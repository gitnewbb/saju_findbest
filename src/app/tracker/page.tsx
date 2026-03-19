'use client';
import { useState } from 'react';
import SajuForm from '@/components/SajuForm';

const ZHI_TIME_MAP: Record<string, string> = {
  '子': '23:30 ~ 01:29 (자시)',
  '丑': '01:30 ~ 03:29 (축시)',
  '寅': '03:30 ~ 05:29 (인시)',
  '卯': '05:30 ~ 07:29 (묘시)',
  '辰': '07:30 ~ 09:29 (진시)',
  '巳': '09:30 ~ 11:29 (사시)',
  '午': '11:30 ~ 13:29 (오시)',
  '未': '13:30 ~ 15:29 (미시)',
  '申': '15:30 ~ 17:29 (신시)',
  '酉': '17:30 ~ 19:29 (유시)',
  '戌': '19:30 ~ 21:29 (술시)',
  '亥': '21:30 ~ 23:29 (해시)',
};

export default function TrackerPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [formData, setFormData] = useState<any>(null);
  const [romanceLoading, setRomanceLoading] = useState<number | null>(null);
  const [romanceData, setRomanceData] = useState<Record<number, string>>({});
  const [topExplanation, setTopExplanation] = useState<string | null>(null);

  // 특정 사주 직접 검색용 스테이트
  const [specDate, setSpecDate] = useState({ year: '1995', month: '1', day: '1', time: '12', minute: '0' });
  const [specResult, setSpecResult] = useState<any>(null);
  const [specLoading, setSpecLoading] = useState(false);

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

  const handleSpecificSearch = async () => {
    if (!formData) return;
    setSpecLoading(true);
    setSpecResult(null);
    try {
      const response = await fetch('/api/saju', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          mode: 'specific_search',
          targetSajuData: specDate
        })
      });
      const data = await response.json();
      if (data.success) {
        // 정확한 매칭을 위해 사주 8글자(천간/지지)가 일치하는지 비교합니다.
        // 이렇게 하면 시차 문제나 짝수 홀수 시간 오차(예: 13시 입력)에서 100% 안전합니다.
        const targetGanStr = data.result.sajuChars.gan.join('');
        const targetZhiStr = data.result.sajuChars.zhi.join('');

        const found = results.findIndex(r =>
          r.sajuChars.gan.join('') === targetGanStr &&
          r.sajuChars.zhi.join('') === targetZhiStr
        );
        setSpecResult({ ...data.result, rank: found !== -1 ? found + 1 : null });
      }
    } catch (e) {
      alert('검색 중 오류가 발생했습니다.');
    } finally {
      setSpecLoading(false);
    }
  };

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'S': return { color: '#8b5a8c', label: '천생연분', bg: 'rgba(139,90,140,0.15)' }; // 자색(자주)
      case 'A': return { color: '#5b8c85', label: '찰떡궁합', bg: 'rgba(91,140,133,0.15)' }; // 비취색
      case 'B': return { color: '#3d6342', label: '좋은인연', bg: 'rgba(61,99,66,0.15)' }; // 국방/진록
      case 'C': return { color: '#a36b3b', label: '무난한합', bg: 'rgba(163,107,59,0.15)' }; // 황토/고동
      default: return { color: '#6b635e', label: '기타인연', bg: 'rgba(107,99,94,0.15)' };
    }
  };

  return (
    <main className="container" style={{ paddingTop: '5rem', background: 'radial-gradient(circle at top right, #fdfbf7, #f4ece3)', minHeight: '100vh' }}>
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

          {/* 한눈에 보는 운명 리포트 */}
          {summary && (
            <div style={{
              background: 'var(--gradient)',
              borderRadius: '28px',
              padding: '2.5rem',
              color: 'var(--text)',
              boxShadow: 'var(--shadow-lg)',
              textAlign: 'center',
              marginBottom: '1rem',
              border: '1px solid var(--border)'
            }}>
              <h4 style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '1.2rem', fontWeight: '800', letterSpacing: '3px', color: 'var(--accent)' }}>DESTINY REPORT</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: '900', lineHeight: '1.5', marginBottom: '2rem' }}>
                당신의 최고의 인연은<br />
                <span style={{ fontSize: '2rem', color: 'var(--primary)', textShadow: '0 0 10px rgba(163,59,59,0.1)' }}>{summary.bestYear}년 {summary.bestSeason}</span>생입니다.
              </p>

              {/* 브리핑 대시보드 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1.2rem',
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                padding: '1.5rem',
                borderRadius: '20px',
                textAlign: 'left',
                fontSize: '0.95rem',
                border: '1px solid var(--border)'
              }}>
                <div style={{ padding: '0.5rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.3rem' }}>최적의 시기</div>
                  <div style={{ fontWeight: '800', color: 'var(--accent)' }}>{summary.bestYear}년 {summary.bestSeason}</div>
                </div>
                <div style={{ padding: '0.5rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.3rem' }}>주의할 시기</div>
                  <div style={{ fontWeight: '800', color: 'var(--primary)' }}>{summary.worstYear}년생 주변</div>
                </div>
                <div style={{ padding: '0.5rem' }}>
                  <div style={{ opacity: 0.6, fontSize: '0.75rem', marginBottom: '0.3rem' }}>인연 밀집 연도</div>
                  <div style={{ fontWeight: '800' }}>{summary.mostFreqYear}년생 검색됨</div>
                </div>
                <div style={{ padding: '0.5rem' }}>
                  <div style={{ opacity: 0.6, fontSize: '0.75rem', marginBottom: '0.3rem' }}>천생연분 빈도</div>
                  <div style={{ fontWeight: '800' }}>상위 {summary.sCount}명 탐지</div>
                </div>
              </div>

              <div style={{
                marginTop: '1.5rem',
                padding: '1.2rem',
                backgroundColor: 'var(--surface)',
                borderRadius: '15px',
                fontSize: '0.92rem',
                lineHeight: '1.6',
                borderLeft: '4px solid var(--accent)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <span style={{ fontWeight: '800', color: 'var(--accent)', marginRight: '0.5rem' }}>핵심 통찰:</span>
                {summary.insight}
              </div>

              {topExplanation && (
                <div style={{
                  marginTop: '2rem',
                  paddingTop: '2rem',
                  borderTop: '1px solid var(--border)',
                  fontSize: '1.05rem',
                  lineHeight: '1.8',
                  textAlign: 'left',
                  color: 'var(--text)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {topExplanation}
                </div>
              )}
            </div>
          )}

          {/* 특정 사주 직접 확인하기 */}
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '24px',
            padding: '2rem',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🔍 궁금한 인연 직접 확인
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input type="number" placeholder="년" value={specDate.year} onChange={e => setSpecDate(p => ({ ...p, year: e.target.value }))} style={inputStyle} />
              <input type="number" placeholder="월" value={specDate.month} onChange={e => setSpecDate(p => ({ ...p, month: e.target.value }))} style={inputStyle} />
              <input type="number" placeholder="일" value={specDate.day} onChange={e => setSpecDate(p => ({ ...p, day: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              <select value={specDate.time} onChange={e => setSpecDate(p => ({ ...p, time: e.target.value }))} style={inputStyle}>
                {[...Array(24)].map((_, i) => <option key={`h-${i}`} value={i}>{i}시</option>)}
              </select>
              <select value={specDate.minute} onChange={e => setSpecDate(p => ({ ...p, minute: e.target.value }))} style={inputStyle}>
                {[...Array(60)].map((_, i) => <option key={`m-${i}`} value={i}>{i}분</option>)}
              </select>
            </div>
            <button
              onClick={handleSpecificSearch}
              disabled={specLoading}
              className="premiumBtn"
              style={{ margin: 0, padding: '0.8rem' }}
            >
              {specLoading ? '운명 대조 중...' : '이 분과의 궁합은?'}
            </button>

            {specResult && (
              <div style={{
                marginTop: '1rem',
                padding: '1.5rem',
                backgroundColor: 'var(--background)',
                borderRadius: '18px',
                border: '1px solid var(--border)',
                animation: 'fadeIn 0.5s ease-out'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>{new Date(specResult.date).getFullYear()}년생 확인 결과</span>
                  {specResult.rank ? (
                    <span style={{ backgroundColor: 'var(--primary)', color: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem' }}>
                      전체 {specResult.rank}위 탐지됨
                    </span>
                  ) : (
                    <span style={{ backgroundColor: 'var(--text-muted)', color: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem' }}>
                      숨겨진 인연 영역
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: 'var(--text)' }}>
                  {specResult.rank ? (
                    <>이미 탐색된 상위권 운명 리스트에 포함되어 있는 인연입니다! </>
                  ) : (
                    <>
                      이 분과는 우주의 기운이 다소 특별한 방식으로 흐르고 있네요.<br />
                      <span style={{ color: 'var(--accent)', fontWeight: '800' }}>
                        "우주가 잠시 숨겨둔, 당신만이 알아볼 수 있는 특별한 실마리일지도 모릅니다."
                      </span><br />
                      표면적인 점수 너머의 깊은 인연의 끈을 느껴보세요.
                    </>
                  )}
                </p>
                <div style={{ marginTop: '1rem', fontSize: '0.85rem', opacity: 0.7 }}>
                  오행 성분: {specResult.sajuChars.gan.join('')} {specResult.sajuChars.zhi.join('')}<br />
                  시간대 확인: {ZHI_TIME_MAP[specResult.sajuChars.zhi[3]] || '알 수 없음'}
                </div>
              </div>
            )}
          </div>

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
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500', lineHeight: '1.5' }}>
                        {new Date(item.date).toLocaleDateString('ko-KR')} | {item.sajuChars.gan.join('')} {item.sajuChars.zhi.join('')}<br />
                        <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>시간대: {ZHI_TIME_MAP[item.sajuChars.zhi[3]] || '측정불가'}</span>
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

const inputStyle = {
  backgroundColor: 'var(--background)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '0.6rem',
  color: 'var(--text)',
  outline: 'none',
  fontSize: '0.9rem'
};
