# IEP Desk

Full-stack MERN application to help parents understand IEPs with AI analysis, rights breakdowns, and meeting prep kits.

## Structure
- `client/` React + Vite frontend
- `api/` Vercel Serverless API (single-repo deploy)
- `server/` Express backend (legacy local-only; not used in Vercel deploy)

## Local Setup (Vercel-style)
1. Copy environment files:
   - `server/.env.example` -> `.env` (root for Vercel API)
   - `client/.env.example` -> `client/.env`
2. Install dependencies:
   - `npm.cmd install`
   - `cd client && npm.cmd install`
3. Run frontend:
   - `cd client && npm.cmd run dev`

For local API testing, use Vercel dev or set `VITE_API_URL` to your deployed URL.

## Deployment (Vercel Only)
1. Push the repo to GitHub
2. Import into Vercel
3. Add **all server env vars** in Vercel Project Settings (from `server/.env.example`)
4. Add **VITE_* client env vars** in Vercel
5. Deploy

Vercel will build `client/` and serve API routes from `/api`.

## Notes
- All AI endpoints require Firebase auth tokens.
- Legal disclaimer is enforced on every AI response.
