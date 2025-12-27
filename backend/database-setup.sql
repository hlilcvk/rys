-- =====================================================
-- RANDEVU YÖNETİM SİSTEMİ - VERITABANI SETUP
-- =====================================================

-- 1. MASTER VERITABANI OLUŞTURMA
-- PostgreSQL'de psql veya pgAdmin ile çalıştırın:
-- CREATE DATABASE randevu_master;

-- Master DB'ye bağlanın ve aşağıdaki tabloları oluşturun:

-- =====================================================
-- ADMIN KULLANICILARI TABLOSU (Master DB)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    isletme_id VARCHAR(50) NOT NULL UNIQUE,
    kullanici_adi VARCHAR(100) NOT NULL UNIQUE,
    ad_soyad VARCHAR(200) NOT NULL,
    sifre VARCHAR(255) NOT NULL, -- Bcrypt hash
    bagli_tablo_adi VARCHAR(100) NOT NULL, -- Randevu tablosu adı
    
    -- Tenant DB bağlantı bilgileri
    db_host VARCHAR(255) NOT NULL DEFAULT 'localhost',
    db_port INTEGER NOT NULL DEFAULT 5432,
    db_name VARCHAR(100) NOT NULL,
    db_user VARCHAR(100) NOT NULL,
    db_password VARCHAR(255) NOT NULL,
    
    -- Yetki
    is_super_admin BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index'ler
CREATE INDEX idx_admin_users_isletme_id ON admin_users(isletme_id);
CREATE INDEX idx_admin_users_kullanici_adi ON admin_users(kullanici_adi);

-- =====================================================
-- SÜPER ADMIN KULLANICI OLUŞTURMA (İlk kurulum)
-- =====================================================
-- Şifre: Admin123! (Bcrypt hash)
INSERT INTO admin_users 
(isletme_id, kullanici_adi, ad_soyad, sifre, bagli_tablo_adi, 
 db_host, db_port, db_name, db_user, db_password, is_super_admin)
VALUES 
('SUPER_ADMIN', 'superadmin', 'Sistem Yöneticisi', 
 '$2b$10$rJ3qYvzKZvF8YN8qYvzKZu8qYvzKZvF8YN8qYvzKZvF8YN8qYv', 
 'admin_table',
 'localhost', 5432, 'randevu_master', 'postgres', 'yourpassword',
 true);

-- =====================================================
-- ÖRNEK İŞLETME 1: Güzellik Salonu
-- =====================================================
-- Önce ayrı bir DB oluşturun: CREATE DATABASE guzellik_salonu_db;
-- Sonra bu DB'ye bağlanıp randevu tablosunu oluşturun:

CREATE TABLE IF NOT EXISTS guzellik_salonu_randevular (
    id SERIAL PRIMARY KEY,
    musteri_adi VARCHAR(200) NOT NULL,
    telefon_no VARCHAR(20),
    islem_turu VARCHAR(100), -- Kesim, Boya, Manikür vs.
    calisma_odasi VARCHAR(100) NOT NULL, -- Uzman adı veya koltuk no
    baslangic_saati TIMESTAMP NOT NULL,
    bitis_saati TIMESTAMP NOT NULL,
    notlar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_guzellik_randevu_tarih ON guzellik_salonu_randevular(baslangic_saati);
CREATE INDEX idx_guzellik_randevu_oda ON guzellik_salonu_randevular(calisma_odasi);

-- Örnek randevular
INSERT INTO guzellik_salonu_randevular 
(musteri_adi, telefon_no, islem_turu, calisma_odasi, baslangic_saati, bitis_saati)
VALUES 
('Ayşe Yılmaz', '0532 111 2233', 'Saç Kesimi', 'Uzman: Zeynep', '2025-01-10 10:00:00', '2025-01-10 11:00:00'),
('Mehmet Demir', '0533 444 5566', 'Sakal Tıraşı', 'Koltuk 1', '2025-01-10 11:00:00', '2025-01-10 11:30:00'),
('Fatma Kaya', '0534 777 8899', 'Manikür', 'Uzman: Selin', '2025-01-10 14:00:00', '2025-01-10 15:00:00');

-- Master DB'ye bu işletmeyi ekle:
-- (Önce Master DB'ye bağlanın!)
INSERT INTO admin_users 
(isletme_id, kullanici_adi, ad_soyad, sifre, bagli_tablo_adi, 
 db_host, db_port, db_name, db_user, db_password, is_super_admin)
VALUES 
('GUZELLIK_001', 'guzellik_admin', 'Güzellik Salonu Yöneticisi', 
 '$2b$10$abcdefghijklmnopqrstuvwxyz123456789', -- Şifre: Guzellik123
 'guzellik_salonu_randevular',
 'localhost', 5432, 'guzellik_salonu_db', 'postgres', 'yourpassword',
 false);

-- =====================================================
-- ÖRNEK İŞLETME 2: Diş Kliniği
-- =====================================================
-- Önce: CREATE DATABASE dis_klinigi_db;

CREATE TABLE IF NOT EXISTS dis_klinigi_randevular (
    id SERIAL PRIMARY KEY,
    musteri_adi VARCHAR(200) NOT NULL,
    telefon_no VARCHAR(20),
    islem_turu VARCHAR(100), -- Kontrol, Dolgu, İmplant vs.
    calisma_odasi VARCHAR(100) NOT NULL, -- Doktor adı
    baslangic_saati TIMESTAMP NOT NULL,
    bitis_saati TIMESTAMP NOT NULL,
    sigorta_var BOOLEAN DEFAULT false,
    notlar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dis_randevu_tarih ON dis_klinigi_randevular(baslangic_saati);
CREATE INDEX idx_dis_randevu_doktor ON dis_klinigi_randevular(calisma_odasi);

-- Örnek randevular
INSERT INTO dis_klinigi_randevular 
(musteri_adi, telefon_no, islem_turu, calisma_odasi, baslangic_saati, bitis_saati, sigorta_var)
VALUES 
('Ali Veli', '0535 123 4567', 'Rutin Kontrol', 'Dr. Ahmet Çelik', '2025-01-10 09:00:00', '2025-01-10 09:30:00', true),
('Zehra Şahin', '0536 987 6543', 'Diş Dolgusu', 'Dr. Ayşe Yıldız', '2025-01-10 10:00:00', '2025-01-10 11:00:00', false);

-- Master DB'ye ekle:
INSERT INTO admin_users 
(isletme_id, kullanici_adi, ad_soyad, sifre, bagli_tablo_adi, 
 db_host, db_port, db_name, db_user, db_password, is_super_admin)
VALUES 
('DIS_KLINIK_001', 'dis_admin', 'Diş Kliniği Yöneticisi', 
 '$2b$10$xyz789abc456def123ghi456jkl789mno', -- Şifre: Dis123
 'dis_klinigi_randevular',
 'localhost', 5432, 'dis_klinigi_db', 'postgres', 'yourpassword',
 false);

-- =====================================================
-- KULLANIM NOTLARI
-- =====================================================
/*
1. Önce Master DB'yi oluşturun: randevu_master
2. admin_users tablosunu oluşturun
3. Super Admin kullanıcısını ekleyin
4. Her işletme için ayrı DB oluşturun
5. O DB'de randevu tablosunu oluşturun
6. Master DB'de işletme kaydını ekleyin

ÖNEMLİ: Bcrypt şifrelerini gerçek hash'lerle değiştirin!
Örnek hash oluşturma (Node.js):
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('Guzellik123', 10);
*/
