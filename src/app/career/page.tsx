'use client';
import { useState } from 'react';
import SajuForm from '@/components/SajuForm';

export default function CareerPage() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSajuSubmit = async (data: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/saju', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, type: 'career' })
      });
      const resData = await response.json();
      setResult(resData.analysis);
    } catch (error) {
      setResult('분석에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container" style={{ justifyContent: 'flex-start', paddingTop: '4rem' }}>
      <div className="page-header">
        <h1 className="title" style={{ fontSize: '2.5rem' }}>진로 및 사업 컨설팅</h1>
        <p className="description" style={{ marginBottom: '1.5rem' }}>
          명리학의 재성 분석을 통해 타고난 직업 적성과 창업 최적기를 확인하세요.
        </p>
      </div>

      {!result && !loading && (
        <SajuForm onSubmit={handleSajuSubmit} buttonText="나의 진로/사업운 확인하기" />
      )}
      
      {loading && (
        <div className="resultCard">
          <h2>사주 데이터를 분석 중입니다...</h2>
          <p>잠시만 기다려 주세요 (NotebookLM 연동 중)</p>
        </div>
      )}

      {result && !loading && (
        <div className="resultCard">
          <h2>분석 결과</h2>
          <p style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>{result}</p>
          <button className="btn-primary" onClick={() => setResult(null)}>다시 분석하기</button>
        </div>
      )}
    </main>
  );
}
