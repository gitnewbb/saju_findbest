import { CompatibilityVector } from './saju';

export interface SajuResult {
  date: Date;
  // 문자열 형태로 직렬화 가능한 사주 정보
  sajuChars: { gan: string[]; zhi: string[] };
  vector: CompatibilityVector;
  tier?: 'S' | 'A' | 'B' | 'C' | 'D';
}

/**
 * 파레토 지배(Dominance) 검사: vA가 vB를 지배하는가?
 * 모든 요소가 크거나 같고, 최소 하나의 요소가 더 큰 경우 지배한다고 판단.
 */
function dominates(vA: CompatibilityVector, vB: CompatibilityVector): boolean {
  let strictlyBetter = false;
  
  if (vA.hap < vB.hap) return false;
  if (vA.chung < vB.chung) return false;
  if (vA.hyeong < vB.hyeong) return false;
  if (vA.johu < vB.johu) return false;
  if (vA.samhap < vB.samhap) return false;

  if (vA.hap > vB.hap) strictlyBetter = true;
  if (vA.chung > vB.chung) strictlyBetter = true;
  if (vA.hyeong > vB.hyeong) strictlyBetter = true;
  if (vA.johu > vB.johu) strictlyBetter = true;
  if (vA.samhap > vB.samhap) strictlyBetter = true;

  return strictlyBetter;
}

/**
 * 파레토 프론트(Pareto Front) 기반 Non-dominated sorting.
 * 티어 분류(S, A, B, C 등)를 위해 여러 계층의 프론트를 분리합니다.
 */
export function rankParetoFronts(candidates: SajuResult[], maxTiers = 4): SajuResult[][] {
  const fronts: SajuResult[][] = [];
  let remaining = [...candidates];
  
  while (remaining.length > 0 && fronts.length < maxTiers) {
    const currentFront: SajuResult[] = [];
    const nextRemaining: SajuResult[] = [];
    
    for (let i = 0; i < remaining.length; i++) {
      let isDominated = false;
      for (let j = 0; j < remaining.length; j++) {
        if (i !== j && dominates(remaining[j].vector, remaining[i].vector)) {
          isDominated = true;
          break;
        }
      }
      if (isDominated) {
        nextRemaining.push(remaining[i]);
      } else {
        currentFront.push(remaining[i]);
      }
    }
    
    fronts.push(currentFront);
    remaining = nextRemaining;
  }
  
  // 만약 N번째 티어들 내에서도 성능 정렬이 필요하다면 간단히 sum(가중치 1)로 정렬할 수 있으나,
  // 파레토의 핵심은 우월을 가릴 수 없다는 것이므로 임의 순서나 특정 우선순위로 섞습니다.
  return fronts;
}
