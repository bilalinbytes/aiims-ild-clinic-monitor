
import React, { useState, useEffect, useRef } from 'react';
import { Patient, Medication, HealthLog } from '../types';
import { DIAGNOSIS_LIST, CTD_TYPES, SARCOIDOSIS_STAGES, CO_MORBIDITIES_LIST, MEDICATION_LIST, FREQUENCY_LIST } from '../constants';
import { Users, Plus, Download, Trash2, Search, ChevronDown, ChevronUp, X, Activity, AlertTriangle, Bell, Edit, Save, Calendar, RotateCcw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DoctorDashboardProps {
  patients: Patient[];
  onAddPatient: (p: Patient) => void;
  onUpdatePatient: (p: Patient) => void;
  onDeletePatient: (id: string) => void;
  onLogout: () => void;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ patients, onAddPatient, onUpdatePatient, onDeletePatient, onLogout }) => {
  const [view, setView] = useState<'list' | 'add' | 'detail' | 'edit'>('list');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCoMorbidityDropdownOpen, setIsCoMorbidityDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const getLocalDateISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const getTodayDisplayDate = () => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  };

  const [formData, setFormData] = useState<Partial<Patient>>({
    sex: 'Male',
    diagnosis: DIAGNOSIS_LIST[0],
    fibroticIld: 'No',
    registrationDate: getTodayDisplayDate(),
    medications: [],
    coMorbidities: [],
    otherCoMorbidity: '',
    pft: { fev1_fvc: 0, fev1: 0, fvc: 0, dlco: 0, six_mwd: 0, min_spo2: 0, max_spo2: 0 }
  });
  
  const [tempMed, setTempMed] = useState<Medication>({ name: '', dose: '', frequency: '', startDate: getLocalDateISO() });

  useEffect(() => {
    if ((view === 'edit' || view === 'detail') && selectedPatientId) {
      const p = patients.find(pat => pat.id === selectedPatientId);
      if (p && view === 'edit') {
        setFormData(JSON.parse(JSON.stringify(p))); 
        setTempMed({ name: '', dose: '', frequency: '', startDate: getLocalDateISO() });
      }
    } else if (view === 'add') {
      setFormData({
        sex: 'Male',
        diagnosis: DIAGNOSIS_LIST[0],
        fibroticIld: 'No',
        registrationDate: getTodayDisplayDate(),
        medications: [],
        coMorbidities: [],
        otherCoMorbidity: '',
        pft: { fev1_fvc: 0, fev1: 0, fvc: 0, dlco: 0, six_mwd: 0, min_spo2: 0, max_spo2: 0 }
      });
      setTempMed({ name: '', dose: '', frequency: '', startDate: getLocalDateISO() });
    }
  }, [view, selectedPatientId, patients]);

  const getFilteredPatients = () => {
    return patients.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.includes(searchTerm)
    );
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

  const handleExportCSV = () => {
    const headers = [
      "Patient Name", "Mobile ID", "Registration Date", "Diagnosis", "Fibrotic ILD", "Co-morbidities",
      "Log Date", "Log Time", "Alerts", "AQI",
      "FEV1/FVC (%)", "FEV1 (L)", "FVC (L)", "DLCO (%)", "6MWD (m)", "Baseline Min SpO2", "Baseline Max SpO2",
      "SpO2 Rest", "SpO2 Exertion", "mMRC Grade", "KBILD Total Score", 
      ...Array.from({length: 15}, (_, i) => `KBILD Q${i+1}`),
      "VAS Cough", "VAS Expectoration", "VAS Breathlessness", "VAS Chest Pain", "VAS Hemoptysis", "VAS Fever", "VAS CTD Symptoms",
      "Side Effects", "Meds Taken (Daily Log)", "Medication History & Adherence"
    ];

    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
    
    patients.forEach(p => {
      // Calculate medication adherence counts across ALL logs for this patient
      const medCounts: Record<string, number> = {};
      p.logs.forEach(log => {
        if (log.taken_medications) {
          log.taken_medications.forEach(medName => {
            medCounts[medName] = (medCounts[medName] || 0) + 1;
          });
        }
      });

      // Format prescribed meds history string with days taken
      const medicationHistoryStr = p.medications.map(m => 
        `${m.name} (${m.dose}, ${m.frequency}) - [Taken: ${medCounts[m.name] || 0} days]`
      ).join(" | ").replace(/"/g, '""');

      const safePft = (val: number | undefined) => (val !== undefined && val !== null) ? val : "";
      const pftCols = [
        safePft(p.pft?.fev1_fvc), safePft(p.pft?.fev1), safePft(p.pft?.fvc), safePft(p.pft?.dlco), 
        safePft(p.pft?.six_mwd), safePft(p.pft?.min_spo2), safePft(p.pft?.max_spo2)
      ].join(",");

      const regDate = p.registrationDate || 'N/A';
      const coMorbiditiesStr = (p.coMorbidities || []).map(c => c === 'Others' && p.otherCoMorbidity ? `Others: ${p.otherCoMorbidity}` : c).join("; ");

      // Group logs by date, pick worst
      const dailyLogs: Record<string, HealthLog> = {};
      p.logs.forEach(log => {
        if (!dailyLogs[log.date]) {
           dailyLogs[log.date] = log;
        } else {
           const existing = dailyLogs[log.date];
           const current = log;
           // Logic: Higher mMRC is worse
           if (Number(current.mmrc_grade) > Number(existing.mmrc_grade)) { dailyLogs[log.date] = current; }
        }
      });
      
      const logsToExport = Object.values(dailyLogs).sort((a,b) => b.timestamp - a.timestamp); 

      if (logsToExport.length === 0) {
        const row = [
          `"${p.name}"`, `"${p.id}"`, `"${regDate}"`, `"${p.diagnosis}"`, `"${p.fibroticIld || 'No'}"`, `"${coMorbiditiesStr}"`,
          "No Logs", "", "", "", pftCols, "", "", "", "", ...Array(15).fill(""), ...Array(7).fill(""), "", "", `"${medicationHistoryStr}"`
        ];
        csvContent += row.join(",") + "\n";
      } else {
        logsToExport.forEach(log => {
          const kbildScores = Array.from({length: 15}, (_, i) => log.kbild_responses?.[i+1] || "");
          const adherenceStr = p.medications.map(m => `${m.name}(${log.taken_medications?.includes(m.name)?'Y':'N'})`).join("; ");
          const alertsStr = log.alerts ? log.alerts.join("; ") : "";
          const dateParts = log.date.split('/');
          const excelSafeDate = dateParts.length === 3 ? `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}` : log.date;

          const row = [
            `"${p.name}"`, `"${p.id}"`, `"${regDate}"`, `"${p.diagnosis}"`, `"${p.fibroticIld || 'No'}"`, `"${coMorbiditiesStr}"`,
            `"${excelSafeDate || 'N/A'}"`, `"${log.time || ''}"`, `"${alertsStr}"`, `"${log.aqi !== undefined ? log.aqi : ''}"`,
            pftCols, log.spo2_rest, log.spo2_exertion, log.mmrc_grade, log.kbild_score, ...kbildScores,
            log.vas.cough, log.vas.expectoration, log.vas.breathlessness, log.vas.chest_pain, log.vas.hemoptysis, log.vas.fever, log.vas.ctd_symptoms,
            `"${log.side_effects.join(';')}"`, `"${adherenceStr}"`, `"${medicationHistoryStr}"`
          ];
          csvContent += row.join(",") + "\n";
        });
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "aiims_ild_clinic_data.csv");
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
      setTempMed({ name: '', dose: '', frequency: '', startDate: getLocalDateISO() });
    }
  };

  const handleClearMedication = () => {
    setTempMed({ name: '', dose: '', frequency: '', startDate: getLocalDateISO() });
  };

  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.id) return;

    let currentMeds = formData.medications || [];
    if (tempMed.name && tempMed.dose) {
       currentMeds = [...currentMeds, tempMed];
    }
    const cleanedMeds = currentMeds.map(m => ({
      ...m,
      startDate: m.startDate || getLocalDateISO()
    }));
    const regDate = formData.registrationDate || getTodayDisplayDate();

    const finalPatient = {
        ...formData as Patient,
        medications: cleanedMeds,
        registrationDate: regDate,
        logs: view === 'edit' ? (patients.find(p => p.id === selectedPatientId)?.logs || []) : []
    };

    if (view === 'add') {
      onAddPatient(finalPatient);
      setView('list');
    } else if (view === 'edit') {
       onUpdatePatient(finalPatient);
       setView('detail');
    }
  };

  const renderForm = () => (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-3xl shadow-xl border-t-8 border-blue-600">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{view === 'add' ? 'Register New Patient' : 'Edit Patient Details'}</h2>
        <button onClick={() => setView(view === 'add' ? 'list' : 'detail')} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
      </div>
      <form onSubmit={handleSavePatient} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="block font-semibold text-gray-700 mb-1">Full Name</label><input type="text" required value={formData.name || ''} className="w-full p-3 border rounded-xl" onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div><label className="block font-semibold text-gray-700 mb-1">Mobile Number</label><input type="tel" required pattern="[0-9]{10}" disabled={view === 'edit'} value={formData.id || ''} className={`w-full p-3 border rounded-xl ${view === 'edit' ? 'bg-gray-100' : ''}`} onChange={e => setFormData({...formData, id: e.target.value})} /></div>
            <div><label className="block font-semibold text-gray-700 mb-1">Age</label><input type="number" required value={formData.age || ''} className="w-full p-3 border rounded-xl" onChange={e => setFormData({...formData, age: Number(e.target.value)})} /></div>
            <div><label className="block font-semibold text-gray-700 mb-1">Sex</label><select className="w-full p-3 border rounded-xl" value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value as any})}><option>Male</option><option>Female</option><option>Other</option></select></div>
            <div><label className="block font-semibold text-gray-700 mb-1">Occupation</label><input type="text" required value={formData.occupation || ''} className="w-full p-3 border rounded-xl" onChange={e => setFormData({...formData, occupation: e.target.value})} /></div>
            <div><label className="block font-semibold text-gray-700 mb-1">Registration Date</label><input type="date" value={formData.registrationDate ? formData.registrationDate.split('/').reverse().join('-') : getLocalDateISO()} onChange={(e) => { const val = e.target.value; if(val) { const [y, m, d] = val.split('-'); setFormData({...formData, registrationDate: `${d}/${m}/${y}`}); }}} className="w-full p-3 border rounded-xl" /></div>
        </div>
        
        <div className="bg-blue-100 p-6 rounded-xl space-y-4 border-l-4 border-blue-500 shadow-sm">
            <h3 className="font-bold text-blue-800 text-lg">Clinical Diagnosis</h3>
            <div><label className="block font-semibold text-gray-700 mb-1">Diagnosis</label><select className="w-full p-3 border rounded-xl bg-white" value={formData.diagnosis} onChange={e => setFormData({...formData, diagnosis: e.target.value, ctdType: undefined, sarcoidosisStage: undefined})}>{DIAGNOSIS_LIST.map(d => <option key={d}>{d}</option>)}</select></div>
            {formData.diagnosis === "CTD-ILD" && (<div><label className="block font-semibold text-gray-700 mb-1">CTD Subtype</label><select className="w-full p-3 border rounded-xl bg-white" value={formData.ctdType || ''} onChange={e => setFormData({...formData, ctdType: e.target.value})}><option value="">Select Subtype</option>{CTD_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>)}
            {formData.diagnosis === "Sarcoidosis" && (<div><label className="block font-semibold text-gray-700 mb-1">Sarcoidosis Stage</label><select className="w-full p-3 border rounded-xl bg-white" value={formData.sarcoidosisStage || ''} onChange={e => setFormData({...formData, sarcoidosisStage: e.target.value})}><option value="">Select Stage</option>{SARCOIDOSIS_STAGES.map(s => <option key={s}>{s}</option>)}</select></div>)}
            <div><label className="block font-semibold text-gray-700 mb-1">Fibrotic ILD?</label><select className="w-full p-3 border rounded-xl bg-white" value={formData.fibroticIld || 'No'} onChange={e => setFormData({...formData, fibroticIld: e.target.value as 'Yes' | 'No'})}><option value="No">No</option><option value="Yes">Yes</option></select></div>
            <div className="relative" ref={dropdownRef}><label className="block font-semibold text-gray-700 mb-1">Co-morbidities</label><button type="button" onClick={() => setIsCoMorbidityDropdownOpen(!isCoMorbidityDropdownOpen)} className="w-full p-3 border rounded-xl bg-white text-left flex justify-between items-center"><span className="truncate">{formData.coMorbidities?.length ? formData.coMorbidities.join(', ') : "Select Co-morbidities (or None)"}</span>{isCoMorbidityDropdownOpen ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</button>{isCoMorbidityDropdownOpen && (<div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto p-2">{CO_MORBIDITIES_LIST.map((item) => (<label key={item} className="flex items-center gap-3 p-2 hover:bg-blue-50 cursor-pointer"><input type="checkbox" checked={(formData.coMorbidities || []).includes(item)} onChange={() => handleToggleCoMorbidity(item)} className="w-5 h-5"/><span className="text-gray-700">{item}</span></label>))}</div>)}</div>
            {formData.coMorbidities?.includes('Others') && (<div><label className="block font-semibold text-gray-700 mb-1">Specify Other</label><input type="text" value={formData.otherCoMorbidity || ''} onChange={(e) => setFormData({...formData, otherCoMorbidity: e.target.value})} className="w-full p-3 border rounded-xl"/></div>)}
        </div>
        
        <div className="bg-green-100 p-6 rounded-xl border-l-4 border-green-500 shadow-sm"><h3 className="font-bold text-green-800 mb-3 text-lg">Pulmonary Function Tests</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div><label className="text-xs font-bold text-green-700">FEV1/FVC (%)</label><input type="number" step="0.01" value={formData.pft?.fev1_fvc || ''} className="w-full p-2 rounded border bg-white" onChange={e => setFormData(prev => ({...prev, pft: {...prev.pft!, fev1_fvc: Number(e.target.value)}}))} /></div><div><label className="text-xs font-bold text-green-700">FEV1 (L)</label><input type="number" step="0.01" value={formData.pft?.fev1 || ''} className="w-full p-2 rounded border bg-white" onChange={e => setFormData(prev => ({...prev, pft: {...prev.pft!, fev1: Number(e.target.value)}}))} /></div><div><label className="text-xs font-bold text-green-700">FVC (L)</label><input type="number" step="0.01" value={formData.pft?.fvc || ''} className="w-full p-2 rounded border bg-white" onChange={e => setFormData(prev => ({...prev, pft: {...prev.pft!, fvc: Number(e.target.value)}}))} /></div><div><label className="text-xs font-bold text-green-700">DLCO (%)</label><input type="number" step="0.01" value={formData.pft?.dlco || ''} className="w-full p-2 rounded border bg-white" onChange={e => setFormData(prev => ({...prev, pft: {...prev.pft!, dlco: Number(e.target.value)}}))} /></div><div><label className="text-xs font-bold text-green-700">6MWD (m)</label><input type="number" step="0.01" value={formData.pft?.six_mwd || ''} className="w-full p-2 rounded border bg-white" onChange={e => setFormData(prev => ({...prev, pft: {...prev.pft!, six_mwd: Number(e.target.value)}}))} /></div><div><label className="text-xs font-bold text-green-700">Min SpO2</label><input type="number" step="0.01" value={formData.pft?.min_spo2 || ''} className="w-full p-2 rounded border bg-white" onChange={e => setFormData(prev => ({...prev, pft: {...prev.pft!, min_spo2: Number(e.target.value)}}))} /></div><div><label className="text-xs font-bold text-green-700">Max SpO2</label><input type="number" step="0.01" value={formData.pft?.max_spo2 || ''} className="w-full p-2 rounded border bg-white" onChange={e => setFormData(prev => ({...prev, pft: {...prev.pft!, max_spo2: Number(e.target.value)}}))} /></div></div></div>
        
        <div className="bg-purple-100 p-6 rounded-xl border-l-4 border-purple-500 shadow-sm">
          <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2 text-lg"><Calendar size={20} /> Medication History</h3>
          <div className="space-y-2 mb-4">
            {formData.medications?.map((m, i) => (
              <div key={i} className={`flex flex-col gap-2 p-3 rounded text-sm border ${m.endDate ? 'bg-gray-200' : 'bg-white'}`}>
                  <div className="flex flex-col md:flex-row gap-2 items-center">
                    <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-3 gap-2">
                        <div className="flex flex-col">
                           <label className="text-[10px] text-gray-500">Drug</label>
                           <select className="p-1 border rounded bg-white" value={getMedicationDropdownValue(m.name)} onChange={(e) => updateMedListItem(i, { name: e.target.value === 'Other' ? '' : e.target.value })}><option value="">Select Drug</option>{MEDICATION_LIST.map(drug => <option key={drug} value={drug}>{drug}</option>)}</select>
                           {getMedicationDropdownValue(m.name) === 'Other' && <input className="p-1 border rounded mt-1 uppercase" placeholder="NAME" value={m.name} onChange={(e) => updateMedListItem(i, { name: e.target.value.toUpperCase() })}/>}
                        </div>
                        <div className="flex flex-col"><label className="text-[10px] text-gray-500">Dose</label><input value={m.dose} onChange={(e) => updateMedListItem(i, { dose: e.target.value })} className="p-1 border rounded" /></div>
                        <div className="flex flex-col"><label className="text-[10px] text-gray-500">Freq</label><select value={m.frequency} onChange={(e) => updateMedListItem(i, { frequency: e.target.value })} className="p-1 border rounded bg-white"><option value="">Freq</option>{FREQUENCY_LIST.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                    </div>
                    <div className="flex gap-2 items-center">
                        <div className="flex flex-col"><span className="text-[10px] text-gray-500">Start</span><input type="date" value={m.startDate || ''} onChange={(e) => updateMedListItem(i, { startDate: e.target.value })} className="p-1 border rounded w-24"/></div>
                        <div className="flex flex-col"><span className="text-[10px] text-gray-500">End</span><input type="date" value={m.endDate || ''} onChange={(e) => updateMedListItem(i, { endDate: e.target.value })} className="p-1 border rounded w-24"/></div>
                        <button type="button" onClick={() => handleRemoveMedication(i)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14}/></button>
                    </div>
                  </div>
                  {isComplexFrequency(m.frequency) && (<div className="flex gap-4 bg-indigo-50 p-2 rounded"><div className="flex flex-col"><label className="text-[10px] text-indigo-800">Dose # (1-20)</label><select value={m.doseNumber || ''} onChange={e => updateMedListItem(i, { doseNumber: Number(e.target.value) })} className="p-1 border rounded"><option value="">#</option>{Array.from({length:20}, (_,k) => <option key={k+1} value={k+1}>{k+1}</option>)}</select></div><div className="flex flex-col"><label className="text-[10px] text-indigo-800">Date</label><input type="date" value={m.dosageDate || ''} onChange={e => updateMedListItem(i, { dosageDate: e.target.value })} className="p-1 border rounded"/></div></div>)}
              </div>
            ))}
          </div>

          <div className="border-t pt-3 border-purple-200">
              <label className="text-xs block text-purple-700 font-bold mb-2">Add New Medication</label>
              <div className="flex flex-col gap-2">
                 <div className="flex flex-col md:flex-row gap-2">
                    <div className="flex-1 flex flex-col">
                       <label className="text-[10px] text-gray-500">Drug</label>
                       <select className="w-full p-2 rounded border text-sm bg-white" value={getMedicationDropdownValue(tempMed.name)} onChange={e => setTempMed({...tempMed, name: e.target.value === 'Other' ? '' : e.target.value})}><option value="">Select Drug</option>{MEDICATION_LIST.map(d => <option key={d} value={d}>{d}</option>)}</select>
                       {getMedicationDropdownValue(tempMed.name) === 'Other' && <input className="w-full p-2 rounded border text-sm mt-1 uppercase border-purple-300" placeholder="TYPE NAME" value={tempMed.name} onChange={e => setTempMed({...tempMed, name: e.target.value.toUpperCase()})}/>}
                    </div>
                    <div className="w-24"><label className="text-[10px] text-gray-500">Dose</label><input placeholder="Dose" value={tempMed.dose} onChange={e => setTempMed({...tempMed, dose: e.target.value})} className="w-full p-2 rounded border text-sm"/></div>
                    <div className="w-32"><label className="text-[10px] text-gray-500">Freq</label><select className="w-full p-2 rounded border text-sm bg-white" value={tempMed.frequency} onChange={e => setTempMed({...tempMed, frequency: e.target.value})}><option value="">Freq</option>{FREQUENCY_LIST.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                    <div className="w-32"><label className="text-[10px] text-gray-500">Start</label><input type="date" value={tempMed.startDate} onChange={e => setTempMed({...tempMed, startDate: e.target.value})} className="w-full p-2 rounded border text-sm"/></div>
                    <div className="flex gap-1 items-end"><button type="button" onClick={handleClearMedication} className="bg-gray-200 text-gray-600 p-2 rounded h-9 w-9 flex items-center justify-center hover:bg-gray-300"><RotateCcw size={16}/></button><button type="button" onClick={handleAddMedication} className="bg-purple-600 text-white p-2 rounded h-9 w-9 flex items-center justify-center hover:bg-purple-700"><Plus size={16}/></button></div>
                 </div>
                 {isComplexFrequency(tempMed.frequency) && (<div className="flex gap-4 bg-indigo-50 p-2 rounded animate-fade-in"><div className="flex flex-col"><label className="text-[10px] text-indigo-800">Dose #</label><select value={tempMed.doseNumber || ''} onChange={e => setTempMed({...tempMed, doseNumber: Number(e.target.value)})} className="p-1 border rounded w-20"><option value="">1-20</option>{Array.from({length:20}, (_,k) => <option key={k+1} value={k+1}>{k+1}</option>)}</select></div><div className="flex flex-col"><label className="text-[10px] text-indigo-800">Date</label><input type="date" value={tempMed.dosageDate || ''} onChange={e => setTempMed({...tempMed, dosageDate: e.target.value})} className="p-1 border rounded"/></div></div>)}
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
    const chartData = [...patient.logs].reverse().map(log => ({ date: log.date.slice(0,5), spo2_rest: log.spo2_rest, spo2_exertion: log.spo2_exertion, kbild: log.kbild_score }));

    return (
      <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6">
           <button onClick={() => setView('list')} className="text-blue-600 hover:underline flex items-center gap-1">&larr; Back</button>
           {/* DELETE BUTTON FIX: Added stopPropagation and confirm logic */}
           <button 
             onClick={(e) => {
               e.preventDefault();
               if(window.confirm(`Are you sure you want to PERMANENTLY delete patient ${patient.name}?`)) { 
                 onDeletePatient(patient.id); 
                 setView('list'); 
               } 
             }} 
             className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-100 transition flex items-center gap-2 shadow-sm"
           >
             <Trash2 size={18}/> Delete Patient
           </button>
        </div>
        
        <div className="bg-white rounded-3xl p-6 shadow-md border-l-4 border-blue-500 mb-6">
             <h2 className="text-3xl font-bold text-gray-800">{patient.name}</h2>
             <p className="text-gray-500">ID: {patient.id}</p>
             <p className="text-sm text-gray-600 mt-1 font-bold">Sex: {patient.sex} | Age: {patient.age}y</p>
             <div className="mt-4 flex gap-2"><button onClick={() => setView('edit')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Edit Profile</button></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-3xl shadow-md h-64"><h4 className="font-bold mb-2 text-gray-600">SpO2 Trend</h4><ResponsiveContainer><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date"/><YAxis domain={[80,100]}/><Tooltip/><Line type="monotone" dataKey="spo2_rest" stroke="#10b981"/><Line type="monotone" dataKey="spo2_exertion" stroke="#ef4444"/></LineChart></ResponsiveContainer></div>
          <div className="bg-white p-6 rounded-3xl shadow-md h-64"><h4 className="font-bold mb-2 text-gray-600">KBILD Trend</h4><ResponsiveContainer><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date"/><YAxis domain={[0,100]}/><Tooltip/><Line type="monotone" dataKey="kbild" stroke="#f59e0b"/></LineChart></ResponsiveContainer></div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-md">
          <h3 className="text-xl font-bold mb-4 text-gray-700">Recent Logs</h3>
          <table className="w-full text-left">
            <thead><tr className="border-b text-gray-500 text-sm"><th className="pb-2">Date</th><th className="pb-2">Alerts</th><th className="pb-2">SpO2</th><th className="pb-2">mMRC</th><th className="pb-2">Symptoms</th></tr></thead>
            <tbody>
              {patient.logs.map((log: HealthLog) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="py-3">{log.date} <span className="text-xs text-gray-400 block">{log.time}</span></td>
                  <td className="py-3 text-red-600 text-xs font-bold">{log.alerts.join(", ")}</td>
                  <td className="py-3">{log.spo2_rest}/{log.spo2_exertion}</td>
                  <td className="py-3">{log.mmrc_grade}</td>
                  <td className="py-3 text-xs">{Object.entries(log.vas).filter(([k,v]) => v>5).map(([k,v])=>`${k}(${v})`).join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-sky-50 pb-10">
      <header className="bg-white shadow-sm p-6 mb-8"><div className="max-w-7xl mx-auto flex justify-between items-center"><h1 className="text-2xl font-bold text-gray-800">Doctor Dashboard</h1><button onClick={onLogout} className="text-gray-500 hover:text-red-500">Logout</button></div></header>
      <main className="max-w-7xl mx-auto px-6">
        {view === 'list' && (
          <>
            <div className="flex justify-between mb-8">
              <input type="text" placeholder="Search..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="p-3 rounded border w-96"/>
              <div className="flex gap-2">
                <button onClick={handleExportCSV} className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2"><Download size={16}/> Export</button>
                <button onClick={()=>setView('add')} className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2"><Plus size={16}/> Add Patient</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {getFilteredPatients().map(p=>(
                <div key={p.id} onClick={()=>{setSelectedPatientId(p.id);setView('detail')}} className="bg-white p-6 rounded-xl shadow-sm cursor-pointer border-l-4 border-blue-400 hover:shadow-md transition relative group"> 
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{p.name}</h3>
                      <p className="text-gray-500 text-sm">{p.diagnosis}</p>
                      <p className="text-gray-400 text-xs mt-1 font-semibold">{p.sex}, {p.age}y</p>
                    </div>
                    {/* LIST VIEW DELETE BUTTON */}
                    <button 
                      onClick={(e)=>{
                        e.stopPropagation(); 
                        if(window.confirm(`Are you sure you want to delete ${p.name}?`)) onDeletePatient(p.id);
                      }} 
                      className="text-gray-300 hover:text-red-500 p-2 transition-colors"
                      title="Delete Patient"
                    >
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {(view === 'add' || view === 'edit') && renderForm()}
        {view === 'detail' && renderDetailView()}
      </main>
    </div>
  );
};

export default DoctorDashboard;
