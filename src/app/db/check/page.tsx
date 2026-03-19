'use client';
import { useEffect, useState } from 'react';

export default function DbCheckPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/db/logs', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setLogs(data.logs);
                } else {
                    console.error('API Error:', data.error);
                    alert('로그를 불러오지 못했습니다. DB 초기화 여부를 확인해주세요.');
                }
            })
            .catch(err => {
                console.error('Network Error:', err);
                alert('서버와 연결할 수 없습니다.');
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <main style={{ padding: '3rem', backgroundColor: '#101010', minHeight: '100vh', color: '#e6dfd8', fontFamily: 'serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
                <h1 style={{ color: '#d4af37', margin: 0 }}>📜 시스템 운명 로그 (최근 200건)</h1>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ffd700' }}>총 {logs.length}건 조회됨</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Aiven Cloud DB 연동 중</div>
                </div>
            </div>

            {loading ? (
                <p>기록을 불러오는 중...</p>
            ) : (
                <div style={{ overflowX: 'auto', backgroundColor: '#1e1e1e', borderRadius: '12px', padding: '1rem', border: '1px solid #333' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#1e1e1e', color: '#d4af37' }}>
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
                                <tr key={log.id} style={{ borderBottom: '1px solid #333' }}>
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

const thStyle = { padding: '12px', textAlign: 'left' as const, borderBottom: '2px solid #333' };
const tdStyle = { padding: '12px', textAlign: 'left' as const };
