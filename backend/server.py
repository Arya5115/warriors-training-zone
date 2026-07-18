from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import secrets
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Literal

import bcrypt
import jwt
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

# ---------- Setup ----------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "false").lower() == "true"
CORS_ORIGINS = [origin.strip() for origin in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",") if origin.strip()]

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Warriors Training Zone API")
api = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("warriors")

# ---------- Helpers ----------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()

def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_access_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "type": "access",
        "exp": now_utc() + timedelta(hours=12),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": now_utc() + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def public_user(u: dict) -> dict:
    return {
        "id": str(u["_id"]),
        "email": u["email"],
        "name": u.get("name", ""),
        "role": u.get("role", "user"),
        "phone": u.get("phone", ""),
        "avatar": u.get("avatar", ""),
        "membership_tier": u.get("membership_tier", "free"),
        "created_at": u.get("created_at", iso(now_utc())),
    }

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(*roles: str):
    async def dep(user: dict = Depends(get_current_user)):
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return dep

def set_auth_cookies(resp: Response, access: str, refresh: str):
    resp.set_cookie("access_token", access, httponly=True, secure=COOKIE_SECURE, samesite="none", max_age=43200, path="/")
    resp.set_cookie("refresh_token", refresh, httponly=True, secure=COOKIE_SECURE, samesite="none", max_age=604800, path="/")

# ---------- Schemas ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str
    phone: Optional[str] = ""

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class ForgotIn(BaseModel):
    email: EmailStr

class ResetIn(BaseModel):
    token: str
    password: str = Field(min_length=6)

class ProductIn(BaseModel):
    name: str
    description: str = ""
    category: str
    brand: str = ""
    price: float
    discount: float = 0
    stock: int = 0
    images: List[str] = []
    tags: List[str] = []
    weight: str = ""
    featured: bool = False

class OrderItemIn(BaseModel):
    product_id: str
    quantity: int = 1

class CheckoutIn(BaseModel):
    items: List[OrderItemIn]
    address: dict
    coupon_code: Optional[str] = None
    payment_method: Literal["phonepe", "cod"] = "phonepe"

class MembershipPurchaseIn(BaseModel):
    plan_id: str

class ReviewIn(BaseModel):
    product_id: str
    rating: int = Field(ge=1, le=5)
    comment: str = ""

class ContactIn(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    message: str

class BMIIn(BaseModel):
    height_cm: float
    weight_kg: float

class CouponIn(BaseModel):
    code: str
    discount_type: Literal["percentage", "flat"] = "percentage"
    value: float
    min_amount: float = 0
    expires_at: Optional[str] = None

# ---------- Auth Routes ----------
@api.post("/auth/register")
async def register(data: RegisterIn, response: Response):
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {
        "email": email,
        "password_hash": hash_password(data.password),
        "name": data.name,
        "phone": data.phone or "",
        "role": "user",
        "membership_tier": "free",
        "avatar": "",
        "created_at": iso(now_utc()),
    }
    res = await db.users.insert_one(doc)
    user = await db.users.find_one({"_id": res.inserted_id})
    access = create_access_token(str(user["_id"]), user["role"])
    refresh = create_refresh_token(str(user["_id"]))
    set_auth_cookies(response, access, refresh)
    return {"user": public_user(user), "access_token": access}

@api.post("/auth/login")
async def login(data: LoginIn, response: Response):
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access = create_access_token(str(user["_id"]), user["role"])
    refresh = create_refresh_token(str(user["_id"]))
    set_auth_cookies(response, access, refresh)
    return {"user": public_user(user), "access_token": access}

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)

@api.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access = create_access_token(str(user["_id"]), user["role"])
        response.set_cookie("access_token", access, httponly=True, secure=COOKIE_SECURE, samesite="none", max_age=43200, path="/")
        return {"access_token": access}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@api.post("/auth/forgot-password")
async def forgot(data: ForgotIn):
    user = await db.users.find_one({"email": data.email.lower()})
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_resets.insert_one({
            "token": token,
            "user_id": str(user["_id"]),
            "expires_at": iso(now_utc() + timedelta(hours=1)),
            "used": False,
        })
        logger.info(f"[PASSWORD RESET] {user['email']} -> token: {token}")
    return {"ok": True, "message": "If the email exists, a reset link was sent."}

@api.post("/auth/reset-password")
async def reset(data: ResetIn):
    rec = await db.password_resets.find_one({"token": data.token, "used": False})
    if not rec:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    if datetime.fromisoformat(rec["expires_at"]) < now_utc():
        raise HTTPException(status_code=400, detail="Token expired")
    await db.users.update_one({"_id": ObjectId(rec["user_id"])}, {"$set": {"password_hash": hash_password(data.password)}})
    await db.password_resets.update_one({"_id": rec["_id"]}, {"$set": {"used": True}})
    return {"ok": True}

