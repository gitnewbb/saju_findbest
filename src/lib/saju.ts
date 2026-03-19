import { Solar } from 'lunar-javascript';

export type OhaengType = '목' | '화' | '토' | '금' | '수';

export interface SajuChar {
  gan: string[];
  zhi: string[];
  ohaeng: Record<OhaengType, number>;
  gender?: 'M' | 'F';
}

export interface CompatibilityVector {
  hap: number;    // 합 (천간합, 지지육합)
  banhap: number; // 반합 (왕지를 포함한 2글자 합)
  samhap: number; // 삼합 완성 (둘이 만나 3글자가 모임)
  johu: number;   // 오행 조후 (서로 부족한 기운 보완 및 조양조음)
  sibseong: number; // 십성 궁합 (남:재성, 여:관성)
  chung: number;  // 충 (천간충, 지지충) - 음수 리턴
  hyeong: number; // 형 (삼형, 자형 등) - 음수 리턴
  wonjin: number; // 원진살 (이유없는 갈등/미움) - 음수 리턴
}

const OHAENG_MAP: Record<string, OhaengType> = {
  '甲': '목', '乙': '목', '寅': '목', '卯': '목',
  '丙': '화', '丁': '화', '巳': '화', '午': '화',
  '戊': '토', '己': '토', '辰': '토', '戌': '토', '丑': '토', '未': '토',
  '庚': '금', '辛': '금', '申': '금', '酉': '금',
  '壬': '수', '癸': '수', '亥': '수', '子': '수',
};

// 상극 관계 (목극토, 화극금, 토극수, 금극목, 수극화)
const SANGGUEK_MAP: Record<OhaengType, OhaengType> = {
  '목': '토',
  '화': '금',
  '토': '수',
  '금': '목',
  '수': '화'
};

// 천간/지지 매핑
const GAN_HAP = new Set(['甲己', '乙庚', '丙辛', '丁壬', '戊癸']);
const ZHI_HAP = new Set(['子丑', '寅亥', '卯戌', '辰酉', '巳申', '午未']);

const GAN_CHUNG = new Set(['甲庚', '乙辛', '丙壬', '丁癸']);
const ZHI_CHUNG = new Set(['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥']);

const ZHI_HYEONG = new Set(['寅巳', '巳申', '寅申', '丑戌', '戌未', '丑未', '子卯', '辰辰', '午午', '酉酉', '亥亥']);
const ZHI_WONJIN = new Set(['子未', '丑午', '寅酉', '卯申', '辰亥', '巳戌']);

// 삼합 (3글자 세트) & 반합 (왕지 포함 2글자)
const ZHI_SAMHAP = [
  new Set(['亥', '卯', '未']),
  new Set(['寅', '午', '戌']),
  new Set(['巳', '酉', '丑']),
  new Set(['申', '子', '辰'])
];

const ZHI_BANHAP = new Set(['亥卯', '卯未', '寅午', '午戌', '巳酉', '酉丑', '申子', '子辰']);

// 자리별 가중치: 년(1), 월(2), 일(3), 시(1) -> 일주 중심의 궁합 측정
const PILLAR_WEIGHTS = [1, 2, 3, 1];

function checkPair(set: Set<string>, a: string, b: string): boolean {
  return set.has(a + b) || set.has(b + a);
}

// 일간(나)을 기준으로 십성(육친) 중 이성에 해당하는 오행을 계산
function getSpouseElement(ilgan: string, gender: 'M' | 'F'): OhaengType | null {
  const myOhaeng = OHAENG_MAP[ilgan];
  if (!myOhaeng) return null;

  if (gender === 'M') {
    // 남성의 배우자(재성): 내가 극하는 오행
    return SANGGUEK_MAP[myOhaeng];
  } else {
    // 여성의 배우자(관성): 나를 극하는 오행 (어떤 오행이 나를 극하는지 찾기)
    const keys = Object.keys(SANGGUEK_MAP) as OhaengType[];
    return keys.find((k) => SANGGUEK_MAP[k] === myOhaeng) || null;
  }
}

