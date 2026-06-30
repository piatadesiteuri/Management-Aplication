import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import pool from '../config/database';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';

const router = Router();

// --- VEHICULE ---
router.get('/vehicles', authenticate, async (req, res) => {
  try {
    const vehicleId = req.query.vehicleId ? Number(req.query.vehicleId) : undefined;
    let query = `
      SELECT 
        vd.*,
        JSON_OBJECT(
          'id', v.id,
          'brand', v.brand,
          'model', v.model,
          'registration_number', v.registration_number
        ) as vehicle
      FROM vehicle_documents vd
      LEFT JOIN vehicles v ON vd.vehicle_id = v.id
    `;
    
    const params: any[] = [];
    if (vehicleId) {
      query += ' WHERE vd.vehicle_id = ?';
      params.push(vehicleId);
    }
    
    query += ' ORDER BY vd.created_at DESC';
    
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: 'Eroare la încărcarea documentelor vehiculelor', error: errMsg });
  }
});

router.get('/vehicles/stats', authenticate, async (req, res) => {
  try {
    const vehicleId = req.query.vehicleId ? Number(req.query.vehicleId) : undefined;
    
    let query = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN expiry_date > NOW() THEN 1 ELSE 0 END) as valid,
        SUM(CASE WHEN expiry_date <= NOW() THEN 1 ELSE 0 END) as expired
      FROM vehicle_documents
    `;
    
    const params: any[] = [];
    if (vehicleId) {
      query += ' WHERE vehicle_id = ?';
      params.push(vehicleId);
    }
    
    const [rows] = await pool.execute(query, params);
    res.json((rows as any[])[0]);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: 'Eroare la încărcarea statisticilor documentelor vehiculelor', error: errMsg });
  }
});

// View document vehicul
router.get('/vehicles/:documentId/view', authenticate, async (req, res) => {
  try {
    const { documentId } = req.params;
    console.log(`👁️ [DEBUG] Viewing vehicle document ${documentId}`);

    const [documents] = await pool.execute(
      'SELECT * FROM vehicle_documents WHERE id = ?',
      [documentId]
    ) as [any[], any];

    if (documents.length === 0) {
      return res.status(404).json({ message: 'Documentul nu a fost găsit' });
    }

    const document = documents[0];
    const filePath = document.file_path;

    // Verific dacă fișierul există fizic
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Fișierul nu a fost găsit pe server' });
    }

    // Detectez tipul de fișier
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      default:
        contentType = 'application/octet-stream';
    }

    // Setez headerele pentru vizualizare inline
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    console.log('✅ Successfully serving vehicle document for viewing');
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error viewing vehicle document ${req.params.documentId}:`, error);
    res.status(500).json({ message: 'Eroare la vizualizarea documentului', error: errMsg });
  }
});

// Download document vehicul
router.get('/vehicles/:documentId/download', authenticate, async (req, res) => {
  try {
    const { documentId } = req.params;
    console.log(`📥 Downloading vehicle document ${documentId}`);

    const [documents] = await pool.execute(
      'SELECT * FROM vehicle_documents WHERE id = ?',
      [documentId]
    ) as [any[], any];

    if (documents.length === 0) {
      return res.status(404).json({ message: 'Documentul nu a fost găsit' });
    }

    const document = documents[0];
    const filePath = document.file_path;

    // Verific dacă fișierul există fizic
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Fișierul nu a fost găsit pe server' });
    }

    // Setez headerele pentru download
    const fileName = `${document.type}-${document.number}${path.extname(filePath)}`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    console.log('✅ Successfully serving vehicle document for download');
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error downloading vehicle document ${req.params.documentId}:`, error);
    res.status(500).json({ message: 'Eroare la descărcarea documentului', error: errMsg });
  }
});

// --- EVENIMENTE ---
router.get('/events', authenticate, async (req, res) => {
  try {
    const query = `
      SELECT 
        ed.*,
        JSON_OBJECT(
          'id', ce.id,
          'title', ce.title,
          'type', ce.type
        ) as event,
        JSON_OBJECT(
          'id', u.id,
          'firstName', u.first_name,
          'lastName', u.last_name,
          'email', u.email
        ) as uploader
      FROM event_documents ed
      LEFT JOIN calendar_events ce ON ed.event_id = ce.id
      LEFT JOIN users u ON ed.uploaded_by = u.id
      ORDER BY ed.created_at DESC
    `;
    
    const [rows] = await pool.execute(query);
    res.json(rows);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: 'Eroare la încărcarea documentelor evenimentelor', error: errMsg });
  }
});

router.get('/events/stats', authenticate, async (req, res) => {
  try {
    const query = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive
      FROM event_documents
    `;
    
    const [rows] = await pool.execute(query);
    res.json((rows as any[])[0]);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: 'Eroare la încărcarea statisticilor documentelor evenimentelor', error: errMsg });
  }
});

