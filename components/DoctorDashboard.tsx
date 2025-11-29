import React, { useState, useEffect, useRef } from 'react';
import { Patient, Medication, HealthLog, PFTDataEntry } from '../types';
import { PRIMARY_DIAGNOSIS_CATEGORIES, ILD_SUBTYPES, OAD_SUBTYPES, BRONCHIECTASIS_SUBTYPES, CTD_TYPES, SARCOIDOSIS_STAGES, CO_MORBIDITIES_LIST, MEDICATION_LIST, FREQUENCY_LIST } from '../constants';
import { Users, Plus, Download, Trash2, Search, ChevronDown, ChevronUp, X, Activity, AlertTriangle, Bell, Edit, Save, Calendar, RotateCcw, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DoctorDashboardProps {
  patients: Patient[];
  onAddPatient: (p: Patient) => void;
  onUpdatePatient: (p: Patient) => void;
  onDeletePatient: (id: string) => void;
  onLogout: () => void;
}

// Fix: Updated the type definition for PFT_PARAM_LABELS to exclude 'id' and 'date'
const PFT_PARAM_LABELS: Record<Exclude<keyof PFTDataEntry, 'id' | 'date'>, string> = {
  fev1_fvc: 'FEV1/FVC Ratio',
  fev1: 'FEV1 (% Predicted)',
  fev1_liters: 'FEV1 (Liters)', // New
  fvc: 'FVC (% Predicted)',
  fvc_liters: 'FVC (Liters)', // New
  dlco: 'DLCO (% Predicted)',
  six_mwd: '6MWD (meters)',
  min_spo2: 'Min SpO2 (6MWD)',
  max_spo2: 'Max SpO2 (6MWD)',
};

const DIAGNOSIS_CATEGORY_STYLES: Record<string, { borderColor: string; bgColor: string; tagColor: string; } | undefined> = {
  "Interstitial Lung Disease (ILD)": {
    borderColor: 'border-blue-300',
    bgColor: 'from-blue-100 to-indigo-100',
    tagColor: 'text-blue-700 bg-blue-50 border-blue-100'
  },
  "Obstructive Airway Disease (OAD)": {
    borderColor: 'border-orange-300',
    bgColor: 'from-orange-100 to-yellow-100',
    tagColor: 'text-orange-700 bg-orange-50 border-orange-100'
  },
  "Bronchiectasis": {
    borderColor: 'border-emerald-300',
    bgColor: 'from-emerald-100 to-teal-100',
    tagColor: 'text-emerald-700 bg-emerald-50 border-emerald-100'
  }
};

// Helper to get short category name
const getShortCategoryName = (fullCategoryName: string) => {
  if (fullCategoryName === "Interstitial Lung Disease (ILD)") return "ILD";
  if (fullCategoryName === "Obstructive Airway Disease (OAD)") return "OAD";
  if (fullCategoryName === "Bronchiectasis") return "Bronchiectasis";
  return fullCategoryName; // Fallback
};

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ patients, onAddPatient, onUpdatePatient, onDeletePatient, onLogout }) => {
  const [view, setView] = useState<'list' | 'add' | 'detail' | 'edit'>('list');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCoMorbidityDropdownOpen, setIsCoMorbidityDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectedDisplayCategory, setSelectedDisplayCategory] = useState<string>('all'); // New state for main display filter
  const [selectedExportCategory, setSelectedExportCategory] = useState<string>('all'); // 'all', 'Interstitial Lung Disease (ILD)', 'Obstructive Airway Disease (OAD)', 'Bronchiectasis'
  const [selectedWorstScorePeriod, setSelectedWorstScorePeriod] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [exportFromDate, setExportFromDate] = useState<string>('');
  const [exportToDate, setExportToDate] = useState<string>('');
  const [showExportOptions, setShowExportOptions] = useState(false); // New state for export options visibility
  
  // Moved selectedPFTTrend state to the top-level component
  const [selectedPFTTrend, setSelectedPFTTrend] = useState<Exclude<keyof PFTDataEntry, 'id' | 'date'>>('fev1');
  // New state for selected symptom trend in detail view
  const [selectedSymptomTrend, setSelectedSymptomTrend] = useState<string>('breathlessness');


  const getTodayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const getTodayDisplayDate = () => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  };

  // Fix: Corrected useState initialization for formData
  const [formData, setFormData] = useState<Partial<Patient>>({
    sex: 'Male',
    diagnosisCategory: PRIMARY_DIAGNOSIS_CATEGORIES[0],
    diagnosis: ILD_SUBTYPES[0],
    fibroticIld: 'No',
    registrationDate: getTodayDisplayDate(),
    medications: [],
    coMorbidities: [],
    otherCoMorbidity: '',
    pftHistory: [] // Changed from pft
  });
  
  const [tempMed, setTempMed] = useState<Medication>({ name: '', dose: '', frequency: '', startDate: getTodayISO(), endDate: '' });
  const [editingPFT, setEditingPFT] = useState<PFTDataEntry | null>(null);
  const [showPFTForm, setShowPFTForm] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCoMorbidityDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  useEffect(() => {
    if ((view === 'edit' || view === 'detail') && selectedPatientId) {
      const p = patients.find(pat => pat.id === selectedPatientId);
      if (p) {
        setFormData(JSON.parse(JSON.stringify(p))); 
        setTempMed({ name: '', dose: '', frequency: '', startDate: getTodayISO(), endDate: '' });
        setEditingPFT(null);
        setShowPFTForm(false);
      }
    } else if (view === 'add') {
      setFormData({
        sex: 'Male',
        diagnosisCategory: PRIMARY_DIAGNOSIS_CATEGORIES[0],
        diagnosis: ILD_SUBTYPES[0],
        fibroticIld: 'No',
        registrationDate: getTodayDisplayDate(),
        medications: [],
        coMorbidities: [],
        otherCoMorbidity: '',
        pftHistory: [] // Changed from pft
      });
      setTempMed({ name: '', dose: '', frequency: '', startDate: getTodayISO(), endDate: '' });
      setEditingPFT(null);
      setShowPFTForm(false);
    }
  }, [view, selectedPatientId, patients]);

  // Reset searchTerm when returning to list view after adding/editing
  useEffect(() => {
    if (view === 'list') {
      setSearchTerm('');
    }
  }, [view]);

  // Modified getFilteredPatients to prevent unintended filtering in the main list
  const getFilteredPatients = (categoryForExport?: string) => {
    let currentPatients = [...patients]; // Work on a copy

    // 1. Sort by registration date (most recent first)
    currentPatients.sort((a, b) => {
        // Convert DD/MM/YYYY to YYYY-MM-DD for proper date comparison
        const dateA = new Date(a.registrationDate.split('/').reverse().join('-'));
        const dateB = new Date(b.registrationDate.split('/').reverse().join('-'));
        return dateB.getTime() - dateA.getTime(); // Descending order
    });

    // 2. Apply search term filter for the main display
    let filteredBySearch = currentPatients.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.includes(searchTerm)
    );

    // 3. Apply display category filter for the main display if selected
    let filteredByDisplayCategory = filteredBySearch;
    if (selectedDisplayCategory && selectedDisplayCategory !== 'all') {
        filteredByDisplayCategory = filteredBySearch.filter(p => p.diagnosisCategory === selectedDisplayCategory);
    }

    // 4. If categoryForExport is provided (meaning it's an export call), apply *that* specific category filter.
    // Otherwise, return the filteredByDisplayCategory for the main list.
    if (categoryForExport && categoryForExport !== 'all') {
      return filteredByDisplayCategory.filter(p => p.diagnosisCategory === categoryForExport);
    }

    return filteredByDisplayCategory; // For the main list view
  };

  const handleToggleCoMorbidity = (item: string) => {
    setFormData(prev => {
      const current = prev.coMorbidities || [];
      if (current.includes(item)) {
        const updates: Partial<Patient> = { coMorbidities: current.filter(c => c !== item) };
        if (item === 'Others') updates.otherCoMorbidity = '';
        return { ...prev, ...updates };
      } else {
        return { ...prev, coMorbidities: [...current, item] };
      }
    });
  };

  const getMedicationDropdownValue = (name: string) => {
    if (!name) return '';
    if (MEDICATION_LIST.includes(name)) return name;
    return 'Other';
  };

  const isComplexFrequency = (freq: string) => {
    return ["Induction first dose", "Induction 2nd dose", "Maintenance dose"].includes(freq);
  };

  const updateMedListItem = (index: number, updates: Partial<Medication>) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications?.map((m, i) => i === index ? { ...m, ...updates } : m)
    }));
  };

  // Helper to get correct subtype list based on category
  const getSubtypeList = (category: string | undefined) => {
    if (category === "Interstitial Lung Disease (ILD)") return ILD_SUBTYPES;
    if (category === "Obstructive Airway Disease (OAD)") return OAD_SUBTYPES;
    if (category === "Bronchiectasis") return BRONCHIECTASIS_SUBTYPES;
    return ILD_SUBTYPES; // Default fallback
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    const subtypes = getSubtypeList(category);
    setFormData(prev => ({
      ...prev,
      diagnosisCategory: category,
      diagnosis: subtypes.length > 0 ? subtypes[0] : '',
      // Reset specific fields if switching away from ILD
      ctdType: category === "Interstitial Lung Disease (ILD)" ? prev.ctdType : undefined,
      sarcoidosisStage: category === "Interstitial Lung Disease (ILD)" ? prev.sarcoidosisStage : undefined,
      fibroticIld: category === "Interstitial Lung Disease (ILD)" ? prev.fibroticIld : undefined,
    }));
  };

  interface ExportOptions {
    category?: string;
    patientId?: string;
    fromDate?: string; // YYYY-MM-DD
    toDate?: string;   // YYYY-MM-DD
  }

  // Helper to determine the "worst" log for a given day
  const getWorstLogForDay = (logs: HealthLog[]): HealthLog => {
    if (logs.length === 0) return null as unknown as HealthLog; // Should not happen if called with logs for a day

    return logs.reduce((worst, current) => {
      // Prioritize logs with alerts
      if (current.alerts.length > 0 && worst.alerts.length === 0) return current;
      if (worst.alerts.length > 0 && current.alerts.length === 0) return worst;

      // Lower SpO2 Exertion is worse
      if (current.spo2_exertion < worst.spo2_exertion) return current;
      if (current.spo2_exertion > worst.spo2_exertion) return worst;

      // Higher mMRC Grade is worse
      if (Number(current.mmrc_grade) > Number(worst.mmrc_grade)) return current;
      if (Number(current.mmrc_grade) < Number(worst.mmrc_grade)) return worst;

      // Higher KBILD score is worse (since lower actual score is better QoL)
      if (current.kbild_score > worst.kbild_score) return current;
      if (current.kbild_score < worst.kbild_score) return worst;
      
      // If still tied, just return the first one encountered or existing worst
      return worst;
    }, logs[0]);
  };

  const handleExportCSV = (options: ExportOptions = {}) => {
    const commonHeaders = [
      "Record Type", "Patient Name", "Mobile ID", "Registration Date", "Disease Category", "Diagnosis", "Fibrotic ILD", "CTD Type", "Sarcoidosis Stage", "Co-morbidities", "Medication History",
    ];
    const logHeaders = [
      "Log Date", "Log Time", "Alerts", "AQI",
      "SpO2 Rest", "SpO2 Exertion", "mMRC Grade", "KBILD Total Score", 
      ...Array.from({length: 15}, (_, i) => `KBILD Q${i+1}`),
      "VAS Cough", "VAS Expectoration", "VAS Breathlessness", "VAS Chest Pain", "VAS Hemoptysis", "VAS Fever", "VAS CTD Symptoms",
      "Side Effects", "Meds Taken (Daily Log)",
    ];
    const pftHeaders = [
      "PFT Date", "PFT FEV1/FVC (%)", "PFT FEV1 (% Predicted)", "PFT FEV1 (Liters)", "PFT FVC (% Predicted)", "PFT FVC (Liters)", "PFT DLCO (% Predicted)", "PFT 6MWD (m)", "PFT Min SpO2", "PFT Max SpO2"
    ];

    const allHeaders = [...commonHeaders, ...logHeaders, ...pftHeaders];
    let csvContent = "data:text/csv;charset=utf-8," + allHeaders.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";
    
    // Determine which patients to export
    let patientsToExport: Patient[];
    if (options.patientId) {
      const patient = patients.find(p => p.id === options.patientId);
      patientsToExport = patient ? [patient] : [];
    } else {
      patientsToExport = getFilteredPatients(options.category); // Already sorted by registration date
    }

    const safeVal = (val: number | string | undefined | null) => (val !== undefined && val !== null) ? String(val).replace(/"/g, '""') : "";

    patientsToExport.forEach(p => {
      const medCounts: Record<string, number> = {};
      p.logs?.forEach(log => {
        if (log.taken_medications) {
          log.taken_medications.forEach(medName => {
            medCounts[medName] = (medCounts[medName] || 0) + 1;
          });
        }
      });

      const medicationHistoryStr = (p.medications || []).map(m => {
        const daysTaken = medCounts[m.name] || 0;
        const endDate = m.endDate ? `, End: ${m.endDate}` : ', Current';
        return `${m.name} ${m.dose} ${m.frequency} [Start: ${m.startDate || 'N/A'}${endDate}] (Taken: ${daysTaken} days)`;
      }).join(" | ");

      const coMorbiditiesStr = (p.coMorbidities || []).map(c => c === 'Others' && p.otherCoMorbidity ? `Others: ${p.otherCoMorbidity}` : c).join("; ");
      
      // Patient Details Row
      const patientDetailsValues = [
        "Patient Details", // Record Type
        safeVal(p.name), safeVal(p.id), safeVal(p.registrationDate), safeVal(p.diagnosisCategory), safeVal(p.diagnosis), safeVal(p.fibroticIld), 
        safeVal(p.ctdType), safeVal(p.sarcoidosisStage), safeVal(coMorbiditiesStr), safeVal(medicationHistoryStr),
      ];
      csvContent += patientDetailsValues.map(v => `"${v}"`).join(",") + Array(logHeaders.length + pftHeaders.length).fill('""').join(",") + "\n";


      // PFT History Rows
      const pftHistoryToProcess = [...(p.pftHistory || [])].filter(pft => {
        if (!options.fromDate || !options.toDate) return true;
        return pft.date >= options.fromDate && pft.date <= options.toDate;
      }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      pftHistoryToProcess.forEach(pft => {
        const pftValues = [
          "PFT Entry", // Record Type
          safeVal(p.name), safeVal(p.id), Array(commonHeaders.length - 3).fill('""').join(','), // Fill blank common patient fields except name & ID
          safeVal(pft.date), safeVal(pft.fev1_fvc), safeVal(pft.fev1), 
          safeVal(pft.fev1_liters), safeVal(pft.fvc), safeVal(pft.fvc_liters), 
          safeVal(pft.dlco), safeVal(pft.six_mwd), 
          safeVal(pft.min_spo2), safeVal(pft.max_spo2)
        ];
        csvContent += pftValues.map(v => `"${v}"`).join(",") + Array(logHeaders.length).fill('""').join(",") + "\n";
      });


      // Daily Logs Rows (Worst Per Day)
      const logsToProcess = [...(p.logs || [])].filter(log => {
        if (!options.fromDate || !options.toDate) return true;
        const logDateISO = log.date.split('/').reverse().join('-'); // Convert DD/MM/YYYY to YYYY-MM-DD
        return logDateISO >= options.fromDate && logDateISO <= options.toDate;
      });

      // Group logs by date and get the worst for each day
      const logsByDay: Record<string, HealthLog[]> = {};
      logsToProcess.forEach(log => {
        if (!logsByDay[log.date]) {
          logsByDay[log.date] = [];
        }
        logsByDay[log.date].push(log);
      });

      const worstLogsPerDay = Object.values(logsByDay).map(dayLogs => getWorstLogForDay(dayLogs));
      worstLogsPerDay.sort((a,b) => {
        const dateA = new Date(a.date.split('/').reverse().join('-')).getTime();
        const dateB = new Date(b.date.split('/').reverse().join('-')).getTime();
        return dateA - dateB;
      });

      worstLogsPerDay.forEach(log => {
        const kbildScores = Array.from({length: 15}, (_, i) => safeVal(log.kbild_responses?.[i+1]));
        const adherenceStr = (p.medications || []).map(m => `${m.name}(${log.taken_medications?.includes(m.name)?'Y':'N'})`).join("; ");
        const alertsStr = log.alerts ? log.alerts.join("; ") : "";
        const excelDate = log.date;
        
        const logValues = [
          "Health Log", // Record Type
          safeVal(p.name), safeVal(p.id), Array(commonHeaders.length - 3).fill('""').join(','), // Fill blank common patient fields except name & ID
          safeVal(excelDate), safeVal(log.time), safeVal(alertsStr), safeVal(log.aqi),
          safeVal(log.spo2_rest), safeVal(log.spo2_exertion), safeVal(log.mmrc_grade), safeVal(log.kbild_score), ...kbildScores,
          safeVal(log.vas.cough), safeVal(log.vas.expectoration), safeVal(log.vas.breathlessness), safeVal(log.vas.chest_pain), safeVal(log.vas.hemoptysis), safeVal(log.vas.fever), safeVal(log.vas.ctd_symptoms),
          safeVal(log.side_effects.join(';')), safeVal(adherenceStr),
        ];
        csvContent += logValues.map(v => `"${v}"`).join(",") + Array(pftHeaders.length).fill('""').join(",") + "\n";
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    let filename = `aiims_clinic_detailed_data_`;
    if (options.patientId) {
      const p = patients.find(pat => pat.id === options.patientId);
      filename += `patient_${p?.name.replace(/ /g, '_')}_${p?.id}_`;
    } else {
      const categoryName = options.category === 'all' ? 'all_patients' : getShortCategoryName(options.category || '').toLowerCase().replace(/ /g, '_');
      filename += `${categoryName}_`;
    }
    if (options.fromDate && options.toDate) {
      filename += `from_${options.fromDate}_to_${options.toDate}_`;
    }
    filename += `${getTodayISO()}.csv`;

    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSummary = () => { // Renamed from handleExportWorstScores
    if (selectedWorstScorePeriod === 'none') {
      alert("Please select a period (Daily, Weekly, or Monthly) for summary export.");
      return;
    }

    const headers = [
      "Patient Name", "Mobile ID", "Period Type", "Period Start Date", "Period End Date",
      "Lowest KBILD Score", "Highest mMRC Grade", "Lowest SpO2 Rest", "Lowest SpO2 Exertion", "Total Alerts",
      "Worst FEV1/FVC (%)", "Worst FEV1 (% Predicted)", "Worst FEV1 (Liters)", 
      "Worst FVC (% Predicted)", "Worst FVC (Liters)", "Worst DLCO (% Predicted)", 
      "Worst 6MWD (m)", "Min SpO2 (6MWD)", "Max SpO2 (6MWD)"
    ];
    let csvContent = "data:text/csv;charset=utf-8," + headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";

    const safeVal = (val: number | string | undefined | null) => (val !== undefined && val !== null) ? String(val).replace(/"/g, '""') : "";

    patients.forEach(p => {
      const patientLogs = [...(p.logs || [])].sort((a,b) => {
        const dateA = new Date(a.date.split('/').reverse().join('-')).getTime();
        const dateB = new Date(b.date.split('/').reverse().join('-')).getTime();
        return dateA - dateB;
      });
      if (patientLogs.length === 0 && (p.pftHistory || []).length === 0) return;

      const groupedLogsAndPFTs: Record<string, { logs: HealthLog[]; pfts: PFTDataEntry[] }> = {}; 

      // Group both logs and PFTs by period
      [...patientLogs, ...(p.pftHistory || [])].forEach(entry => {
        let dateObj: Date;
        if ('date' in entry && typeof entry.date === 'string' && entry.date.includes('/')) { // HealthLog
          dateObj = new Date(entry.date.split('/').reverse().join('-'));
        } else if ('date' in entry && typeof entry.date === 'string' && entry.date.includes('-')) { // PFTDataEntry (YYYY-MM-DD)
          dateObj = new Date(entry.date);
        } else {
          return; // Skip invalid date formats
        }
        
        let periodKey: string;
        let periodStartDate: string;
        let periodEndDate: string;

        if (selectedWorstScorePeriod === 'daily') {
          periodKey = dateObj.toISOString().slice(0,10); // YYYY-MM-DD
          periodStartDate = periodKey;
          periodEndDate = periodKey;
        } else if (selectedWorstScorePeriod === 'weekly') {
          const day = dateObj.getDay(); // 0 for Sunday, 1 for Monday
          const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
          const monday = new Date(dateObj);
          monday.setDate(diff);
          
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);

          periodStartDate = monday.toISOString().slice(0,10);
          periodEndDate = sunday.toISOString().slice(0,10);
          periodKey = `${periodStartDate}_${periodEndDate}`;
        } else { // monthly
          periodKey = dateObj.toISOString().slice(0, 7); // YYYY-MM
          const firstDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
          const lastDay = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0); // Last day of month
          periodStartDate = firstDay.toISOString().slice(0,10);
          periodEndDate = lastDay.toISOString().slice(0,10);
        }

        const formattedPeriodKey = `${periodStartDate} to ${periodEndDate}`;
        if (!groupedLogsAndPFTs[formattedPeriodKey]) {
          groupedLogsAndPFTs[formattedPeriodKey] = { logs: [], pfts: [] };
        }
        if ('spo2_rest' in entry) { // It's a HealthLog
          groupedLogsAndPFTs[formattedPeriodKey].logs.push(entry as HealthLog);
        } else { // It's a PFTDataEntry
          groupedLogsAndPFTs[formattedPeriodKey].pfts.push(entry as PFTDataEntry);
        }
      });

      for (const periodKey in groupedLogsAndPFTs) {
        const { logs: logsInPeriod, pfts: pftsInPeriod } = groupedLogsAndPFTs[periodKey];
        
        // Initialize worst log scores
        let worstKbild: number = 1000; // KBILD: lower is worse, so min value is worst
        let worstMmrc: number = 0; // mMRC: higher is worse, so max value is worst
        let minSpo2Rest: number = 101;
        let minSpo2Exertion: number = 101;
        let totalAlerts: number = 0;

        logsInPeriod.forEach(log => {
          if (log.kbild_score !== undefined && log.kbild_score < worstKbild) worstKbild = log.kbild_score;
          if (log.mmrc_grade !== undefined && Number(log.mmrc_grade) > worstMmrc) worstMmrc = Number(log.mmrc_grade);
          if (log.spo2_rest !== undefined && log.spo2_rest < minSpo2Rest) minSpo2Rest = log.spo2_rest;
          if (log.spo2_exertion !== undefined && log.spo2_exertion < minSpo2Exertion) minSpo2Exertion = log.spo2_exertion;
          totalAlerts += (log.alerts || []).length;
        });

        // Initialize worst PFT scores
        let worstFev1Fvc: number = 101;
        let worstFev1: number = 101;
        let worstFev1Liters: number = 10000; // Assuming 0-infinity, lowest is worst
        let worstFvc: number = 101;
        let worstFvcLiters: number = 10000;
        let worstDlco: number = 101;
        let worstSixMwd: number = 10000;
        let minSixMwdSpo2: number = 101;
        let maxSixMwdSpo2: number = 0;

        pftsInPeriod.forEach(pft => {
          if (pft.fev1_fvc !== undefined && pft.fev1_fvc < worstFev1Fvc) worstFev1Fvc = pft.fev1_fvc;
          if (pft.fev1 !== undefined && pft.fev1 < worstFev1) worstFev1 = pft.fev1;
          if (pft.fev1_liters !== undefined && pft.fev1_liters < worstFev1Liters) worstFev1Liters = pft.fev1_liters;
          if (pft.fvc !== undefined && pft.fvc < worstFvc) worstFvc = pft.fvc;
          if (pft.fvc_liters !== undefined && pft.fvc_liters < worstFvcLiters) worstFvcLiters = pft.fvc_liters;
          if (pft.dlco !== undefined && pft.dlco < worstDlco) worstDlco = pft.dlco;
          if (pft.six_mwd !== undefined && pft.six_mwd < worstSixMwd) worstSixMwd = pft.six_mwd; // Lower 6MWD is worse
          if (pft.min_spo2 !== undefined && pft.min_spo2 < minSixMwdSpo2) minSixMwdSpo2 = pft.min_spo2;
          if (pft.max_spo2 !== undefined && pft.max_spo2 > maxSixMwdSpo2) maxSixMwdSpo2 = pft.max_spo2;
        });

        const [periodStartDateStr, periodEndDateStr] = periodKey.split(' to ');

        const row = [
          safeVal(p.name), safeVal(p.id), safeVal(selectedWorstScorePeriod), safeVal(periodStartDateStr), safeVal(periodEndDateStr),
          safeVal(worstKbild === 1000 ? "" : worstKbild),
          safeVal(worstMmrc === 0 ? "" : worstMmrc),
          safeVal(minSpo2Rest === 101 ? "" : minSpo2Rest),
          safeVal(minSpo2Exertion === 101 ? "" : minSpo2Exertion),
          safeVal(totalAlerts),
          safeVal(worstFev1Fvc === 101 ? "" : worstFev1Fvc),
          safeVal(worstFev1 === 101 ? "" : worstFev1),
          safeVal(worstFev1Liters === 10000 ? "" : worstFev1Liters),
          safeVal(worstFvc === 101 ? "" : worstFvc),
          safeVal(worstFvcLiters === 10000 ? "" : worstFvcLiters),
          safeVal(worstDlco === 101 ? "" : worstDlco),
          safeVal(worstSixMwd === 10000 ? "" : worstSixMwd),
          safeVal(minSixMwdSpo2 === 101 ? "" : minSixMwdSpo2),
          safeVal(maxSixMwdSpo2 === 0 ? "" : maxSixMwdSpo2),
        ];
        csvContent += row.map(v => `"${v}"`).join(",") + "\n";
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    let filename = `aiims_summary_scores_${selectedWorstScorePeriod}_${getTodayISO()}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRemoveMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications?.filter((_, i) => i !== index)
    }));
  };

  const handleAddMedication = () => {
    if (tempMed.name && tempMed.dose) {
      setFormData(prev => ({
        ...prev,
        medications: [...(prev.medications || []), tempMed]
      }));
      setTempMed({ name: '', dose: '', frequency: '', startDate: getTodayISO(), endDate: '' });
    }
  };

  const handleClearMedication = () => {
    setTempMed({ name: '', dose: '', frequency: '', startDate: getTodayISO(), endDate: '' });
  };

  const handleAddPFT = () => {
    if (!editingPFT || !editingPFT.date) {
      alert("Please fill PFT date and values.");
      return;
    }
    setFormData(prev => ({
      ...prev,
      pftHistory: [...((prev.pftHistory || [])), { ...editingPFT, id: Date.now().toString() + Math.random().toString().slice(2,6) }]
    }));
    setEditingPFT(null);
    setShowPFTForm(false);
  };

  const handleUpdatePFT = () => {
    if (!editingPFT || !editingPFT.date || !editingPFT.id) {
      alert("Error: PFT data is incomplete.");
      return;
    }
    setFormData(prev => ({
      ...prev,
      pftHistory: (prev.pftHistory || []).map(p => p.id === editingPFT.id ? editingPFT : p)
    }));
    setEditingPFT(null);
    setShowPFTForm(false);
  };

  const handleDeletePFT = (id: string) => {
    if (window.confirm("Are you sure you want to delete this PFT record?")) {
      setFormData(prev => ({
        ...prev,
        pftHistory: (prev.pftHistory || []).filter(p => p.id !== id)
      }));
    }
  };

  const handleEditPFTClick = (pft: PFTDataEntry) => {
    setEditingPFT(pft);
    setShowPFTForm(true);
  };

  const handleCancelPFTEdit = () => {
    setEditingPFT(null);
    setShowPFTForm(false);
  }

  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.id) return;

    let currentMeds = formData.medications || [];
    if (tempMed.name && tempMed.dose) {
       currentMeds = [...currentMeds, tempMed];
    }
    const cleanedMeds = currentMeds.map(m => ({
      ...m,
      startDate: m.startDate || getTodayISO()
    }));
    const regDate = formData.registrationDate || getTodayDisplayDate();

    // Ensure defaults
    const diagnosisCat = formData.diagnosisCategory || PRIMARY_DIAGNOSIS_CATEGORIES[0];
    const diagnosisSub = formData.diagnosis || ILD_SUBTYPES[0];

    const newPatient: Patient = {
        ...formData as Patient,
        diagnosisCategory: diagnosisCat,
        diagnosis: diagnosisSub,
        medications: cleanedMeds,
        logs: view === 'edit' ? (patients.find(p => p.id === selectedPatientId)?.logs || []) : [],
        pftHistory: formData.pftHistory || [] // Ensure pftHistory is always an array
    };

    if (view === 'add') onAddPatient(newPatient);
    else onUpdatePatient(newPatient);
    setView(view === 'add' ? 'list' : 'detail');
  };

  const renderForm = () => (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-3xl shadow-xl border-t-4 border-blue-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{view === 'add' ? 'Register New Patient' : 'Edit Patient Details'}</h2>
        <button onClick={() => setView(view === 'add' ? 'list' : 'detail')} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
      </div>
      <form onSubmit={handleSavePatient} className="space-y-6">
        <div className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="block font-semibold text-gray-700 mb-1">Full Name</label><input type="text" required value={formData.name || ''} className="w-full p-3 border rounded-xl" onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div><label className="block font-semibold text-gray-700 mb-1">Mobile Number</label><input type="tel" required pattern="[0-9]{10}" disabled={view === 'edit'} value={formData.id || ''} className={`w-full p-3 border rounded-xl ${view === 'edit' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} onChange={e => setFormData({...formData, id: e.target.value})} /></div>
            <div><label className="block font-semibold text-gray-700 mb-1">Age</label><input type="number" required value={formData.age || ''} className="w-full p-3 border rounded-xl" onChange={e => setFormData({...formData, age: Number(e.target.value)})} /></div>
            <div><label className="block font-semibold text-gray-700 mb-1">Sex</label><select className="w-full p-3 border rounded-xl" value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value as any})}><option>Male</option><option>Female</option><option>Other</option></select></div>
            <div><label className="block font-semibold text-gray-700 mb-1">Occupation (Optional)</label><input type="text" value={formData.occupation || ''} className="w-full p-3 border rounded-xl" onChange={e => setFormData({...formData, occupation: e.target.value})} /></div>
            <div><label className="block font-semibold text-gray-700 mb-1">Registration Date</label><input type="date" value={formData.registrationDate ? formData.registrationDate.split('/').reverse().join('-') : getTodayISO()} onChange={(e) => { const val = e.target.value; if(val) { const [y, m, d] = val.split('-'); setFormData({...formData, registrationDate: `${d}/${m}/${y}`}); }}} className="w-full p-3 border rounded-xl" /></div>
        </div>
        
        <div className="bg-blue-100 p-6 rounded-2xl space-y-4 border-l-4 border-blue-500 shadow-sm">
            <h3 className="font-bold text-blue-800 text-lg">Clinical Diagnosis</h3>
            
            {/* Category Selection */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Disease Category</label>
              <select 
                className="w-full p-3 border rounded-xl bg-white" 
                value={formData.diagnosisCategory} 
                onChange={e => handleCategoryChange(e.target.value)}
              >
                {PRIMARY_DIAGNOSIS_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Subtype Selection based on Category */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Specific Diagnosis</label>
              <select 
                className="w-full p-3 border rounded-xl bg-white" 
                value={formData.diagnosis} 
                onChange={e => setFormData({...formData, diagnosis: e.target.value})}
              >
                {getSubtypeList(formData.diagnosisCategory).map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            {/* Conditionals specific to ILD */}
            {formData.diagnosisCategory === "Interstitial Lung Disease (ILD)" && (
              <>
                 {formData.diagnosis === "CTD-ILD" && (<div><label className="block font-semibold text-gray-700 mb-1">CTD Subtype</label><select className="w-full p-3 border rounded-xl bg-white" value={formData.ctdType || ''} onChange={e => setFormData({...formData, ctdType: e.target.value})}><option value="">Select Subtype</option>{CTD_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>)}
                 {formData.diagnosis === "Sarcoidosis" && (<div><label className="block font-semibold text-gray-700 mb-1">Stage</label><select className="w-full p-3 border rounded-xl bg-white" value={formData.sarcoidosisStage || ''} onChange={e => setFormData({...formData, sarcoidosisStage: e.target.value})}><option value="">Select Stage</option>{SARCOIDOSIS_STAGES.map(s => <option key={s}>{s}</option>)}</select></div>)}
                 <div><label className="block font-semibold text-gray-700 mb-1">Fibrotic ILD?</label><select className="w-full p-3 border rounded-xl bg-white" value={formData.fibroticIld || 'No'} onChange={e => setFormData({...formData, fibroticIld: e.target.value as 'Yes' | 'No'})}><option value="No">No</option><option value="Yes">Yes</option></select></div>
              </>
            )}

            <div className="relative" ref={dropdownRef}><label className="block font-semibold text-gray-700 mb-1">Co-morbidities</label><button type="button" onClick={() => setIsCoMorbidityDropdownOpen(!isCoMorbidityDropdownOpen)} className="w-full p-3 border rounded-xl bg-white text-left flex justify-between items-center"><span className="truncate">{formData.coMorbidities?.length ? formData.coMorbidities.join(', ') : "Select Co-morbidities (or None)"}</span>{isCoMorbidityDropdownOpen ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</button>{isCoMorbidityDropdownOpen && (<div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto p-2">{CO_MORBIDITIES_LIST.map((item) => (<label key={item} className="flex items-center gap-3 p-2 hover:bg-blue-50 cursor-pointer"><input type="checkbox" checked={(formData.coMorbidities || []).includes(item)} onChange={() => handleToggleCoMorbidity(item)} className="w-5 h-5"/><span className="text-gray-700">{item}</span></label>))}</div>)}</div>
            {formData.coMorbidities?.includes('Others') && (<div><label className="block font-semibold text-gray-700 mb-1">Specify Other</label><input type="text" value={formData.otherCoMorbidity || ''} onChange={(e) => setFormData({...formData, otherCoMorbidity: e.target.value})} className="w-full p-3 border rounded-xl"/></div>)}
        </div>
        
        <div className="bg-green-100 p-6 rounded-2xl border-l-4 border-green-500 shadow-sm">
          <h3 className="font-bold text-green-800 mb-3 text-lg">Pulmonary Function Test Records</h3>
          <div className="space-y-4 mb-4">
            {formData.pftHistory?.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(pft => (
              <div key={pft.id} className="bg-white p-3 rounded-xl border border-green-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-800">{pft.date}</div>
                  <div className="text-sm text-gray-600">
                    FEV1: {pft.fev1}% {pft.fev1_liters ? `(${pft.fev1_liters.toFixed(2)} L)` : ''} | 
                    FVC: {pft.fvc}% {pft.fvc_liters ? `(${pft.fvc_liters.toFixed(2)} L)` : ''} | 
                    DLCO: {pft.dlco}%
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleEditPFTClick(pft)} className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50"><Edit size={16}/></button>
                  <button type="button" onClick={() => handleDeletePFT(pft.id)} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>

          <button 
            type="button" 
            onClick={() => { 
              setShowPFTForm(true); 
              setEditingPFT({
                id: '', date: getTodayISO(), fev1_fvc: 0, fev1: 0, fev1_liters: 0, // Initialize new fields
                fvc: 0, fvc_liters: 0, dlco: 0, six_mwd: 0, min_spo2: 0, max_spo2: 0
              }); 
            }} 
            className="w-full bg-green-500 text-white py-2 rounded-xl font-bold hover:bg-green-600 transition shadow-md flex items-center justify-center gap-2"
          >
            <Plus size={18}/> Add New PFT Record
          </button>

          {showPFTForm && (
            <div className="mt-6 p-4 bg-green-50 rounded-2xl border border-green-200 animate-fade-in">
              <h4 className="font-bold text-green-800 mb-4">{editingPFT?.id ? "Edit PFT Record" : "New PFT Record"}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-full"><label className="text-xs font-bold text-green-700">Date</label><input type="date" value={editingPFT?.date || getTodayISO()} max={getTodayISO()} onChange={e => setEditingPFT(prev => ({...prev!, date: e.target.value}))} className="w-full p-2 rounded border bg-white" /></div>
                <div><label className="text-xs font-bold text-green-700">FEV1/FVC (%)</label><input type="number" step="0.01" value={editingPFT?.fev1_fvc || ''} className="w-full p-2 rounded border bg-white" onChange={e => setEditingPFT(prev => ({...prev!, fev1_fvc: Number(e.target.value)}))} /></div>
                <div><label className="text-xs font-bold text-green-700">FEV1 (% Predicted)</label><input type="number" step="0.01" value={editingPFT?.fev1 || ''} className="w-full p-2 rounded border bg-white" onChange={e => setEditingPFT(prev => ({...prev!, fev1: Number(e.target.value)}))} /></div>
                <div><label className="text-xs font-bold text-green-700">FEV1 (Liters)</label><input type="number" step="0.01" value={editingPFT?.fev1_liters || ''} className="w-full p-2 rounded border bg-white" onChange={e => setEditingPFT(prev => ({...prev!, fev1_liters: Number(e.target.value)}))} /></div> {/* New */}
                <div><label className="text-xs font-bold text-green-700">FVC (% Predicted)</label><input type="number" step="0.01" value={editingPFT?.fvc || ''} className="w-full p-2 rounded border bg-white" onChange={e => setEditingPFT(prev => ({...prev!, fvc: Number(e.target.value)}))} /></div>
                <div><label className="text-xs font-bold text-green-700">FVC (Liters)</label><input type="number" step="0.01" value={editingPFT?.fvc_liters || ''} className="w-full p-2 rounded border bg-white" onChange={e => setEditingPFT(prev => ({...prev!, fvc_liters: Number(e.target.value)}))} /></div> {/* New */}
                <div><label className="text-xs font-bold text-green-700">DLCO (% Predicted)</label><input type="number" step="0.01" value={editingPFT?.dlco || ''} className="w-full p-2 rounded border bg-white" onChange={e => setEditingPFT(prev => ({...prev!, dlco: Number(e.target.value)}))} /></div>
                <div><label className="text-xs font-bold text-green-700">6MWD (m)</label><input type="number" step="0.01" value={editingPFT?.six_mwd || ''} className="w-full p-2 rounded border bg-white" onChange={e => setEditingPFT(prev => ({...prev!, six_mwd: Number(e.target.value)}))} /></div>
                <div><label className="text-xs font-bold text-green-700">Min SpO2</label><input type="number" step="0.01" value={editingPFT?.min_spo2 || ''} className="w-full p-2 rounded border bg-white" onChange={e => setEditingPFT(prev => ({...prev!, min_spo2: Number(e.target.value)}))} /></div>
                <div><label className="text-xs font-bold text-green-700">Max SpO2</label><input type="number" step="0.01" value={editingPFT?.max_spo2 || ''} className="w-full p-2 rounded border bg-white" onChange={e => setEditingPFT(prev => ({...prev!, max_spo2: Number(e.target.value)}))} /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={handleCancelPFTEdit} className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100">Cancel</button>
                <button type="button" onClick={editingPFT?.id ? handleUpdatePFT : handleAddPFT} className="px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700">
                  {editingPFT?.id ? "Update PFT" : "Add PFT"}
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-purple-100 p-6 rounded-2xl border-l-4 border-purple-500 shadow-sm">
          <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2 text-lg"><Calendar size={20} /> Medication History & Prescription</h3>
          <div className="space-y-2 mb-4">
            {formData.medications?.map((m, i) => (
              <div key={i} className={`flex flex-col gap-2 p-3 rounded text-sm border ${m.endDate ? 'bg-gray-200' : 'bg-white shadow-sm'}`}>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-3 font-bold">{m.name}</div>
                    <div className="col-span-2">{m.dose}</div>
                    <div className="col-span-2">{m.frequency}</div>
                    <div className="col-span-2 text-xs text-gray-500">{m.startDate}</div>
                    <div className="col-span-2 text-xs text-gray-500">{m.endDate || '-'}</div>
                    <div className="col-span-1 text-right"><button type="button" onClick={() => handleRemoveMedication(i)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button></div>
                  </div>
                  {isComplexFrequency(m.frequency) && <div className="text-xs text-indigo-700 pl-2">Dose #{m.doseNumber} on {m.dosageDate}</div>}
              </div>
            ))}
          </div>

          <div className="border-t pt-3 border-purple-200">
              <label className="text-xs block text-purple-700 font-bold mb-2 uppercase tracking-wider">Add New Medication</label>
              <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-sm">
                 <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-3">
                       <label className="text-[10px] text-gray-500 font-bold block">Drug Name</label>
                       <select className="w-full p-2 rounded border text-sm bg-gray-50" value={getMedicationDropdownValue(tempMed.name)} onChange={e => setTempMed({...tempMed, name: e.target.value === 'Other' ? '' : e.target.value})}><option value="">Select...</option>{MEDICATION_LIST.map(d => <option key={d} value={d}>{d}</option>)}</select>
                       {getMedicationDropdownValue(tempMed.name) === 'Other' && <input className="w-full p-2 rounded border text-sm mt-1 uppercase border-yellow-300 bg-yellow-50" placeholder="TYPE NAME HERE" value={tempMed.name} onChange={e => setTempMed({...tempMed, name: e.target.value.toUpperCase()})}/>}
                    </div>
                    <div className="col-span-2">
                       <label className="text-[10px] text-gray-500 font-bold block">Dose</label>
                       <input placeholder="mg/ml" value={tempMed.dose} onChange={e => setTempMed({...tempMed, dose: e.target.value})} className="w-full p-2 rounded border text-sm"/>
                    </div>
                    <div className="col-span-2">
                       <label className="text-[10px] text-gray-500 font-bold block">Freq</label>
                       <select className="w-full p-2 rounded border text-sm bg-gray-50" value={tempMed.frequency} onChange={e => setTempMed({...tempMed, frequency: e.target.value})}><option value="">Select...</option>{FREQUENCY_LIST.map(f => <option key={f} value={f}>{f}</option>)}</select>
                    </div>
                    <div className="col-span-2">
                       <label className="text-[10px] text-gray-500 font-bold block">Start Date</label>
                       <input type="date" value={tempMed.startDate} onChange={e => setTempMed({...tempMed, startDate: e.target.value})} className="w-full p-2 rounded border text-sm"/>
                    </div>
                    <div className="col-span-2">
                       <label className="text-[10px] text-gray-500 font-bold block">End Date</label>
                       <input type="date" value={tempMed.endDate || ''} onChange={e => setTempMed({...tempMed, endDate: e.target.value})} className="w-full p-2 rounded border text-sm"/>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button type="button" onClick={handleAddMedication} className="bg-purple-600 text-white p-2 rounded h-9 w-9 flex items-center justify-center hover:bg-purple-700 shadow-md"><Plus size={16}/></button>
                    </div>
                 </div>
                 {isComplexFrequency(tempMed.frequency) && (
                    <div className="flex gap-4 bg-indigo-50 p-2 rounded mt-2 animate-fade-in">
                       <div className="flex flex-col"><label className="text-[10px] text-indigo-800">Dose #</label><select value={tempMed.doseNumber || ''} onChange={e => setTempMed({...tempMed, doseNumber: Number(e.target.value)})} className="p-1 border rounded w-20"><option value="">1-20</option>{Array.from({length:20}, (_,k) => <option key={k+1} value={k+1}>{k+1}</option>)}</select></div>
                       <div className="flex flex-col"><label className="text-[10px] text-indigo-800">Specific Date</label><input type="date" value={tempMed.dosageDate || ''} onChange={e => setTempMed({...tempMed, dosageDate: e.target.value})} className="p-1 border rounded"/></div>
                    </div>
                 )}
              </div>
          </div>
        </div>

        <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"><Save size={20} className="inline mr-2"/>{view === 'add' ? 'Create Patient ID' : 'Save Changes'}</button>
      </form>
    </div>
  );

  const renderDetailView = () => {
    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return null;
    
    // Convert DD/MM/YYYY log dates to YYYY-MM-DD for consistent sorting
    const sortedLogs = [...(patient.logs || [])].sort((a, b) => { // Added || []
      const dateA = new Date(a.date.split('/').reverse().join('-')).getTime();
      const dateB = new Date(b.date.split('/').reverse().join('-')).getTime();
      return dateA - dateB;
    });

    const chartData = sortedLogs.map(log => ({
      date: log.date.slice(0, 5), // Just DD/MM
      spo2_rest: log.spo2_rest,
      spo2_exertion: log.spo2_exertion,
      kbild: log.kbild_score,
      symptomScore: log.vas[selectedSymptomTrend as keyof typeof log.vas] || 0
    }));

    const sortedPftHistory = [...(patient.pftHistory || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Added || []
    
    const pftChartData = sortedPftHistory.map(pft => ({
      date: pft.date, // YYYY-MM-DD
      // Ensure that if the new fields are undefined, they default to 0 for charting
      fev1_fvc: pft.fev1_fvc,
      fev1: pft.fev1,
      fev1_liters: pft.fev1_liters || 0,
      fvc: pft.fvc,
      fvc_liters: pft.fvc_liters || 0,
      dlco: pft.dlco,
      six_mwd: pft.six_mwd,
      min_spo2: pft.min_spo2,
      max_spo2: pft.max_spo2,
    }));


    return (
      <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6">
           <button onClick={() => setView('list')} className="text-blue-600 hover:underline flex items-center gap-1">&larr; Back to Patient List</button>
           <button 
             onClick={(e) => {
               e.preventDefault();
               if(window.confirm(`Are you sure you want to PERMANENTLY delete patient ${patient.name}?`)) { 
                 onDeletePatient(patient.id); 
                 setView('list'); 
               } 
             }} 
             className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-100 transition flex items-center gap-2 shadow-sm border border-red-100"
           >
             <Trash2 size={18}/> Delete Patient
           </button>
        </div>
        
        <div className="bg-white rounded-3xl p-6 shadow-md border-l-4 border-blue-500 mb-6">
             <div className="flex justify-between items-start">
                <div>
                   <h2 className="text-3xl font-bold text-gray-800">{patient.name}</h2>
                   <p className="text-gray-500">ID: {patient.id}</p>
                   <p className="text-sm text-gray-600 mt-1 font-bold bg-blue-50 inline-block px-2 py-1 rounded">Sex: {patient.sex} | Age: {patient.age}y</p>
                   <div className="mt-2">
                      <span className="text-blue-800 bg-blue-100 px-2 py-1 rounded text-sm font-semibold mr-2">{getShortCategoryName(patient.diagnosisCategory || "ILD")}</span>
                      <span className="text-indigo-800 bg-indigo-100 px-2 py-1 rounded text-sm font-semibold">{patient.diagnosis}</span>
                   </div>
                   {patient.coMorbidities && patient.coMorbidities.length > 0 && (
                     <div className="mt-2 text-sm text-gray-700">
                       <span className="font-semibold">Co-morbidities:</span> {patient.coMorbidities.map(c => c === 'Others' && patient.otherCoMorbidity ? `Others: ${patient.otherCoMorbidity}` : c).join(', ')}
                     </div>
                   )}
                   {/* NEW: Log and PFT counts here */}
                   <div className="mt-4 text-sm text-gray-700">
                      <span className="font-semibold mr-4">Total Logs: <span className="font-bold text-blue-600">{patient.logs?.length || 0}</span></span>
                      <span className="font-semibold">Total PFTs: <span className="font-bold text-green-600">{patient.pftHistory?.length || 0}</span></span>
                   </div>
                </div>
                <div className="flex items-center gap-2"> {/* New div for buttons */}
                  <button 
                    onClick={() => handleExportCSV({ patientId: patient.id })} 
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm shadow hover:bg-purple-700 flex items-center gap-2"
                  >
                    <Download size={18}/> Export Patient Data
                  </button>
                  <button onClick={() => setView('edit')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm shadow hover:bg-blue-700">Edit Profile</button>
                </div>
             </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-100">
            <h3 className="text-xl font-bold mb-4 text-gray-700">Recent Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-gray-500 text-sm">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Alerts</th>
                    <th className="pb-2">SpO2</th>
                    <th className="pb-2">mMRC</th>
                    <th className="pb-2">Symptoms</th>
                  </tr>
                </thead>
                <tbody>
                  {(patient.logs || []).length === 0 && ( // Added || []
                    <tr><td colSpan={5} className="py-4 text-center text-gray-400">No logs found.</td></tr>
                  )}
                  {(patient.logs || []).slice(0, 5).map((log: HealthLog) => ( // Added || []
                    <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                      <td className="py-3 font-medium">{log.date} <span className="text-xs text-gray-400 block">{log.time}</span></td>
                      <td className="py-3 text-red-600 text-xs font-bold">{log.alerts.join(", ")}</td>
                      <td className="py-3"><span className="text-green-600 font-bold">{log.spo2_rest}</span> / <span className="text-red-500 font-bold">{log.spo2_exertion}</span></td>
                      <td className="py-3 font-semibold">{log.mmrc_grade}</td>
                      <td className="py-3 text-xs text-gray-600">{Object.entries(log.vas).filter(([k,v]) => v>5).map(([k,v])=>`${k}(${v})`).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-100">
             <h3 className="text-xl font-bold mb-4 text-gray-700">PFT History</h3>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead>
                   <tr className="border-b text-gray-500 text-sm">
                     <th className="pb-2">Date</th>
                     <th className="pb-2">FEV1/FVC</th>
                     <th className="pb-2">FEV1 (%)</th> {/* Updated label */}
                     <th className="pb-2">FEV1 (L)</th> {/* New */}
                     <th className="pb-2">FVC (%)</th> {/* Updated label */}
                     <th className="pb-2">FVC (L)</th> {/* New */}
                   </tr>
                 </thead>
                 <tbody>
  {(patient.pftHistory || []).length === 0 && (
    <>
      {/* Updated colspan */}
      <tr>
        <td colSpan={6} className="py-4 text-center text-gray-400">
          No PFT records found.
        </td>
      </tr>
    </>
  )}

  {[...(patient.pftHistory || [])]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((pft) => (
      <tr
        key={pft.id}
        className="border-b last:border-0 hover:bg-gray-50 transition"
      >
        <td className="py-3 font-medium">{pft.date}</td>
        <td className="py-3 text-blue-600 font-bold">{pft.fev1_fvc}%</td>
        <td className="py-3 text-green-600 font-bold">{pft.fev1}%</td>

        {/* New */}
        <td className="py-3 text-green-700 font-bold">
          {pft.fev1_liters?.toFixed(2) || "N/A"}
        </td>

        <td className="py-3 text-purple-600 font-bold">{pft.fvc}%</td>

        {/* New */}
        <td className="py-3 text-purple-700 font-bold">
          {pft.fvc_liters?.toFixed(2) || "N/A"}
        </td>
      </tr>
    ))}
</tbody>

               </table>
             </div>
          </div>
        </div>

        {/* All Trends Section */}
        <div className="space-y-6 mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><TrendingUp className="text-blue-500"/> Patient Trends</h3>

          {/* SpO2 Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-100">
              <h3 className="font-bold text-gray-700 mb-4">SpO2 Levels</h3>
              {sortedLogs.length > 1 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#888" fontSize={12} />
                      <YAxis domain={[80, 100]} stroke="#888" fontSize={12} />
                      <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                      <Legend />
                      <Line type="monotone" dataKey="spo2_rest" stroke="#10b981" name="Rest" strokeWidth={2} dot={{r:4}} />
                      <Line type="monotone" dataKey="spo2_exertion" stroke="#ef4444" name="Exertion" strokeWidth={2} dot={{r:4}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-gray-400 py-10">Not enough log data to show SpO2 trends (at least 2 entries needed).</p>
              )}
          </div>

          {/* KBILD Total Score Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-100">
              <h3 className="font-bold text-gray-700 mb-4">Quality of Life (KBILD) Score</h3>
              {sortedLogs.length > 1 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#888" fontSize={12} />
                      <YAxis domain={[0, 105]} stroke="#888" fontSize={12} /> {/* KBILD scores are up to 105 */}
                      <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                      <Line type="monotone" dataKey="kbild" stroke="#fbbd23" name="KBILD Score" strokeWidth={3} dot={{r:4, fill:'#fbbd23'}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-gray-400 py-10">Not enough log data to show KBILD score trends (at least 2 entries needed).</p>
              )}
          </div>

          {/* Symptom Severity Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-700">Symptom Severity</h3>
                <select 
                  value={selectedSymptomTrend} 
                  onChange={(e) => setSelectedSymptomTrend(e.target.value)}
                  className="p-2 text-sm border rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-200 outline-none"
                >
                   <option value="breathlessness">Breathlessness</option>
                   <option value="cough">Cough</option>
                   <option value="expectoration">Expectoration</option>
                   <option value="chest_pain">Chest Pain</option>
                   <option value="hemoptysis">Hemoptysis</option>
                   <option value="fever">Fever</option>
                   <option value="ctd_symptoms">CTD Symptoms</option>
                </select>
              </div>
              {sortedLogs.length > 1 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#888" fontSize={12} />
                      <YAxis domain={[0, 10]} stroke="#888" fontSize={12} />
                      <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                      <Line type="monotone" dataKey="symptomScore" stroke="#8b5cf6" name="Score" strokeWidth={3} dot={{r:4, fill:'#8b5cf6'}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-gray-400 py-10">Not enough log data to show symptom trends (at least 2 entries needed).</p>
              )}
          </div>

          {/* PFT Trends Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-100 mb-6">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-gray-700">PFT Trends</h3>
                 <select 
                   value={selectedPFTTrend} 
                   onChange={(e) => setSelectedPFTTrend(e.target.value as keyof PFTDataEntry)}
                   className="p-2 text-sm border rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-200 outline-none"
                 >
                    {Object.entries(PFT_PARAM_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                 </select>
              </div>
              {sortedPftHistory.length > 1 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pftChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#888" fontSize={12} />
                      <YAxis stroke="#888" fontSize={12} />
                      <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                      <Line type="monotone" dataKey={selectedPFTTrend} stroke="#06b6d4" name={PFT_PARAM_LABELS[selectedPFTTrend]} strokeWidth={3} dot={{r:4, fill:'#06b6d4'}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-gray-400 py-10">Not enough PFT data to show trends (at least 2 entries needed).</p>
              )}
           </div>
        </div>

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 pb-10 font-sans text-slate-800">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg p-6 mb-8 text-white">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white shadow-inner">
               <Activity size={28} />
             </div>
             <div>
               <h1 className="text-3xl font-extrabold tracking-tight">Doctor Dashboard</h1>
               <p className="text-blue-100 text-xs font-medium opacity-90">Patient Management System</p>
             </div>
          </div>
          <button onClick={onLogout} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm transition text-sm font-semibold border border-white/20 shadow-sm">Logout</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6">
        {view === 'list' && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
               <div className="flex flex-col md:flex-row gap-4 w-full"> {/* Group search and filter */}
                 <div className="relative w-full md:w-96 group">
                   <Search className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                   <input 
                     type="text" 
                     placeholder="Search by name or mobile number" 
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                   />
                 </div>
                 {/* New Category Filter Dropdown */}
                 <div className="relative w-full md:w-auto">
                   <select
                     value={selectedDisplayCategory}
                     onChange={(e) => setSelectedDisplayCategory(e.target.value)}
                     className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none pr-8"
                   >
                     <option value="all">Filter by Category</option>
                     {PRIMARY_DIAGNOSIS_CATEGORIES.map(cat => (
                       <option key={cat} value={cat}>{getShortCategoryName(cat)}</option>
                     ))}
                   </select>
                   <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={20} />
                 </div>
               </div>
               <button 
                 onClick={() => setView('add')}
                 className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-bold active:scale-95 w-full md:w-auto"
               >
                 <Plus size={18} /> Add Patient
               </button>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {getFilteredPatients().map(p => { 
    const categoryStyle =
      DIAGNOSIS_CATEGORY_STYLES[p.diagnosisCategory] ||
      DIAGNOSIS_CATEGORY_STYLES[PRIMARY_DIAGNOSIS_CATEGORIES[0]];

    const shortCategoryName = getShortCategoryName(p.diagnosisCategory);

    return (
      <div
        key={p.id}
        onClick={() => {
          setSelectedPatientId(p.id);
          setView('detail');
        }}
        className={`bg-white p-5 rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer border-l-4 ${
          categoryStyle?.borderColor || 'border-blue-300'
        } group relative overflow-hidden hover:-translate-y-1 duration-300`}
      >
        <div
          className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${
            categoryStyle?.bgColor || 'from-blue-100 to-indigo-100'
          } rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110`}
        ></div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-3">
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-white to-gray-50 border ${
                categoryStyle?.borderColor || 'border-blue-100'
              } flex items-center justify-center ${
                categoryStyle?.tagColor.split(' ')[0] || 'text-blue-600'
              } font-bold text-xl shadow-sm`}
            >
              {p.name.charAt(0).toUpperCase()}
            </div>

            <button
              onClick={e => {
                e.stopPropagation();
                if (window.confirm(`Are you sure you want to delete ${p.name}?`))
                  onDeletePatient(p.id);
              }}
              className="text-slate-300 hover:text-red-500 p-2 transition-colors hover:bg-red-50 rounded-full"
              title="Delete Patient"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <h3 className="font-bold text-lg text-slate-800 mb-1 capitalize truncate pr-2">
            {p.name}
          </h3>

          <div className="mb-2">
            <span
              className={`text-sm font-semibold ${
                categoryStyle?.tagColor ||
                'text-blue-700 bg-blue-50 border-blue-100'
              } px-2 py-1 rounded-md border inline-block max-w-full truncate`}
            >
              {shortCategoryName} / {p.diagnosis}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 border-t border-slate-100 pt-3 mt-2">
            <span className="flex items-center gap-1">
              <Users size={12} /> {p.sex}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span>{p.age} Years</span>
            <span className="ml-auto text-slate-400">ID: {p.id.slice(-4)}</span>
          </div>
        </div>
      </div>
    );
  })}
</div>

            {/* Button to toggle Export Options */}
            <div className="mt-8 text-center">
              <button 
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="flex items-center justify-center mx-auto gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition shadow-lg shadow-purple-200 font-bold text-lg active:scale-95"
              >
                <Download size={20} /> {showExportOptions ? 'Hide Export Options' : 'Show Export Options'}
              </button>
            </div>

            {/* Export Options Section - Moved to bottom */}
            {showExportOptions && (
              <div className="mt-10 pt-5 border-t border-slate-200 flex flex-col gap-5 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 max-w-2xl mx-auto animate-fade-in">
                  {/* Detailed Data Export */}
                  <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-3">Detailed Patient Data Export</h3>
                      <p className="text-gray-600 text-sm mb-3">Exports a comprehensive Excel sheet with all patient details, daily logs, and PFT history for the selected patient group.</p>
                      <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
                          <select
                              value={selectedExportCategory}
                              onChange={(e) => setSelectedExportCategory(e.target.value)}
                              className="px-4 py-2 border rounded-lg bg-gray-50 text-gray-700 text-base w-full sm:w-auto"
                          >
                              <option value="all">All Patients Data</option>
                              {PRIMARY_DIAGNOSIS_CATEGORIES.map(cat => (
                                  <option key={cat} value={cat}>{getShortCategoryName(cat)}</option>
                              ))}
                          </select>
                          <button
                              onClick={() => handleExportCSV({ category: selectedExportCategory })}
                              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-md font-bold text-base w-full sm:w-auto active:scale-95"
                          >
                              <Download size={18} /> Export Detailed Data (All History)
                          </button>
                      </div>
                      {/* Date Range Export */}
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                          <label htmlFor="fromDate" className="text-sm font-medium text-gray-700 whitespace-nowrap">From Date:</label>
                          <input
                              type="date"
                              id="fromDate"
                              value={exportFromDate}
                              onChange={(e) => setExportFromDate(e.target.value)}
                              className="px-4 py-2 border rounded-lg bg-gray-50 text-gray-700 text-base w-full sm:w-auto"
                          />
                          <label htmlFor="toDate" className="text-sm font-medium text-gray-700 whitespace-nowrap">To Date:</label>
                          <input
                              type="date"
                              id="toDate"
                              value={exportToDate}
                              onChange={(e) => setExportToDate(e.target.value)}
                              className="px-4 py-2 border rounded-lg bg-gray-50 text-gray-700 text-base w-full sm:w-auto"
                          />
                          <button
                              onClick={() => handleExportCSV({ category: selectedExportCategory, fromDate: exportFromDate, toDate: exportToDate })}
                              disabled={!exportFromDate || !exportToDate}
                              className={`flex items-center gap-2 px-6 py-2 ${(!exportFromDate || !exportToDate) ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'} text-white rounded-xl transition shadow-md font-bold text-base w-full sm:w-auto active:scale-95`}
                          >
                              <Download size={18} /> Export Detailed Data (Date Range)
                          </button>
                      </div>
                  </div>

                  <hr className="border-t border-slate-200" />

                  {/* Summary Scores Export */}
                  <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">Summary Export</h3>
                      <p className="text-gray-600 text-sm mb-3">Exports a summary of the worst recorded scores (KBILD, mMRC, SpO2, Alerts) and worst PFT metrics for each patient, grouped by the selected time period.</p>
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                          <select
                              value={selectedWorstScorePeriod}
                              onChange={(e) => setSelectedWorstScorePeriod(e.target.value as typeof selectedWorstScorePeriod)}
                              className="px-4 py-2 border rounded-lg bg-gray-50 text-gray-700 text-base w-full sm:w-auto"
                          >
                              <option value="none">Select Period</option>
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                          </select>
                          <button
                              onClick={handleExportSummary}
                              disabled={selectedWorstScorePeriod === 'none'}
                              className={`flex items-center gap-2 px-6 py-2 ${selectedWorstScorePeriod === 'none' ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white rounded-xl transition shadow-md font-bold text-base w-full sm:w-auto active:scale-95`}
                          >
                              <Download size={18} /> Export Summary
                          </button>
                      </div>
                  </div>
              </div> 
            )} {/* End of Export options */}
          </>
        )}
        {(view === 'add' || view === 'edit') && renderForm()}
        {view === 'detail' && renderDetailView()}
      </main>
    </div>
  );
};

export default DoctorDashboard;