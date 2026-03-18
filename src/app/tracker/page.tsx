'use client';
import { useState } from 'react';
import SajuForm from '@/components/SajuForm';

export default function TrackerPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [formData, setFormData] = useState<any>(null);
  const [romanceLoading, setRomanceLoading] = useState<number | null>(null);
  const [romanceData, setRomanceData] = useState<Record<number, string>>({});

  // 총평 데이터를 위한 통계 계산
  const getSummary = () => {
    if (results.length === 0) return null;
    const topTiers = results.filter(r => r.tier === 'S' || r.tier === 'A');
    if (topTiers.length === 0) return null;

    const years = topTiers.map(r => new Date(r.date).getFullYear());
    const seasons = topTiers.map(r => {
      const month = new Date(r.date).getMonth() + 1;
      if ([3, 4, 5].includes(month)) return '봄';
      if ([6, 7, 8].includes(month)) return '여름';
      if ([9, 10, 11].includes(month)) return '가을';
      return '겨울';
    });

    const mostFreq = (arr: any[]) => arr.sort((a,b) => arr.filter(v => v===a).length - arr.filter(v => v===b).length).pop();
    
    return {
      bestYear: mostFreq(years),
      bestSeason: mostFreq(seasons),
      sCount: results.filter(r => r.tier === 'S').length
    };
  };

  const summary = getSummary();

  const handleSajuSubmit = async (data: any) => {
    setLoading(true);
    setResults([]);
    setRomanceData({});
    setVisibleCount(10);
    setFormData(data);

    try {
      const response = await fetch('/api/saju', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, rangeYears: 2 })
      });
      const resData = await response.json();
      if (resData.success) {
        setResults(resData.results);
      }
    } catch (error) {
      alert('분석 실패');
    } finally {
      setLoading(false);
    }
  };

  const fetchRomanceAnalysis = async (idx: number, item: any) => {
    if (romanceData[idx]) return;
    setRomanceLoading(idx);
    try {
      const response = await fetch('/api/saju', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          mode: 'romance', 
          targetSajuData: { saju: item.sajuChars, vector: item.vector } 
        })
      });
      const data = await response.json();
      if (data.success) {
        setRomanceData(prev => ({ ...prev, [idx]: data.romance }));
      }
    } catch (e) {
      alert('AI 해석 중 에러가 발생했습니다.');
    } finally {
      setRomanceLoading(null);
    }
  };

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'S': return { color: '#8e44ad', label: '천생연분', bg: '#f4eef9' };
      case 'A': return { color: '#2980b9', label: '찰떡궁합', bg: '#ebf5fb' };
      case 'B': return { color: '#27ae60', label: '좋은인연', bg: '#eafaf1' };
      case 'C': return { color: '#f39c12', label: '무난한합', bg: '#fef5e7' };
      default: return { color: '#7f8c8d', label: '기타인연', bg: '#f4f6f6' };
    }
  };

  return (
    <main className="container" style={{ paddingTop: '5rem', background: 'radial-gradient(circle at top right, #fdfbfd, #f4f7f9)', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 4rem' }}>
        <h1 style={{ 
          fontSize: '3.2rem', 
          fontWeight: '900', 
          marginBottom: '1rem', 
          background: 'var(--gradient)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-2px'
        }}>궁합 역추적기</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: '500' }}>당신을 위한 우주 최적의 시간을 찾아냅니다.</p>
      </div>

      {!loading && results.length === 0 && (
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <SajuForm onSubmit={handleSajuSubmit} buttonText="최적 타이밍 역추적" />
        </div>
      )}
      
      {loading && (
        <div style={{ textAlign: 'center', padding: '6rem 0' }}>
          <div className="loader" style={{ margin: '0 auto 2rem', borderTopColor: 'var(--primary)' }}></div>
          <p style={{ fontSize: '1.1rem', color: 'var(--primary)', fontWeight: '600', letterSpacing: '2px' }}>DATA BRUTE-FORCING...</p>
        </div>
      )}

      {results.length > 0 && !loading && (
        <div style={{ width: '100%', maxWidth: '650px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* 총평 장표 */}
          {summary && (
            <div style={{ 
              background: 'var(--gradient)', 
              borderRadius: '28px', 
              padding: '2rem', 
              color: '#fff', 
              boxShadow: 'var(--shadow-lg)',
              textAlign: 'center',
              marginBottom: '1rem'
            }}>
              <h4 style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.5rem', fontWeight: '600' }}>DESTINY SUMMARY</h4>
              <p style={{ fontSize: '1.4rem', fontWeight: '800', lineHeight: '1.4' }}>
                당신과 가장 인연이 깊은 사람은<br/>
                <span style={{ fontSize: '1.8rem', color: '#ffd700' }}>{summary.bestYear}년 {summary.bestSeason}</span>에 태어난 사람일 확률이 높습니다.
              </p>
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.9 }}>
                탐색 범위 내 천생연분급 인연 : {summary.sCount}명 발견
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>탐색된 운명 결과</h3>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>총 {results.length}건 정렬됨</span>
            </div>
            
            {results.slice(0, visibleCount).map((item, idx) => {
              const info = getTierInfo(item.tier);
              return (
                <div key={idx} style={{ 
                  backgroundColor: '#fff',
                  borderRadius: '24px',
                  padding: '1.8rem',
                  boxShadow: 'var(--shadow-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                  border: '1px solid rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.6rem' }}>
                        <span style={{ 
                          backgroundColor: info.bg, 
                          color: info.color, 
                          padding: '6px 14px', 
                          borderRadius: '12px', 
                          fontSize: '0.85rem', 
                          fontWeight: '800' 
                        }}>{info.label}</span>
                        <span style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text)' }}>{new Date(item.date).getFullYear()}년생</span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>
                        {new Date(item.date).toLocaleDateString('ko-KR')} | {item.sajuChars.gan.join('')} {item.sajuChars.zhi.join('')}
                      </p>
                    </div>
                    {item.tier === 'S' && !romanceData[idx] && (
                      <button 
                        onClick={() => fetchRomanceAnalysis(idx, item)}
                        disabled={!!romanceLoading}
                        style={{
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          border: 'none',
                          padding: '10px 18px',
                          borderRadius: '14px',
                          fontSize: '0.9rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {romanceLoading === idx ? '분석 중' : 'AI 연애 시뮬레이션'}
                      </button>
                    )}
                  </div>

                  {romanceData[idx] && (
                    <div style={{ 
                      padding: '1.5rem', 
                      backgroundColor: '#fdfbff', 
                      borderRadius: '18px', 
                      fontSize: '0.95rem', 
                      lineHeight: '1.8',
                      border: '1px solid var(--primary-light)',
                      color: '#444',
                      whiteSpace: 'pre-wrap'
                    }}>
                      <div style={{ fontWeight: '800', color: 'var(--primary)', marginBottom: '0.8rem', fontSize: '0.9rem' }}>💡 이 인연과의 연애 패턴</div>
                      {romanceData[idx]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {visibleCount < results.length && (
            <button 
              className="premiumBtn" 
              style={{ backgroundColor: '#fff', color: 'var(--text-muted)', border: '1px solid var(--border)', boxShadow: 'none', margin: '1rem auto' }}
              onClick={() => setVisibleCount(v => v + 20)}
            >
              운명 더보기
            </button>
          )}

          <button className="btn-primary" onClick={() => {setResults([]); setRomanceData({});}} style={{ marginTop: '2rem', padding: '1.2rem', borderRadius: '18px' }}>새로운 생으로 다시 탐색</button>
        </div>
      )}
    </main>
  );
}
