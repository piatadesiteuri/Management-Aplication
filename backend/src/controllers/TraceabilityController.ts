import { Request, Response } from 'express';
import { TraceabilityService } from '../services/TraceabilityService';

export const TraceabilityController = {
  /**
   * Obține trasabilitatea completă a unei cereri de materiale
   */
  getMaterialRequestTraceability: async (req: Request, res: Response) => {
    try {
      const { requestId } = req.params;
      const userId = req.user!.id;
      const userRoles = req.user!.roles;

      // Verifică dacă utilizatorul are dreptul să vizualizeze această cerere
      const isInspector = userRoles.includes('INSPECTOR') || userRoles.includes('SUPER_ADMIN') || userRoles.includes('DEPARTMENT_ADMIN');
      
      if (!isInspector) {
        return res.status(403).json({ 
          success: false, 
          message: 'Nu aveți dreptul să vizualizați trasabilitatea cererilor' 
        });
      }

      const traceability = await TraceabilityService.getCompleteRequestTraceability(parseInt(requestId));
      
      if (!traceability.request) {
        return res.status(404).json({ 
          success: false, 
          message: 'Cererea de materiale nu a fost găsită' 
        });
      }

      res.json({
        success: true,
        data: traceability
      });
    } catch (error) {
      console.error('❌ Error fetching material request traceability:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Eroare la preluarea trasabilității cererii',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  /**
   * Obține trasabilitatea completă a unui eveniment de transport
   */
  getTransportEventTraceability: async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const userId = req.user!.id;
      const userRoles = req.user!.roles;

      // Verifică dacă utilizatorul are dreptul să vizualizeze acest eveniment
      const isInspector = userRoles.includes('INSPECTOR') || userRoles.includes('SUPER_ADMIN') || userRoles.includes('DEPARTMENT_ADMIN');
      
      if (!isInspector) {
        return res.status(403).json({ 
          success: false, 
          message: 'Nu aveți dreptul să vizualizați trasabilitatea evenimentelor' 
        });
      }

      const traceability = await TraceabilityService.getCompleteTransportTraceability(parseInt(eventId));
      
      if (!traceability.event) {
        return res.status(404).json({ 
          success: false, 
          message: 'Evenimentul de transport nu a fost găsit' 
        });
      }

      res.json({
        success: true,
        data: traceability
      });
    } catch (error) {
      console.error('❌ Error fetching transport event traceability:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Eroare la preluarea trasabilității evenimentului',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  /**
   * Obține toate cererile cu trasabilitatea lor
   */
  getAllRequestsWithTraceability: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const userRoles = req.user!.roles;

      // Verifică dacă utilizatorul are dreptul să vizualizeze cererile
      const isInspector = userRoles.includes('INSPECTOR') || userRoles.includes('SUPER_ADMIN') || userRoles.includes('DEPARTMENT_ADMIN');
      
      if (!isInspector) {
        return res.status(403).json({ 
          success: false, 
          message: 'Nu aveți dreptul să vizualizați cererile' 
        });
      }

      const filters = {
        status: req.query.status as string,
        priority: req.query.priority as string,
        requester_id: req.query.requester_id ? parseInt(req.query.requester_id as string) : undefined,
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20
      };

      const result = await TraceabilityService.getAllRequestsWithTraceability(filters);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('❌ Error fetching requests with traceability:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Eroare la preluarea cererilor cu trasabilitate',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  /**
   * Obține statistici de trasabilitate
   */
  getTraceabilityStatistics: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const userRoles = req.user!.roles;

      // Verifică dacă utilizatorul are dreptul să vizualizeze statisticile
      const isAuthorized = userRoles.includes('INSPECTOR') || userRoles.includes('SUPER_ADMIN') || userRoles.includes('DEPARTMENT_ADMIN');
      
      if (!isAuthorized) {
        return res.status(403).json({ 
          success: false, 
          message: 'Nu aveți dreptul să vizualizați statisticile' 
        });
      }

      const statistics = await TraceabilityService.getTraceabilityStatistics();

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('❌ Error fetching traceability statistics:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Eroare la preluarea statisticilor de trasabilitate',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  /**
   * Obține audit trail pentru o entitate specifică
   */
  getAuditTrail: async (req: Request, res: Response) => {
    try {
      const { entityType, entityId } = req.params;
      const userId = req.user!.id;
      const userRoles = req.user!.roles;

      // Verifică dacă utilizatorul are dreptul să vizualizeze audit trail
      const isInspector = userRoles.includes('INSPECTOR') || userRoles.includes('SUPER_ADMIN') || userRoles.includes('DEPARTMENT_ADMIN');
      
      if (!isInspector) {
        return res.status(403).json({ 
          success: false, 
          message: 'Nu aveți dreptul să vizualizați audit trail-ul' 
        });
      }

      let auditTrail = [];

      switch (entityType) {
        case 'material_request':
          auditTrail = await TraceabilityService.getMaterialRequestTraceability(parseInt(entityId));
          break;
        case 'transport_event':
          auditTrail = await TraceabilityService.getTransportEventTraceability(parseInt(entityId));
          break;
        default:
          return res.status(400).json({ 
            success: false, 
            message: 'Tip de entitate invalid' 
          });
      }

      res.json({
        success: true,
        data: auditTrail
      });
    } catch (error) {
      console.error('❌ Error fetching audit trail:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Eroare la preluarea audit trail-ului',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};
