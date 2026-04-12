<div align="center">
  <img src="https://via.placeholder.com/150/b48aff/ffffff?text=S" alt="Snapzy Logo" width="80" height="80">
  <h1>Snapzy (formerly NexusSocial)</h1>
  <p><strong>Next-Gen Decentralized, AI-Moderated Social Platform</strong></p>
  <i>Fusing cutting-edge Web2 Glassmorphism aesthetics with immutable Web3 transparency.</i>
</div>

&nbsp;

## 🌟 Project Overview

**Snapzy** is a modern social networking platform engineered to bridge the gap between seamless user experiences and cryptographically verifiable trust. At its core, Snapzy leverages a quad-architecture approach:
1. **Onyx Glassmorphism Frontend:** A stunning, pixel-perfect React (Vite) interface implementing full light/dark mode transitions, fluid animations, and robust responsive design.
2. **Node.js Express Backend:** High-performance, scalable API managing real-time WebSockets, robust authentication, messaging, and RESTful data pipelines.
3. **Machine Learning AI Firewall:** A dedicated Python FastAPI anomaly detection service that flags toxic language, enforces behavior protocols, and maintains content safety.
4. **Blockchain Integrity Layer:** Built on Hardhat, every profile creation, post, comment, and message is hashed via SHA-256 and anchored to a local Ethereum ledger, creating a tamper-proof auditing trail verified alongside local SQLite immutable logs.

Snapzy guarantees that "what happens on chain, stays on chain"—effectively neutralizing algorithmic manipulation and shadowbanning without accountability.

---

## ✨ Features
- **Dynamic Dual-Theming:** Real-time seamless toggle between "Light Mode" and the immersive "Onyx Dark Mode" with rippling transitions.
- **Cryptographic Hashing:** User accounts, posts, comments, and direct messages generate and store local hashes (`Account Hash`, `postHash`) anchored to the blockchain.
- **AI Moderation:** Integrated Python model detects four tiers (Low, Medium, High, Critical) of toxicity. Critical violations are instantly blocked and reported to Admin Ledgers.
- **Immutable Admin Audits:** Dual-layer auditing using both an immutable SQLite log (`nexus_audit.sqlite`) and Blockchain Transaction ledgers.
- **Rich User Interactions:** Real-time direct messaging, post likes, comments, and explore-feed hashtag aggregation.

---

