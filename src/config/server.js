module.exports = {
  port: process.env.PORT || 3000,
  
  apiBase: '/api',
  
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
};