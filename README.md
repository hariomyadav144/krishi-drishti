# 🌾 KRISHI DRISHTI 2.0 – Next-Gen AI for Smarter Farming
> **“From Space to Soil”**  
> *Right Information. Better Decisions. Higher Yield.*

Krishi Drishti 2.0 is a production-grade, full-stack, mobile-first agricultural intelligence ecosystem designed to empower Indian farmers with real-time AI disease diagnosis from crop images, live webcam scanner, contextual agronomic advisories, speech-to-text mic input, live APMC mandi market rates, precision NPK fertilizer dosage calculators, Sentinel-2 satellite NDVI field radars, government subsidies portal, and pest outbreak early warnings.

---

## 🚀 Key Features in Version 2.0

1. **AI Crop Disease Scanner with Live Viewfinder (“Scan Your Crop”)**:
   - Real-time webcam / smartphone camera stream with scanning laser grid, snapshot capture, zoom control, and flash effect.
   - Outputs: **Detected Problem**, **Confidence %**, **Severity (Low/Med/High/Critical)**, **Possible Cause**, **Recommended Action**, **Organic/Bio Treatment**, **Chemical Treatment**, **Prevention Tips**, and **Next Action Timeline**.
   - Pathology bounding box indicator highlighting diseased zones on the leaf.
   - **1-Click WhatsApp Share** and **Printable Krishi Prescription Card**.

2. **Smart AI Agriculture Advisor with Voice Mic**:
   - Context-aware agronomy Q&A engine considering crop, soil, stage, and live weather.
   - **Speech-to-Text Microphone**: Farmers can simply speak their questions in Hindi or English using Web Speech Recognition.
   - Structured 5-Part Advice:
     1. *What is the issue?*
     2. *Why is it happening?*
     3. *What should the farmer do?*
     4. *When should the action be taken?*
     5. *What should the farmer avoid?*
   - Audio Voice Reader in multiple Indian languages.

3. **Mandi Market Live Rates & AI Price Predictor**:
   - Real-time APMC commodity modal prices across top Indian mandis (Nashik, Azadpur, Indore, Rajkot, Guntur, Khanna, etc.).
   - 7-day price trajectory sparkline charts.
   - **AI Sell vs Hold Forecast** (*e.g., "Bullish trend: Hold harvest 3 days for 8-12% higher returns"*).

4. **NPK & Precision Fertilizer Dosage Calculator**:
   - Calculates exact bags/kg of Urea, DAP, MOP, SSP, 19:19:19, Zinc, Calcium Nitrate based on exact land size (Acres, Bigha, Guntha, Hectare), soil type, and crop stage.
   - Cost estimation & organic bio-fertilizer alternatives (Jeevamrutha, Vermicompost, Neem Cake).

5. **Sentinel-2 Satellite NDVI & Field Health Radar**:
   - Multispectral satellite vegetation index monitoring biomass vigour and root-zone moisture stress across farm plot sectors.
   - 40-day vegetative health trend charts.

6. **Government Schemes & Subsidies Hub**:
   - PM-Kisan Samman Nidhi, PM Fasal Bima Yojana (PMFBY), Drip Irrigation Subsidy (PMKSY), Solar Pump (PM-KUSUM), Soil Health Card, Farm Mechanization.
   - Eligibility checker, required documents checklist, and direct official portal links.

7. **Regional Pest & Disease Outbreak Radar**:
   - Community outbreak telemetry alerting farmers to nearby infections within a 25km radius.
   - Immediate preventive biological barrier protocols.

8. **Action Plan Checklist System**:
   - Interactive day-by-day task checklist (`TODAY`, `DAY 2`, `DAY 3`, `DAY 5`, `DAY 7`).
   - Progress bar with task completion percentage.

9. **Agro-Weather & Smart Advisory Engine**:
   - 5-Day forecast with rain probabilities, humidity, wind, and smart weather farming alerts.

10. **4-Language Indian Multilingual Support**:
    - Full native UI support in **English**, **हिन्दी (Hindi)**, **मराठी (Marathi)**, and **ਪੰਜਾਬੀ (Punjabi)** with 1-click language switcher.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, Axios, Web Speech Recognition & Synthesis API, MediaDevices Camera API.
- **Backend**: Node.js, Express.js, JWT (`jsonwebtoken`), `bcryptjs`, Multer (image uploads), CORS, `dotenv`.
- **Database**: MongoDB / Mongoose models with automatic zero-config **`mongodb-memory-server`** embedded fallback + external MongoDB Atlas support.

---

## ⚙️ Quick Start & Setup Guide

### 1. Prerequisites
- **Node.js** (v18.0.0 or later)
- **npm** (v9.0.0 or later)

### 2. Backend Setup
```bash
cd backend
npm install
npm start
```

### 3. Frontend Setup
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 👥 Demo Accounts (1-Click Login Available)

| Role | Mobile Number | Password | Description |
| :--- | :--- | :--- | :--- |
| **Farmer** | `9876543210` | `password123` | Rameshwar Patil (Tomato & Onion Farmer, Nashik) |
| **Expert** | `9876500001` | `password123` | Dr. Ananya Sharma (KVK Agricultural Scientist) |
| **Admin** | `9876599999` | `password123` | Krishi Drishti Central Command Admin |
