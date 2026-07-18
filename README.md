# Warriors Training Zone

Warriors Training Zone is a full-stack gym management and ecommerce platform built with:

- `FastAPI` + `MongoDB` for the backend
- `React` + `CRA` + `TailwindCSS` for the frontend
- Role-based auth, dashboards, memberships, trainers, products, cart, checkout, and admin analytics

This README is the full handoff for:

- what to keep in Git
- what to ignore
- how to push to GitHub
- how to run locally
- how to deploy to Render + Vercel + MongoDB Atlas

## What To Keep In Git

Commit these files and folders:

```text
backend/
frontend/
README.md
.gitignore
render.yaml
design_guidelines.json
```

Inside `backend/`, keep:

```text
main.py
server.py
requirements.txt
.env.example
__init__.py
```

Inside `frontend/`, keep:

```text
src/
public/
package.json
package-lock.json
craco.config.js
postcss.config.js
tailwind.config.js
jsconfig.json
.env.example
vercel.json
```

## What NOT To Push To GitHub

Do not push:

```text
.git/
.agents/
memory/
backend/.env
frontend/.env
frontend/node_modules/
frontend/build/
__pycache__/
.venv/
venv/
```

Why:

- `.env` files contain secrets and machine-specific values
- `node_modules` and `build` are generated files
- `__pycache__` and virtual envs are local-only
- `.agents` and `memory` are internal workspace artifacts

## .gitignore

Your repo already includes a `.gitignore` configured for this project.

It now ignores:

- env files
- Python cache and virtual environments
- frontend dependencies and build output
- local internal folders

If you ever create new local-only folders, add them there before committing.

## Project Structure

```text
warriors/
  backend/
  frontend/
  render.yaml
  README.md
  .gitignore
```

## Local Prerequisites

Install these first:

- Node.js 18 or newer
- Python 3.11 or newer
- MongoDB Community Server or MongoDB Atlas
- Git

## Local Environment Setup

### Backend env

Create [backend/.env](/C:/warriors/backend/.env) from [backend/.env.example](/C:/warriors/backend/.env.example).

Use:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=warriors_gym
CORS_ORIGINS=http://localhost:3000
JWT_SECRET=your-long-local-secret
ADMIN_EMAIL=admin@warriors.com
ADMIN_PASSWORD=Admin@123
COOKIE_SECURE=false
```

### Frontend env

Create [frontend/.env](/C:/warriors/frontend/.env) from [frontend/.env.example](/C:/warriors/frontend/.env.example).

Use:

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

## Run Locally

### 1. Start MongoDB

Your machine already shows `MongoDB` service as running, so you are good.

If you ever need to verify again:

```powershell
Get-Service *mongo*
```

### 2. Start backend

From `C:\warriors`:

```powershell
python -m pip install -r backend\requirements.txt
python -m uvicorn backend.main:app --reload
```

Backend runs on:

```text
http://localhost:8000
```

Health check:

```text
http://localhost:8000/health
```

### 3. Start frontend

Open a second terminal:

```powershell
cd C:\warriors\frontend
npm install
npm start
```

Frontend runs on:

```text
http://localhost:3000
```

## Seeded Login Accounts

Admin:

```text
admin@warriors.com / Admin@123
```

User:

```text
user@warriors.com / User@123
```

Trainer:

```text
trainer@warriors.com / Trainer@123
```

Staff:

```text
staff@warriors.com / Staff@123
```

## GitHub Push Steps

### 1. Check what will be committed

From `C:\warriors`:

```powershell
git status
```

You should see source files, not `node_modules`, not `.env`, not `build`.

### 2. Initialize Git only if needed

Skip this if `.git` already exists.

```powershell
git init
```

Your project already has a `.git` folder, so you do not need to run this again.

### 3. Create a new GitHub repository

On GitHub:

1. Log in
2. Click `New repository`
3. Repository name: `warriors-training-zone`
4. Choose `Public` or `Private`
5. Do not add another README, `.gitignore`, or license if you are pushing the existing repo
6. Click `Create repository`

### 4. Add files

From `C:\warriors`:

```powershell
git add .
```

### 5. Double-check staged files

```powershell
git status
```

Make sure these are NOT staged:

- `backend/.env`
- `frontend/.env`
- `frontend/node_modules`
- `frontend/build`
- `.agents`
- `memory`

If something sensitive is staged by mistake:

```powershell
git restore --staged <path>
```

Example:

```powershell
git restore --staged backend/.env
git restore --staged frontend/.env
```

### 6. Commit

```powershell
git commit -m "Initial production-ready Warriors Training Zone setup"
```

### 7. Connect local repo to GitHub

Replace `YOUR_USERNAME` with your GitHub username:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/warriors-training-zone.git
```

