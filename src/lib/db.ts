import { Pool } from 'pg';

const isProduction = process.env.NODE_ENV === 'production';

if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL is missing in environment variables.');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost')
        ? false
        : {
            rejectUnauthorized: false, // For Aiven/Render production DB
        },
    connectionTimeoutMillis: 5000, // 5 second timeout to avoid hanging
});

/**
 * DB에 사주 요청 로그를 남깁니다.
 * 서버 리스폰스 지연을 방지하기 위해 await 없이 실행하거나 비동기 처리를 권장합니다.
 */
export async function logSajuRequest(data: {
    ip?: string;
    birthYear: number;
    birthMonth: number;
    birthDay: number;
    birthTime: string;
    gender: string;
    mode: string;
    analysis: string;
}) {
    const query = `
    INSERT INTO saju_logs (
      user_ip, birth_year, birth_month, birth_day, birth_time, gender, mode, analysis
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `;

    const values = [
        data.ip || 'unknown',
        data.birthYear,
        data.birthMonth,
        data.birthDay,
        data.birthTime,
        data.gender,
        data.mode,
        data.analysis
    ];

    try {
        const client = await pool.connect();
        try {
            await client.query(query, values);
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Failed to log to DB:', err);
    }
}

export async function initializeDatabase() {
    const query = `
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

    const client = await pool.connect();
    try {
        await client.query(query);
        return { success: true, message: 'Table saju_logs initialized successfully' };
    } catch (err: any) {
        console.error('Database initialization failed:', err);
        return { success: false, error: err.message };
    } finally {
        client.release();
    }
}

export default pool;
