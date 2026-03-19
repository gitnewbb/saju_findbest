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
  const [topExplanation, setTopExplanation] = useState<string | null>(null);

  // 총평 데이터를 위한 통계 계산 (운명 브리핑 강화)
  const getSummary = () => {
    if (results.length === 0) return null;
    const topTiers = results.filter(r => r.tier === 'S' || r.tier === 'A');
    if (topTiers.length === 0) return null;

    // 1. 최고의 인연 (1위)
    const topMatch = results[0];
    const topDate = new Date(topMatch.date);
    const bestYear = topDate.getFullYear();
    const month = topDate.getMonth() + 1;
    let bestSeason = '겨울';
    if ([3, 4, 5].includes(month)) bestSeason = '봄';
    else if ([6, 7, 8].includes(month)) bestSeason = '여름';
    else if ([9, 10, 11].includes(month)) bestSeason = '가을';

    // 2. 최악의 인연 (점수 최하위)
    const worstMatch = results[results.length - 1];
    const worstDate = new Date(worstMatch.date);
    const worstYear = worstDate.getFullYear();

    // 3. 최빈 시기 (상위권에서 가장 많이 겹치는 연도)
    const years = topTiers.map(r => new Date(r.date).getFullYear());
    const mostFreqYear = years.sort((a, b) => years.filter(v => v === a).length - years.filter(v => v === b).length).pop();

    // 4. 궁합 인사이트 (조후 vs 합)
    const avgHap = topTiers.reduce((acc, curr) => acc + (curr.vector.hap || 0), 0) / topTiers.length;
    const avgJohu = topTiers.reduce((acc, curr) => acc + (curr.vector.johu || 0), 0) / topTiers.length;
    const insight = avgJohu > avgHap
      ? "기운의 차가운/뜨거운 균형(조후)이 잘 맞는 인연이 귀합니다."
      : "서로 끌어당기는 성분(육합/삼합)의 조화가 무척 강한 편입니다.";

    return {
      bestYear,
      bestSeason,
      worstYear,
      mostFreqYear,
      insight,
      sCount: results.filter(r => r.tier === 'S').length
    };
  };

  const summary = getSummary();

  const handleSajuSubmit = async (data: any) => {
    setLoading(true);
    setResults([]);
    setRomanceData({});
    setTopExplanation(null);
    setVisibleCount(10);
    setFormData(data);

    try {
      const response = await fetch('/api/saju', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, rangeYears: 2, needExplanation: true })
      });
      const resData = await response.json();
      if (resData.success) {
        setResults(resData.results);
        if (resData.explanation) setTopExplanation(resData.explanation);
      }
    } catch (error) {
      alert('분석에 실패하였습니다. 다시 시도해 주세요.');
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
      alert('운명 시뮬레이션 중 오류가 발생했습니다.');
    } finally {
      setRomanceLoading(null);
    }
  };

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'S': return { color: '#e0b0ff', label: '천생연분', bg: 'rgba(142,68,173,0.3)' };
      case 'A': return { color: '#85c1e9', label: '찰떡궁합', bg: 'rgba(41,128,185,0.3)' };
      case 'B': return { color: '#82e0aa', label: '좋은인연', bg: 'rgba(39,174,96,0.3)' };
      case 'C': return { color: '#f8c471', label: '무난한합', bg: 'rgba(243,156,18,0.3)' };
      default: return { color: '#bdc3c7', label: '기타인연', bg: 'rgba(127,140,141,0.3)' };
    }
  };

  return (
    <main className="container" style={{ paddingTop: '5rem', background: 'radial-gradient(circle at top right, #1a1a1a, #0a0a0a)', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 4rem' }}>
        <h1 style={{
          fontSize: '3.2rem',
          fontWeight: '900',
          marginBottom: '1rem',
          background: 'var(--gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-2px'
        }}>운명 궁합 역추적기</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: '500' }}>당신을 위한 우주의 최적 인연 시점을 찾아냅니다.</p>
      </div>

      {!loading && results.length === 0 && (
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <SajuForm onSubmit={handleSajuSubmit} buttonText="운명의 시점 역추적 시작" />
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '6rem 0' }}>
          <div className="loader" style={{ margin: '0 auto 2rem', borderTopColor: 'var(--primary)' }}></div>
          <p style={{ fontSize: '1.1rem', color: 'var(--primary)', fontWeight: '600', letterSpacing: '2px' }}>우주의 기운을 탐색 중...</p>
        </div>
      )}

      {results.length > 0 && !loading && (
        <div style={{ width: '100%', maxWidth: '650px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* 총평 장표 (운명 브리핑) */}
          {summary && (
            <div style={{
              background: 'var(--gradient)',
              borderRadius: '28px',
              padding: '2.5rem',
              color: '#fff',
              boxShadow: 'var(--shadow-lg)',
              textAlign: 'center',
              marginBottom: '1rem'
            }}>
              <h4 style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.8rem', fontWeight: '800', letterSpacing: '2px' }}>DESTINY BRIEFING</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: '900', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                당신과 가장 인연이 깊은 사람은<br />
                <span style={{ fontSize: '1.9rem', color: '#ffd700' }}>{summary.bestYear}년 {summary.bestSeason}</span>에 태어난 사람입니다.
              </p>

              {/* 브리핑 대시보드 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                backgroundColor: 'rgba(0,0,0,0.2)',
                padding: '1.2rem',
                borderRadius: '18px',
                textAlign: 'left',
                fontSize: '0.95rem'
              }}>
                <div>
                  <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>💎 최적의 시기</span>
                  <div style={{ fontWeight: '700' }}>{summary.bestYear}년 {summary.bestSeason}</div>
                </div>
                <div>
                  <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>⚠️ 거리둘 시기</span>
                  <div style={{ fontWeight: '700' }}>{summary.worstYear}년생 주변</div>
                </div>
                <div>
                  <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>📊 발견된 빈도</span>
                  <div style={{ fontWeight: '700' }}>{summary.mostFreqYear}년생 다수 분포</div>
                </div>
                <div>
                  <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>✨ 상위권 비율</span>
                  <div style={{ fontWeight: '700' }}>천생연분 {summary.sCount}명</div>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '0.9rem', fontStyle: 'italic' }}>
                💡 {summary.insight}
              </div>

              {topExplanation && (
                <div style={{
                  marginTop: '1.5rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid rgba(255,255,255,0.2)',
                  fontSize: '1.05rem',
                  lineHeight: '1.7',
                  textAlign: 'left',
                  fontWeight: '400',
                  color: '#fff',
                  whiteSpace: 'pre-wrap'
                }}>
                  {topExplanation}
                </div>
              )}
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
                  backgroundColor: 'var(--surface)',
                  borderRadius: '24px',
                  padding: '1.8rem',
                  boxShadow: 'var(--shadow-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                  border: '1px solid var(--border)'
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
                      backgroundColor: 'var(--background)',
                      borderRadius: '18px',
                      fontSize: '0.95rem',
                      lineHeight: '1.8',
                      border: '1px solid var(--primary-light)',
                      color: 'var(--text)',
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
              style={{ backgroundColor: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)', boxShadow: 'none', margin: '1rem auto' }}
              onClick={() => setVisibleCount(v => v + 20)}
            >
              운명 더보기
            </button>
          )}

          <button className="btn-primary" onClick={() => { setResults([]); setRomanceData({}); }} style={{ marginTop: '2rem', padding: '1.2rem', borderRadius: '18px' }}>새로운 생으로 다시 탐색</button>
        </div>
      )}
    </main>
  );
}
