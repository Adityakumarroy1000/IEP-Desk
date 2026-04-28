# IEP Desk

Serverless app to help families understand IEPs with AI analysis, rights breakdowns, and meeting prep kits.

## Structure
- `client/` React + Vite frontend
- `api/` Serverless API handlers (Firebase + Firestore, used by Vercel and local serverless dev)
- `server/` Legacy Express + Mongo path (not required for current serverless flow)

## Local Serverless Setup (No MongoDB)
1. Configure root `.env` with serverless API variables:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `OPENROUTER_API_KEY`
   - `CLIENT_URL=http://localhost:5173`
2. Configure `client/.env` with Firebase client keys.
3. Install dependencies:
   - `npm.cmd install`
   - `npm.cmd --prefix client install`
4. Run serverless API locally:
   - `npm.cmd run dev:api`
5. Run frontend:
   - `npm.cmd run dev:client`

Frontend runs on `http://localhost:5173`, API runs on `http://localhost:3000`, and Vite proxies `/api` automatically.

## Deploy (Vercel)
1. Push repo to GitHub
2. Import to Vercel
3. Add root API env vars in Vercel Project Settings
4. Add `VITE_*` vars for client
5. Deploy

## Notes
- API auth requires Firebase ID tokens.
- Data persistence is Firestore (not MongoDB).
- Legal disclaimer is enforced on AI responses.
