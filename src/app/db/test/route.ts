import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const dbUrl = process.env.DATABASE_URL || '';
    const maskedUrl = dbUrl.slice(0, 15) + '...' + dbUrl.slice(-5);

    const diagnostics = {
        env: {
            DATABASE_URL_SET: !!dbUrl,
            DATABASE_URL_PREVIEW: maskedUrl || 'NOT SET',
            NODE_ENV: process.env.NODE_ENV,
        },
        connection: {
            status: 'pending',
            error: null as string | null,
            version: null as string | null
        }
    };

    try {
        const client = await pool.connect();
        try {
            const res = await client.query('SELECT version()');
            diagnostics.connection.status = 'success';
            diagnostics.connection.version = res.rows[0].version;
        } finally {
            client.release();
        }
    } catch (err: any) {
        diagnostics.connection.status = 'failed';
        diagnostics.connection.error = err.message;
    }

    return NextResponse.json(diagnostics);
}
