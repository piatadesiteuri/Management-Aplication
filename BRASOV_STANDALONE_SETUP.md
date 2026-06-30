## Obiectiv
Să rulezi aplicația „Spital Brașov” **independent** de instanța veche (ex. Dolj/DSPD), cu:
- **schema MySQL separată** (ex: `spital_brasov`)
- **porturi separate** (ex: backend `3100`, frontend `5174`)

---

## 1) Porturi separate (dev)
În repo am făcut porturile configurabile din env:
- **backend**: citește `PORT` și `FRONTEND_URL`
- **frontend (Vite)**: citește `VITE_PORT` și `VITE_API_TARGET` (proxy `/api`)

### Fișiere exemplu (în repo)
- `backend/env.example` → copiezi local în `backend/.env`
- `frontend/env.example` → copiezi local în `frontend/.env`

Recomandare Brașov (dev):
- backend: `3100`
- frontend: `5174`

---

## 2) Schema MySQL separată: `spital_brasov`
### Varianta recomandată (rapidă și sigură): clonezi schema existentă
Motiv: în repo nu există un „single source of truth” complet pentru schema (sunt multe migrații + proceduri/triggers cu `DELIMITER`), iar clonarea din Workbench îți garantează că **toate coloanele** sunt identice cu ce folosește aplicația.

### Pași în MySQL Workbench
- **A) Creează schema nouă**
  - `Schemas` → click dreapta → `Create Schema...`
  - nume: `spital_brasov`
  - Apply

- **B) Copiază structura din schema curentă (ex: `DSPD`)**
  - `Server` → `Data Export`
  - selectezi schema veche (ex: `DSPD`)
  - bifezi **Dump Structure Only** (sau și data dacă vrei să pornești cu date)
  - `Export to Self-Contained File`
  - Start Export

- **C) Import în `spital_brasov`**
  - `Server` → `Data Import`
  - alegi fișierul exportat mai sus
  - înainte să rulezi importul, editezi fișierul SQL (sau folosești opțiunea de target schema) astfel încât să intre în `spital_brasov`
  - Start Import

### Verificare
În `backend/.env` setezi:
- `DB_NAME=spital_brasov`

---

## 3) Rulare aplicație (dev)
### Backend
- în `backend/.env` setezi port/DB
- pornești:
  - `npm run dev`

### Frontend
- în `frontend/.env` setezi port + proxy target
- pornești:
  - `npm run dev`

---

## 4) Notă importantă (de făcut imediat după separare)
După ce Brașov rulează separat, următorul pas util e să separăm și:
- **uploads/documents** (alt folder/bucket per instanță) ca să nu amesteci fișierele între spitale.


