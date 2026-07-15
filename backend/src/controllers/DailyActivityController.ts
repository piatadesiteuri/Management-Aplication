import { Request, Response } from 'express';
import { DailyActivityService } from '../services/DailyActivityService';

export const DailyActivityController = {
    // Obține fișa activității pentru o dată specifică
    getDailyActivity: async (req: Request, res: Response) => {
        try {
            const { date } = req.params;
            const activity = await DailyActivityService.getDailyActivity(date);
            
            res.json({
                success: true,
                data: activity
            });
        } catch (error) {
            console.error('Error fetching daily activity:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching daily activity',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    // Obține datele din ziua anterioară pentru carryover
    getPreviousDayActivity: async (req: Request, res: Response) => {
        try {
            const { date } = req.params;
            const { vehicleId } = req.query;
            const vehicleIdNum = vehicleId ? parseInt(vehicleId as string) : undefined;
            
            const previousDayData = await DailyActivityService.getPreviousDayActivity(date, vehicleIdNum);
            
            res.json({
                success: true,
                data: previousDayData
            });
        } catch (error) {
            console.error('Error fetching previous day activity:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching previous day activity',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    // Salvează fișa activității
    saveDailyActivity: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const activityData = {
                ...req.body,
                created_by: userId,
                updated_by: userId
            };

            const savedData = await DailyActivityService.saveDailyActivity(activityData);
            
            res.json({
                success: true,
                data: savedData,
                message: 'Daily activity saved successfully'
            });
        } catch (error) {
            console.error('Error saving daily activity:', error);
            res.status(500).json({
                success: false,
                message: 'Error saving daily activity',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    // Actualizează fișa activității
    updateDailyActivity: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const userId = (req as any).user.id;
            const activityData = {
                ...req.body,
                updated_by: userId
            };

            const updatedData = await DailyActivityService.updateDailyActivity(parseInt(id), activityData);
            
            res.json({
                success: true,
                data: updatedData,
                message: 'Daily activity updated successfully'
            });
        } catch (error) {
            console.error('Error updating daily activity:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating daily activity',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    // Finalizează fișa activității pentru luna și vehiculul selectat
    finalizeDailyActivity: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const { year, month, vehicleId } = req.body;

            if (!year || !month || !vehicleId) {
                return res.status(400).json({
                    success: false,
                    message: 'year, month și vehicleId sunt obligatorii',
                });
            }

            await DailyActivityService.finalizeMonthlyActivity(
                Number(year),
                String(month),
                Number(vehicleId),
                userId
            );
            
            res.json({
                success: true,
                message: 'Daily activity finalized successfully'
            });
        } catch (error) {
            console.error('Error finalizing daily activity:', error);
            res.status(500).json({
                success: false,
                message: 'Error finalizing daily activity',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    // Redeschide luna pentru editare
    reopenDailyActivity: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const { year, month, vehicleId } = req.body;

            if (!year || !month || !vehicleId) {
                return res.status(400).json({
                    success: false,
                    message: 'year, month și vehicleId sunt obligatorii',
                });
            }

            await DailyActivityService.reopenMonthlyActivity(
                Number(year),
                String(month),
                Number(vehicleId),
                userId
            );

            res.json({
                success: true,
                message: 'Daily activity reopened successfully',
            });
        } catch (error) {
            console.error('Error reopening daily activity:', error);
            res.status(500).json({
                success: false,
                message: 'Error reopening daily activity',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    },

    // Obține raportul lunar
    getMonthlyReport: async (req: Request, res: Response) => {
        try {
            const { vehicleId, year, month } = req.params;
            const report = await DailyActivityService.getMonthlyReport(
                parseInt(vehicleId),
                parseInt(year),
                parseInt(month)
            );
            
            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            console.error('Error fetching monthly report:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching monthly report',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    // Șterge o înregistrare din fișa activității zilnice
    deleteDailyActivity: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            console.log(`🗑️ DELETE request received for daily activity ID: ${id}`);
            await DailyActivityService.deleteDailyActivity(parseInt(id));
            
            res.json({
                success: true,
                message: 'Daily activity deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting daily activity:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting daily activity',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};