# ---------- Membership Plans ----------
DEFAULT_PLANS = [
    {"id": "free", "name": "Free Visitor", "price": 0, "duration_days": 7, "tier": "free", "color": "slate",
     "benefits": ["1 Trial Session", "Gym Tour", "BMI Assessment"], "discount_pct": 0, "trainer_sessions": 0, "priority": False},
    {"id": "silver", "name": "Silver", "price": 1499, "duration_days": 30, "tier": "silver", "color": "slate",
     "benefits": ["Full Gym Access", "Locker", "2 Trainer Sessions", "Group Classes"], "discount_pct": 5, "trainer_sessions": 2, "priority": False},
    {"id": "gold", "name": "Gold", "price": 3999, "duration_days": 90, "tier": "gold", "color": "yellow",
     "benefits": ["Everything in Silver", "8 Trainer Sessions", "Nutrition Guidance", "Sauna Access", "Priority Booking"], "discount_pct": 10, "trainer_sessions": 8, "priority": True},
    {"id": "platinum", "name": "Platinum", "price": 9999, "duration_days": 365, "tier": "platinum", "color": "zinc",
     "benefits": ["Everything in Gold", "Unlimited Trainer", "Personal Diet Plan", "Physiotherapy", "24/7 Access", "Guest Passes"], "discount_pct": 20, "trainer_sessions": 999, "priority": True},
]

@api.get("/memberships/plans")
async def list_plans():
    return DEFAULT_PLANS

@api.post("/memberships/purchase")
async def purchase_membership(data: MembershipPurchaseIn, user: dict = Depends(get_current_user)):
    plan = next((p for p in DEFAULT_PLANS if p["id"] == data.plan_id), None)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    # simulate PhonePe: create pending -> success
    txn_id = f"PP{uuid.uuid4().hex[:12].upper()}"
    start = now_utc()
    end = start + timedelta(days=plan["duration_days"])
    membership_doc = {
        "user_id": str(user["_id"]),
        "plan_id": plan["id"],
        "plan_name": plan["name"],
        "tier": plan["tier"],
        "price": plan["price"],
        "started_at": iso(start),
        "expires_at": iso(end),
        "status": "active",
        "qr_code": f"WTZ-{str(user['_id'])[-6:].upper()}-{plan['tier'].upper()}",
        "txn_id": txn_id,
        "created_at": iso(start),
    }
    await db.memberships.insert_one(membership_doc)
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"membership_tier": plan["tier"]}})
    await db.payments.insert_one({
        "user_id": str(user["_id"]),
        "amount": plan["price"],
        "type": "membership",
        "reference": plan["id"],
        "txn_id": txn_id,
        "status": "success",
        "method": "phonepe",
        "created_at": iso(now_utc()),
    })
    membership_doc["id"] = str(membership_doc.pop("_id", ""))
    return {"membership": {**membership_doc, "id": txn_id}, "txn_id": txn_id, "status": "success"}

@api.get("/memberships/my")
async def my_memberships(user: dict = Depends(get_current_user)):
    cursor = db.memberships.find({"user_id": str(user["_id"])}).sort("created_at", -1)
    out = []
    async for m in cursor:
        m["id"] = str(m.pop("_id"))
        out.append(m)
    return out

# ---------- Products ----------
def product_doc_out(p: dict) -> dict:
    p["id"] = str(p.pop("_id"))
    return p

@api.get("/products")
async def list_products(
    category: Optional[str] = None,
    q: Optional[str] = None,
    featured: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: Optional[str] = "featured",
    limit: int = Query(50, le=200),
    skip: int = 0,
):
    query = {}
    if category and category != "all":
        query["category"] = category
    if featured is not None:
        query["featured"] = featured
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"brand": {"$regex": q, "$options": "i"}},
        ]
    if min_price is not None or max_price is not None:
        pr = {}
        if min_price is not None:
            pr["$gte"] = min_price
        if max_price is not None:
            pr["$lte"] = max_price
        query["price"] = pr
    sort_map = {
        "price_asc": [("price", 1)],
        "price_desc": [("price", -1)],
        "newest": [("created_at", -1)],
        "featured": [("featured", -1), ("created_at", -1)],
    }
    sort_by = sort_map.get(sort, sort_map["featured"])
    cursor = db.products.find(query).sort(sort_by).skip(skip).limit(limit)
    total = await db.products.count_documents(query)
    items = [product_doc_out(p) async for p in cursor]
    return {"items": items, "total": total}

@api.get("/products/categories")
async def product_categories():
    cats = await db.products.distinct("category")
    return sorted(cats)

@api.get("/products/{product_id}")
async def get_product(product_id: str):
    try:
        p = await db.products.find_one({"_id": ObjectId(product_id)})
    except Exception:
        p = None
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_doc_out(p)

