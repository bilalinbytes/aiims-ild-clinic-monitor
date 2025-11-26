
export type Role = 'doctor' | 'patient' | null;

export interface Medication {
  name: string;
  dose: string;
  frequency: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD, optional (if undefined, it is active)
  doseNumber?: number; // For Induction/Maintenance (1-20)
  dosageDate?: string; // Specific date for the dose
}

export interface VasScores {
  cough: number;
  expectoration: number;
  breathlessness: number;
  chest_pain: number;
  hemoptysis: number;
  fever: number;
  ctd_symptoms: number;
  [key: string]: number;
}

export interface HealthLog {
  id: string;
  date: string; // DD/MM/YYYY
  time?: string; // HH:mm AM/PM
  timestamp: number;
  spo2_rest: number;
  spo2_exertion: number;
  aqi?: number;
  mmrc_grade: string;
  kbild_score: number;
  kbild_responses: Record<number, number>;
  taken_medications: string[];
  vas: VasScores;
  side_effects: string[];
  alerts: string[];
}

export interface PFTData {
  fev1_fvc: number;
  fev1: number;
  fvc: number;
  dlco: number;
  six_mwd: number;
  min_spo2: number;
  max_spo2: number;
}

export interface Patient {
  id: string; // Mobile number is used as ID
  name: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  occupation: string;
  diagnosis: string;
  ctdType?: string; // Optional, only if diagnosis is CTD-ILD
  sarcoidosisStage?: string; // Optional, only if diagnosis is Sarcoidosis
  fibroticIld?: 'Yes' | 'No';
  coMorbidities?: string[];
  otherCoMorbidity?: string; // New field for custom "Others" text
  registrationDate: string;
  medications: Medication[];
  logs: HealthLog[];
  pft: PFTData;
}

export interface KBILDQuestion {
  id: number;
  textEn: string;
  textHi: string;
  optionType: 'frequency_1' | 'frequency_2' | 'control' | 'amount';
}
