const express = require('express');
const cors = require('cors');
const path = require('path');
const copyrightRoutes = require('./routes/copyright');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: true,
  credentials: false,
  allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization'],
  exposedHeaders: ['X-Request-Id'],
}));
app.use(express.json({ limit: '50mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ai-copyright-api' });
});

app.use('/api/copyright', copyrightRoutes);

app.use(
  '/embed',
  express.static(path.join(__dirname, '..', 'public', 'embed'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=300');
      }
      res.setHeader('Access-Control-Allow-Origin', '*');
    },
  })
);

app.listen(PORT, () => {
  console.log(`AI Copyright API listening on port ${PORT}`);
});
