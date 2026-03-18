import { NextResponse } from 'next/server';
import { getSajuFromDate } from '@/lib/saju';
import { generateSajuTiers } from '@/lib/search';
import { generateSTierExplanation, generateRomanceAnalysis } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { birthYear, birthMonth, birthDay, rangeYears = 2, needExplanation = false, mode = 'general', targetSajuData = null } = data;

    // 만세력 계산을 위한 기준일 생성
    const baseDate = new Date(parseInt(birthYear), parseInt(birthMonth) - 1, parseInt(birthDay), 12, 0, 0);
    const baseSaju = getSajuFromDate(baseDate);

    // 1. 연애 분석 전용 요청인 경우 (보안: 유효한 데이터와 특정 티어 조건 확인 권장)
    if (mode === 'romance' && targetSajuData) {
      // 보안용: 입력 벡터가 적정 수준(S, A티어급)인지 확인하는 로직을 추가하여 무분별한 호출 방지 가능
      if (!targetSajuData.vector || targetSajuData.vector.hap < 0) {
        return NextResponse.json({ success: false, error: '유효하지 않은 데이터입니다.' }, { status: 400 });
      }
      const romance = await generateRomanceAnalysis(baseSaju, targetSajuData.saju, targetSajuData.vector);
      return NextResponse.json({ success: true, romance });
    }

    // 2. ±N년 완전 탐색 및 파레토 프론트 랭킹
    const tiers = generateSajuTiers(baseDate, parseInt(rangeYears));

    // 3. S티어 1위 대상 Gemini 해설 요청 (자동 호출 시 보안 가드)
    let explanation = null;
    if (needExplanation && tiers.length > 0 && tiers[0].tier === 'S') {
      explanation = await generateSTierExplanation(baseSaju, tiers[0].sajuChars as any, tiers[0].vector, tiers[0].date);
    }

    return NextResponse.json({ 
      success: true, 
      base: { date: baseDate, saju: baseSaju },
      results: tiers,
      explanation
    });
  } catch (error: any) {
    console.error("Tracker API Error:", error);
    return NextResponse.json({ success: false, error: '서버 에러 발생' }, { status: 500 });
  }
}
