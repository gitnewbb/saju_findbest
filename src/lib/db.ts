import { Pool } from 'pg';

const isProduction = process.env.NODE_ENV === 'production';

if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL is missing in environment variables.');
}

const aivenCa = `-----BEGIN CERTIFICATE-----
MIIETTCCArWgAwIBAgIUDSFYGNyFWhC93UsAOy7QOGEA2bYwDQYJKoZIhvcNAQEM
BQAwQDE+MDwGA1UEAww1ZmQyMTVjZDMtMDg5Yy00NjhiLTg3MzQtNTRjNDFkZjBm
MzI5IEdFTiAxIFByb2plY3QgQ0EwHhcNMjUwMzI1MDMxODQ4WhcNMzUwMzIzMDMx
ODQ4WjBAMT4wPAYDVQQDDDVmZDIxNWNkMy0wODljLTQ2OGItODczNC01NGM0MWRm
MGYzMjkgR0VOIDEgUHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCC
AYoCggGBAJXQ/N5GWFgT/DQwENHmiH/nO8yDAbI1BiY3jLRly8SOCWCy6sr5kZik
YeK13OZObiOsQ6Emf9xtsx7RbAYBdAvGTdtKOiH4+/ah3Oth3MVwY3IN6Q15gT4i
6VV0rAMyS7fXG8y1A6NSh/DGlItL90Xk8s7t6L0+goRuccWv1fHv3OAW9kdmaAIC
xSgm8r8l/2d/DkTlFuZ3yRzQWblVqxZhsajb6LnssgR9jvJ7DBjaYmkeUGo74UYy
Ov6nX1ZYhQppWHfrdpuOXwF4E1MOZDEKoydSn0OSJYGmoFZgXQZZlJeE92c67agh
Yp8XvkSKicE7rWOv3PFFhPY/JQEikmHEOvy19HsBzkWB/MHMKK17h4Zf9KQYemVn
8eFVDmngqJgzoRWq+xqdavNbp6SBB0KGMQTVI4kaoEY0fRvj/HLj6GEmeRDBkJgX
nb/skGQ89AIh9NV5Oo2hmIQJdHHzZGPBjMuEzQrCdtem62x/YDAFLA/pnzZYfjdV
e48x7vsFFQIDAQABoz8wPTAdBgNVHQ4EFgQUNNJsw2Kq+V3Fe+nk0Fsi7JyuMeMw
DwYDVR0TBAgwBgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQADggGB
AGs7s1WOJ7wPM4Cs3d3O72J29F0zzDJ3mADo4rxi3yf0XbCLwwSYxIqYvC1gZWHd
UCDlfru4rKDx0Qv6zyt7L5cRyRNkn81Z2+lJA/DjzcF7sI1MXh5C3XdW+PBksRYz
FVzV5tttNIEP9X4UttykO2pLBt167w46gW/QEHnsOSpdLTmqBxfn65YjpvUApq50
Ee9S64KLV8tOJpD7xWtQtiktFslo/AugXh/KLPneqdhVJrU/bYOnE/ZeAOL6BF6x
uPXG8Qb/94Y7CVInCuS5VVJBoTiejSMYk2qDNSJLneeJ2/vS2ETFF89R9GIIbklh
tutWGeLt6yOpF2KZqAFk313bGaOJWvqksqL5ryuXJyWvKGhdQer/7wSfep/27sEE
aArACNSjc1cz4++UHmNVXsdf+dA2NnCsuFR8CjxL44cOMKrJK9m7JhkqPwGzI3U/
VeokzTmQRsqvof2Tev4m/psIWGs0i16DMsNgs1RSXtaR11za+fVadliRes9pCDDM
ZQ==
-----END CERTIFICATE-----`;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost')
        ? false
        : {
            rejectUnauthorized: true, // Safety first with CA
            ca: aivenCa,
        },
    connectionTimeoutMillis: 5000,
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
