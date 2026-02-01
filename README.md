# LAFY AL07113680
# SW Gestor (UX/UI + Tareas)
Proyecto full stack con **React + Vite** (frontend) y **Node.js + Express + MongoDB** (backend).
Incluye UX/UI intuitivo y CRUD de tareas con fechas, estado y prioridad.

## Requisitos
- Node.js 18+
- MongoDB local activo (por defecto: mongodb://localhost:27017/swgestor)

## Backend
```bash
cd server
npm install
npm run dev
```
Servidor: http://localhost:3000

## Frontend
```bash
cd client
npm install
npm run dev
```
App: http://localhost:5173

## Config (opcional)
Frontend puede usar `VITE_API_URL` en `.env`:
```
VITE_API_URL=http://localhost:3000
```
