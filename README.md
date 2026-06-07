# Barsan Digital Lottery (Telegram Mini App)

A fully automated digital lottery mini-app built for Telegram, utilizing a high-performance serverless backend and automated payment reconciliation via SMS processing.

## 🚀 Tech Stack
- **Frontend:** Pure HTML5, CSS3, JavaScript (ES6+), Telegram WebApp SDK
- **Backend:** Netlify Serverless Functions (Node.js)
- **Database:** Supabase (PostgreSQL) with Row Level Security (RLS)
- **Payment Engine:** Automated parsing for Commercial Bank of Ethiopia (CBE) structural SMS formats

## 📂 Project Structure
```text
├── netlify/
│   └── functions/
│       └── api.js       # Serverless API routing engine
├── index.html           # Telegram WebApp UI Core
├── style.css            # Custom dark-theme stylesheet
├── app.js               # Frontend state controller & API consumer
└── README.md            # Project Documentation
