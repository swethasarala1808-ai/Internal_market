# 🎯 ERPNext Internal Marketing Feedback Portal

An internal web app for the ERPNext company where the **Marketing Team** uploads marketing materials (posters, ads, content) per ERPNext solution, and **Internal Staff** get notified and give structured feedback.

---

## ✨ Features

### Marketing Team
- Upload marketing materials (posters, ads, content, videos, brochures, social media)
- Tag each material to an ERPNext solution (HR, CRM, Payroll, etc.)
- View all feedback with ratings and comments
- Approve materials → they move to the Approved Library
- Manage ERPNext solution categories

### Internal Staff
- Get notified via **Email** + **WhatsApp** when new material is uploaded
- Browse materials filtered by solution/type/status
- Give feedback with **5 rating options**: 🌟 Excellent | 👍 Good | 😐 Okay | ⚠️ Needs Work | 👎 Bad
- Add written comment + improvement suggestion
- View approved material library grouped by solution, with downloads

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT (7-day tokens) |
| Email | Nodemailer (SMTP/Gmail) |
| WhatsApp | Twilio WhatsApp API |
| File Upload | Multer (local storage) |
| Hosting | Render / Railway (suggested) |

---

## 🚀 Setup & Installation

### 1. Clone the repo
```bash
git clone https://github.com/swethasarala1808-ai/Internal_market.git
cd Internal_market
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI, email credentials, Twilio keys
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

---

## ⚙️ Environment Variables (backend/.env)

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
TWILIO_ACCOUNT_SID=...          # Optional for WhatsApp
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
FRONTEND_URL=http://localhost:3000
```

---

## 📱 First Run

1. Register a **Marketing** account
2. Go to **Solutions** → click **⚡ Seed Default Solutions** (adds HR, CRM, Payroll, etc.)
3. Register **Internal Staff** accounts
4. Marketing team uploads material → all internal users get email/WhatsApp notification
5. Internal staff log in, give feedback
6. Marketing team reviews feedback and approves the best materials

---

## 🌐 Hosting (Recommended: Render.com)

1. Push code to GitHub ✅
2. Go to [render.com](https://render.com) → New Web Service → connect repo
3. Backend: set Root Directory = `backend`, Build Command = `npm install`, Start = `npm start`
4. Frontend: set Root Directory = `frontend`, Build Command = `npm run build`
5. Add all environment variables in Render dashboard
6. Done — works on all mobile and desktop devices via HTTPS!

---

## 🔔 Notification Flow

```
Marketing uploads material
        ↓
Backend sends Email to all internal users (notifyEmail=true)
Backend sends WhatsApp to all internal users with phone (notifyWhatsapp=true)
        ↓
Internal user clicks link → opens app → gives feedback
        ↓
Marketing team gets email notification about new feedback
```

---

## 📁 Project Structure

```
├── backend/
│   ├── models/          # MongoDB schemas (User, Material, Feedback, Solution)
│   ├── routes/          # Express API routes
│   ├── middleware/       # JWT auth middleware
│   ├── utils/           # Notifications, file upload
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── pages/       # All page components
│   │   ├── components/  # Navbar
│   │   ├── context/     # AuthContext
│   │   └── api/         # Axios config
│   └── public/
└── README.md
```