If `origin` already exists:

```powershell
git remote set-url origin https://github.com/YOUR_USERNAME/warriors-training-zone.git
```

### 8. Push

If this is your first push:

```powershell
git branch -M main
git push -u origin main
```

After that, future pushes are:

```powershell
git add .
git commit -m "Describe your changes"
git push
```

## Before You Push

Do this checklist:

1. Confirm `.env` files are not staged
2. Confirm `frontend/build` is not staged
3. Confirm `frontend/node_modules` is not staged
4. Confirm `.agents` and `memory` are not staged
5. Confirm the app runs locally
6. Confirm `README.md` is updated

## Deploy Overview

Recommended deployment:

- Database: MongoDB Atlas
- Backend: Render
- Frontend: Vercel

## Step 1: Deploy MongoDB Atlas

1. Create a free MongoDB Atlas account
2. Create a cluster
3. Create a database user
4. Add IP access rule
   For easiest setup, you can temporarily allow `0.0.0.0/0`
5. Copy the connection string
6. Replace username, password, and database name

Example:

```text
mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/warriors_gym?retryWrites=true&w=majority
```

## Step 2: Deploy Backend On Render

This repo already includes [render.yaml](/C:/warriors/render.yaml).

### Render steps

1. Go to Render
2. Click `New +`
3. Choose `Blueprint`
4. Connect your GitHub account if asked
5. Select the `warriors-training-zone` repository
6. Render will read `render.yaml`
7. Fill in the required environment variables
8. Start deploy

### Backend env vars for Render

Use:

```env
MONGO_URL=<your atlas connection string>
DB_NAME=warriors_gym
JWT_SECRET=<new long random production secret>
CORS_ORIGINS=https://your-frontend-domain.vercel.app
COOKIE_SECURE=true
ADMIN_EMAIL=admin@warriors.com
ADMIN_PASSWORD=<strong production password>
```

### Backend checks after deploy

Your backend URL will look like:

```text
https://warriors-training-zone-api.onrender.com
```

Test:

```text
https://warriors-training-zone-api.onrender.com/health
```

## Step 3: Deploy Frontend On Vercel

This repo already includes [frontend/vercel.json](/C:/warriors/frontend/vercel.json).

### Vercel steps

1. Go to Vercel
2. Click `Add New`
3. Choose `Project`
4. Import your GitHub repo
5. Set `Root Directory` to:

```text
frontend
```

6. Framework preset: `Create React App`
7. Add environment variable:

```env
REACT_APP_BACKEND_URL=https://your-backend-domain.onrender.com
```

8. Click `Deploy`

## Step 4: Connect Frontend And Backend

After Vercel gives your frontend URL:

1. Copy the exact URL
2. Open Render service settings
3. Update:

```env
CORS_ORIGINS=https://your-frontend-name.vercel.app
```

4. Save and redeploy if Render does not auto-redeploy

This step is important. If `CORS_ORIGINS` is wrong, the browser will show network errors even if the backend is running.

## Step 5: Production Smoke Test

After both are deployed:

1. Open the frontend URL
2. Confirm home page loads
3. Sign up a new user
4. Sign in as admin
5. Open admin dashboard
6. Visit marketplace
7. Add a product to cart
8. Complete a dummy checkout
9. Verify backend health endpoint works

## Build Commands

Frontend production build:

```powershell
cd C:\warriors\frontend
npm run build
```

Backend production-style run:

```powershell
cd C:\warriors
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

## Secret Key Notes

`JWT_SECRET` is a string you generate yourself.

For local development, any long random string is fine.

For production, generate a new one and keep it private.

Example PowerShell generator:

```powershell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

## Common Mistakes To Avoid

- Pushing `.env` files to GitHub
- Pushing `node_modules`
- Pushing `frontend/build`
- Using `CORS_ORIGINS=*` with cookies
- Forgetting to change `REACT_APP_BACKEND_URL` on Vercel
- Forgetting to change `CORS_ORIGINS` on Render
- Using local `localhost` values in production

## Final Safe Push Checklist

Before pushing:

1. `git status`
2. confirm ignored files are not staged
3. confirm app runs locally
4. confirm README is updated
5. confirm `.env.example` files exist
6. confirm real secrets are only in deployment platforms, not Git
