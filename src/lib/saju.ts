import { Solar } from 'lunar-javascript';

export interface SajuChar {
  gan: string[];
  zhi: string[];
  ohaeng: Record<string, number>;
}

export interface CompatibilityVector {
  hap: number;   // 합 (천간합, 지지육합)
  chung: number; // 충 (천간충, 지지충)
  hyeong: number; // 형 (삼형, 자형 등)
  johu: number;  // 오행 조후 (서로 부족한 기운 보완 정도)
  samhap: number; // 삼합/방합 완성 
}

const OHAENG_MAP: Record<string, string> = {
  '甲': '목', '乙': '목', '寅': '목', '卯': '목',
  '丙': '화', '丁': '화', '巳': '화', '午': '화',
  '戊': '토', '己': '토', '辰': '토', '戌': '토', '丑': '토', '未': '토',
  '庚': '금', '辛': '금', '申': '금', '酉': '금',
  '壬': '수', '癸': '수', '亥': '수', '子': '수',
};

// 합 매핑 (키 조합)
const GAN_HAP = new Set(['甲己', '乙庚', '丙辛', '丁壬', '戊癸']);
const ZHI_HAP = new Set(['子丑', '寅亥', '卯戌', '辰酉', '巳申', '午未']);

// 충 매핑
const GAN_CHUNG = new Set(['甲庚', '乙辛', '丙壬', '丁癸']);
const ZHI_CHUNG = new Set(['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥']);

// 형 매핑 (간단히 이형, 삼형 조합을 체크. 이 코드에서는 대표적인 조합 위주)
const ZHI_HYEONG = new Set(['寅巳', '巳申', '寅申', '丑戌', '戌未', '丑未', '子卯', '辰辰', '午午', '酉酉', '亥亥']);

// 삼합
const ZHI_SAMHAP = [new Set(['亥', '卯', '未']), new Set(['寅', '午', '戌']), new Set(['巳', '酉', '丑']), new Set(['申', '子', '辰'])];

function checkPair(set: Set<string>, a: string, b: string): boolean {
  return set.has(a + b) || set.has(b + a);
}

export function getSajuFromDate(date: Date): SajuChar {
  const solar = Solar.fromYmdHms(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  );
  const lunar = solar.getLunar();
  const baZi = lunar.getEightChar();
  
  const gan = [baZi.getYearGan(), baZi.getMonthGan(), baZi.getDayGan(), baZi.getTimeGan()];
  const zhi = [baZi.getYearZhi(), baZi.getMonthZhi(), baZi.getDayZhi(), baZi.getTimeZhi()];
  
  const ohaeng = { '목': 0, '화': 0, '토': 0, '금': 0, '수': 0 };
  
  gan.forEach(g => { if(OHAENG_MAP[g]) ohaeng[OHAENG_MAP[g] as keyof typeof ohaeng]++; });
  zhi.forEach(z => { if(OHAENG_MAP[z]) ohaeng[OHAENG_MAP[z] as keyof typeof ohaeng]++; });

  return { gan, zhi, ohaeng };
}

export function calculateVector(a: SajuChar, b: SajuChar): CompatibilityVector {
  let hap = 0, chung = 0, hyeong = 0, johu = 0, samhap = 0;

  // 천간 비교 (일방적으로 페널티를 주거나 보너스를 주는 형태이나, 섞일 경우를 위해 단순 카운트 후 파레토 최적화에 사용)
  for (const gA of a.gan) {
    for (const gB of b.gan) {
      if (checkPair(GAN_HAP, gA, gB)) hap++;
      if (checkPair(GAN_CHUNG, gA, gB)) chung++;
    }
  }

  // 지지 비교
  for (const zA of a.zhi) {
    for (const zB of b.zhi) {
      if (checkPair(ZHI_HAP, zA, zB)) hap++;
      if (checkPair(ZHI_CHUNG, zA, zB)) chung++;
      if (checkPair(ZHI_HYEONG, zA, zB)) hyeong++;
    }
  }

  // 삼합 완성 감지: 각각 하나씩 가지고 있어 둘이 만나 삼합/반합을 이룰 때
  for (const sh of ZHI_SAMHAP) {
    let hasA = false; let hasB = false; let matchCount = 0;
    sh.forEach(char => {
      if (a.zhi.includes(char)) hasA = true;
      if (b.zhi.includes(char)) hasB = true;
      if (a.zhi.includes(char) || b.zhi.includes(char)) matchCount++;
    });
    // 상대방과 합쳐서 비로소 3개가 모였을 때 큰 점수 부여
    if (matchCount === 3 && hasA && hasB) {
      samhap++;
    }
  }

  // 조후(오행 보완): A에게 0개인 오행을 B가 2개 이상 가지고 있으면 시너지 발생
  Object.keys(a.ohaeng).forEach(g => {
    if (a.ohaeng[g] === 0 && b.ohaeng[g] >= 2) johu++;
    if (b.ohaeng[g] === 0 && a.ohaeng[g] >= 2) johu++;
  });

  // 충, 형은 페널티 지표이므로 파레토 최적화 시 Maximize를 위해 음수로 전달
  return {
    hap,
    chung: -chung, 
    hyeong: -hyeong,
    johu,
    samhap
  };
}
