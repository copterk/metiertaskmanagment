import { Router, Request, Response } from 'express';
import { getAll, appendRow, updateRow, deleteRow } from '../sheetsRepository';

export function createEntityRouter(sheetName: string): Router {
    const router = Router();

    // GET all
    router.get('/', async (_req: Request, res: Response) => {
        try {
            const items = await getAll(sheetName);
            res.json(items);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST create
    router.post('/', async (req: Request, res: Response) => {
        try {
            const item = req.body;
            await appendRow(sheetName, item);
            res.status(201).json(item);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    // PUT update
    router.put('/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const updated = await updateRow(sheetName, id, req.body);
            if (!updated) return res.status(404).json({ error: 'Not found' });
            res.json(req.body);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE
    router.delete('/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const deleted = await deleteRow(sheetName, id);
            if (!deleted) return res.status(404).json({ error: 'Not found' });
            res.json({ success: true });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
}
