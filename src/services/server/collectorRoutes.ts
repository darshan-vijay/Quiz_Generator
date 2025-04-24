import { Router, Request, Response } from 'express';
import { getAllCollectorEntries, getCollectorEntryById } from './collectorService';

// Create Express router
const router = Router();

/**
 * GET /api/collector
 * Retrieve all entries from the collector database
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const entries = await getAllCollectorEntries();
    res.json(entries);
  } catch (error: any) {
    console.error('Error in GET /api/collector:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve collector data' });
  }
});

/**
 * GET /api/collector/:id
 * Retrieve a single entry by ID from the collector database
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ error: 'Missing ID parameter' });
      return;
    }
    
    const entry = await getCollectorEntryById(id);
    
    if (!entry) {
      res.status(404).json({ error: `Entry with ID ${id} not found` });
      return;
    }
    
    res.json(entry);
  } catch (error: any) {
    console.error(`Error in GET /api/collector/${req.params.id}:`, error);
    res.status(500).json({ error: error.message || 'Failed to retrieve collector entry' });
  }
});

export const collectorApiRoutes = router; 