import { getSajuFromDate, calculateVector, SajuChar } from './saju';
import { SajuResult, rankParetoFronts } from './pareto';

/**
 * 기준 날짜/시간으로부터 주어진 N년 범위 내의 브루트포스 캔디데이트를 생성합니다.
 * 계산 부하를 줄이기 위해 N년 범위의 모든 '일(Day)'를 생성하고 하루를 12개 시진으로 분할 조사.
 */
export function searchSajuSpace(baseDate: Date, targetChars: SajuChar, baseGender?: 'M' | 'F', nYears: number = 2): SajuResult[] {
  const candidates: SajuResult[] = [];

  const baseYear = baseDate.getFullYear();
  const startTime = new Date(baseDate);
  startTime.setFullYear(baseYear - nYears, 0, 1); // 시작 연도 1월 1일
  startTime.setHours(0, 0, 0, 0);

  const endTime = new Date(baseDate);
  endTime.setFullYear(baseYear + nYears, 11, 31); // 종료 연도 12월 31일
  endTime.setHours(23, 59, 59, 999);

  const current = new Date(startTime);

  // 하루에 12개의 시간대 중 대표적인 시간 12개 추출
  // 각 십이지시의 중간 값을 사용한다고 가정 (예: 자시 00:00, 축시 02:00, 인시 04:00 ...)
  const timeOffsets = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

  while (current.getTime() <= endTime.getTime()) {
    for (const h of timeOffsets) {
      const targetDate = new Date(current);
      targetDate.setHours(h, 0, 0, 0);

      const targetSaju = getSajuFromDate(targetDate);
      const vector = calculateVector(targetChars, targetSaju, baseGender);

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

export function generateSajuTiers(baseDate: Date, baseGender?: 'M' | 'F', rangeYears: number = 2): SajuResult[] {
  const baseSaju = getSajuFromDate(baseDate, baseGender);
  let candidates = searchSajuSpace(baseDate, baseSaju, baseGender, rangeYears);

  // 성능 최적화: 파레토 랭킹(O(N^2)) 이전에 점수 합계로 상위 N개만 필터링
  // 전체 2만여개를 모두 비교하면 서버 과부하가 걸릴 수 있으므로, 
  // 최소한의 가능성이 있는 상위 1500개 정도만 파레토 검증에 투입합니다.
  const getSum = (v: any) => (v.hap || 0) + (v.banhap || 0) + (v.samhap || 0) + (v.johu || 0) + (v.sibseong || 0) + (v.chung || 0) + (v.hyeong || 0) + (v.wonjin || 0);

  candidates.sort((a, b) => getSum(b.vector) - getSum(a.vector));
  const topCandidates = candidates.slice(0, 1500);

  // 파레토 티어 도출 (상위 후보군 대상)
  const fronts = rankParetoFronts(topCandidates, 4);
  const tierLabels: ('S' | 'A' | 'B' | 'C')[] = ['S', 'A', 'B', 'C'];

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
    const getSum = (v: any) => v.hap + v.banhap + v.samhap + v.johu + v.sibseong + v.chung + v.hyeong + v.wonjin;
    const sumA = getSum(a.vector);
    const sumB = getSum(b.vector);
    return sumB - sumA;
  });

  return resultPool;
}
