## Modul 2 – Management documente și fluxuri: URL-uri pentru demo / trasabilitate

### A. UI (Frontend) – unde se demonstrează
- **Management Documente**: `/admin/documents`
  - tab-uri: documente vehicule / documente evenimente
  - acțiuni: vizualizare, descărcare, conversie PDF pentru view

- **Execuție/monitorizare fluxuri de lucru (Task Management)**: `/admin/tasks`
  - fluxuri bazate pe template-uri (task_steps) + progres + istoric

- **Guvernanță / Reguli / Alerte (Rules Engine)**: `/admin/alerts`
  - reguli active, severitate, testare, motor de reguli

- **Audit / Monitorizare**: `/admin/activity-logs`
  - dovadă de trasabilitate (cine/când/ce) pentru acțiuni cheie

---

### B. API (Backend) – endpoint-uri relevante

#### 1) Workflow Engine (task workflows)
- `GET /api/task-workflows/templates`
- `POST /api/task-workflows/generate-tasks`
- `GET /api/task-workflows/events/:eventId/tasks`
- `GET /api/task-workflows/events/:eventId/progress`
- `POST /api/task-workflows/tasks/:taskId/advance`

#### 2) Workflow Engine (approval workflow)
- `GET /api/approval-workflow/events/:eventId/workflow`
- `POST /api/approval-workflow/events/:eventId/workflow/initialize`
- `GET /api/approval-workflow/requests/my`
- `POST /api/approval-workflow/requests/:requestId/action`
- `POST /api/approval-workflow/requests/:requestId/escalate`
- `POST /api/approval-workflow/requests/:requestId/cancel`

#### 3) Document Engine (document management)
- `GET /api/documents/vehicles`
- `GET /api/documents/vehicles/stats`
- `GET /api/documents/vehicles/:documentId/view`
- `GET /api/documents/vehicles/:documentId/download`
- `GET /api/documents/events`
- `GET /api/documents/events/stats`
- `GET /api/documents/events/:documentId/view`
- `GET /api/documents/events/:documentId/download`
- `GET /api/documents/:documentId/view` (universal)
- `GET /api/documents/:documentId/view-pdf` (DOC/DOCX → PDF)

#### 4) Rules / Context Engine (alerts rule engine)
- `GET /api/alerts/rules`
- `POST /api/alerts/rules`
- `PUT /api/alerts/rules/:id`
- `DELETE /api/alerts/rules/:id`
- `GET /api/alerts/rules/:ruleId/test`
- `POST /api/alerts/engine/start`
- `POST /api/alerts/engine/stop`
- `POST /api/alerts/trigger-rules`

#### 5) Audit (trasabilitate)
- `GET /api/activity-logs/*` (în funcție de implementarea paginii)


