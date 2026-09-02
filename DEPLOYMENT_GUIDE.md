# 🚀 KRISHI DRISHTI – Public Cloud Deployment Guide
# कृषि दृष्टि – पब्लिक क्लाउड डिप्लॉयमेंट गाइड

Follow these simple steps to make your **Krishi Drishti Farming App** accessible through a permanent public URL 24/7 on any mobile phone or computer, even when your laptop is turned off!

---

## 🌐 Public Live URLs (पब्लिक लाइव लिंक)

| Platform | Live Public URL | Status |
| :--- | :--- | :--- |
| **GitHub Pages** | **[https://hariomyadav144.github.io/krishi-drishti/](https://hariomyadav144.github.io/krishi-drishti/)** | 🚀 Ready & Published |
| **GitHub Repo** | **[https://github.com/hariomyadav144/krishi-drishti](https://github.com/hariomyadav144/krishi-drishti)** | 📦 Main Source Code |
| **Render API** | `https://krishi-drishti-api.onrender.com` | ⚙️ Backend Web Service |
| **Vercel** | `https://krishi-drishti.vercel.app` | 🌐 Production CDN (Optional) |

---

## ⚡ STEP 1: Enable GitHub Pages (1 Click)
## चरण 1: GitHub Pages चालू करें

Your code and automated deployment workflow are already pushed to GitHub:
1. Open your repository on GitHub:
   👉 **[https://github.com/hariomyadav144/krishi-drishti/settings/pages](https://github.com/hariomyadav144/krishi-drishti/settings/pages)**
2. Under **Build and deployment** $\rightarrow$ **Source**:
   - Select **GitHub Actions** (या **Deploy from a branch** $\rightarrow$ branch `gh-pages` $\rightarrow$ folder `/ (root)`).
3. Click **Save**.
4. Your website is instantly live at:
   👉 **https://hariomyadav144.github.io/krishi-drishti/**

---

## ⚙️ STEP 2: Deploy Backend API on Render (2 Minutes)
## चरण 2: Render पर बैकएंड चालू करें (निःशुल्क)

1. Go to **[https://dashboard.render.com](https://dashboard.render.com)** and Sign In with GitHub.
2. Click **New +** $\longrightarrow$ **Web Service**.
3. Select your repository: `hariomyadav144/krishi-drishti`.
4. Configure these simple fields:
   - **Name**: `krishi-drishti-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: **Free**
5. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `krishi_drishti_jwt_secret_2026_production`
   *(Optional: Add `MONGODB_URI` from MongoDB Atlas if you want cloud persistence. If left empty, it runs using its built-in database).*
6. Click **Create Web Service**.
7. Once deployed, verify your backend health by visiting:
   `https://krishi-drishti-api.onrender.com/api/health`

---

## 🌐 STEP 3: Deploy on Vercel or Netlify (1 Minute)
## चरण 3: Vercel या Netlify पर जोड़ें (वैकल्पिक)

### Vercel:
1. Go to **[https://vercel.com](https://vercel.com)** and Sign In with GitHub.
2. Click **Add New...** $\longrightarrow$ **Project**.
3. Select `krishi-drishti`.
4. The project includes automatic `vercel.json` configurations.
5. In **Environment Variables**, set:
   - `VITE_API_BASE_URL` = `https://krishi-drishti-api.onrender.com/api`
6. Click **Deploy**.

---

## 📱 Mobile Demonstration Features for Farmers
## किसान भाइयों के लिए मोबाइल प्रदर्शन सुविधाएं

- 🌾 **100% Mobile Optimized**: Designed like a native smartphone app with bottom navigation, big touch buttons, and high contrast.
- 👨‍🌾 **1-Click Demo Logins**:
  - Click **Farmer Demo** (Rameshwar Patil, Nashik Tomato Farm)
  - Click **Expert Demo** (Dr. Ananya Sharma, KVK Agronomist)
  - Click **Admin Demo** (System Overview & Analytics)
- 🌐 **Multilingual**: Switch seamlessly between **English** and **हिन्दी (Hindi)** with one tap.
- 🔬 **Crop Disease Scanner**: Camera photo capture with instant AI disease diagnosis, organic remedies, and chemical spray dosages.
- 📡 **Satellite NDVI Radar**: Field vegetation health index and soil moisture map.
- 📈 **Mandi Bhav (मंडी भाव)**: Live APMC market price trends for Tomato, Onion, Soybean, Cotton, and Wheat.
- 🌤️ **Weather & Agro-Advisory**: 5-day rain probability, spray suitability index, and irrigation guidance.
