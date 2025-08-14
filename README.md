# 📚 CampusMart

CampusMart is a **student-to-student marketplace** where students from different campuses can **buy** and **sell** items easily within their community.  
Built with **Next.js**, **MongoDB**, and **NextAuth.js**, it provides a secure and user-friendly platform for second-hand trading among students.

---

## 🚀 Features

- 🛒 **Post & Browse Items** – Students can sell their used items and explore what others are offering.
- 🔍 **Search & Filter** – Quickly find products by name or category.
- 🏫 **Campus-Based Listings** – Connect buyers and sellers from specific campuses.
- 🔐 **Google Authentication** – Sign in quickly and securely with Google.
- 📸 **Image Uploads** – Add product photos for better engagement.
- 📩 **Email Notifications** – Get alerts for new messages or offers.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js  
- **Backend:** Node.js (Next.js API routes)  
- **Database:** MongoDB  
- **Authentication:** NextAuth.js (Google OAuth)  
- **Email Service:** Nodemailer (SMTP)  
- **Package Manager:** npm  

---

## 📂 Project Structure

```plaintext
CampusMart/
│── .next/             # Next.js build output (auto-generated)
│── app/               # App Router pages & API routes
│── components/        # Reusable React components
│── lib/               # Database and utility functions
│── node_modules/      # Project dependencies
│── public/            # Static assets (images, icons, etc.)
│── .env.local         # Environment variables (local)
│── .gitignore         # Git ignore rules
│── jsconfig.json      # Path aliases & JS config
│── next.config.mjs    # Next.js configuration
│── package-lock.json  # Dependency lock file
│── package.json       # Dependencies & scripts
│── README.md          # Project documentation

```
⚙️ Installation & Setup
1️⃣ Clone the repository
```
git clone https://github.com/iamshubham1704/CampusMart.git
cd CampusMart
```
2️⃣ Install dependencies
```
npm install
```
3️⃣ Create .env.local and add the following variables:
```
# ===== Database Connection =====
MONGODB_URI=your_mongodb_connection_string

# ===== Google Authentication (OAuth) =====
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# ===== NextAuth Configuration =====
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
JWT_SECRET=your_jwt_secret

# ===== Email Service (for notifications / password reset) =====
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password_or_app_password

# ===== Public Base URL =====
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```
4️⃣ Run the development server
```
npm run dev
```
5️⃣ Open the app
```
Visit http://localhost:3000 in your browser.

```
📌 Roadmap

✅ Marketplace listing & search

✅ MongoDB integration

✅ Google authentication with NextAuth

🔄 Real-time chat for buyers/sellers

🔄 Email-based campus verification

🔄 Mobile app version using React Native
