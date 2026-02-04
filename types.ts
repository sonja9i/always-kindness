
export type TreatmentStatus = '대기' | '진행중' | '완료' | '안함';

export type TreatmentType = 'ICT' | '부항' | '침' | '핫팩' | 'Ice' | '추나' | '소노' | '충격파';

export interface Treatment {
  id: string;
  name: TreatmentType;
  status: TreatmentStatus;
  timeLeft: number; 
  targetEndTime?: number; // 서버 동기화용: 종료될 시점의 타임스탬프
  elapsedTime: number; 
  duration: number; 
  isDefault: boolean;
  area?: string; 
  isWet?: boolean; 
  acupunctureType?: string; 
  hotPackType?: string;
  hotPackMemo?: string;
}

export type WaitingCategory = '상담' | '재진' | '소노' | '충격파';

export interface WaitingPatient {
  id: string;
  name: string;
  category: WaitingCategory;
  waitingSince: number; 
}

export interface Bed {
  id: number;
  name: string; 
  patientName: string;
  area: string;
  memo: string;
  treatments: Treatment[];
  isAlarming?: boolean;
}

export interface DirectorTask {
  id: string;
  bedId: number;
  bedName: string;
  patientName: string;
  treatmentName: TreatmentType;
  details?: string;
  waitingSince: number;
  treatmentId: string;
}