// View document eveniment
router.get('/events/:documentId/view', authenticate, async (req, res) => {
  try {
    const { documentId } = req.params;
    console.log(`👁️ [DEBUG] Viewing event document ${documentId}`);

    const [documents] = await pool.execute(
      'SELECT * FROM event_documents WHERE id = ?',
      [documentId]
    ) as [any[], any];

    if (documents.length === 0) {
      return res.status(404).json({ message: 'Documentul nu a fost găsit' });
    }

    const document = documents[0];
    const filePath = document.file_path;

    // Verific dacă fișierul există fizic
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Fișierul nu a fost găsit pe server' });
    }

    // Detectez tipul de fișier
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      default:
        contentType = 'application/octet-stream';
    }

    // Setez headerele pentru vizualizare inline
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    console.log('✅ Successfully serving event document for viewing');
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error viewing event document ${req.params.documentId}:`, error);
    res.status(500).json({ message: 'Eroare la vizualizarea documentului', error: errMsg });
  }
});

// Download document eveniment
router.get('/events/:documentId/download', authenticate, async (req, res) => {
  try {
    const { documentId } = req.params;
    console.log(`📥 Downloading event document ${documentId}`);

    const [documents] = await pool.execute(
      'SELECT * FROM event_documents WHERE id = ?',
      [documentId]
    ) as [any[], any];

    if (documents.length === 0) {
      return res.status(404).json({ message: 'Documentul nu a fost găsit' });
    }

    const document = documents[0];
    const filePath = document.file_path;

    // Verific dacă fișierul există fizic
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Fișierul nu a fost găsit pe server' });
    }

    // Setez headerele pentru download
    const fileName = `${document.title || 'document'}${path.extname(filePath)}`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    console.log('✅ Successfully serving event document for download');
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error downloading event document ${req.params.documentId}:`, error);
    res.status(500).json({ message: 'Eroare la descărcarea documentului', error: errMsg });
  }
});

// --- ENDPOINT UNIVERSAL PENTRU DETERMINAREA TIPULUI DOCUMENTULUI ---
router.get('/:documentId/view', authenticate, async (req, res) => {
  try {
    const { documentId } = req.params;
    console.log(`🔍 [DEBUG] Determining document type for ID ${documentId}`);

    // Încerc să găsesc documentul în vehicle_documents
    let [vehicleDocuments] = await pool.execute(
      'SELECT * FROM vehicle_documents WHERE id = ?',
      [documentId]
    ) as [any[], any];

    if (vehicleDocuments.length > 0) {
      // Este un document de vehicul
      console.log(`✅ Found vehicle document ${documentId}`);
      const document = vehicleDocuments[0];
      const filePath = document.file_path;

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Fișierul nu a fost găsit pe server' });
      }

      const ext = path.extname(filePath).toLowerCase();
      let contentType = 'application/octet-stream';
      
      switch (ext) {
        case '.pdf':
          contentType = 'application/pdf';
          break;
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        default:
          contentType = 'application/octet-stream';
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      console.log('✅ Successfully serving vehicle document for viewing');
      return res.sendFile(path.resolve(filePath));
    }

    // Încerc să găsesc documentul în event_documents
    let [eventDocuments] = await pool.execute(
      'SELECT * FROM event_documents WHERE id = ?',
      [documentId]
    ) as [any[], any];

    if (eventDocuments.length > 0) {
      // Este un document de eveniment
      console.log(`✅ Found event document ${documentId}`);
      const document = eventDocuments[0];
      const filePath = document.file_path;

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Fișierul nu a fost găsit pe server' });
      }

      const ext = path.extname(filePath).toLowerCase();
      let contentType = 'application/octet-stream';
      
      switch (ext) {
        case '.pdf':
          contentType = 'application/pdf';
          break;
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        default:
          contentType = 'application/octet-stream';
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      console.log('✅ Successfully serving event document for viewing');
      return res.sendFile(path.resolve(filePath));
    }

    // Documentul nu a fost găsit în niciunul din tabele
    return res.status(404).json({ message: 'Documentul nu a fost găsit' });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error viewing document ${req.params.documentId}:`, error);
    res.status(500).json({ message: 'Eroare la vizualizarea documentului', error: errMsg });
  }
});

export default router; 

// --- Conversie universală DOC/DOCX -> PDF pentru view ---
router.get('/:documentId/view-pdf', authenticate, async (req, res) => {
  try {
    const { documentId } = req.params as any;

    // Caut în vehicle_documents
    let [rows] = await pool.execute('SELECT * FROM vehicle_documents WHERE id = ?', [documentId]) as [any[], any];
    if (rows.length === 0) {
      // Caut în event_documents
      [rows] = await pool.execute('SELECT * FROM event_documents WHERE id = ?', [documentId]) as [any[], any];
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Documentul nu a fost găsit' });
    }

    const document = rows[0];
    const originalPath = document.file_path as string;
    if (!fs.existsSync(originalPath)) {
      return res.status(404).json({ message: 'Fișierul nu a fost găsit pe server' });
    }

    const ext = path.extname(originalPath).toLowerCase();
    if (ext === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      return res.sendFile(path.resolve(originalPath));
    }

    const cacheDir = path.join(__dirname, '../../uploads/documents/cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    const cachedPdf = path.join(cacheDir, `${documentId}.pdf`);

    try {
      const origStat = fs.statSync(originalPath);
      const pdfStat = fs.statSync(cachedPdf);
      if (pdfStat.mtimeMs >= origStat.mtimeMs) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        return res.sendFile(path.resolve(cachedPdf));
      }
    } catch (_) {}

    // Conversie cu LibreOffice
    const cmd = `soffice --headless --convert-to pdf --outdir ${cacheDir} ${JSON.stringify(originalPath)}`;
    await new Promise<void>((resolve, reject) => {
      exec(cmd, (error) => (error ? reject(error) : resolve()));
    });

    const producedPdf = path.join(cacheDir, path.basename(originalPath, path.extname(originalPath)) + '.pdf');
    if (!fs.existsSync(producedPdf)) {
      return res.status(500).json({ message: 'Conversia în PDF a eșuat' });
    }
    // Standardizez numele în cache
    try { fs.unlinkSync(cachedPdf); } catch (_) {}
    fs.renameSync(producedPdf, cachedPdf);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    return res.sendFile(path.resolve(cachedPdf));
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Error in /api/documents/:id/view-pdf:', errMsg);
    return res.status(500).json({ message: 'Eroare la conversia/afișarea documentului', error: errMsg });
  }
});