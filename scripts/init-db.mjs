import pg from 'pg';
import fs from 'fs';
import path from 'path';

/**
 * .env 파일에서 DATABASE_URL을 파싱하는 간단한 함수
 */
function getDatabaseUrl() {
    try {
        const envPath = path.join(process.cwd(), '.env');
        if (!fs.existsSync(envPath)) return null;
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/DATABASE_URL=['"]?([^'"\n]+)['"]?/);
        return match ? match[1] : null;
    } catch (e) {
        return null;
    }
}

async function initDb() {
    const connectionString = getDatabaseUrl();

    if (!connectionString) {
        console.error('❌ .env 파일에서 DATABASE_URL을 찾을 수 없습니다.');
        process.exit(1);
    }

    const pool = new pg.Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS saju_logs (
        id SERIAL PRIMARY KEY,
        user_ip VARCHAR(45),
        birth_year INT,
        birth_month INT,
        birth_day INT,
        birth_time VARCHAR(10),
        gender CHAR(1),
        mode VARCHAR(20),
        analysis TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

    console.log('🚀 데이터베이스 테이블 생성을 시도합니다...');

    try {
        const client = await pool.connect();
        try {
            await client.query(createTableQuery);
            console.log('✅ saju_logs 테이블이 성공적으로 생성되었거나 이미 존재합니다.');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('❌ 테이블 생성 중 오류 발생:', err);
    } finally {
        await pool.end();
    }
}

initDb();
