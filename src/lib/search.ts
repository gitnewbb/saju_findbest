import { getSajuFromDate, calculateVector, SajuChar } from './saju';
import { SajuResult, rankParetoFronts } from './pareto';

/**
 * 기준 날짜/시간으로부터 주어진 N년 범위 내의 브루트포스 캔디데이트를 생성합니다.
 * 계산 부하를 줄이기 위해 N년 범위의 모든 '일(Day)'를 생성하고 하루를 12개 시진으로 분할 조사.
 */
export function searchSajuSpace(baseDate: Date, targetChars: SajuChar, nYears: number = 2): SajuResult[] {
  const candidates: SajuResult[] = [];
  
  const startTime = baseDate.getTime() - nYears * 365 * 24 * 60 * 60 * 1000;
  const endTime = baseDate.getTime() + nYears * 365 * 24 * 60 * 60 * 1000;
  
  const current = new Date(startTime);
  
  // 하루에 12개의 시간대 중 대표적인 시간 12개 추출
  // 각 십이지시의 중간 값을 사용한다고 가정 (예: 자시 00:00, 축시 02:00, 인시 04:00 ...)
  const timeOffsets = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

  while (current.getTime() <= endTime) {
    for (const h of timeOffsets) {
      const targetDate = new Date(current);
      targetDate.setHours(h, 0, 0, 0);
      
      const targetSaju = getSajuFromDate(targetDate);
      const vector = calculateVector(targetChars, targetSaju);
      
      candidates.push({
        date: targetDate,
        sajuChars: { gan: targetSaju.gan, zhi: targetSaju.zhi },
        vector
      });
    }
    // 하루 전진
    current.setDate(current.getDate() + 1);
  }
  
  return candidates;
}

export function generateSajuTiers(baseDate: Date, rangeYears: number = 2): SajuResult[] {
  const baseSaju = getSajuFromDate(baseDate);
  const candidates = searchSajuSpace(baseDate, baseSaju, rangeYears);
  
  // 파레토 티어 도출
  const fronts = rankParetoFronts(candidates, 4); // S, A, B, C 계층까지만 계산
  const tierLabels: ('S'|'A'|'B'|'C')[] = ['S', 'A', 'B', 'C'];
  
  let resultPool: SajuResult[] = [];
  
  fronts.forEach((front, idx) => {
    const tier = tierLabels[idx] || 'D';
    front.forEach(item => {
      item.tier = tier;
      resultPool.push(item);
    });
  });
  
  // S티어 내에서도 총합으로 러프하게 정렬 (가장 직관적인 순서 부여)
  resultPool.sort((a, b) => {
    if (a.tier !== b.tier) return tierLabels.indexOf(a.tier as any) - tierLabels.indexOf(b.tier as any);
    
    // 티어가 같을 때 벡터 총합 스코어로 소분류
    const sumA = a.vector.hap + a.vector.chung + a.vector.hyeong + a.vector.johu + a.vector.samhap;
    const sumB = b.vector.hap + b.vector.chung + b.vector.hyeong + b.vector.johu + b.vector.samhap;
    return sumB - sumA;
  });
  
  return resultPool;
}
