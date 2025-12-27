const bcrypt = require('bcrypt');

/**
 * Şifre hash'lerini oluşturmak için yardımcı script
 * Kullanım: node generateHash.js
 */

async function generateHashes() {
  console.log('=== ŞİFRE HASH OLUŞTURUCU ===\n');

  const passwords = [
    { name: 'Super Admin', password: 'Admin123!' },
    { name: 'Güzellik Salonu', password: 'Guzellik123' },
    { name: 'Diş Kliniği', password: 'Dis123' }
  ];

  for (const item of passwords) {
    const hash = await bcrypt.hash(item.password, 10);
    console.log(`${item.name}:`);
    console.log(`  Şifre: ${item.password}`);
    console.log(`  Hash:  ${hash}`);
    console.log('');
  }

  console.log('Bu hash\'leri database-setup.sql dosyasındaki INSERT sorgularına yapıştırın.\n');
}

generateHashes().catch(console.error);
