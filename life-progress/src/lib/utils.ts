import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateProgress(birthDate: Date, lifeExpectancy: number): number {
  const today = new Date();
  const totalDays = lifeExpectancy * 365;
  const daysSinceBirth = Math.floor(
    (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const progress = (daysSinceBirth / totalDays) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

export function formatProgress(progress: number): string {
  return `${progress.toFixed(2)}% 진행됨`;
}

export function calculateTimeBlocks(birthDate: Date, lifeExpectancy: number) {
  const today = new Date();
  const totalWeeks = lifeExpectancy * 52;
  const weeksSinceBirth = Math.floor(
    (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
  );
  
  return {
    total: totalWeeks,
    elapsed: weeksSinceBirth,
    remaining: totalWeeks - weeksSinceBirth,
  };
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
} 