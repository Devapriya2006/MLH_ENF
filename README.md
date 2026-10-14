# CivicLens AI

CivicLens is a React/Vite civic issue reporting interface with an Express API, MongoDB persistence, local image storage, and optional Ollama vision analysis.

## Repository audit and implementation plan

The repository already contained a React dashboard, map, report/detail/admin pages, JWT authentication, Mongoose complaint/user models, local upload storage, and Ollama/Cloudflare analysis. The main reporting gap was that the browser uploaded an image to a temporary analysis endpoint and later created a complaint with a client-supplied image reference. AI failures were converted to mock results, upload validation trusted MIME headers, and server error responses could leak internal messages. This implementation changes report submission to multipart and persists the complaint and image before attempting AI analysis. Existing visual pages and routes remain in place.

The project has no worker account model or persistent comments model. Those workflows are not represented as complete in this release.

## Requirements and setup (PowerShell)

Requirements: Node.js 18+, MongoDB 6+, and Ollama if using local vision analysis.

```powershell
Copy-Item server\.env.example server\.env
Set-Location server
npm.cmd install
npm.cmd run dev
```

In another terminal:

```powershell
Set-Location client
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:5173`. For mobile camera/GPS use an HTTPS tunnel to the Vite server (`cloudflared tunnel --url http://localhost:5173`); Vite proxies API and uploads to the backend. The device and development computer must be online, and tunnel URLs are publicly reachable while active. Do not expose MongoDB or Ollama ports.

Set `VISION_MODEL` to an installed Ollama vision model, then run `ollama pull qwen3-vl:4b-instruct`. `AI_MODE=mock` explicitly enables deterministic simulated analysis for development; mock reports are marked for human review. Cloudflare Workers AI remains optional via account/token settings. To create an administrator, set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (plus optional name/department) and run `npm.cmd run seed` from `server`; `ADMIN_EMAILS` does not provision accounts.

Citizen reports require a photo captured through the in-app live camera and a fresh device location fix at or better than `MAX_LOCATION_ACCURACY_M` (20 m by default). Set the matching Vite value `VITE_MAX_LOCATION_ACCURACY_M` if you change the server threshold. The report and image are persisted before AI analysis starts; the ticket is returned immediately and analysis status is polled afterward. Category mismatches, unclear images, mock output, and AI failures remain available for human review. Create an administrator by setting `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` and running `npm.cmd run seed` from `server`; `ADMIN_EMAILS` does not create accounts.

For remote phone testing, run the client tunnel from `client` (`npm.cmd run tunnel`) so the HTTPS URL reaches Vite. Browser API calls and protected image requests use same-origin paths and Vite proxies them to the computer's local Express server. Complaint images are served through the same-origin authenticated API. Do not tunnel MongoDB or Ollama ports.

## Configuration

Copy `server/.env.example` to `server/.env`. Configure `PORT`, `MONGO_URI`, a long random `JWT_SECRET`, `CLIENT_URL`, `OLLAMA_URL`, `VISION_MODEL`, `AI_TIMEOUT_MS`, `AI_MODE`, optional Cloudflare credentials/model, `PUBLIC_URL`, `DUP_RADIUS_M`, `VERIFY_THRESHOLD`, and `ADMIN_EMAILS`. Never commit `.env`, local uploads, or logs. A MongoDB URI should bind/access only the intended local or private network.

## Architecture and data

- `client/`: React 18, Vite, Tailwind, MapLibre.
- `server/`: Express, JWT, Mongoose, Multer, Ollama/Cloudflare vision client.
- Mongo collections: `users` (unique email) and `complaints` (unique sparse ticket ID; 2dsphere location; status/priority and category indexes).
- Images are stored under `server/uploads` using generated UUID filenames. Complaint detail image retrieval checks the authenticated reporter or admin role.
- Complaint creation saves image and Mongo record before vision analysis. Analysis failure is recorded against the complaint and does not remove the report.

## API inventory

- `GET /api/health`
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/complaints/analyze` (advisory image analysis), `POST /api/complaints` (multipart durable report submission)
- `GET /api/complaints`, `GET /api/complaints/map`, `GET /api/complaints/:id`, `GET /api/complaints/:id/analysis`, `GET /api/complaints/:id/image/:imageId`, `GET /api/complaints/:id/activity`
- `POST /api/complaints/:id/confirm`, `PATCH /api/complaints/:id/status`, `POST /api/complaints/:id/resolve`, `POST /api/complaints/:id/verify-resolution`
- `GET /api/complaints/stats` (admin), `GET /api/complaints/leaderboard`

The requested admin/worker assignment API, comments API, and dedicated analytics endpoint are **NOT IMPLEMENTED**. Current assignments are a status plus free-form `assignedTo`; there is no worker identity/authorization model. Comments have no schema or UI. Repair upload/comparison and citizen verification use the existing `resolve` and `verify-resolution` paths rather than the separately named requested endpoints.

All API routes are prefixed with `/api`; the Vite proxy uses relative browser URLs. Uploads accept JPEG, PNG, or WebP up to 8 MiB and check the file signature.

## Tests and verification

Run `Set-Location server; npm.cmd test` and `Set-Location client; npm.cmd test` for regression tests. Run `Set-Location client; npm.cmd run build` for the production client build. MongoDB-backed API timing and actual Ollama success/timeout paths require those services and must be exercised in a configured environment. Do not use the demo seed script on real data: it clears the selected database collections before inserting demo records.

## Troubleshooting

- Mongo connection failure: confirm MongoDB is running and `MONGO_URI` points to the intended database.
- AI reports with `analysisStatus: failed`: check Ollama health (`ollama list`), model name, and `AI_TIMEOUT_MS`; the complaint and image remain stored.
- Mobile camera/GPS unavailable: browsers require a secure context, so use an HTTPS tunnel to Vite and grant device permissions.
- Images unavailable: keep `server/uploads` persistent and verify local disk access. Private complaint images require the reporter or an admin session.
