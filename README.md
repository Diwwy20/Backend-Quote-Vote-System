# 📝 Backend-Quote-Vote-System

This service is built with **NestJS** and handles all quote-related functionalities including creation, retrieval, updating, deletion, voting, and user dashboard statistics.

## 🚀 Features

- Fetch all quotes from the system  
- Fetch quotes created by a specific user  
- Create, update, and delete quotes  
- Vote on quotes  
- Retrieve top 3 quotes with the highest votes  
- User dashboard summarizing:  
  - Total quotes created  
  - Total votes received  
  - User ranking based on votes  
  - Percentage breakdown of quotes created by category

---

## 🛠 Tech Stack

- **Backend Framework**: NestJS (Node.js + TypeScript)  
- **Database**: PostgreSQL (Neon)  
- **Cache**: Redis  
- **Authentication**: JWT (integration with Auth Service)  

---

## ⚙️ Environment Variables (.env)

Create a `.env` file in the root directory with the following variables:

```env
NODE_ENV=development

DB_URL=postgresql://neondb_owner:npg_gjILc14eomOU@ep-shiny-glade-a1uybeg0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

PORT=4000

Redis_Host=redis-15014.c295.ap-southeast-1-1.ec2.redns.redis-cloud.com
Redis_Port=15014
Redis_Password=129HxrADtiTIfDmx06RlzwXwXQ8n3a8z

JWT_SEC=<Generate a secret key by running: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and paste the output here>

User_URL=https://backend-auth-system-production.up.railway.app
---
## 📦 How to Run

1. **Clone the repository**

```bash
git clone https://github.com/Diwwy20/Backend-Quote-Vote-System
cd quote-service

2. **Install dependencies**
npm install

3. **Create and configure the .env file**
   - Copy the example above into a .env file in the project root
   - Make sure all environment variables are set correctly

4. **Run the development server**
npm run start:dev
