'use client';
import { useState } from 'react';
import styles from './SajuForm.module.css';

interface SajuData {
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  birthTime: string; // 지지 (예: '자', '축')
  gender: 'male' | 'female';
  rangeYears: string;
}

interface Props {
  onSubmit: (data: any) => void;
  buttonText?: string;
}

const timeOptions = [
  { label: '자시 (23:00~00:59)', value: '23' },
  { label: '축시 (01:00~02:59)', value: '1' },
  { label: '인시 (03:00~04:59)', value: '3' },
  { label: '묘시 (05:00~06:59)', value: '5' },
  { label: '진시 (07:00~08:59)', value: '7' },
  { label: '사시 (09:00~10:59)', value: '9' },
  { label: '오시 (11:00~12:59)', value: '11' },
  { label: '미시 (13:00~14:59)', value: '13' },
  { label: '신시 (15:00~16:59)', value: '15' },
  { label: '유시 (17:00~18:59)', value: '17' },
  { label: '술시 (19:00~20:59)', value: '19' },
  { label: '해시 (21:00~22:59)', value: '21' },
];

export default function SajuForm({ onSubmit, buttonText = "운명 찾기" }: Props) {
  const [formData, setFormData] = useState<SajuData>({
    birthYear: '1995',
    birthMonth: '5',
    birthDay: '20',
    birthTime: '13', // 기본값 미시
    gender: 'male',
    rangeYears: '2'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 성별 데이터 연동 통일: male/female을 M/F로 매핑
    const payload = {
      ...formData,
      baseGender: formData.gender === 'male' ? 'M' : 'F'
    };
    onSubmit(payload);
  };

  return (
    <div className={styles.premiumCard}>
      <form onSubmit={handleSubmit} className={styles.formLayout}>
        <div className={styles.inputSection}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>태어난 해</label>
            <input type="number" name="birthYear" value={formData.birthYear} onChange={handleChange} required className={styles.stylishInput} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>월</label>
            <input type="number" name="birthMonth" value={formData.birthMonth} onChange={handleChange} required className={styles.stylishInput} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>일</label>
            <input type="number" name="birthDay" value={formData.birthDay} onChange={handleChange} required className={styles.stylishInput} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>태어난 시</label>
            <select name="birthTime" value={formData.birthTime} onChange={handleChange} className={styles.stylishSelect}>
              {timeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>탐색 범위 (본인 나이 기준 위아래 N년)</label>
            <input type="number" name="rangeYears" value={formData.rangeYears} onChange={handleChange} required className={styles.stylishInput} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>성별</label>
            <select name="gender" value={formData.gender} onChange={handleChange} className={styles.stylishSelect}>
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>
          </div>
        </div>
        <button type="submit" className={styles.premiumBtn}>
          {buttonText}
          <span className={styles.btnEffect}></span>
        </button>
      </form>
    </div>
  );
}
