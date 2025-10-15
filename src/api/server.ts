import express from 'express';
import cors from 'cors';
import path from 'path';
import { connectDatabase } from '../services/db';
import { config } from '../config';
import { getNextLinkForUser, markVisited, markClicked } from '../services/linkQueue';
import { addPoints } from '../services/economy';
import {
  requireAdmin,
  getConfig,
  updateConfig,
  getStatistics,
  getAllLinks,
  deleteLink,
  getAllUsers,
  updateUserBalance,
} from './adminPanel';

export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/link/next/:userId', async (req, res) => {
    const link = await getNextLinkForUser(req.params.userId);
    if (!link) return res.status(404).json({ error: 'no_link_available' });
    return res.json({ id: link._id, url: link.url });
  });

  app.post('/api/verify-click', async (req, res) => {
    const { linkId, userId } = req.body || {};
    if (!linkId || !userId) return res.status(400).json({ error: 'missing_params' });
    const updated = await markVisited(linkId, userId);
    if (!updated) return res.status(404).json({ error: 'link_not_found' });
    await addPoints(userId, config.pointsPerVerifiedClick);
    return res.json({ ok: true });
  });

  // Tracking endpoint - Kullanıcı linke tıkladığında buraya gelir
  app.get('/track/:linkId/:userId/:token', async (req, res) => {
    const { linkId, userId, token } = req.params;
    
    if (!linkId || !userId || !token) {
      return res.status(400).send('Invalid tracking parameters');
    }
    
    const result = await markClicked(linkId, userId, token);
    
    if (!result) {
      return res.status(404).send('Tracking link not found or expired');
    }
    
    // Kullanıcıyı gerçek linke yönlendir
    return res.redirect(result.targetUrl);
  });

  // Root endpoint - Bot çalışıyor durumunu gösterir
  app.get('/', (_req, res) => {
    res.json({
      status: 'online',
      message: 'PrimeGrind Bot is running!',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // Health check endpoints - Render için
  app.post('/healthz', (_req, res) => res.json({ ok: true }));
  app.get('/healthz', (_req, res) => res.json({ ok: true }));

  // Admin panel HTML
  app.get('/admin', (_req, res) => {
    // Production: dist/api/adminPanel.html
    // Development: use src/api/adminPanel.html
    const htmlPath = path.join(__dirname, 'adminPanel.html');
    res.sendFile(htmlPath, (err) => {
      if (err) {
        // Fallback to src path for development
        const devPath = path.join(__dirname, '../../src/api/adminPanel.html');
        res.sendFile(devPath);
      }
    });
  });

  app.get('/api/admin/config', requireAdmin, getConfig);
  app.put('/api/admin/config', requireAdmin, updateConfig);
  app.get('/api/admin/statistics', requireAdmin, getStatistics);
  app.get('/api/admin/links', requireAdmin, getAllLinks);
  app.delete('/api/admin/links/:linkId', requireAdmin, deleteLink);
  app.get('/api/admin/users', requireAdmin, getAllUsers);
  app.put('/api/admin/users/:userId', requireAdmin, updateUserBalance);

  return app;
}

export async function startServer() {
  await connectDatabase();
  const app = createServer();
  return new Promise<void>((resolve) => {
    app.listen(config.port, () => {
      // eslint-disable-next-line no-console
      console.log(`API server listening on :${config.port}`);
      resolve();
    });
  });
}


