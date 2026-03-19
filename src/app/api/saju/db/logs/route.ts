import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT * FROM saju_logs ORDER BY created_at DESC LIMIT 200');
            return NextResponse.json({ success: true, logs: result.rows });
        } catch (queryErr: any) {
            console.error('Query Error (Table might not exist):', queryErr);
            return NextResponse.json({ success: false, error: 'Database table missing or query failed.' }, { status: 500 });
        } finally {
            client.release();
        }
    } catch (err: any) {
        console.error('Connection Error:', err);
        return NextResponse.json({
            success: false,
            error: 'Database connection failed.',
            details: err.message,
            hint: 'Please check your DATABASE_URL in Render environment variables.'
        }, { status: 500 });
    }
}