@api.post("/products", dependencies=[Depends(require_role("admin", "staff"))])
async def create_product(data: ProductIn):
    doc = data.model_dump()
    doc["created_at"] = iso(now_utc())
    doc["rating"] = 0
    doc["review_count"] = 0
    res = await db.products.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    return doc

@api.put("/products/{product_id}", dependencies=[Depends(require_role("admin", "staff"))])
async def update_product(product_id: str, data: ProductIn):
    res = await db.products.update_one({"_id": ObjectId(product_id)}, {"$set": data.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    p = await db.products.find_one({"_id": ObjectId(product_id)})
    return product_doc_out(p)

@api.delete("/products/{product_id}", dependencies=[Depends(require_role("admin"))])
async def delete_product(product_id: str):
    await db.products.delete_one({"_id": ObjectId(product_id)})
    return {"ok": True}

# ---------- Cart ----------
@api.get("/cart")
async def get_cart(user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": str(user["_id"])}) or {"items": []}
    items = []
    for it in cart.get("items", []):
        try:
            p = await db.products.find_one({"_id": ObjectId(it["product_id"])})
            if p:
                items.append({"product": product_doc_out(p), "quantity": it["quantity"]})
        except Exception:
            pass
    return {"items": items}

@api.post("/cart/add")
async def add_to_cart(item: OrderItemIn, user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": str(user["_id"])})
    if not cart:
        cart = {"user_id": str(user["_id"]), "items": []}
    existing = next((i for i in cart["items"] if i["product_id"] == item.product_id), None)
    if existing:
        existing["quantity"] += item.quantity
    else:
        cart["items"].append({"product_id": item.product_id, "quantity": item.quantity})
    await db.carts.update_one({"user_id": str(user["_id"])}, {"$set": {"items": cart["items"]}}, upsert=True)
    return {"ok": True}

@api.post("/cart/remove")
async def remove_from_cart(item: OrderItemIn, user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": str(user["_id"])}) or {"items": []}
    cart["items"] = [i for i in cart.get("items", []) if i["product_id"] != item.product_id]
    await db.carts.update_one({"user_id": str(user["_id"])}, {"$set": {"items": cart["items"]}}, upsert=True)
    return {"ok": True}

@api.post("/cart/clear")
async def clear_cart(user: dict = Depends(get_current_user)):
    await db.carts.update_one({"user_id": str(user["_id"])}, {"$set": {"items": []}}, upsert=True)
    return {"ok": True}

# ---------- Wishlist ----------
@api.get("/wishlist")
async def get_wishlist(user: dict = Depends(get_current_user)):
    w = await db.wishlists.find_one({"user_id": str(user["_id"])}) or {"product_ids": []}
    items = []
    for pid in w.get("product_ids", []):
        try:
            p = await db.products.find_one({"_id": ObjectId(pid)})
            if p:
                items.append(product_doc_out(p))
        except Exception:
            pass
    return items

@api.post("/wishlist/toggle")
async def toggle_wishlist(item: OrderItemIn, user: dict = Depends(get_current_user)):
    w = await db.wishlists.find_one({"user_id": str(user["_id"])}) or {"user_id": str(user["_id"]), "product_ids": []}
    if item.product_id in w["product_ids"]:
        w["product_ids"].remove(item.product_id)
        added = False
    else:
        w["product_ids"].append(item.product_id)
        added = True
    await db.wishlists.update_one({"user_id": str(user["_id"])}, {"$set": {"product_ids": w["product_ids"]}}, upsert=True)
    return {"added": added}

# ---------- Orders / Checkout (PhonePe dummy) ----------
@api.post("/checkout")
async def checkout(data: CheckoutIn, user: dict = Depends(get_current_user)):
    if not data.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    subtotal = 0.0
    order_items = []
    for it in data.items:
        p = await db.products.find_one({"_id": ObjectId(it.product_id)})
        if not p:
            raise HTTPException(status_code=404, detail=f"Product {it.product_id} not found")
        price = p["price"] * (1 - p.get("discount", 0) / 100)
        subtotal += price * it.quantity
        order_items.append({
            "product_id": it.product_id,
            "name": p["name"],
            "image": (p.get("images") or [""])[0],
            "price": round(price, 2),
            "quantity": it.quantity,
        })
    discount = 0.0
    if data.coupon_code:
        c = await db.coupons.find_one({"code": data.coupon_code.upper()})
        if c and subtotal >= c.get("min_amount", 0):
            if c["discount_type"] == "percentage":
                discount = subtotal * c["value"] / 100
            else:
                discount = c["value"]
    gst = round((subtotal - discount) * 0.18, 2)
    total = round(subtotal - discount + gst, 2)
    txn_id = f"PP{uuid.uuid4().hex[:12].upper()}"
    order = {
        "user_id": str(user["_id"]),
        "items": order_items,
        "subtotal": round(subtotal, 2),
        "discount": round(discount, 2),
        "gst": gst,
        "total": total,
        "coupon_code": data.coupon_code,
        "address": data.address,
        "status": "confirmed",
        "payment_status": "success",
        "payment_method": data.payment_method,
        "txn_id": txn_id,
        "created_at": iso(now_utc()),
    }
    res = await db.orders.insert_one(order)
    await db.payments.insert_one({
        "user_id": str(user["_id"]),
        "amount": total,
        "type": "order",
        "reference": str(res.inserted_id),
        "txn_id": txn_id,
        "status": "success",
        "method": data.payment_method,
        "created_at": iso(now_utc()),
    })
    await db.carts.update_one({"user_id": str(user["_id"])}, {"$set": {"items": []}}, upsert=True)
    # decrement stock
    for it in data.items:
        await db.products.update_one({"_id": ObjectId(it.product_id)}, {"$inc": {"stock": -it.quantity}})
    order["id"] = str(res.inserted_id)
    return {"order": order, "txn_id": txn_id, "status": "success"}

@api.get("/orders/my")
async def my_orders(user: dict = Depends(get_current_user)):
    cursor = db.orders.find({"user_id": str(user["_id"])}).sort("created_at", -1)
    out = []
    async for o in cursor:
        o["id"] = str(o.pop("_id"))
        out.append(o)
    return out

@api.get("/orders")
async def all_orders(user: dict = Depends(require_role("admin", "staff"))):
    cursor = db.orders.find().sort("created_at", -1).limit(200)
    out = []
    async for o in cursor:
        o["id"] = str(o.pop("_id"))
        out.append(o)
    return out

@api.post("/orders/{order_id}/status")
async def update_order_status(order_id: str, payload: dict, user: dict = Depends(require_role("admin", "staff"))):
    status = payload.get("status", "processing")
    await db.orders.update_one({"_id": ObjectId(order_id)}, {"$set": {"status": status}})
    return {"ok": True}

# ---------- Trainers ----------
@api.get("/trainers")
async def list_trainers():
    cursor = db.trainers.find().sort("created_at", -1)
    out = []
    async for t in cursor:
        t["id"] = str(t.pop("_id"))
        out.append(t)
    return out

@api.get("/trainers/{tid}")
async def get_trainer(tid: str):
    t = await db.trainers.find_one({"_id": ObjectId(tid)})
    if not t:
        raise HTTPException(status_code=404, detail="Not found")
    t["id"] = str(t.pop("_id"))
    return t

# ---------- Reviews ----------
@api.post("/reviews")
async def add_review(data: ReviewIn, user: dict = Depends(get_current_user)):
    doc = data.model_dump()
    doc["user_id"] = str(user["_id"])
    doc["user_name"] = user.get("name", "User")
    doc["created_at"] = iso(now_utc())
    await db.reviews.insert_one(doc)
    # update product rating
    all_reviews = [r async for r in db.reviews.find({"product_id": data.product_id})]
    avg = sum(r["rating"] for r in all_reviews) / len(all_reviews)
    await db.products.update_one(
        {"_id": ObjectId(data.product_id)},
        {"$set": {"rating": round(avg, 1), "review_count": len(all_reviews)}}
    )
    return {"ok": True}

@api.get("/reviews/product/{product_id}")
async def product_reviews(product_id: str):
    cursor = db.reviews.find({"product_id": product_id}).sort("created_at", -1)
    out = []
    async for r in cursor:
        r["id"] = str(r.pop("_id"))
        out.append(r)
    return out

# ---------- Coupons ----------
@api.get("/coupons")
async def list_coupons():
    cursor = db.coupons.find().sort("created_at", -1)
    out = []
    async for c in cursor:
        c["id"] = str(c.pop("_id"))
        out.append(c)
    return out

@api.get("/coupons/validate/{code}")
async def validate_coupon(code: str):
    c = await db.coupons.find_one({"code": code.upper()})
    if not c:
        raise HTTPException(status_code=404, detail="Invalid coupon")
    c["id"] = str(c.pop("_id"))
    return c

@api.post("/coupons", dependencies=[Depends(require_role("admin"))])
async def create_coupon(data: CouponIn):
    doc = data.model_dump()
    doc["code"] = doc["code"].upper()
    doc["created_at"] = iso(now_utc())
    res = await db.coupons.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    return doc

# ---------- Contact / Testimonials / FAQ / Blogs / Gallery / Events ----------
@api.post("/contact")
async def contact(data: ContactIn):
    doc = data.model_dump()
    doc["created_at"] = iso(now_utc())
    doc["resolved"] = False
    await db.contact_requests.insert_one(doc)
    return {"ok": True, "message": "We'll get back to you soon."}

@api.get("/testimonials")
async def testimonials():
    cursor = db.testimonials.find()
    return [{"id": str(t.pop("_id")), **t} async for t in cursor]

@api.get("/faqs")
async def faqs():
    cursor = db.faqs.find()
    return [{"id": str(f.pop("_id")), **f} async for f in cursor]

@api.get("/blogs")
async def blogs():
    cursor = db.blogs.find().sort("created_at", -1)
    return [{"id": str(b.pop("_id")), **b} async for b in cursor]

@api.get("/blogs/{bid}")
async def blog_detail(bid: str):
    b = await db.blogs.find_one({"_id": ObjectId(bid)})
    if not b:
        raise HTTPException(status_code=404)
    b["id"] = str(b.pop("_id"))
    return b

@api.get("/gallery")
async def gallery():
    cursor = db.gallery.find()
    return [{"id": str(g.pop("_id")), **g} async for g in cursor]

@api.get("/events")
async def events():
    cursor = db.events.find().sort("date", 1)
    return [{"id": str(e.pop("_id")), **e} async for e in cursor]

@api.get("/services")
async def services():
    cursor = db.services.find()
    return [{"id": str(s.pop("_id")), **s} async for s in cursor]

# ---------- BMI ----------
@api.post("/bmi")
async def compute_bmi(data: BMIIn):
    if data.height_cm <= 0 or data.weight_kg <= 0:
        raise HTTPException(status_code=400, detail="Invalid values")
    h_m = data.height_cm / 100
    bmi = round(data.weight_kg / (h_m * h_m), 1)
    if bmi < 18.5:
        cat = "Underweight"
    elif bmi < 25:
        cat = "Normal"
    elif bmi < 30:
        cat = "Overweight"
    else:
        cat = "Obese"
    return {"bmi": bmi, "category": cat}

# ---------- Admin Analytics ----------
@api.get("/admin/stats", dependencies=[Depends(require_role("admin"))])
async def admin_stats():
    users_ct = await db.users.count_documents({})
    orders_ct = await db.orders.count_documents({})
    products_ct = await db.products.count_documents({})
    members_ct = await db.memberships.count_documents({"status": "active"})
    revenue_agg = [
        p async for p in db.payments.aggregate([
            {"$match": {"status": "success"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ])
    ]
    revenue = revenue_agg[0]["total"] if revenue_agg else 0
    # per-day revenue last 14 days
    from collections import defaultdict
    daily = defaultdict(float)
    since = now_utc() - timedelta(days=14)
    async for p in db.payments.find({"status": "success"}):
        dt = datetime.fromisoformat(p["created_at"])
        if dt >= since:
            daily[dt.strftime("%b %d")] += p["amount"]
    revenue_series = [{"date": k, "amount": round(v, 2)} for k, v in daily.items()]
    return {
        "users": users_ct,
        "orders": orders_ct,
        "products": products_ct,
        "active_members": members_ct,
        "revenue": round(revenue, 2),
        "revenue_series": revenue_series,
    }

@api.get("/admin/users", dependencies=[Depends(require_role("admin"))])
async def admin_users():
    cursor = db.users.find().sort("created_at", -1).limit(200)
    return [public_user(u) async for u in cursor]

@api.put("/admin/users/{uid}/role", dependencies=[Depends(require_role("admin"))])
async def admin_change_role(uid: str, payload: dict):
    role = payload.get("role")
    if role not in {"admin", "staff", "trainer", "user"}:
        raise HTTPException(status_code=400, detail="Invalid role")
    await db.users.update_one({"_id": ObjectId(uid)}, {"$set": {"role": role}})
    return {"ok": True}

@api.get("/admin/payments", dependencies=[Depends(require_role("admin"))])
async def admin_payments():
    cursor = db.payments.find().sort("created_at", -1).limit(200)
    out = []
    async for p in cursor:
        p["id"] = str(p.pop("_id"))
        out.append(p)
    return out

# ---------- Seed Data ----------
async def seed_data():
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.password_resets.create_index("token", unique=True)

    # Seed users
    default_users = [
        {"email": os.environ["ADMIN_EMAIL"], "password": os.environ["ADMIN_PASSWORD"], "name": "Warriors Admin", "role": "admin"},
        {"email": "user@warriors.com", "password": "User@123", "name": "Aarav Singh", "role": "user"},
        {"email": "trainer@warriors.com", "password": "Trainer@123", "name": "Coach Vikram", "role": "trainer"},
        {"email": "staff@warriors.com", "password": "Staff@123", "name": "Reception Staff", "role": "staff"},
    ]
    for u in default_users:
        existing = await db.users.find_one({"email": u["email"]})
        if not existing:
            await db.users.insert_one({
                "email": u["email"],
                "password_hash": hash_password(u["password"]),
                "name": u["name"],
                "role": u["role"],
                "phone": "",
                "avatar": "",
                "membership_tier": "platinum" if u["role"] == "admin" else "free",
                "created_at": iso(now_utc()),
            })

    if await db.products.count_documents({}) == 0:
        img_supp = "https://images.pexels.com/photos/15120889/pexels-photo-15120889.jpeg"
        img_gear = "https://images.pexels.com/photos/30283458/pexels-photo-30283458.jpeg"
        img_gym = "https://images.pexels.com/photos/17211446/pexels-photo-17211446.jpeg"
        products = [
            {"name": "Whey Protein Isolate 2kg", "category": "Supplements", "brand": "MuscleForge", "price": 4499, "discount": 15, "stock": 40, "images": [img_supp], "tags": ["protein", "isolate"], "weight": "2kg", "featured": True, "description": "Ultra-pure whey isolate with 27g protein per scoop. Zero sugar."},
            {"name": "Mass Gainer Pro 3kg", "category": "Supplements", "brand": "MuscleForge", "price": 3299, "discount": 10, "stock": 25, "images": [img_supp], "tags": ["gainer"], "weight": "3kg", "featured": True, "description": "1250 kcal per serving with complex carbs and micellar casein."},
            {"name": "Creatine Monohydrate 500g", "category": "Supplements", "brand": "PurePeak", "price": 1899, "discount": 5, "stock": 60, "images": [img_supp], "tags": ["creatine"], "weight": "500g", "featured": False, "description": "Micronized creatine for explosive strength gains."},
            {"name": "Pre-Workout Nitro X", "category": "Supplements", "brand": "PurePeak", "price": 2299, "discount": 20, "stock": 30, "images": [img_supp], "tags": ["preworkout"], "weight": "300g", "featured": True, "description": "L-citrulline + beta-alanine + caffeine matrix for insane pumps."},
            {"name": "BCAA Recovery Elite", "category": "Supplements", "brand": "PurePeak", "price": 1499, "discount": 0, "stock": 45, "images": [img_supp], "tags": ["bcaa"], "weight": "400g", "featured": False, "description": "2:1:1 ratio BCAA with electrolytes."},
            {"name": "Leather Gym Belt 6\"", "category": "Accessories", "brand": "IronCore", "price": 1799, "discount": 0, "stock": 20, "images": [img_gear], "tags": ["belt", "powerlifting"], "weight": "1kg", "featured": True, "description": "Full-grain leather powerlifting belt with steel buckle."},
            {"name": "Wrist Wraps Pro", "category": "Accessories", "brand": "IronCore", "price": 599, "discount": 10, "stock": 100, "images": [img_gear], "tags": ["wraps"], "weight": "200g", "featured": False, "description": "Heavy-duty wrist support for heavy pressing."},
            {"name": "Lifting Straps", "category": "Accessories", "brand": "IronCore", "price": 449, "discount": 0, "stock": 80, "images": [img_gear], "tags": ["straps"], "weight": "150g", "featured": False, "description": "Cotton lifting straps for deadlifts and rows."},
            {"name": "Warriors Signature Tee", "category": "Apparel", "brand": "Warriors", "price": 899, "discount": 0, "stock": 50, "images": [img_gym], "tags": ["tshirt"], "weight": "250g", "featured": True, "description": "Premium cotton dry-fit training tee with Warriors branding."},
            {"name": "Compression Shorts", "category": "Apparel", "brand": "Warriors", "price": 1199, "discount": 5, "stock": 40, "images": [img_gym], "tags": ["shorts"], "weight": "220g", "featured": False, "description": "4-way stretch compression shorts."},
            {"name": "Shaker Bottle 700ml", "category": "Accessories", "brand": "Warriors", "price": 349, "discount": 0, "stock": 200, "images": [img_gear], "tags": ["shaker"], "weight": "180g", "featured": False, "description": "Leak-proof shaker with wire whisk."},
            {"name": "Resistance Band Set", "category": "Equipment", "brand": "IronCore", "price": 1299, "discount": 15, "stock": 35, "images": [img_gear], "tags": ["bands"], "weight": "1kg", "featured": True, "description": "5-level resistance band set with handles."},
        ]
        for p in products:
            p["created_at"] = iso(now_utc())
            p["rating"] = round(4 + (hash(p["name"]) % 10) / 10, 1)
            p["review_count"] = (hash(p["name"]) % 40) + 5
        await db.products.insert_many(products)

    if await db.trainers.count_documents({}) == 0:
        img1 = "https://images.pexels.com/photos/10960029/pexels-photo-10960029.jpeg"
        img2 = "https://images.pexels.com/photos/3912944/pexels-photo-3912944.jpeg"
        trainers = [
            {"name": "Coach Vikram Rao", "specialization": "Powerlifting & Strength", "experience_years": 12, "rating": 4.9, "image": img1, "bio": "IPF-certified powerlifting coach. Trained 3 national champions.", "certifications": ["NSCA-CSCS", "IPF Coach L2"], "languages": ["English", "Hindi"], "hourly_rate": 1500, "featured": True, "created_at": iso(now_utc())},
            {"name": "Coach Priya Nair", "specialization": "Weight Loss & HIIT", "experience_years": 8, "rating": 4.8, "image": img2, "bio": "ACSM-certified. Helped 500+ clients lose fat sustainably.", "certifications": ["ACSM-CPT", "PN L1 Nutrition"], "languages": ["English", "Hindi", "Malayalam"], "hourly_rate": 1200, "featured": True, "created_at": iso(now_utc())},
            {"name": "Coach Arjun Mehta", "specialization": "Bodybuilding & Nutrition", "experience_years": 10, "rating": 4.9, "image": img1, "bio": "IFBB Pro. Contest-prep coach with 15+ pro clients.", "certifications": ["IFBB Pro Card", "ISSN Nutrition"], "languages": ["English", "Hindi"], "hourly_rate": 2000, "featured": True, "created_at": iso(now_utc())},
            {"name": "Coach Ananya Sen", "specialization": "Yoga & Mobility", "experience_years": 15, "rating": 5.0, "image": img2, "bio": "Yoga Alliance RYT-500. Rehab specialist for lifters.", "certifications": ["RYT-500", "FRC Mobility"], "languages": ["English", "Hindi", "Bengali"], "hourly_rate": 1000, "featured": False, "created_at": iso(now_utc())},
            {"name": "Coach Rohan Kapoor", "specialization": "CrossFit", "experience_years": 7, "rating": 4.7, "image": img1, "bio": "CF-L3 trainer. Regional Games athlete.", "certifications": ["CF-L3", "Olympic Weightlifting L1"], "languages": ["English", "Hindi"], "hourly_rate": 1400, "featured": False, "created_at": iso(now_utc())},
        ]
        await db.trainers.insert_many(trainers)

    if await db.testimonials.count_documents({}) == 0:
        tests = [
            {"name": "Rahul Sharma", "role": "Platinum Member", "message": "Went from 95kg to 78kg in 6 months. The trainers here changed my life.", "rating": 5, "avatar": "https://images.pexels.com/photos/3912944/pexels-photo-3912944.jpeg"},
            {"name": "Meera Iyer", "role": "Gold Member", "message": "Best equipment, cleanest facility, and coaches who actually care. Worth every rupee.", "rating": 5, "avatar": "https://images.pexels.com/photos/10960029/pexels-photo-10960029.jpeg"},
            {"name": "Karan Patel", "role": "Silver Member", "message": "Deadlifted 200kg for the first time thanks to Coach Vikram's programming.", "rating": 5, "avatar": "https://images.pexels.com/photos/3912944/pexels-photo-3912944.jpeg"},
            {"name": "Sneha Reddy", "role": "Platinum Member", "message": "The nutrition guidance is next level. Lost 12kg while gaining muscle.", "rating": 5, "avatar": "https://images.pexels.com/photos/10960029/pexels-photo-10960029.jpeg"},
        ]
        await db.testimonials.insert_many(tests)

    if await db.faqs.count_documents({}) == 0:
        faqs_data = [
            {"question": "What are the gym timings?", "answer": "We are open 5 AM to 11 PM daily. Platinum members get 24/7 access.", "category": "General"},
            {"question": "Can I freeze my membership?", "answer": "Yes, Gold and Platinum members can freeze for up to 30 days per year.", "category": "Membership"},
            {"question": "Do you offer trial sessions?", "answer": "Yes, book a free trial session via the Free Visitor plan.", "category": "Membership"},
            {"question": "What payment methods do you accept?", "answer": "We accept PhonePe, UPI, all major cards, and cash at reception.", "category": "Payment"},
            {"question": "Are personal trainers included?", "answer": "Silver includes 2 sessions/month, Gold 8, and Platinum unlimited.", "category": "Training"},
            {"question": "What is your refund policy?", "answer": "Full refund within 7 days if unused. See our Refund Policy page.", "category": "Payment"},
        ]
        await db.faqs.insert_many(faqs_data)

    if await db.services.count_documents({}) == 0:
        svc = [
            {"name": "Personal Training", "description": "1-on-1 coaching tailored to your goals.", "price": 1500, "duration_min": 60, "image": "https://images.pexels.com/photos/30283458/pexels-photo-30283458.jpeg"},
            {"name": "CrossFit Classes", "description": "High-intensity functional training in a group setting.", "price": 500, "duration_min": 60, "image": "https://images.pexels.com/photos/30283458/pexels-photo-30283458.jpeg"},
            {"name": "Weight Loss Program", "description": "12-week transformation program with diet + training.", "price": 15000, "duration_min": 0, "image": "https://images.pexels.com/photos/17211446/pexels-photo-17211446.jpeg"},
            {"name": "Nutrition Consultation", "description": "Custom meal plan by certified nutritionist.", "price": 2000, "duration_min": 45, "image": "https://images.pexels.com/photos/15120889/pexels-photo-15120889.jpeg"},
            {"name": "Powerlifting Coaching", "description": "Sport-specific coaching for competition prep.", "price": 2500, "duration_min": 90, "image": "https://images.pexels.com/photos/30283458/pexels-photo-30283458.jpeg"},
            {"name": "Yoga & Mobility", "description": "Recovery, flexibility, and injury prevention.", "price": 800, "duration_min": 60, "image": "https://images.pexels.com/photos/17211446/pexels-photo-17211446.jpeg"},
        ]
        await db.services.insert_many(svc)

    if await db.blogs.count_documents({}) == 0:
        blogs_data = [
            {"title": "5 Compound Lifts Every Beginner Should Master", "excerpt": "Squat, deadlift, bench, OHP, row â the foundation of strength.", "content": "The compound lifts are the bedrock of any serious training program...", "image": "https://images.pexels.com/photos/30283458/pexels-photo-30283458.jpeg", "author": "Coach Vikram", "category": "Training", "created_at": iso(now_utc())},
            {"title": "Cutting vs Bulking: What Actually Works", "excerpt": "Forget the gimmicks. Here's how to actually change your body.", "content": "Fat loss requires a caloric deficit. Muscle gain requires a slight surplus...", "image": "https://images.pexels.com/photos/15120889/pexels-photo-15120889.jpeg", "author": "Coach Arjun", "category": "Nutrition", "created_at": iso(now_utc())},
            {"title": "Why Sleep Is Your Most Anabolic Tool", "excerpt": "You don't grow in the gym. You grow in bed.", "content": "Recovery science says 7-9 hours of sleep is non-negotiable...", "image": "https://images.pexels.com/photos/17211446/pexels-photo-17211446.jpeg", "author": "Coach Priya", "category": "Recovery", "created_at": iso(now_utc())},
        ]
        await db.blogs.insert_many(blogs_data)

    if await db.gallery.count_documents({}) == 0:
        imgs = [
            "https://images.pexels.com/photos/17211446/pexels-photo-17211446.jpeg",
            "https://images.pexels.com/photos/36877065/pexels-photo-36877065.jpeg",
            "https://images.pexels.com/photos/30283458/pexels-photo-30283458.jpeg",
            "https://images.pexels.com/photos/10960029/pexels-photo-10960029.jpeg",
            "https://images.pexels.com/photos/3912944/pexels-photo-3912944.jpeg",
            "https://images.pexels.com/photos/15120889/pexels-photo-15120889.jpeg",
        ]
        await db.gallery.insert_many([{"image": url, "caption": f"Warriors Zone {i+1}", "created_at": iso(now_utc())} for i, url in enumerate(imgs)])

    if await db.events.count_documents({}) == 0:
        evs = [
            {"title": "Warriors Strength Meet 2026", "description": "Open powerlifting competition. All levels welcome.", "date": iso(now_utc() + timedelta(days=30)), "image": "https://images.pexels.com/photos/30283458/pexels-photo-30283458.jpeg", "location": "Warriors HQ, Bengaluru"},
            {"title": "30-Day Transformation Bootcamp", "description": "Small-group intensive coaching program.", "date": iso(now_utc() + timedelta(days=14)), "image": "https://images.pexels.com/photos/17211446/pexels-photo-17211446.jpeg", "location": "Warriors HQ, Bengaluru"},
            {"title": "Nutrition Workshop", "description": "Free workshop on macro-based nutrition.", "date": iso(now_utc() + timedelta(days=7)), "image": "https://images.pexels.com/photos/15120889/pexels-photo-15120889.jpeg", "location": "Online + In-Person"},
        ]
        await db.events.insert_many(evs)

    if await db.coupons.count_documents({}) == 0:
        coupons = [
            {"code": "WARRIOR10", "discount_type": "percentage", "value": 10, "min_amount": 1000, "created_at": iso(now_utc())},
            {"code": "IRON20", "discount_type": "percentage", "value": 20, "min_amount": 3000, "created_at": iso(now_utc())},
            {"code": "FLAT500", "discount_type": "flat", "value": 500, "min_amount": 2500, "created_at": iso(now_utc())},
        ]
        await db.coupons.insert_many(coupons)

@app.on_event("startup")
async def startup():
    await seed_data()
    logger.info("Warriors Training Zone API ready.")

@app.on_event("shutdown")
async def shutdown():
    client.close()

@app.get("/health")
async def health():
    return {"ok": True, "service": "warriors-api", "date": iso(now_utc())}

@api.get("/")
async def root():
    return {"message": "Warriors Training Zone API", "version": "1.0.0"}

app.include_router(api)
