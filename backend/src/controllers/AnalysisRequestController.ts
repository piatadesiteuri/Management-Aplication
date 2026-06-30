import { Request, Response } from 'express';
import { AnalysisRequest, IAnalysisRequest } from '../models/AnalysisRequest';
import { Laboratory } from '../models/Laboratory';
import { LaboratoryTest } from '../models/LaboratoryTest';
import { ActivityLogService } from '../services/ActivityLogService';
import pool from '../config/database';

export const AnalysisRequestController = {
  // Obține toate cererile de analize
  getAll: async (req: Request, res: Response) => {
    try {
      const { patient_id, laboratory_id, status, limit, offset } = req.query;
      
      const filters: any = {};
      if (patient_id) filters.patient_id = parseInt(patient_id as string);
      if (laboratory_id) filters.laboratory_id = parseInt(laboratory_id as string);
      if (status) filters.status = status;
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);

      const requests = await AnalysisRequest.findAll(filters);
      res.json(requests);
    } catch (error) {
      console.error('Error fetching analysis requests:', error);
      res.status(500).json({ message: 'Eroare la încărcarea cererilor de analize' });
    }
  },

  // Obține o cerere de analize după ID
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const request = await AnalysisRequest.findById(parseInt(id));

      if (!request) {
        return res.status(404).json({ message: 'Cererea de analize nu a fost găsită' });
      }

      res.json(request);
    } catch (error) {
      console.error('Error fetching analysis request:', error);
      res.status(500).json({ message: 'Eroare la încărcarea cererii de analize' });
    }
  },

  // Creează o cerere de analize nouă
  create: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Utilizator neautentificat' });
      }

      const {
        patient_id,
        laboratory_id,
        responsible_doctor_id,
        referring_doctor_id,
        diagnosis,
        observations,
        reception_type,
        test_ids
      } = req.body;

      // Validare
      if (!patient_id || !laboratory_id) {
        return res.status(400).json({ 
          message: 'Pacientul și laboratorul sunt obligatorii' 
        });
      }

      if (!test_ids || !Array.isArray(test_ids) || test_ids.length === 0) {
        return res.status(400).json({ 
          message: 'Cel puțin un test trebuie selectat' 
        });
      }

      // Verifică dacă pacientul există
      const [patients]: any = await pool.query(
        'SELECT id FROM patients WHERE id = ?',
        [patient_id]
      );
      if (patients.length === 0) {
        return res.status(404).json({ message: 'Pacientul nu a fost găsit' });
      }

      // Verifică dacă laboratorul există
      const laboratory = await Laboratory.findById(laboratory_id);
      if (!laboratory) {
        return res.status(404).json({ message: 'Laboratorul nu a fost găsit' });
      }

      // Verifică testele
      const placeholders = test_ids.map(() => '?').join(',');
      const [tests]: any = await pool.query(
        `SELECT id FROM laboratory_tests WHERE id IN (${placeholders}) AND is_active = TRUE`,
        test_ids
      );
      if (tests.length !== test_ids.length) {
        return res.status(400).json({ message: 'Unele teste nu sunt valide' });
      }

      // Creează cererea
      const requestData: IAnalysisRequest = {
        patient_id,
        laboratory_id,
        responsible_doctor_id: responsible_doctor_id || undefined,
        referring_doctor_id: referring_doctor_id || undefined,
        diagnosis: diagnosis || undefined,
        observations: observations || undefined,
        status: 'DRAFT',
        reception_type: reception_type || 'WITHOUT_RECEPTION',
        created_by: userId
      };

      const createdRequest = await AnalysisRequest.create(requestData, test_ids);

      // Log activitatea
      try {
        const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
        const userAgent = req.headers['user-agent'];
        await ActivityLogService.createLog({
          user_id: userId,
          action_type: 'ANALYSIS_REQUEST_CREATED',
          entity_type: 'ANALYSIS_REQUEST',
          entity_id: createdRequest.id,
          description: `Cerere de analize creată: ${createdRequest.request_number}`,
          ip_address: ipAddress,
          user_agent: userAgent
        });
      } catch (logError) {
        console.error('Error logging activity:', logError);
      }

      // Returnează cererea completă
      const fullRequest = await AnalysisRequest.findById(createdRequest.id!);
      res.status(201).json(fullRequest);
    } catch (error: any) {
      console.error('Error creating analysis request:', error);
      res.status(500).json({ 
        message: error.message || 'Eroare la crearea cererii de analize' 
      });
    }
  },

  // Actualizează statusul unei cereri
  updateStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = (req as any).user?.id;

      if (!status) {
        return res.status(400).json({ message: 'Statusul este obligatoriu' });
      }

      const validStatuses = ['DRAFT', 'SUBMITTED', 'RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Status invalid' });
      }

      await AnalysisRequest.updateStatus(parseInt(id), status, userId);

      // Log activitatea
      try {
        const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
        const userAgent = req.headers['user-agent'];
        await ActivityLogService.createLog({
          user_id: userId,
          action_type: 'ANALYSIS_REQUEST_STATUS_UPDATED',
          entity_type: 'ANALYSIS_REQUEST',
          entity_id: parseInt(id),
          description: `Status cerere de analize actualizat: ${status}`,
          ip_address: ipAddress,
          user_agent: userAgent
        });
      } catch (logError) {
        console.error('Error logging activity:', logError);
      }

      const updatedRequest = await AnalysisRequest.findById(parseInt(id));
      res.json(updatedRequest);
    } catch (error) {
      console.error('Error updating request status:', error);
      res.status(500).json({ message: 'Eroare la actualizarea statusului' });
    }
  },

  // Obține laboratoarele disponibile
  getLaboratories: async (req: Request, res: Response) => {
    try {
      const laboratories = await Laboratory.findAll(true);
      res.json(laboratories);
    } catch (error) {
      console.error('Error fetching laboratories:', error);
      res.status(500).json({ message: 'Eroare la încărcarea laboratoarelor' });
    }
  },

  // Obține medicii unui laborator
  getLaboratoryDoctors: async (req: Request, res: Response) => {
    try {
      const { laboratoryId } = req.params;
      const doctors = await Laboratory.getDoctors(parseInt(laboratoryId));
      res.json(doctors);
    } catch (error) {
      console.error('Error fetching laboratory doctors:', error);
      res.status(500).json({ message: 'Eroare la încărcarea medicilor' });
    }
  },

  // Obține categoriile de teste
  getTestCategories: async (req: Request, res: Response) => {
    try {
      const categories = await LaboratoryTest.getCategories(true);
      res.json(categories);
    } catch (error) {
      console.error('Error fetching test categories:', error);
      res.status(500).json({ message: 'Eroare la încărcarea categoriilor de teste' });
    }
  },

  // Obține testele disponibile
  getTests: async (req: Request, res: Response) => {
    try {
      const { category_id, search } = req.query;
      
      let query = `
        SELECT 
          lt.*,
          tc.name as category_name,
          tc.code as category_code
        FROM laboratory_tests lt
        LEFT JOIN test_categories tc ON lt.category_id = tc.id
        WHERE lt.is_active = TRUE
      `;
      
      const params: any[] = [];
      
      if (search) {
        query += ` AND (lt.name LIKE ? OR lt.code LIKE ? OR lt.description LIKE ?)`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      } else if (category_id) {
        query += ` AND lt.category_id = ?`;
        params.push(category_id);
      }
      
      query += ` ORDER BY tc.display_order, lt.name`;
      
      const [tests]: any = await pool.query(query, params);
      res.json(tests);
    } catch (error) {
      console.error('Error fetching tests:', error);
      res.status(500).json({ message: 'Eroare la încărcarea testelor' });
    }
  },

  // Recepție probe
  reception: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { test_ids } = req.body;
      const userId = (req as any).user?.id;

      if (!test_ids || !Array.isArray(test_ids) || test_ids.length === 0) {
        return res.status(400).json({ message: 'Selectați cel puțin o probă' });
      }

      // Actualizează statusul testelor la RECEIVED
      const placeholders = test_ids.map(() => '?').join(',');
      await pool.execute(
        `UPDATE analysis_request_tests 
         SET status = 'IN_PROGRESS', updated_at = NOW() 
         WHERE request_id = ? AND id IN (${placeholders})`,
        [id, ...test_ids]
      );

      // Actualizează data recepției
      await pool.execute(
        'UPDATE analysis_requests SET reception_date = NOW(), updated_at = NOW() WHERE id = ?',
        [id]
      );

      // Log activitatea
      try {
        const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
        const userAgent = req.headers['user-agent'];
        await ActivityLogService.createLog({
          user_id: userId,
          action_type: 'ANALYSIS_RECEPTION',
          entity_type: 'ANALYSIS_REQUEST',
          entity_id: parseInt(id),
          description: `Recepție probe pentru cererea ${id}`,
          ip_address: ipAddress,
          user_agent: userAgent
        });
      } catch (logError) {
        console.error('Error logging activity:', logError);
      }

      res.json({ success: true, message: 'Recepția probelor a fost salvată' });
    } catch (error) {
      console.error('Error processing reception:', error);
      res.status(500).json({ message: 'Eroare la procesarea recepției' });
    }
  },

  // Introducere rezultate
  enterResults: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      // Verifică dacă este FormData (cu PDF-uri) sau JSON normal
      let results: any;
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        // Parsează results din FormData
        results = JSON.parse(req.body.results || '{}');
      } else {
        results = req.body.results;
      }

      if (!results || typeof results !== 'object') {
        return res.status(400).json({ message: 'Rezultatele sunt obligatorii' });
      }

      // Procesează PDF-urile dacă există
      const files = (req.files as Express.Multer.File[]) || [];
      const pdfMap: Record<number, { path: string; filename: string }> = {};
      
      files.forEach((file: Express.Multer.File) => {
        // Numele fișierului este de forma "pdf_<testId>"
        const match = file.fieldname.match(/^pdf_(\d+)$/);
        if (match) {
          const testId = parseInt(match[1]);
          pdfMap[testId] = {
            path: file.path,
            filename: file.originalname
          };
        }
      });

      // Actualizează rezultatele pentru fiecare test
      // testId este ID-ul din analysis_request_tests (nu din laboratory_tests)
      for (const [testId, resultData] of Object.entries(results)) {
        const result = resultData as any;
        const requestTestId = parseInt(testId as string);
        
        if (isNaN(requestTestId)) {
          console.error(`Invalid test ID: ${testId}`);
          continue;
        }
        
        // Verifică dacă testul aparține cererii
        const [testCheck]: any = await pool.execute(
          'SELECT id FROM analysis_request_tests WHERE id = ? AND request_id = ?',
          [requestTestId, id]
        );
        
        if (!testCheck || testCheck.length === 0) {
          console.error(`Test ${requestTestId} does not belong to request ${id}`);
          continue;
        }
        
        // Obține informații despre PDF dacă există
        const pdfInfo = pdfMap[requestTestId];
        
        await pool.execute(
          `UPDATE analysis_request_tests 
           SET result_value = ?, result_unit = ?, notes = ?, 
               result_pdf_path = ?, result_pdf_filename = ?,
               status = 'COMPLETED', completed_at = NOW(), completed_by = ?, updated_at = NOW()
           WHERE id = ? AND request_id = ?`,
          [
            result.value || null,
            result.unit || null,
            result.notes || null,
            pdfInfo?.path || null,
            pdfInfo?.filename || null,
            userId,
            requestTestId,
            id
          ]
        );
      }

      // Verifică dacă toate testele sunt completate
      const [testStatuses]: any = await pool.execute(
        'SELECT status FROM analysis_request_tests WHERE request_id = ?',
        [id]
      );

      const allCompleted = testStatuses.every((t: any) => t.status === 'COMPLETED');
      if (allCompleted) {
        await pool.execute(
          'UPDATE analysis_requests SET status = ? WHERE id = ?',
          ['COMPLETED', id]
        );
      }

      // Log activitatea
      try {
        const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
        const userAgent = req.headers['user-agent'];
        await ActivityLogService.createLog({
          user_id: userId,
          action_type: 'ANALYSIS_RESULTS_ENTERED',
          entity_type: 'ANALYSIS_REQUEST',
          entity_id: parseInt(id),
          description: `Rezultate introduse pentru cererea ${id}`,
          ip_address: ipAddress,
          user_agent: userAgent
        });
      } catch (logError) {
        console.error('Error logging activity:', logError);
      }

      res.json({ success: true, message: 'Rezultatele au fost salvate' });
    } catch (error) {
      console.error('Error entering results:', error);
      res.status(500).json({ message: 'Eroare la salvarea rezultatelor' });
    }
  },

  // Aprobare rezultate
  approve: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      // Verifică dacă cererea este completată
      const [requests]: any = await pool.execute(
        'SELECT status FROM analysis_requests WHERE id = ?',
        [id]
      );

      if (requests.length === 0) {
        return res.status(404).json({ message: 'Cererea nu a fost găsită' });
      }

      if (requests[0].status !== 'COMPLETED' && requests[0].status !== 'APPROVED') {
        return res.status(400).json({ message: 'Cererea nu este completată' });
      }
      
      if (requests[0].status === 'APPROVED') {
        return res.status(400).json({ message: 'Cererea este deja aprobată' });
      }

      // Marchează cererea ca aprobată
      await pool.execute(
        'UPDATE analysis_requests SET status = ?, updated_at = NOW() WHERE id = ?',
        ['APPROVED', id]
      );

      // Log activitatea
      try {
        const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
        const userAgent = req.headers['user-agent'];
        await ActivityLogService.createLog({
          user_id: userId,
          action_type: 'ANALYSIS_RESULTS_APPROVED',
          entity_type: 'ANALYSIS_REQUEST',
          entity_id: parseInt(id),
          description: `Rezultate aprobate pentru cererea ${id}`,
          ip_address: ipAddress,
          user_agent: userAgent
        });
      } catch (logError) {
        console.error('Error logging activity:', logError);
      }

      res.json({ success: true, message: 'Rezultatele au fost aprobate' });
    } catch (error) {
      console.error('Error approving results:', error);
      res.status(500).json({ message: 'Eroare la aprobarea rezultatelor' });
    }
  },

  // Invalidare rezultate (întoarcere în lista de lucru)
  invalidate: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      // Resetează statusul testelor la IN_PROGRESS
      await pool.execute(
        `UPDATE analysis_request_tests 
         SET status = 'IN_PROGRESS', result_value = NULL, result_unit = NULL, 
             completed_at = NULL, completed_by = NULL, updated_at = NOW()
         WHERE request_id = ?`,
        [id]
      );

      // Actualizează statusul cererii
      await pool.execute(
        'UPDATE analysis_requests SET status = ?, updated_at = NOW() WHERE id = ?',
        ['RECEIVED', id]
      );

      // Log activitatea
      try {
        const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
        const userAgent = req.headers['user-agent'];
        await ActivityLogService.createLog({
          user_id: userId,
          action_type: 'ANALYSIS_RESULTS_INVALIDATED',
          entity_type: 'ANALYSIS_REQUEST',
          entity_id: parseInt(id),
          description: `Rezultate invalidate pentru cererea ${id}`,
          ip_address: ipAddress,
          user_agent: userAgent
        });
      } catch (logError) {
        console.error('Error logging activity:', logError);
      }

      res.json({ success: true, message: 'Testele au fost returnate în lista de lucru' });
    } catch (error) {
      console.error('Error invalidating results:', error);
      res.status(500).json({ message: 'Eroare la invalidarea rezultatelor' });
    }
  },

  // Tipărire buletin de analize
  print: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const request = await AnalysisRequest.findById(parseInt(id));
      if (!request) {
        return res.status(404).json({ message: 'Cererea nu a fost găsită' });
      }

      // Pentru moment, returnăm datele JSON care pot fi folosite pentru generarea PDF
      // În viitor, poți integra o bibliotecă de generare PDF (ex: pdfkit, puppeteer)
      res.json({
        request,
        printable: true,
        // Aici poți adăuga logica de generare PDF
      });
    } catch (error) {
      console.error('Error generating print data:', error);
      res.status(500).json({ message: 'Eroare la generarea buletinului' });
    }
  }
};
