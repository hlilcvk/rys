const express = require('express');
const { getTenantPool } = require('../db');
const { authenticateToken } = require('../authMiddleware');

const router = express.Router();

// Tüm randevu route'ları authentication gerektirir
router.use(authenticateToken);

/**
 * GET /api/appointments
 * Belirli tarih aralığındaki randevuları getir
 * Query params: start_date, end_date
 */
router.get('/', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const { dbConfig, bagliTabloAdi } = req.user;

    if (!start_date || !end_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Başlangıç ve bitiş tarihi gerekli' 
      });
    }

    // İşletmeye özel pool oluştur
    const tenantPool = getTenantPool(dbConfig);

    // Dinamik tablo adıyla sorgu
    const result = await tenantPool.query(
      `SELECT * FROM ${bagliTabloAdi} 
       WHERE DATE(baslangic_saati) >= $1 AND DATE(baslangic_saati) <= $2
       ORDER BY baslangic_saati ASC`,
      [start_date, end_date]
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Randevuları getirme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Randevular alınamadı: ' + error.message 
    });
  }
});

/**
 * GET /api/appointments/columns
 * Tablodaki sütun isimlerini ve çalışma odalarını getir
 */
router.get('/columns', async (req, res) => {
  try {
    const { dbConfig, bagliTabloAdi } = req.user;
    const tenantPool = getTenantPool(dbConfig);

    // Tablo sütun bilgilerini al
    const columnsResult = await tenantPool.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = $1
       ORDER BY ordinal_position`,
      [bagliTabloAdi]
    );

    // Çalışma odalarını (uzmanları) al
    const odasiResult = await tenantPool.query(
      `SELECT DISTINCT calisma_odasi 
       FROM ${bagliTabloAdi} 
       WHERE calisma_odasi IS NOT NULL
       ORDER BY calisma_odasi`
    );

    res.json({
      success: true,
      columns: columnsResult.rows,
      calisma_odalari: odasiResult.rows.map(r => r.calisma_odasi)
    });

  } catch (error) {
    console.error('Sütun bilgileri getirme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sütun bilgileri alınamadı: ' + error.message 
    });
  }
});

/**
 * POST /api/appointments
 * Yeni randevu oluştur
 */
router.post('/', async (req, res) => {
  try {
    const { musteri_adi, telefon_no, islem_turu, calisma_odasi, baslangic_saati, bitis_saati } = req.body;
    const { dbConfig, bagliTabloAdi } = req.user;

    // Validasyon
    if (!musteri_adi || !baslangic_saati || !bitis_saati) {
      return res.status(400).json({ 
        success: false, 
        message: 'Müşteri adı, başlangıç ve bitiş saati zorunludur' 
      });
    }

    const tenantPool = getTenantPool(dbConfig);

    // Çakışma kontrolü
    const conflictCheck = await tenantPool.query(
      `SELECT id FROM ${bagliTabloAdi} 
       WHERE calisma_odasi = $1 
       AND (
         (baslangic_saati < $3 AND bitis_saati > $2) OR
         (baslangic_saati >= $2 AND baslangic_saati < $3)
       )`,
      [calisma_odasi, baslangic_saati, bitis_saati]
    );

    if (conflictCheck.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bu saatte zaten bir randevu var' 
      });
    }

    // Randevu ekle
    const result = await tenantPool.query(
      `INSERT INTO ${bagliTabloAdi} 
       (musteri_adi, telefon_no, islem_turu, calisma_odasi, baslangic_saati, bitis_saati)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [musteri_adi, telefon_no, islem_turu, calisma_odasi, baslangic_saati, bitis_saati]
    );

    res.json({
      success: true,
      message: 'Randevu başarıyla oluşturuldu',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Randevu oluşturma hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Randevu oluşturulamadı: ' + error.message 
    });
  }
});

/**
 * PUT /api/appointments/:id
 * Randevu güncelle
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { musteri_adi, telefon_no, islem_turu, calisma_odasi, baslangic_saati, bitis_saati } = req.body;
    const { dbConfig, bagliTabloAdi } = req.user;

    const tenantPool = getTenantPool(dbConfig);

    // Çakışma kontrolü (kendi ID'si hariç)
    const conflictCheck = await tenantPool.query(
      `SELECT id FROM ${bagliTabloAdi} 
       WHERE calisma_odasi = $1 
       AND id != $2
       AND (
         (baslangic_saati < $4 AND bitis_saati > $3) OR
         (baslangic_saati >= $3 AND baslangic_saati < $4)
       )`,
      [calisma_odasi, id, baslangic_saati, bitis_saati]
    );

    if (conflictCheck.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bu saatte zaten başka bir randevu var' 
      });
    }

    // Randevu güncelle
    const result = await tenantPool.query(
      `UPDATE ${bagliTabloAdi} 
       SET musteri_adi = $1, telefon_no = $2, islem_turu = $3, 
           calisma_odasi = $4, baslangic_saati = $5, bitis_saati = $6
       WHERE id = $7
       RETURNING *`,
      [musteri_adi, telefon_no, islem_turu, calisma_odasi, baslangic_saati, bitis_saati, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Randevu bulunamadı' 
      });
    }

    res.json({
      success: true,
      message: 'Randevu başarıyla güncellendi',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Randevu güncelleme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Randevu güncellenemedi: ' + error.message 
    });
  }
});

/**
 * DELETE /api/appointments/:id
 * Randevu sil
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { dbConfig, bagliTabloAdi } = req.user;

    const tenantPool = getTenantPool(dbConfig);

    const result = await tenantPool.query(
      `DELETE FROM ${bagliTabloAdi} WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Randevu bulunamadı' 
      });
    }

    res.json({
      success: true,
      message: 'Randevu başarıyla silindi'
    });

  } catch (error) {
    console.error('Randevu silme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Randevu silinemedi: ' + error.message 
    });
  }
});

module.exports = router;
