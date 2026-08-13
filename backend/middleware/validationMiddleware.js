const logger = require('../utils/logger');

const validateBody = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      const formattedErrors = issues.map((err) => ({
        field: err.path ? err.path.join('.') : '',
        message: err.message,
      }));
      
      logger.warn(`Validation failed for ${req.originalUrl}: ${JSON.stringify(formattedErrors)}`);
      
      return res.status(400).json({
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }
    
    req.body = result.data;
    next();
  };
};

module.exports = {
  validateBody,
};
