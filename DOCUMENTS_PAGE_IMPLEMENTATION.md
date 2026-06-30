## Modul Documente – implementare (UI + API) / puncte de demo

### 1) UI (Frontend)
- **Pagină**: `frontend/src/pages/DocumentsPage.tsx`
- **URL (Admin)**: `/admin/documents`
- **URL (User)**: `/user/documents`

Pagină cu tab-uri pentru:
- **Documente vehicule** (listează + view/download)
- **Documente evenimente** (listează + view/download)

### 2) API (Backend)
- **Router**: `backend/src/routes/documents.ts`
- **Base path**: `/api/documents`

Endpoint-uri principale:
- `GET /api/documents/vehicles`
- `GET /api/documents/vehicles/stats`
- `GET /api/documents/vehicles/:documentId/view`
- `GET /api/documents/vehicles/:documentId/download`
- `GET /api/documents/events`
- `GET /api/documents/events/stats`
- `GET /api/documents/events/:documentId/view`
- `GET /api/documents/events/:documentId/download`
- `GET /api/documents/:documentId/view` (determinare universală tip document)
- `GET /api/documents/:documentId/view-pdf` (conversie DOC/DOCX → PDF pentru vizualizare)

### 3) Observații relevante pentru cerințe (achiziții)
- **Document Engine**: metadate + fișiere + vizualizare + conversie unitară
- **Arhivare**: fișierele sunt păstrate pe server (`uploads/documents/...`) cu acces controlat (auth)
- **Semnare calificată/sigilare**: extensibilă prin integrare cu furnizor (nu este activată în MVP)
 