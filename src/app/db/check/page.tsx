'use client';
import { useEffect, useState } from 'react';

export default function DbCheckPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/db/logs', { cache: 'no-store' })
            .then(async res => {
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`HTTP ${res.status}: ${text.slice(0, 100)}`);
                }
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    setLogs(data.logs);
                } else {
                    console.error('API Error:', data.error);
                    alert(`DB 오류: ${data.error}`);
                }
            })
            .catch(err => {
                console.error('Network/Parsing Error:', err);
                alert(`연결 실패: ${err.message}\n(DB 설정이나 Render 환경변수를 확인해주세요)`);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <main style={{ padding: '3rem', backgroundColor: 'var(--background)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <h1 style={{ color: 'var(--primary)', margin: 0 }}>📜 시스템 운명 로그 (최근 200건)</h1>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)' }}>총 {logs.length}건 조회됨</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Aiven Cloud DB 연동 중</div>
                </div>
            </div>

            {loading ? (
                <p>기록을 불러오는 중...</p>
            ) : (
                <div style={{ overflowX: 'auto', backgroundColor: 'var(--surface)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--surface)', color: 'var(--primary)', borderBottom: '2px solid var(--border)' }}>
                                <th style={thStyle}>ID</th>
                                <th style={thStyle}>접속 IP</th>
                                <th style={thStyle}>기준 사주 (생년월일시/성별)</th>
                                <th style={thStyle}>모드</th>
                                <th style={thStyle}>분석 내용 (일부)</th>
                                <th style={thStyle}>일시</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={tdStyle}>{log.id}</td>
                                    <td style={tdStyle}>{log.user_ip}</td>
                                    <td style={tdStyle}>
                                        {log.birth_year}.{log.birth_month}.{log.birth_day} ({log.birth_time}시) / {log.gender === 'M' ? '남' : '여'}
                                    </td>
                                    <td style={tdStyle}>{log.mode}</td>
                                    <td style={{ ...tdStyle, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {log.analysis}
                                    </td>
                                    <td style={tdStyle}>{new Date(log.created_at).toLocaleString('ko-KR')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}

const thStyle = { padding: '12px', textAlign: 'left' as const, borderBottom: 'none' };
const tdStyle = { padding: '12px', textAlign: 'left' as const };
