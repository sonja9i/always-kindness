
import { TreatmentType } from './types';

export const TREATMENT_DURATIONS: Record<TreatmentType, number> = {
  'ICT': 600, 
  '부항': 180, 
  '침': 600, 
  '핫팩': 600, 
  'Ice': 300, 
  '추나': 0, // Manual check
  '소노': 330, // Default 5:30
  '충격파': 330,
};

export const DEFAULT_TREATMENT_NAMES: TreatmentType[] = ['ICT', '부항', '침', '핫팩'];
export const ACUPUNCTURE_TYPES = ['통증', '태반', '봉침', '스티커침', '천추'];
export const HOTPACK_TYPES = ['자리로', '자기장', '두타베드'];
