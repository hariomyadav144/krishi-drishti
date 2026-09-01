# 🚀 KRISHI DRISHTI – Public Cloud Deployment Guide

Follow these simple steps to make your **Krishi Drishti Farming App** accessible through a permanent public URL 24/7 on any mobile phone or computer, even when your laptop is turned off!

---

## 📋 Overview of the Setup

1. **GitHub**: Stores your code repository.
2. **Render (Free)**: Runs the Backend API 24/7 (`https://krishi-drishti-api.onrender.com`).
3. **Vercel or Netlify (Free)**: Hosts the Mobile-First Frontend (`https://krishi-drishti.vercel.app`).
4. **Permanent Mobile Link**: Farmers can open this link from anywhere, anytime.

---

## ⚡ STEP 1: Push Code to Your GitHub Account (2 Minutes)

Open PowerShell or your terminal inside the project folder:
`C:\Users\ASUS\.gemini\antigravity\scratch\krishi-drishti`

1. Go to [https://github.com/new](https://github.com/new) in your browser and create a new repository:
   - Repository Name: `krishi-drishti`
   - Select **Public** or **Private**
   - Click **Create repository**

2. Run the following commands in your terminal (replace `YOUR_USERNAME` with your GitHub username):
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/krishi-drishti.git
   git push -u origin main
   ```

---

## ⚙️ STEP 2: Deploy the Backend on Render (2 Minutes)

1. Go to [https://dashboard.render.com](https://dashboard.render.com) and Sign In with GitHub.
2. Click **New +** $\longrightarrow$ **Web Service**.
3. Connect your `krishi-drishti` repository.
4. Fill in these settings:
   - **Name**: `krishi-drishti-api` (or your chosen name)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: **Free**
5. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `krishi_drishti_jwt_secret_2026_production`
   *(Note: If you have a MongoDB Atlas connection string, you can set `MONGODB_URI` here. If left blank, the app auto-initializes with its built-in in-memory database and demo data).*
6. Click **Deploy Web Service**.
7. Once deployed, copy your backend URL:
   `https://krishi-drishti-api.onrender.com`
   *(Verify by opening `https://krishi-drishti-api.onrender.com/api/health` in your browser. It will return `{"status":"online",...}`).*

---

## 🌐 STEP 3: Deploy the Frontend on Vercel (1 Minute)

1. Go to [https://vercel.com](https://vercel.com) and Sign In with GitHub.
2. Click **Add New...** $\longrightarrow$ **Project**.
3. Import your `krishi-drishti` repository.
4. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://krishi-drishti-api.onrender.com/api` *(Paste your Render URL from Step 2 with `/api` at the end)*
6. Click **Deploy**.

---

### Alternative: Deploy Frontend on Netlify (Optional)
If you prefer Netlify over Vercel:
1. Go to [https://app.netlify.com](https://app.netlify.com) and Sign In with GitHub.
2. Click **Add new site** $\longrightarrow$ **Import an existing project**.
3. Select `krishi-drishti`.
4. Set:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://krishi-drishti-api.onrender.com/api`
6. Click **Deploy krishi-drishti**.

---

## 📱 Final Result & Mobile Demonstration

Your public website link will be:
$$\text{\bf https://krishi-drishti.vercel.app}$$
*(or `https://krishi-drishti.netlify.app`)*

### Why this permanent link works 24/7:
- ✅ **Completely independent of your laptop**: Runs in the cloud on Vercel & Render servers.
- ✅ **Mobile-first touch design**: Large buttons, bottom navigation, camera image capture, and text-to-speech audio reader.
- ✅ **Multilingual**: Supports **English**, **हिन्दी (Hindi)**, **मराठी (Marathi)**, and **ਪੰਜਾਬੀ (Punjabi)**.
- ✅ **1-Click Demo Personas**: Farmers and evaluators can click **Farmer Demo**, **Expert Demo**, or **Admin Demo** to immediately explore the system without manual registration.
