require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(helmet());
app.use(compression());

// Basic protection
app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));

const PORT = process.env.PORT || 3000;

const SERVICES = {
  projects: process.env.PROJECTS_SERVICE_URL || 'http://localhost:3001',
  tasks: process.env.TASKS_SERVICE_URL || 'http://localhost:3002',
  notifications: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3003',
};

const cache = new NodeCache({ stdTTL: 10 }); // 10s cache for hot endpoints

app.get('/api/health', async (req, res) => {
  // quick health + downstream checks (best-effort)
  const checks = await Promise.allSettled([
    axios.get(`${SERVICES.projects}/health`, { timeout: 2000 }),
    axios.get(`${SERVICES.tasks}/health`, { timeout: 2000 }),
    axios.get(`${SERVICES.notifications}/health`, { timeout: 2000 }),
  ]);
  const status = {
    ok: true,
    gateway: true,
    services: {
      projects: checks[0].status === 'fulfilled',
      tasks: checks[1].status === 'fulfilled',
      notifications: checks[2].status === 'fulfilled',
    }
  };
  res.json(status);
});

// Aggregated stats (cached)
app.get('/api/stats', async (req, res) => {
  const key = 'stats';
  const hit = cache.get(key);
  if (hit) return res.json({ ...hit, cached: true });

  try{
    const [projects, tasksStats] = await Promise.all([
      axios.get(`${SERVICES.projects}/projects`, { timeout: 5000 }),
      axios.get(`${SERVICES.tasks}/stats`, { timeout: 5000 }),
    ]);

    const out = {
      projects: projects.data.length,
      tasks: tasksStats.data.tasks,
      todo: tasksStats.data.todo,
      doing: tasksStats.data.doing,
      done: tasksStats.data.done,
      cached: false,
    };
    cache.set(key, out);
    res.json(out);
  }catch(e){
    res.status(502).json({ message: 'No fue posible consultar servicios', error: e.message });
  }
});

// Proxy routes (microservices)
// Projects
app.use('/api/projects', createProxyMiddleware({
  target: SERVICES.projects,
  changeOrigin: true,
  pathRewrite: { '^/api': '' },
}));

// Tasks
app.use('/api/tasks', createProxyMiddleware({
  target: SERVICES.tasks,
  changeOrigin: true,
  pathRewrite: { '^/api': '' },
}));
app.use('/api/projects/:projectId/tasks', createProxyMiddleware({
  target: SERVICES.tasks,
  changeOrigin: true,
  pathRewrite: { '^/api': '' },
}));

// Notifications / Chat
app.use('/api/chat', createProxyMiddleware({
  target: SERVICES.notifications,
  changeOrigin: true,
  pathRewrite: { '^/api': '' },
}));
app.use('/api/notify', createProxyMiddleware({
  target: SERVICES.notifications,
  changeOrigin: true,
  pathRewrite: { '^/api': '' },
}));

app.listen(PORT, () => console.log(`[gateway] running on http://localhost:${PORT}`));

module.exports = app;
