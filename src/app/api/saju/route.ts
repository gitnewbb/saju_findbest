import { NextResponse } from 'next/server';
import { getSajuFromDate, calculateVector } from '@/lib/saju';
import { generateSajuTiers } from '@/lib/search';
import { generateSTierExplanation, generateRomanceAnalysis } from '@/lib/gemini';
import { logSajuRequest, initializeDatabase } from '@/lib/db';

export async function GET() {
  const result = await initializeDatabase();
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { birthYear, birthMonth, birthDay, birthTime = 12, baseGender, rangeYears = 2, needExplanation = false, mode = 'general', targetSajuData = null } = data;

    // 만세력 계산을 위한 기준일 생성
    const baseDate = new Date(parseInt(birthYear), parseInt(birthMonth) - 1, parseInt(birthDay), parseInt(birthTime as string), 0, 0);
    const baseSaju = getSajuFromDate(baseDate, baseGender);

    // 2. 연애 분석 전용 요청인 경우
    if (mode === 'romance' && targetSajuData) {
      if (!targetSajuData.vector || targetSajuData.vector.hap < 0) {
        return NextResponse.json({ success: false, error: '유효하지 않은 데이터입니다.' }, { status: 400 });
      }
      const romance = await generateRomanceAnalysis(baseSaju, targetSajuData.saju, targetSajuData.vector);

      // 로깅
      const ip = req.headers.get('x-forwarded-for') || 'unknown';
      await logSajuRequest({
        ip,
        birthYear: parseInt(birthYear),
        birthMonth: parseInt(birthMonth),
        birthDay: parseInt(birthDay),
        birthTime: birthTime.toString(),
        gender: baseGender,
        mode,
        analysis: romance
      });

      return NextResponse.json({ success: true, romance });
    }

    // 3. 특정 사주 직접 검색(역추적 결과 외 조회)
    if (mode === 'specific_search' && targetSajuData) {
      const { year, month, day, time } = targetSajuData;
      const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(time), 0, 0);
      const targetSaju = getSajuFromDate(targetDate);
      const fromSaju = getSajuFromDate(baseDate, baseGender); // Re-calculate to be safe
      const vector = calculateVector(fromSaju, targetSaju, baseGender);

      // 로깅
      const ip = req.headers.get('x-forwarded-for') || 'unknown';
      await logSajuRequest({
        ip,
        birthYear: parseInt(birthYear),
        birthMonth: parseInt(birthMonth),
        birthDay: parseInt(birthDay),
        birthTime: birthTime.toString(),
        gender: baseGender,
        mode,
        analysis: `Specific Search for: ${year}-${month}-${day} ${time}시`
      });

      return NextResponse.json({ success: true, result: { date: targetDate, sajuChars: { gan: targetSaju.gan, zhi: targetSaju.zhi }, vector } });
    }

    // 4. ±N년 완전 탐색 및 파레토 프론트 랭킹
    const tiers = generateSajuTiers(baseDate, baseGender, parseInt(rangeYears as string));

    // 5. S티어 1위 대상 Gemini 해설 요청
    let explanation = null;
    if (needExplanation && tiers.length > 0 && tiers[0].tier === 'S') {
      explanation = await generateSTierExplanation(baseSaju, tiers[0].sajuChars as any, tiers[0].vector, tiers[0].date);
    }

    // 4. DB 로깅 (기본 모드)
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    await logSajuRequest({
      ip,
      birthYear: parseInt(birthYear),
      birthMonth: parseInt(birthMonth),
      birthDay: parseInt(birthDay),
      birthTime: birthTime.toString(),
      gender: baseGender,
      mode,
      analysis: explanation || 'Tiers generated'
    });

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
