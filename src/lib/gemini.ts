import { GoogleGenerativeAI } from '@google/generative-ai';
import { SajuChar, CompatibilityVector } from './saju';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// 사주 지지를 바탕으로 주도적인 계절을 판별하는 단순 헬퍼
function getSeason(zhi: string[]): string {
  const spring = ['寅', '卯', '辰'];
  const summer = ['巳', '午', '未'];
  const autumn = ['申', '酉', '戌'];
  const winter = ['亥', '子', '丑'];

  const counts = { '봄': 0, '여름': 0, '가을': 0, '겨울': 0 };
  zhi.forEach(z => {
    if (spring.includes(z)) counts['봄']++;
    if (summer.includes(z)) counts['여름']++;
    if (autumn.includes(z)) counts['가을']++;
    if (winter.includes(z)) counts['겨울']++;
  });

  return Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
}

export async function generateSTierExplanation(
  userSaju: SajuChar,
  targetSaju: SajuChar,
  vector: CompatibilityVector,
  targetDate: Date
): Promise<string> {
  if (!apiKey) return "API 키가 설정되지 않았습니다.";

  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
  const season = getSeason(targetSaju.zhi);
  const year = targetDate.getFullYear();

  // 사용자의 성별을 바탕으로 상대방의 성별을 유추 (이성 궁합 기준)
  const userGenderStr = userSaju.gender === 'M' ? '남성' : userSaju.gender === 'F' ? '여성' : '사용자';
  const targetGenderStr = userGenderStr === '남성' ? '여성' : userGenderStr === '여성' ? '남성' : '상대방';

  const prompt = `
[역할]
당신은 20년 경력의 따뜻하고 통찰력 있는 사주 명리학 전문가입니다.
${userGenderStr}인 사용자와 완벽에 가까운 명리학적 궁합(S등급)을 가진 ${targetGenderStr}(${year}년생, ${season}의 기운)에 대한 요약 해설을 작성해야 합니다.

[궁합 지표 데이터 (절대 이 수치를 그대로 읊거나 점수를 언급하지 마세요)]
- 긍정 시너지: 합(${vector.hap}), 조후/음양보완(${vector.johu}), 반합(${vector.banhap}), 삼합완성(${vector.samhap}), 십성궁합(${vector.sibseong})
- 주의 갈등: 충(${Math.abs(vector.chung)}), 형(${Math.abs(vector.hyeong)}), 원진살(${Math.abs(vector.wonjin)})

[요청 사항]
다음 구조에 맞춰 3문단 이내의 매력적이고 자연스러운 해설 문장으로 작성해 주세요.
숫자나 명리학 전문 용어(조후, 원진살 등)를 딱딱하게 설명하지 말고, 대중적인 표현("서로 부족한 기운을 다채롭게 채워준다", "이유 없이 끌린다")으로 스토리텔링하세요.

1. [상대의 매력과 기운]: ${year}년생 ${season}의 기운을 가진 ${targetGenderStr} 특유의 전반적인 성향과 분위기를 매력적으로 묘사하세요.
2. [두 사람의 시너지와 역할]: 긍정 시너지 데이터(특히 십성과 조후)를 바탕으로, 두 사람이 관계에서 각각 어떤 역할(예: 안정감을 주는 든든한 리더와, 부드러운 조력자 등)을 자연스럽게 맡게 되며 왜 서로에게 거부할 수 없는 완벽한 짝인지 성별(${userGenderStr}와 ${targetGenderStr})의 역학을 고려하여 구체적으로 묘사하세요.
3. [관계의 비결]: 주의 갈등 데이터(충, 형, 원진살)가 있다면 이를 슬기롭게 극복하고 오래도록 예쁜 만남을 유지하기 위한 깊이 있는 한 줄 조언을 덧붙이세요. 주의 지표가 모두 0이라면, "갈등 요소가 거의 없는 아주 평온하고 단단한 인연"이라고 축하해주세요.

답변은 다정하고 신뢰감 있는 말투("~요", "~습니다")로 출력해 주세요.
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    return "해설 생성 중 오류가 발생했습니다.";
  }
}

export async function generateRomanceAnalysis(
  userSaju: SajuChar,
  targetSaju: SajuChar,
  vector: CompatibilityVector
): Promise<string> {
  if (!apiKey || apiKey === 'your_actual_api_key_here') {
    const msg = "GEMINI_API_KEY가 설정되지 않았습니다. .env 파일을 확인해 주세요.";
    console.error(msg);
    return msg;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // 성별 추출
    const userGenderStr = userSaju.gender === 'M' ? '남성' : userSaju.gender === 'F' ? '여성' : '사용자';
    const targetGenderStr = userGenderStr === '남성' ? '여성' : userGenderStr === '여성' ? '남성' : '상대방';

    const prompt = `
[역할]
당신은 트렌디하면서도 날카로운 통찰력을 지닌 연애 심리 및 명리학 결합 분석 전문가입니다.

[분석 대상 데이터]
- 사용자(${userGenderStr}) 지지: [${userSaju.zhi.join(', ')}]
- 상대방(${targetGenderStr}) 지지: [${targetSaju.zhi.join(', ')}]
- 상호작용 지표 (참고용 - 수치를 직접 언급 절대 금지):
   합(${vector.hap}), 반합(${vector.banhap}), 삼합(${vector.samhap}), 조후보완(${vector.johu}), 십성궁합(${vector.sibseong})
   갈등요소: 충(${Math.abs(vector.chung)}), 형(${Math.abs(vector.hyeong)}), 원진살(${Math.abs(vector.wonjin)})

[요청 사항]
${userGenderStr}인 사용자와 ${targetGenderStr}인 상대방 사이의 명리학적 데이터를 바탕으로, 실제 연애 시 벌어질 현실적이고 생생한 관계 다이내믹을 분석해 주세요.
가독성 좋게 3가지 불렛 포인트(•) 형식으로 작성하되, 사주에 너무 맹신하는 태도를 취하지 말고 쿨하고 전문적인 어조를 유지하세요.
지표의 특정 숫자를 나열하지 말고, 각 수치가 뜻하는 의미를 세련된 감성 스토리로 녹이세요.

• 연애 시 역할과 끌림: 두 사람이 처음 만났을 때 어떤 부분에 서로 강한 호감을 느끼며, 연인이 되었을 때 각자 어떤 역할(리더/의지처/활력소 등)을 자연스럽게 맡게 될지 (조후/십성 지표 및 성별 역학 기반)
• 데이트 분위기와 소통: 평소 두 사람의 데이트 스타일과 대화의 호흡 (합/삼합/반합 데이터 기반)
• 현실적인 연애 팁: 갈등 요소(충/형/원진살)를 극복하기 위한 심리학적이고 트렌디한 예방주사(조언)

- 전체 내용은 각 불렛 당 2~3문장 정도로, 핵심만 찰지게 작성하세요.
- 불렛 제목에는 괄호와 같은 불필요한 마크다운을 빼고 자연스럽게 작성하세요.
- 답변은 반드시 한국어로, 존댓말("~요", "~습니다")을 사용하세요.
`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error: any) {
    console.error("Gemini Romance API Error:", error.message || error);
    return `AI 서비스 연결 실패 (${error.message || 'Unknown Error'})`;
  }
}
