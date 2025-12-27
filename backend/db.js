const { Pool } = require('pg');

// Master DB Pool (Admin kullanıcıları için)
const masterPool = new Pool({
  host: process.env.MASTER_DB_HOST,
  port: process.env.MASTER_DB_PORT,
  database: process.env.MASTER_DB_NAME,
  user: process.env.MASTER_DB_USER,
  password: process.env.MASTER_DB_PASSWORD,
});

// Aktif tenant bağlantılarını cache'leme
const tenantPools = new Map();

/**
 * İşletmeye özel dinamik pool oluşturur
 * @param {Object} dbConfig - {host, port, database, user, password}
 * @returns {Pool}
 */
function getTenantPool(dbConfig) {
  const poolKey = `${dbConfig.host}_${dbConfig.port}_${dbConfig.database}_${dbConfig.user}`;
  
  if (tenantPools.has(poolKey)) {
    return tenantPools.get(poolKey);
  }

  const newPool = new Pool({
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password,
    max: 10, // Her işletme için max 10 bağlantı
    idleTimeoutMillis: 30000,
  });

  tenantPools.set(poolKey, newPool);
  return newPool;
}

/**
 * Master DB'den işletme bilgilerini çeker
 * @param {number} isletmeId
 * @returns {Object|null}
 */
async function getIsletmeDbConfig(isletmeId) {
  try {
    const result = await masterPool.query(
      `SELECT db_host, db_port, db_name, db_user, db_password, bagli_tablo_adi 
       FROM admin_users 
       WHERE isletme_id = $1 LIMIT 1`,
      [isletmeId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      host: row.db_host,
      port: row.db_port,
      database: row.db_name,
      user: row.db_user,
      password: row.db_password,
      tableName: row.bagli_tablo_adi
    };
  } catch (error) {
    console.error('İşletme DB config alınamadı:', error);
    return null;
  }
}

/**
 * Tüm pool'ları güvenli şekilde kapatır
 */
async function closeAllPools() {
  await masterPool.end();
  for (const pool of tenantPools.values()) {
    await pool.end();
  }
  tenantPools.clear();
}

module.exports = {
  masterPool,
  getTenantPool,
  getIsletmeDbConfig,
  closeAllPools
};
