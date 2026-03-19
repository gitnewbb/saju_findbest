'use client';
import { useState } from 'react';
import styles from './SajuForm.module.css';

interface SajuData {
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  birthTime: string;
  gender: 'male' | 'female';
}

interface Props {
  onSubmit: (data: any) => void;
  buttonText?: string;
}

export default function SajuForm({ onSubmit, buttonText = "운명 찾기" }: Props) {
  const [formData, setFormData] = useState<SajuData>({
    birthYear: '1995',
    birthMonth: '5',
    birthDay: '20',
    birthTime: '13',
    gender: 'male'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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
            <label className={styles.label}>시</label>
            <input type="number" name="birthTime" value={formData.birthTime} onChange={handleChange} required className={styles.stylishInput} />
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
