#!/bin/bash

# Randevu Yönetim Sistemi - Hızlı Kurulum Script'i

echo "╔═══════════════════════════════════════════════════════╗"
echo "║   Randevu Yönetim Sistemi - Kurulum                  ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Node.js kontrolü
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js bulunamadı! Lütfen Node.js yükleyin.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js bulundu: $(node --version)${NC}"

# PostgreSQL kontrolü
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL CLI bulunamadı.${NC}"
    echo "   Manuel olarak veritabanlarını oluşturmanız gerekebilir."
else
    echo -e "${GREEN}✅ PostgreSQL bulundu${NC}"
fi

echo ""
echo "📦 Backend bağımlılıkları yükleniyor..."
cd backend
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ npm install başarısız!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend bağımlılıkları yüklendi${NC}"

# .env dosyası kontrolü
if [ ! -f .env ]; then
    echo ""
    echo "📝 .env dosyası oluşturuluyor..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  .env dosyasını düzenlemeniz gerekiyor!${NC}"
    echo "   Backend klasöründeki .env dosyasını açın ve:"
    echo "   - MASTER_DB_PASSWORD değerini güncelleyin"
    echo "   - JWT_SECRET değerini güvenli bir değere değiştirin"
fi

echo ""
echo "🔑 Şifre hash'leri oluşturuluyor..."
node generateHash.js

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║   Kurulum Tamamlandı!                                 ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "📋 Sonraki Adımlar:"
echo ""
echo "1. PostgreSQL'de veritabanlarını oluşturun:"
echo "   ${GREEN}createdb randevu_master${NC}"
echo "   ${GREEN}createdb guzellik_salonu_db${NC}"
echo "   ${GREEN}createdb dis_klinigi_db${NC}"
echo ""
echo "2. database-setup.sql dosyasını çalıştırın:"
echo "   ${GREEN}psql -U postgres -d randevu_master -f database-setup.sql${NC}"
echo ""
echo "3. .env dosyasını düzenleyin ve şifreleri güncelleyin"
echo ""
echo "4. Backend'i başlatın:"
echo "   ${GREEN}cd backend && npm start${NC}"
echo ""
echo "5. Başka bir terminalde Frontend'i başlatın:"
echo "   ${GREEN}cd frontend && python -m http.server 8080${NC}"
echo ""
echo "6. Tarayıcıda açın: ${GREEN}http://localhost:8080/login.html${NC}"
echo ""
echo "🔐 Varsayılan Giriş Bilgileri:"
echo "   Super Admin: superadmin / Admin123!"
echo "   İşletme 1:   guzellik_admin / Guzellik123"
echo "   İşletme 2:   dis_admin / Dis123"
echo ""
