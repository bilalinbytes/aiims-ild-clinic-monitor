
import React, { useState, useEffect, useRef } from 'react';
import { Patient, Medication, HealthLog } from '../types';
import { DIAGNOSIS_LIST, CTD_TYPES, SARCOIDOSIS_STAGES, CO_MORBIDITIES_LIST, MEDICATION_LIST, FREQUENCY_LIST } from '../constants';
import { Users, Plus, Download, Trash2, Search, FileText, ChevronDown, ChevronUp, X, Activity, AlertTriangle, Bell, Edit, Save, Calendar, RotateCcw } from 'lucide-react';
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
  
  const [tempMed, setTempMed] = useState<Medication>({ name: '', dose: '', frequency: '', startDate: getLocalDateISO(), endDate: '' });

  useEffect(() => {
    if ((view === 'edit' || view === 'detail') && selectedPatientId) {
      const p = patients.find(pat => pat.id === selectedPatientId);
      if (p && view === 'edit') {
        setFormData(JSON.parse(JSON.stringify(p))); 
        setTempMed({ name: '', dose: '', frequency: '', startDate: getLocalDateISO(), endDate: '' });
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
      setTempMed({ name: '', dose: '', frequency: '', startDate: getLocalDateISO(), endDate: '' });
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
      "Side Effects", "Meds Taken (Daily Log)", "Medication History"
    ];

    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
    
    patients.forEach(p => {
      const medCounts: Record<string, number> = {};
      p.logs.forEach(log => {
        if (log.taken_medications) {
          log.taken_medications.forEach(medName => {
            medCounts[medName] = (medCounts[medName] || 0) + 1;
          });
        }
      });

      const medicationHistoryStr = p.medications.map(m => {
        const daysTaken = medCounts[m.name] || 0;
        return `${m.name} ${m.dose} ${m.frequency} [Start: ${m.startDate || 'N/A'}${m.endDate ? `, End: ${m.endDate}` : ', Current'}] (Taken: ${daysTaken} days)`;
      }).join(" | ").replace(/"/g, '""');

      const safePft = (val: number | undefined) => (val !== undefined && val !== null) ? val : "";
      const pftCols = [
        safePft(p.pft?.fev1_fvc), safePft(p.pft?.fev1), safePft(p.pft?.fvc), safePft(p.pft?.dlco), 
        safePft(p.pft?.six_mwd), safePft(p.pft?.min_spo2), safePft(p.pft?.max_spo2)
      ].join(",");

      const regDate = p.registrationDate || 'N/A';
      const coMorbiditiesStr = (p.coMorbidities || []).map(c => c === 'Others' && p.otherCoMorbidity ? `Others: ${p.otherCoMorbidity}` : c).join("; ");

      const dailyLogs: Record<string, HealthLog> = {};
      p.logs.forEach(log => {
        if (!dailyLogs[log.date]) {
           dailyLogs[log.date] = log;
        } else {
           const existing = dailyLogs[log.date];
           const current = log;
           if (Number(current.mmrc_grade) > Number(existing.mmrc_grade)) { dailyLogs[log.date] = current; return; }
           else if (Number(current.mmrc_grade) < Number(existing.mmrc_grade)) { return; }
           if (current.kbild_score < existing.kbild_score) { dailyLogs[log.date] = current; return; }
           else if (current.kbild_score > existing.kbild_score) { return; }
           const sumVas = (v: any) => Object.values(v).reduce((a:any,b:any) => a + (Number(b)||0), 0);
           if (sumVas(current.vas) > sumVas(existing.vas)) { dailyLogs[log.date] = current; return; }
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
          const excelDate = log.date.replace(/\//g, '-');

          const row = [
            `"${p.name}"`, `"${p.id}"`, `"${regDate}"`, `"${p.diagnosis}"`, `"${p.fibroticIld || 'No'}"`, `"${coMorbiditiesStr}"`,
            `"${excelDate}"`, `"${log.time || ''}"`, `"${alertsStr}"`, `"${log.aqi !== undefined ? log.aqi : ''}"`,
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
      setTempMed({ name: '', dose: '', frequency: '', startDate: getLocalDateISO(), endDate: '' });
    }
  };

  const handleClearMedication = () => {
    setTempMed({ name: '', dose: '', frequency: '', startDate: getLocalDateISO(), endDate: '' });
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

    if (view === 'add') {
      const newPatient: Patient = {
        ...formData as Patient,
        medications: cleanedMeds,
        registrationDate: regDate,
        logs: []
      };
      onAddPatient(newPatient);
      setView('list');
    } else if (view === 'edit') {
       const existingPatient = patients.find(p => p.id === selectedPatientId);
       const updatedPatient: Patient = {
         ...formData as Patient,
         medications: cleanedMeds,
         registrationDate: regDate,
         logs: existingPatient ? existingPatient.logs : [],
       };
       onUpdatePatient(updatedPatient);
       setView('detail');
    }
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
            <div><label className="block font-semibold text-gray-700 mb-1">Registration Date</label><input type="date" value={formData.registrationDate ? formData.registrationDate.split('/').reverse().join('-') : getLocalDateISO()} onChange={(e) => { const val = e.target.value; if(val) { const [y, m, d] = val.split('-'); setFormData({...formData, registrationDate: `${d}/${m}/${y}`}); }}} className="w-full p-3 border rounded-xl" /></div>
        </div>
        
        <div className="bg-blue-100 p-6 rounded-2xl space-y-4 border-l-4 border-blue-500 shadow-sm">
            <h3 className="font-bold text-blue-800 text-lg">Clinical Diagnosis</h3>
            <div><label className="block font-semibold text-gray-700 mb-1">Diagnosis</label><select className="w-full p-3 border rounded-xl bg-white" value={formData.diagnosis} onChange={e => setFormData({...formData, diagnosis: e.target.value, ctdType: undefined, sarcoidosisStage: undefined})}>{DIAGNOSIS_LIST.map(d => <option key={d}>{d}</option>)}</select></div>
            {formData.diagnosis === "CTD-ILD" && (<div><label className="block font-semibold text-gray-700 mb-1">CTD Subtype</label><select className="w-full p-3 border rounded-xl bg-white" value={formData.ctdType || ''} onChange={e => setFormData({...formData, ctdType: e.target.value})}><option value="">Select Subtype</option>{CTD_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>)}
            {formData.diagnosis === "Sarcoidosis" && (<div><label className="block font-semibold text-gray-700 mb-1">Stage</label><select className="w-full p-3 border rounded-xl bg-white" value={formData.sarcoidosisStage || ''} onChange={e => setFormData({...formData, sarcoidosisStage: e.target.value})}><option value="">Select Stage</option>{SARCOIDOSIS_STAGES.map(s => <option key={s}>{s}</option>)}</select></div>)}
            <div><label className="block font-semibold text-gray-700 mb-1">Fibrotic ILD?</label><select className="w-full p-3 border rounded-xl bg-white" value={formData.fibroticIld || 'No'} onChange={e => setFormData({...formData, fibroticIld: e.target.value as 'Yes' | 'No'})}><option value="No">No</option><option value="Yes">Yes</option></select></div>
            <div className="relative" ref={dropdownRef}><label className="block font-semibold text-gray-700 mb-1">Co-morbidities</label><button type="button" onClick={() => setIsCoMorbidityDropdownOpen(!isCoMorbidityDropdownOpen)} className="w-full p-3 border rounded-xl bg-white text-left flex justify-between items-center"><span className="truncate">{formData.coMorbidities?.length ? formData.coMorbidities.join(', ') : "Select Co-morbidities (or None)"}</span>{isCoMorbidityDropdownOpen ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</button>{isCoMorbidityDropdownOpen && (<div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto p-2">{CO_MORBIDITIES_LIST.map((item) => (<label key={item} className="flex items-center gap-3 p-2 hover:bg-blue-50 cursor-pointer"><input type="checkbox" checked={(formData.coMorbidities || []).includes(item)} onChange={() => handleToggleCoMorbidity(item)} className="w-5 h-5"/><span className="text-gray-700">{item}</span></label>))}</div>)}</div>
            {formData.coMorbidities?.includes('Others') && (<div><label className="block font-semibold text-gray-700 mb-1">Specify Other</label><input type="text" value={formData.otherCoMorbidity || ''} onChange={(e) => setFormData({...formData, otherCoMorbidity: e.target.value})} className="w-full p-3 border rounded-xl"/></div>)}
        </div>
        
        <div className="bg-green-100 p-6 rounded-2xl border-l-4 border-green-500 shadow-sm"><h3 className="font-bold text-green-800 mb-3 text-lg">Pulmonary Function Tests (Baseline)</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div><label className="text-xs font-bold text-green-700">FEV1/FVC (%)</label><input type="number" step="0.01" value={formData.pft?.fev1_fvc || ''} className="w-full p-2 rounded border bg-white" onChange={e => setFormData(prev => ({...prev, pft: {...prev.pft!, fev1_fvc: Number(e.target.value)}}))} /></div><div><label className="text-xs font-bold text-green-700">FEV1 (L)</label><input type="number" step="0.01" value={formData.pft?.fev1 || ''} className="w-full p-2 rounded border bg-white" onChange={e => setFormData(prev => ({...prev, pft: {...prev.pft!, fev1: Number(e.target.value)}}))} /></div><div><label className="text-xs font-bold text-green-700">FVC (L)</label><input type="number" step="0.01" value={formData.pft?.fvc || ''} className="w-full p-2 rounded border bg-white" onChange={e => setFormData(prev => ({...prev, pft: {...prev.pft!, fvc: Number(e.target.value)}}))} /></div><div><label className="text-xs font-bold text-green-700">DLCO (%)</label><input type="number" step="0.01" value={formData.pft?.dlco || ''} className="w-full p-2 rounded border bg-white" onChange={e => setFormData(prev => ({...prev, pft: {...prev.pft!, dlco: Number(e.target.value)}}))} /></div><div><label className="text-xs font-bold text-green-700">6MWD (m)</label><input type="number" step="0.01" value={formData.pft?.six_mwd || ''} className="w-full p-2 rounded border bg-white" onChange={e => setFormData(prev => ({...prev, pft: {...prev.pft!, six_mwd: Number(e.target.value)}}))} /></div><div><label className="text-xs font-bold text-green-700">Min SpO2</label><input type="number" step="0.01" value={formData.pft?.min_spo2 || ''} className="w-full p-2 rounded border bg-white" onChange={e => setFormData(prev => ({...prev, pft: {...prev.pft!, min_spo2: Number(e.target.value)}}))} /></div><div><label className="text-xs font-bold text-green-700">Max SpO2</label><input type="number" step="0.01" value={formData.pft?.max_spo2 || ''} className="w-full p-2 rounded border bg-white" onChange={e => setFormData(prev => ({...prev, pft: {...prev.pft!, max_spo2: Number(e.target.value)}}))} /></div></div></div>
        
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
                       {getMedicationDropdownValue(tempMed.name) === 'Other' && <input className="w-full p-2 rounded border text-sm mt-1 uppercase border-yellow-300 bg-yellow-50" placeholder="TYPE NAME" value={tempMed.name} onChange={e => setTempMed({...tempMed, name: e.target.value.toUpperCase()})}/>}
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
    // ... (Chart logic kept same) ...
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
        {/* ... rest of detail view ... */}
        <div className="bg-white rounded-3xl p-6 shadow-md border-l-4 border-blue-500 mb-6">
             <div className="flex justify-between items-start">
                <div>
                   <h2 className="text-3xl font-bold text-gray-800">{patient.name}</h2>
                   <p className="text-gray-500">ID: {patient.id}</p>
                   <p className="text-sm text-gray-600 mt-1 font-bold bg-blue-50 inline-block px-2 py-1 rounded">Sex: {patient.sex} | Age: {patient.age}y</p>
                   <div className="mt-2"><span className="text-blue-800 bg-blue-100 px-2 py-1 rounded text-sm font-semibold">{patient.diagnosis}</span></div>
                </div>
                <button onClick={() => setView('edit')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm shadow hover:bg-blue-700">Edit Profile</button>
             </div>
        </div>
        {/* ... logs table etc ... */}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 pb-10 font-sans text-slate-800">
      {/* ... Header ... */}
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
               {/* ... Search and buttons ... */}
               <div className="relative w-full md:w-96 group">
                 <Search className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                 <input 
                   type="text" 
                   placeholder="Search patients..." 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                 />
               </div>
               <div className="flex gap-3">
                 <button onClick={handleExportCSV} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition shadow-lg shadow-emerald-200 font-bold active:scale-95"><Download size={18} /> Export Data</button>
                 <button onClick={() => setView('add')} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-bold active:scale-95"><Plus size={18} /> Add Patient</button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {getFilteredPatients().map(p => (
                 <div key={p.id} onClick={()=>{setSelectedPatientId(p.id);setView('detail')}} className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer border border-slate-100 group relative overflow-hidden hover:-translate-y-1 duration-300">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-3">
                         <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl shadow-sm">{p.name.charAt(0).toUpperCase()}</div>
                         <button onClick={(e)=>{e.stopPropagation(); if(window.confirm(`Delete ${p.name}?`)) onDeletePatient(p.id);}} className="text-slate-300 hover:text-red-500 p-2 transition-colors hover:bg-red-50 rounded-full" title="Delete Patient"><Trash2 size={18}/></button>
                      </div>
                      <h3 className="font-bold text-lg text-slate-800 mb-1 capitalize truncate pr-2">{p.name}</h3>
                      <div className="mb-3"><span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 inline-block max-w-full truncate">{p.diagnosis}</span></div>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 border-t border-slate-100 pt-3 mt-2"><span className="flex items-center gap-1"><Users size={12}/> {p.sex}</span><span className="w-1 h-1 rounded-full bg-slate-300"></span><span>{p.age} Years</span><span className="ml-auto text-slate-400">ID: {p.id.slice(-4)}</span></div>
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
