const express = require('express');
const bcrypt = require('bcrypt');
const { masterPool } = require('../db');
const { authenticateToken, requireSuperAdmin } = require('../authMiddleware');

const router = express.Router();

// Tüm admin route'ları Super Admin yetkisi gerektirir
router.use(authenticateToken, requireSuperAdmin);

/**
 * GET /api/admin/isletmeler
 * Tüm işletmeleri listele
 */
router.get('/isletmeler', async (req, res) => {
  try {
    const result = await masterPool.query(
      `SELECT id, isletme_id, kullanici_adi, ad_soyad, bagli_tablo_adi, 
              db_host, db_port, db_name, db_user, 
              created_at
       FROM admin_users 
       WHERE is_super_admin = false
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('İşletmeleri listeleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

/**
 * POST /api/admin/isletme
 * Yeni işletme oluştur
 */
router.post('/isletme', async (req, res) => {
  try {
    const {
      isletme_id,
      kullanici_adi,
      ad_soyad,
      sifre,
      bagli_tablo_adi,
      db_host,
      db_port,
      db_name,
      db_user,
      db_password
    } = req.body;

    // Validasyon
    if (!isletme_id || !kullanici_adi || !sifre || !bagli_tablo_adi || 
        !db_host || !db_port || !db_name || !db_user || !db_password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tüm alanlar zorunludur' 
      });
    }

    // Kullanıcı adı kontrolü
    const checkUser = await masterPool.query(
      'SELECT id FROM admin_users WHERE kullanici_adi = $1',
      [kullanici_adi]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bu kullanıcı adı zaten kullanılıyor' 
      });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(sifre, 10);

    // Yeni işletme ekle
    const result = await masterPool.query(
      `INSERT INTO admin_users 
       (isletme_id, kullanici_adi, ad_soyad, sifre, bagli_tablo_adi, 
        db_host, db_port, db_name, db_user, db_password, is_super_admin)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false)
       RETURNING id, isletme_id, kullanici_adi, ad_soyad, bagli_tablo_adi`,
      [isletme_id, kullanici_adi, ad_soyad, hashedPassword, bagli_tablo_adi,
       db_host, db_port, db_name, db_user, db_password]
    );

    res.json({
      success: true,
      message: 'İşletme başarıyla oluşturuldu',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('İşletme oluşturma hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

/**
 * PUT /api/admin/isletme/:id
 * İşletme bilgilerini güncelle
 */
router.put('/isletme/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      kullanici_adi,
      ad_soyad,
      sifre,
      bagli_tablo_adi,
      db_host,
      db_port,
      db_name,
      db_user,
      db_password
    } = req.body;

    let query = `UPDATE admin_users SET 
                 kullanici_adi = $1, ad_soyad = $2, bagli_tablo_adi = $3,
                 db_host = $4, db_port = $5, db_name = $6, 
                 db_user = $7, db_password = $8`;
    
    let params = [kullanici_adi, ad_soyad, bagli_tablo_adi, 
                  db_host, db_port, db_name, db_user, db_password];

    // Şifre güncellenecekse
    if (sifre) {
      const hashedPassword = await bcrypt.hash(sifre, 10);
      query += `, sifre = $9 WHERE id = $10`;
      params.push(hashedPassword, id);
    } else {
      query += ` WHERE id = $9`;
      params.push(id);
    }

    query += ` RETURNING id, isletme_id, kullanici_adi, ad_soyad, bagli_tablo_adi`;

    const result = await masterPool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'İşletme bulunamadı' 
      });
    }

    res.json({
      success: true,
      message: 'İşletme başarıyla güncellendi',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('İşletme güncelleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

/**
 * DELETE /api/admin/isletme/:id
 * İşletmeyi sil
 */
router.delete('/isletme/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await masterPool.query(
      'DELETE FROM admin_users WHERE id = $1 AND is_super_admin = false RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'İşletme bulunamadı' 
      });
    }

    res.json({
      success: true,
      message: 'İşletme başarıyla silindi'
    });

  } catch (error) {
    console.error('İşletme silme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

module.exports = router;
