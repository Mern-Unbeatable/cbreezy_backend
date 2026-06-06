/**
 * Error Handling Middlewares
 */

// 404 handler - catch all undefined routes
export const notFoundHandler = (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: 'The requested resource does not exist'
  });
};

// Global error handler
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'MulterError') {
    return res.status(400).json({
      error: 'Upload Error',
      message: err.message
    });
  }

  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({
      error: 'Upload Error',
      message: err.message
    });
  }
  
  res.status(err.status || err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