export function getSajuFromDate(date: Date, gender?: 'M' | 'F'): SajuChar {
  // 동현님 아이디어 적용: 
  // 한국 표준시(KST, UTC+9)는 실제 태양시(서울 기준 약 UTC+8.5)보다 약 30분 빠릅니다.
  // 중국 사주 라이브러리(lunar-javascript)는 00분 기준으로 지지를 넘기므로, 
  // 입력된 시간에서 30분을 빼서 입력해주면 한국식 사주(예: 11:30~13:29 오시) 경계와 완벽히 일치합니다.
  const correctedDate = new Date(date.getTime() - 30 * 60000);

  const solar = Solar.fromYmdHms(
    correctedDate.getFullYear(),
    correctedDate.getMonth() + 1,
    correctedDate.getDate(),
    correctedDate.getHours(),
    correctedDate.getMinutes(),
    correctedDate.getSeconds()
  );
  const lunar = solar.getLunar();
  const baZi = lunar.getEightChar();

  const gan = [baZi.getYearGan(), baZi.getMonthGan(), baZi.getDayGan(), baZi.getTimeGan()];
  const zhi = [baZi.getYearZhi(), baZi.getMonthZhi(), baZi.getDayZhi(), baZi.getTimeZhi()];

  const ohaeng: Record<OhaengType, number> = { '목': 0, '화': 0, '토': 0, '금': 0, '수': 0 };

  gan.forEach(g => { if (OHAENG_MAP[g]) ohaeng[OHAENG_MAP[g]]++; });
  zhi.forEach(z => { if (OHAENG_MAP[z]) ohaeng[OHAENG_MAP[z]]++; });

  return { gan, zhi, ohaeng, gender };
}

export function calculateVector(a: SajuChar, b: SajuChar, baseGender?: 'M' | 'F'): CompatibilityVector {
  let hap = 0, banhap = 0, samhap = 0, johu = 0, sibseong = 0, chung = 0, hyeong = 0, wonjin = 0;

  // 1. 천간 비교
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const gA = a.gan[i];
      const gB = b.gan[j];
      const weight = PILLAR_WEIGHTS[i] * PILLAR_WEIGHTS[j];

      if (checkPair(GAN_HAP, gA, gB)) hap += weight;
      if (checkPair(GAN_CHUNG, gA, gB)) chung += weight;
    }
  }

  // 2. 지지 비교
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const zA = a.zhi[i];
      const zB = b.zhi[j];
      const weight = PILLAR_WEIGHTS[i] * PILLAR_WEIGHTS[j];

      if (checkPair(ZHI_HAP, zA, zB)) hap += weight;
      if (checkPair(ZHI_BANHAP, zA, zB)) banhap += weight * 0.5;
      if (checkPair(ZHI_CHUNG, zA, zB)) chung += weight;
      if (checkPair(ZHI_HYEONG, zA, zB)) hyeong += weight;
      if (checkPair(ZHI_WONJIN, zA, zB)) wonjin += weight;
    }
  }

  // 3. 삼합 완성 감지
  for (const sh of ZHI_SAMHAP) {
    let hasA = false; let hasB = false; let matchCount = 0;
    sh.forEach(char => {
      if (a.zhi.includes(char)) hasA = true;
      if (b.zhi.includes(char)) hasB = true;
      if (a.zhi.includes(char) || b.zhi.includes(char)) matchCount++;
    });
    if (matchCount === 3 && hasA && hasB) {
      samhap += 10;
    }
  }

  // 4. 조후(오행 보완) 및 음양 보완 러프하게 적용
  const ELEMENTS: OhaengType[] = ['목', '화', '토', '금', '수'];
  let sumYangA = a.ohaeng['목'] + a.ohaeng['화'];
  let sumYinA = a.ohaeng['금'] + a.ohaeng['수'];
  let sumYangB = b.ohaeng['목'] + b.ohaeng['화'];
  let sumYinB = b.ohaeng['금'] + b.ohaeng['수'];

  if ((sumYangA > sumYinA && sumYinB > sumYangB) || (sumYinA > sumYangA && sumYangB > sumYinB)) {
    johu += 3;
  }

  ELEMENTS.forEach(g => {
    const countA = a.ohaeng[g] || 0;
    const countB = b.ohaeng[g] || 0;

    if (countA === 0 && countB >= 2) johu += 5;
    if (countB === 0 && countA >= 2) johu += 5;
  });

  // 5. 십성 궁합 (남: 재성, 여: 관성)
  const genderToUse = baseGender || a.gender;
  if (genderToUse) {
    const ilganA = a.gan[2]; // 일간(나)
    const spouseElement = getSpouseElement(ilganA, genderToUse);

    if (spouseElement) {
      const spouseCountInB = b.ohaeng[spouseElement] || 0;
      if (spouseCountInB >= 1) {
        sibseong += (spouseCountInB * 4);
      }
    }
  }

  return {
    hap,
    banhap,
    samhap,
    johu,
    sibseong,
    chung: -chung,
    hyeong: -hyeong,
    wonjin: -wonjin
  };
}
