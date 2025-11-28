

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
  isEdited?: boolean; // Track if log has been edited
}

export interface PFTDataEntry {
  id: string; // Unique ID for each PFT entry
  date: string; // YYYY-MM-DD
  fev1_fvc: number; // FEV1/FVC Ratio
  fev1: number; // FEV1 (% Predicted)
  fev1_liters?: number; // New: FEV1 (Absolute Liters)
  fvc: number; // FVC (% Predicted)
  fvc_liters?: number; // New: FVC (Absolute Liters)
  dlco: number; // DLCO (% Predicted)
  six_mwd: number; // 6MWD (meters)
  min_spo2: number; // Min SpO2 during 6MWD
  max_spo2: number; // Max SpO2 during 6MWD
}

export interface Patient {
  id: string; // Mobile number is used as ID
  name: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  occupation: string;
  
  diagnosisCategory: string; // New Field: ILD, OAD, Bronchiectasis
  diagnosis: string; // Specific Subtype
  
  ctdType?: string; // Optional, only if diagnosis is CTD-ILD
  sarcoidosisStage?: string; // Optional, only if diagnosis is Sarcoidosis
  fibroticIld?: 'Yes' | 'No';
  coMorbidities?: string[];
  otherCoMorbidity?: string; // New field for custom "Others" text
  registrationDate: string;
  medications: Medication[];
  logs: HealthLog[];
  pftHistory: PFTDataEntry[]; // Changed from pft: PFTData
}

export interface KBILDQuestion {
  id: number;
  textEn: string;
  textHi: string;
  optionType: 'frequency_1' | 'frequency_2' | 'control' | 'amount';
}