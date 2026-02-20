
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createEntityRouter } from './routes/entityRouter';

// Load env vars
// In Vercel, env vars are injected automatically. locally, load from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Log requests
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString().split('T')[1].split('.')[0]}] ${req.method} ${req.url}`);
    next();
});

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── CRUD Routes ───────────────────────────────────────────────
// Mount entity routers
app.use('/api/projects', createEntityRouter('projects'));
app.use('/api/departments', createEntityRouter('departments'));
app.use('/api/users', createEntityRouter('users'));
app.use('/api/taskTypes', createEntityRouter('taskTypes'));
app.use('/api/tasks', createEntityRouter('tasks'));
app.use('/api/activityLog', createEntityRouter('activityLog'));
app.use('/api/taskTemplates', createEntityRouter('taskTemplates'));

export default app;
