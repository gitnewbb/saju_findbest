import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT * FROM saju_logs ORDER BY created_at DESC LIMIT 200');
            return NextResponse.json({ success: true, logs: result.rows });
        } finally {
            client.release();
        }
    } catch (err: any) {
        console.error('Failed to fetch logs:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
