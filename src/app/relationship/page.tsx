'use client';
import { useState } from 'react';
import SajuForm from '@/components/SajuForm';

export default function RelationshipPage() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSajuSubmit = async (data: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/saju', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, type: 'relationship' })
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
        <h1 className="title" style={{ fontSize: '2.5rem' }}>대인관계 및 심리 치유</h1>
        <p className="description" style={{ marginBottom: '1.5rem' }}>
          전생과 카르마 해석을 통해 갈등의 원인을 풀이하고 심리적 위안을 제공합니다.
        </p>
      </div>

      {!result && !loading && (
        <SajuForm onSubmit={handleSajuSubmit} buttonText="관계 카르마 해석하기" />
      )}
      
      {loading && (
        <div className="resultCard">
          <h2>명리학 기반 관계를 분석 중입니다...</h2>
          <p>잠시만 기다려 주세요</p>
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
