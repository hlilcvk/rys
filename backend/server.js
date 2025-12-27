require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { closeAllPools } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const appointmentRoutes = require('./routes/appointments');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/appointments', appointmentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Randevu Yönetim API'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint bulunamadı' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Sunucu hatası:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Sunucu hatası oluştu' 
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM alındı, bağlantılar kapatılıyor...');
  await closeAllPools();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT alındı, bağlantılar kapatılıyor...');
  await closeAllPools();
  process.exit(0);
});

// Server başlat
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║   Randevu Yönetim Sistemi API                 ║
║   Port: ${PORT}                                    ║
║   Environment: ${process.env.NODE_ENV || 'development'}              ║
║   Hazır ve çalışıyor! 🚀                      ║
╚═══════════════════════════════════════════════╝
  `);
});

module.exports = app;