## 🚀 Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org) v18+
- [Python](https://python.org) 3.9+
- [MongoDB](https://www.mongodb.com) running locally (port 27017)
- Git

### 1. Start the Blockchain Node
```bash
cd blockchain
npx hardhat node
```
> Keep this terminal open. Local Ethereum node runs on http://localhost:8545

### 2. Start the AI/ML Content Firewall
```bash
cd ml-service
# First time install: pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### 3. Start the Backend Server
```bash
cd backend
# First time install: npm install
npm run dev
```

### 4. Start the Frontend Application
```bash
cd frontend
# First time install: npm install
npm run dev
```
> App launches at **http://localhost:5173** 🎉

---

## ⚙️ Environment Variables (.env)
Create `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/snapzy
JWT_SECRET=snapzy_super_secret_jwt_key_2024
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
DEPLOYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
ML_SERVICE_URL=http://localhost:8001
```

---

## 👑 Demo Accounts

| User | Email | Password | Role |
|-------|-------|----------|------|
| **Admin System** | admin1@snapzy.io | `admin@123` | Master Administrator |
| **User Alice** | alice@demo.com | `Alice@123` | Standard User |
| **User Bob** | bob@demo.com | `Bob@1234` | Standard User |

*You can generate the complete 10-layer demo account tree by running `node scripts/seedDemo.js` in the backend directory!*

---

## 🛡️ AI Content Moderation Mapping

The system automatically parses chat and comments tracking **4 severity levels**:

| Severity | Examples | Platform Action |
|----------|----------|--------|
| 🔴 **Critical** | kill, murder, bomb, rape | **Automatically blocked + Admin Alerted** |
| 🟠 **High** | hate, racist, bully, violence | **Flagged + Admin Alerted** |
| 🟡 **Medium** | idiot, stupid, spam, nsfw | **Flagged with warning** |
| 🟢 **Low** | damn, wtf | **Logged for tracking** |

> Note: All deleted toxic comments trigger an immutable `deleted_violent_comment` activity sequence so moderators can retrospectively assess platform attacks.

---

## 📂 Architecture Tree

```text
Snapzy/
├── blockchain/          ← Hardhat + Solidity Smart Contracts
├── backend/             ← Node.js + Express API + Mongoose
│   ├── models/          ← Database Schemas (User, Post, Message)
│   ├── routes/          ← API Endpoints
│   └── services/        ← Blockchain & AI Middleware Layers
├── frontend/            ← React + Vite App (Glassmorphism UI)
└── ml-service/          ← Python FastAPI Machine Learning Node
```

---

## 🌍 Global Production Deployment Guide

Ready to take Snapzy live? Follow this comprehensive roadmap specifically designed for GitHub Student Developer Pack users to deploy everything entirely for free!

### Step 1: Claim Your Free Domain
Through your GitHub Student Pack, you have access to free domain names (`.me`, `.tech`, or `.live`) for one year!
1. Go to **[GitHub Education Offers](https://education.github.com/pack/offers)**.
2. Search for the **Namecheap**, **Name.com**, or **.TECH** offer.
3. Click "Get access by connecting your GitHub account". This automatically bypasses university email region-locks and verifies your GitHub student status!

### Step 2: Push Your Code to GitHub
Open your terminal in the `Snapzy` folder:
```bash
git init
git add .
git commit -m "feat: Prepare project for global deployment"
git branch -M main
git remote add origin https://github.com/yourusername/snapzy.git
git push -u origin main
```

### Step 3: Configure Database via MongoDB Atlas
1. Go to **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)** and create a Free Cluster (M0 tier).
2. Under **Network Access**, add `0.0.0.0/0` (Allow access from anywhere).
3. Under **Database Access**, create a user with a secure password.
4. Click **Connect -> Connect your application** and copy the URI (e.g., `mongodb+srv://username:password@cluster.mongodb.net/snapzy`).

### Step 4: Deploy the Backend & AI Firewalls (Render.com)
Render provides free hosting optimized for Node.js and Python.
1. Sign into **[Render.com](https://render.com/)** using GitHub.
2. **For the Node Backend:** Click **New -> Web Service**. Connect your `snapzy` repository.
   - **Root directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:** Add `MONGO_URI` (from Step 3), `FRONTEND_URL` (Wait until Step 6 to get this, then add it), and standard JWT secrets.
3. **For the ML Service:** Click **New -> Web Service**.
   - **Root directory:** `ml-service`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port 10000`

### Step 5: Deploy the Smart Contracts (Alchemy & Sepolia)
1. Sign up for **[Alchemy](https://www.alchemy.com/)** and create a basic Ethereum Sepolia App to get a free API Key URL.
2. Inject the URL into your backend's Render Environment Variables as `BLOCKCHAIN_RPC_URL` so your API interacts with a genuine testnet rather than LocalHost!

### Step 6: Deploy the Frontend (Vercel)
Vercel is the ultimate platform for rendering React/Vite frontends natively.
1. Go to **[Vercel.com](https://vercel.com/)** and log in with GitHub.
2. Click **Add New Project** and import your `snapzy` repository.
3. **Framework Preset:** Vite
4. **Root Directory:** `frontend`
5. **Environment Variables:** Define `VITE_BACKEND_URL` and point it to the Node Backend URL you generated in Step 4.
6. Click **Deploy**!

### Step 7: Map the Custom Domain 🔗
Once Vercel deploys, route your newly claimed domain to your app:
1. In Vercel, go to **Settings -> Domains**.
2. Type in your free domain (e.g., `snapzy.tech`).
3. Vercel will provide an "A Record" IP address or a "Nameserver".
4. Copy those digits, go back to your Domain Registrar (Name.com or Namecheap), open DNS configurations, and save!
