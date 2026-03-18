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

  const prompt = `
당신은 최고의 명리학 전문가입니다. 
상대방은 ${year}년생이며, 사주에 ${season}의 기운이 강하게 서린 사람입니다.
이 사람과 사용자의 S티어 궁합에 대해 다음 구조로 해설해 주세요:

1. [인물 특징]: ${year}년생 ${season}의 기운을 가진 이 사람의 전반적인 성향 요약 (뭉뚱그려서 친절하게)
2. [시너지 핵심]: 파레토 벡터값(합:${vector.hap}, 조후:${vector.johu}, 삼합:${vector.samhap})을 바탕으로 왜 최적의 짝인지 설명
3. [한 줄 조언]: 갈등(충:${vector.chung}, 형:${vector.hyeong})을 피하는 팁

다정하고 신뢰감 있는 말투로 작성해 주세요.
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
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
    const prompt = `
명리학적 관점에서 이 두 사람이 연애를 한다면 어떤 모습일지 분석해 주세요. 
데이터: 합(${vector.hap}), 충(${vector.chung}), 형(${vector.hyeong}), 조후(${vector.johu}), 삼합(${vector.samhap})
사용자 지지: ${userSaju.zhi.join(',')}, 상대 지지: ${targetSaju.zhi.join(',')}

[출력 형식]
- 반드시 한국어로 답변해 주세요.
- 다음 항목을 포함하여 가독성 좋게 불렛 포인트(•)로 답변해 주세요.
  • 데이트 분위기
  • 서로를 대하는 방식
  • 관계의 장기적 전망
- 전체 내용은 3~4문장 정도로 핵심만 간결하게 작성하세요.
`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    return text.trim();
  } catch (error: any) {
    console.error("Gemini Romance API Error:", error.message || error);
    return `AI 서비스 연결 실패 (${error.message || 'Unknown Error'})`;
  }
}
