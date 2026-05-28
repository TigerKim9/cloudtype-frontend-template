const express = require('express');
const cors = require('cors');
const copyrightRoutes = require('./routes/copyright');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ai-copyright-api' });
});

app.use('/api/copyright', copyrightRoutes);

app.listen(PORT, () => {
  console.log(`AI Copyright API listening on port ${PORT}`);
});
