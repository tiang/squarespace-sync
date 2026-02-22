const app = require('./app');

const PORT = process.env.PORT || 3001;

// Only start server if run directly (not when imported by Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
  });
}

// Export for Vercel serverless functions
module.exports = app;