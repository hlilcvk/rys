const jwt = require('jsonwebtoken');

/**
 * JWT Token doğrulama middleware
 * Header'dan token'ı alır, doğrular ve req.user'a işletme bilgilerini ekler
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Erişim için token gerekli' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Token geçersiz veya süresi dolmuş' 
      });
    }

    // Token payload'ındaki bilgileri req.user'a ekle
    req.user = {
      isletmeId: decoded.isletme_id,
      kullaniciAdi: decoded.kullanici_adi,
      adSoyad: decoded.ad_soyad,
      bagliTabloAdi: decoded.bagli_tablo_adi,
      isSuperAdmin: decoded.is_super_admin || false,
      dbConfig: decoded.db_config // {host, port, database, user, password}
    };

    next();
  });
}

/**
 * Sadece Super Admin erişimi için middleware
 */
function requireSuperAdmin(req, res, next) {
  if (!req.user || !req.user.isSuperAdmin) {
    return res.status(403).json({ 
      success: false, 
      message: 'Bu işlem için Super Admin yetkisi gerekli' 
    });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireSuperAdmin
};
