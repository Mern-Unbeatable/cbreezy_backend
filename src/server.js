import app from './app.js';
import pricingService from './services/pricing.service.js';

// Get port from environment variable or use default
const PORT = process.env.PORT || 3000;

// Ensure required pricing plans exist, then start server
await pricingService.ensureRequiredPlansExist();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);
});
