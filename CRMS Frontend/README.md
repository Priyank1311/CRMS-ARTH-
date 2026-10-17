# CRMS Frontend (Cash Management & Reconciliation System)

Modern React + Vite frontend for multi-branch cash reconciliation and settlements.

## Vercel Deployment Guide

1. Push this repository to GitHub as a standalone repository.
2. In [Vercel Dashboard](https://vercel.com), click **Add New...** -> **Project**.
3. Import your `CRMS Frontend` repository.
4. **Build & Development Settings**:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. **Environment Variables**:
   - Key: `VITE_API_BASE_URL`
   - Value: `https://<your-render-backend-name>.onrender.com/api/v1`
6. Click **Deploy**.

## Local Development
```bash
npm install
npm run dev
```
The app will be available at `http://localhost:5173`.
