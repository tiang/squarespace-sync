const express = require('express');

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'platform-api' });
});

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
