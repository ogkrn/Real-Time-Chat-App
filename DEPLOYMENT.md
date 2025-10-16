# 🚀 Deployment Guide - ChatConnect

## Option 1: Deploy to Render.com (RECOMMENDED)

### Why Render?
- ✅ Free tier with PostgreSQL database
- ✅ WebSocket support (Socket.IO works perfectly)
- ✅ Persistent file storage
- ✅ Easy setup

### Steps:

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/Real-Time-Chat-App.git
   git push -u origin main
   ```

2. **Create Render Account**
   - Go to https://render.com
   - Sign up (free)
   - Connect your GitHub account

3. **Deploy Database First**
   - Click "New +" → "PostgreSQL"
   - Name: `chatconnect-db`
   - Database: `chatapp`
   - User: `chatapp_user`
   - Region: Choose closest to you
   - Plan: Free
   - Click "Create Database"
   - **Copy the Internal Database URL** (you'll need this)

4. **Deploy Backend**
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Name: `chatconnect-backend`
   - Region: Same as database
   - Branch: `main`
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm start`
   - Plan: Free
   
   **Environment Variables:**
   ```
   DATABASE_URL=<paste-internal-database-url-from-step-3>
   JWT_SECRET=your-super-secret-key-change-this
   NODE_ENV=production
   PORT=5000
   ```
   
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - **Copy the backend URL** (e.g., https://chatconnect-backend.onrender.com)

5. **Deploy Frontend**
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Name: `chatconnect-frontend`
   - Region: Same as backend
   - Branch: `main`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Plan: Free
   
   **Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://chatconnect-backend.onrender.com
   NEXT_PUBLIC_SOCKET_URL=https://chatconnect-backend.onrender.com
   ```
   
   - Click "Create Web Service"
   - Wait for deployment

6. **Done!** 🎉
   - Visit your frontend URL (e.g., https://chatconnect-frontend.onrender.com)
   - Create account and test on mobile!

---

## Option 2: Deploy to Vercel (Frontend) + Render (Backend)

### Deploy Backend on Render
Follow steps 1-4 from Option 1 above.

### Deploy Frontend on Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel
   ```

3. **Add Environment Variables** (in Vercel Dashboard)
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   NEXT_PUBLIC_SOCKET_URL=https://your-backend.onrender.com
   ```

4. **Redeploy**
   ```bash
   vercel --prod
   ```

---

## ⚠️ Important Notes

### Free Tier Limitations

**Render Free Tier:**
- Services sleep after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds to wake up
- PostgreSQL: 90 days free trial, then paid
- 750 hours/month free (enough for 1 service running 24/7)

**Solutions:**
- Use a free uptime monitor (e.g., UptimeRobot) to ping your app every 10 minutes
- Upgrade to paid plan ($7/month) for always-on service

### File Upload Storage

**Render:**
- Files uploaded to `/uploads` are stored temporarily
- For persistent storage, use Render Disks (paid) or cloud storage (AWS S3, Cloudinary)

**Quick Fix for Production:**
1. Sign up for Cloudinary (free tier)
2. Update `backend/src/routes/upload.ts` to upload to Cloudinary instead of local disk

### WebSocket with Vercel

⚠️ Vercel has limitations with WebSocket connections (Socket.IO)
- **Serverless functions timeout after 10 seconds**
- Not ideal for real-time features

**Recommendation:** Deploy backend on Render, frontend on Vercel

---

## 📱 Mobile Testing

Once deployed, your app works on mobile automatically!

**Test on your phone:**
1. Open browser
2. Visit your deployed URL
3. Register/Login
4. Start chatting!

**Share with friends:**
- Send them your app URL
- They can register and chat with you in real-time!

---

## 🔧 Troubleshooting

### Issue: "Failed to connect: xhr poll error"
**Solution:** 
- Check backend logs on Render dashboard
- Verify environment variables are set correctly
- Ensure Socket.IO URL matches backend URL

### Issue: "Database connection failed"
**Solution:**
- Verify DATABASE_URL is set correctly
- Check if database is running (Render dashboard)
- Run migrations: `npx prisma migrate deploy` in Render shell

### Issue: "File uploads not working"
**Solution:**
- Render free tier doesn't persist files
- Upgrade to Render Disk or use Cloudinary

---

## 🎯 Next Steps

1. **Custom Domain** (optional)
   - Buy domain (Namecheap, Google Domains)
   - Connect to Render/Vercel (they have guides)

2. **Analytics** (optional)
   - Add Google Analytics
   - Track user engagement

3. **Monitoring**
   - Set up Sentry for error tracking
   - Use UptimeRobot to monitor uptime

---

## 💡 Tips

- **First deployment takes time** - Be patient!
- **Check logs** if something doesn't work - Render/Vercel dashboards show detailed logs
- **Test locally first** - Make sure everything works on localhost:3000
- **Start with Render** - Easiest option for beginners

---

Need help? Check:
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Open an issue on GitHub

Good luck! 🚀
