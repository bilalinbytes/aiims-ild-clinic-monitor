import React, { useState, useEffect, useMemo } from 'react';
import { Patient, HealthLog } from '../types';
import { KBILD_QUESTIONS, MMRC_GRADES, SIDE_EFFECTS, KBILD_OPTIONS, SYMPTOMS_HINDI } from '../constants';
import { AlertTriangle, CheckCircle, History, Activity, HeartPulse, Pill, Thermometer, Smile, CloudFog, Calendar, RotateCw, PlusCircle, Clock, ArrowLeft, TrendingUp, Edit2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PatientDashboardProps {
  patient: Patient;
  onUpdatePatient: (updatedPatient: Patient) => void;
  onLogout: () => void;
}

const VAS_COLORS: Record<string, { label: string; bg: string }> = {
  cough: { label: 'text-red-600', bg: 'accent-red-500' },
  expectoration: { label: 'text-orange-600', bg: 'accent-orange-500' },
  breathlessness: { label: 'text-blue-600', bg: 'accent-blue-500' },
  chest_pain: { label: 'text-purple-600', bg: 'accent-purple-500' },
  hemoptysis: { label: 'text-red-800', bg: 'accent-red-700' },
  fever: { label: 'text-rose-500', bg: 'accent-rose-500' },
  ctd_symptoms: { label: 'text-indigo-600', bg: 'accent-indigo-500' },
};

const THEMES = {
  VITALS: { border: 'border-pink-400', icon: 'text-pink-500', bg: 'bg-pink-50' },
  MMRC: { border: 'border-blue-400', icon: 'text-blue-500', bg: 'bg-blue-50' },
  MEDS: { border: 'border-purple-400', icon: 'text-purple-500', bg: 'bg-purple-50' },
  VAS: { border: 'border-orange-400', icon: 'text-orange-500', bg: 'bg-orange-50' },
  KBILD: { border: 'border-yellow-400', icon: 'text-yellow-500', bg: 'bg-yellow-50' },
};

const PatientDashboard: React.FC<PatientDashboardProps> = ({ patient, onUpdatePatient, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'entry' | 'history' | 'trends'>('entry');
  const [selectedSymptomTrend, setSelectedSymptomTrend] = useState<string>('breathlessness');
  
  const getTodayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const getCurrentTimeForInput = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatTime12Hour = (time24: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  const toISODate = (dateStr: string) => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateStr;
  };

  const formatDateToDisplay = (isoDate: string) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayISO());
  const [logTime, setLogTime] = useState<string>(getCurrentTimeForInput());
  const selectedDateDisplay = formatDateToDisplay(selectedDate);

  const dailyLogs = useMemo(() => {
    return patient.logs
      .filter(log => log.date === selectedDateDisplay)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [patient.logs, selectedDateDisplay]);

  const submissionCount = dailyLogs.length;
  const canSubmitMore = submissionCount < 2;
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  useEffect(() => {
    if (submissionCount === 0) {
      setIsFormOpen(true);
      setLogTime(getCurrentTimeForInput());
    } else {
      setIsFormOpen(false);
    }
  }, [submissionCount, selectedDate]);

  const previousLog = useMemo(() => {
    if (dailyLogs.length > 0) return dailyLogs[0];
    const pastLogs = patient.logs.filter(log => toISODate(log.date) < selectedDate);
    pastLogs.sort((a, b) => b.timestamp - a.timestamp);
    return pastLogs.length > 0 ? pastLogs[0] : null;
  }, [patient.logs, selectedDate, dailyLogs]);

  const [spo2Rest, setSpo2Rest] = useState<string>('');
  const [spo2Exertion, setSpo2Exertion] = useState<string>('');
  const [mmrc, setMmrc] = useState<string>(MMRC_GRADES[0].value);
  const [kbildResponses, setKbildResponses] = useState<Record<number, number>>({});
  const [takenMeds, setTakenMeds] = useState<string[]>([]);
  const [vasScores, setVasScores] = useState<HealthLog['vas']>({
    cough: 0, expectoration: 0, breathlessness: 0, chest_pain: 0, hemoptysis: 0, fever: 0, ctd_symptoms: 0
  });
  const [selectedSideEffects, setSelectedSideEffects] = useState<string[]>([]);
  const [currentAQI, setCurrentAQI] = useState<number | null>(null);
  const [aqiLoading, setAqiLoading] = useState(false);
  const [locationError, setLocationError] = useState<string>('');

  const fetchAQI = () => {
    if (!("geolocation" in navigator)) { setLocationError("N/A"); return; }
    setAqiLoading(true);
    setLocationError('');
    setCurrentAQI(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&current=us_aqi`);
          const data = await res.json();
          if (data.current?.us_aqi !== undefined) setCurrentAQI(data.current.us_aqi);
          else setLocationError("Unavailable");
        } catch { setLocationError("Error"); } 
        finally { setAqiLoading(false); }
      },
      () => { setAqiLoading(false); setLocationError("Denied"); },
      { timeout: 10000 }
    );
  };

  useEffect(() => {
    if (submissionCount === 0 && selectedDate === getTodayISO() && !currentAQI) fetchAQI();
  }, [submissionCount, selectedDate]);

  const resetForm = () => {
    setSpo2Rest(''); setSpo2Exertion(''); setTakenMeds([]); setSelectedSideEffects([]);
    setKbildResponses({});
    setVasScores({ cough: 0, expectoration: 0, breathlessness: 0, chest_pain: 0, hemoptysis: 0, fever: 0, ctd_symptoms: 0 });
    setLogTime(getCurrentTimeForInput());
    setEditingLogId(null);
  };

  const handleVasChange = (key: keyof HealthLog['vas'], value: string) => {
    setVasScores(prev => ({
      ...prev,
      [key]: Number(value)
    }));
  };

  const handleAddSecondEntry = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleEditLog = (log: HealthLog) => {
    if (log.isEdited) {
      alert("This entry has already been edited once.");
      return;
    }
    setSpo2Rest(String(log.spo2_rest));
    setSpo2Exertion(String(log.spo2_exertion));
    setMmrc(log.mmrc_grade);
    setKbildResponses(log.kbild_responses);
    setTakenMeds(log.taken_medications);
    setVasScores(log.vas);
    setSelectedSideEffects(log.side_effects);
    
    setLogTime(getCurrentTimeForInput()); // Keep current time for edit metadata if desired, or parse from log.time
    
    setEditingLogId(log.id);
    setIsFormOpen(true);
  };

  const currentKbildSum = (Object.values(kbildResponses) as number[]).reduce((a, b) => a + b, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitMore && !editingLogId) return; 

    const rest = Number(spo2Rest);
    const exert = Number(spo2Exertion);
    const alerts: string[] = [];
    if (rest - exert > 5) alerts.push("SpO2 drop > 5%");
    if (vasScores.fever > 0 || selectedSideEffects.some(e => e.toLowerCase().includes('fever') || e.includes('बुखार'))) alerts.push("Fever detected");

    if (Object.keys(kbildResponses).length < KBILD_QUESTIONS.length) { alert("Please answer all KBILD questions"); return; }

    const newLogData: HealthLog = {
      id: editingLogId || Date.now().toString() + Math.random().toString().slice(2,6),
      date: selectedDateDisplay,
      time: formatTime12Hour(logTime),
      timestamp: Date.now(),
      spo2_rest: rest,
      spo2_exertion: exert,
      aqi: currentAQI || undefined,
      mmrc_grade: mmrc,
      kbild_score: currentKbildSum,
      kbild_responses: kbildResponses,
      taken_medications: takenMeds,
      vas: vasScores,
      side_effects: selectedSideEffects,
      alerts: alerts,
      isEdited: editingLogId ? true : false
    };

    let updatedLogs = [...patient.logs];
    if (editingLogId) {
      updatedLogs = updatedLogs.map(l => l.id === editingLogId ? newLogData : l);
    } else {
      updatedLogs = [newLogData, ...updatedLogs];
    }

    onUpdatePatient({ ...patient, logs: updatedLogs });
    if (editingLogId) {
       setEditingLogId(null);
       setIsFormOpen(false);
    }
  };

  const activeMedications = (patient.medications || []).filter(m => {
    const start = m.startDate || '0000-00-00';
    const end = m.endDate || '9999-99-99';
    return start <= selectedDate && end >= selectedDate;
  });

  const getAQIColor = (aqi: number) => {
    if(aqi<=50) return 'bg-green-100 text-green-800';
    if(aqi<=100) return 'bg-yellow-100 text-yellow-800';
    if(aqi<=150) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const renderEntryTab = () => {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-200 flex flex-col md:flex-row items-center gap-4">
           <div className="flex items-center gap-2 flex-1">
             <Calendar className="text-blue-500" size={20}/>
             <div><h3 className="text-sm font-bold text-blue-800">Date & Time</h3></div>
           </div>
           <div className="flex gap-2">
             <input type="date" max={getTodayISO()} value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="px-3 py-2 border rounded-lg text-gray-700"/>
             <input type="time" value={logTime} onChange={e=>setLogTime(e.target.value)} className="px-3 py-2 border rounded-lg text-gray-700"/>
           </div>
        </div>

        {!isFormOpen ? (
          <div className="bg-white rounded-3xl shadow-xl border border-green-200 max-w-md mx-auto overflow-hidden animate-fade-in">
             <div className="p-8 bg-green-50 flex flex-col items-center text-center border-b border-green-100">
                <CheckCircle size={48} className="text-green-600 mb-3"/>
                <h2 className="text-2xl font-bold text-green-800">Log Submitted</h2>
                <p className="text-green-700 text-sm">{submissionCount} entries for {selectedDateDisplay}</p>
             </div>
             <div className="p-6 space-y-4">
                {dailyLogs[0]?.alerts?.length > 0 && (
                  <div className="bg-red-50 p-3 rounded-lg text-sm text-red-800 border border-red-100">
                    <strong className="flex items-center gap-1"><AlertTriangle size={14}/> Alerts:</strong> {dailyLogs[0].alerts.join(', ')}
                  </div>
                )}
                <div className="bg-yellow-300 p-4 rounded-lg text-center font-bold text-yellow-900 text-xl shadow-sm border border-yellow-400">
                   KBILD Total Score: {dailyLogs[0]?.kbild_score}
                </div>
                <div className="flex flex-col gap-2 pt-2">
                   {/* Edit Option */}
                   {!dailyLogs[0].isEdited && (
                     <button onClick={() => handleEditLog(dailyLogs[0])} className="flex-1 border border-blue-300 text-blue-700 py-3 rounded-xl font-bold hover:bg-blue-50 transition flex items-center justify-center gap-2">
                        <Edit2 size={16}/> Edit Submission
                     </button>
                   )}

                   <div className="flex gap-2">
                     {canSubmitMore && (
                       <button onClick={handleAddSecondEntry} className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition flex items-center justify-center gap-2 shadow-md">
                         <PlusCircle size={18}/> Add Entry
                     </button>
                   )}
                     <button onClick={()=>setActiveTab('history')} className="flex-1 border-2 border-blue-100 text-blue-600 py-3 rounded-xl font-bold hover:bg-blue-50 transition">
                       History
                     </button>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingLogId ? "Editing Log" : (submissionCount>0?"Second Entry":"Daily Check-in")}
                </h2>
                {(submissionCount > 0 || editingLogId) && (
                  <button type="button" onClick={()=>{setIsFormOpen(false); setEditingLogId(null);}} className="text-sm text-gray-500 flex items-center gap-1"><ArrowLeft size={14}/> Cancel</button>
                )}
             </div>

             {selectedDate === getTodayISO() && !editingLogId && (
               <div className="bg-white p-4 rounded-2xl border border-indigo-200 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-2">
                    <CloudFog className="text-indigo-500"/>
                    <span className="font-bold text-gray-700">AQI: {currentAQI ?? (locationError || '...')}</span>
                  </div>
                  <button type="button" onClick={fetchAQI} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100">Refresh</button>
               </div>
             )}

             <div className={`bg-white p-6 rounded-3xl shadow-sm border-l-4 ${THEMES.VITALS.border} ${THEMES.VITALS.bg} border-gray-100`}>
               <h3 className={`font-bold ${THEMES.VITALS.icon} mb-4 flex gap-2 text-lg`}><HeartPulse/> Vitals</h3>
               <div className="grid grid-cols-2 gap-4">
                 <div><label className="block text-sm font-semibold mb-1 text-gray-600">Rest (Max)</label><input type="number" required step="0.1" value={spo2Rest} onChange={e=>setSpo2Rest(e.target.value)} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-pink-200 outline-none bg-white"/></div>
                 <div><label className="block text-sm font-semibold mb-1 text-gray-600">Exertion (Min)</label><input type="number" required step="0.1" value={spo2Exertion} onChange={e=>setSpo2Exertion(e.target.value)} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-pink-200 outline-none bg-white"/></div>
               </div>
             </div>

             <div className={`bg-white p-6 rounded-3xl shadow-sm border-l-4 ${THEMES.MMRC.border} ${THEMES.MMRC.bg} border-gray-100`}>
               <h3 className={`font-bold ${THEMES.MMRC.icon} mb-4 flex gap-2 text-lg`}><Activity/> mMRC Grade</h3>
               <div className="space-y-2">{MMRC_GRADES.map(g=>(<label key={g.value} className={`flex p-3 rounded-xl border cursor-pointer transition-all bg-white ${mmrc===g.value? 'ring-2 ring-blue-500 shadow-sm':'hover:bg-gray-50 border-gray-200'}`}><input type="radio" name="mmrc" value={g.value} checked={mmrc===g.value} onChange={e=>setMmrc(e.target.value)} className="mt-1"/><div className="ml-3"><p className="font-semibold text-sm text-gray-800">{g.en}</p><p className="text-xs text-gray-500">{g.hi}</p></div></label>))}</div>
             </div>

             <div className={`bg-white p-6 rounded-3xl shadow-sm border-l-4 ${THEMES.MEDS.border} ${THEMES.MEDS.bg} border-gray-100`}>
               <h3 className={`font-bold ${THEMES.MEDS.icon} mb-4 flex gap-2 text-lg`}><Pill/> Medications</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {activeMedications.length===0 && <p className="text-gray-400 text-sm italic">No active meds for this date.</p>}
                 {activeMedications.map(m=>(<label key={m.name} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all bg-white ${takenMeds.includes(m.name)?'ring-2 ring-purple-400 bg-purple-50':'hover:bg-gray-50'}`}><input type="checkbox" checked={takenMeds.includes(m.name)} onChange={()=>{setTakenMeds(p=>p.includes(m.name)?p.filter(x=>x!==m.name):[...p,m.name])}} className="w-5 h-5 text-purple-600 rounded"/><span className="text-sm font-bold text-gray-700">{m.name}</span></label>))}
               </div>
               <div className="mt-6 border-t border-purple-200 pt-4"><p className="text-sm font-bold mb-3 text-gray-600">Side Effects</p><div className="flex flex-wrap gap-2">{SIDE_EFFECTS.map(e=>(<button key={e} type="button" onClick={()=>setSelectedSideEffects(p=>p.includes(e)?p.filter(x=>x!==e):[...p,e])} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${selectedSideEffects.includes(e)?'bg-red-500 text-white shadow-md':'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>{e}</button>))}</div></div>
             </div>

             <div className={`bg-white p-6 rounded-3xl shadow-sm border-l-4 ${THEMES.VAS.border} ${THEMES.VAS.bg} border-gray-100`}>
               <h3 className={`font-bold ${THEMES.VAS.icon} mb-6 flex gap-2 text-lg`}><Thermometer/> Symptoms (1-10)</h3>
               <div className="space-y-6">
                 {(Object.keys(vasScores) as Array<keyof HealthLog['vas']>).map(key => {
                   const colors = VAS_COLORS[key as string] || { label: 'text-gray-700', bg: 'accent-blue-500' };
                   const hindiName = SYMPTOMS_HINDI[key as string] || "";
                   return (
                   <div key={String(key)} className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100">
                     <div className="flex justify-between mb-2 items-center">
                       <div className="flex items-center gap-2 flex-wrap">
                         <label className={`font-bold capitalize text-base ${colors.label}`}>
                           {String(key).replace('_',' ')} <span className="text-sm font-normal text-gray-500">({hindiName})</span>
                         </label>
                         {previousLog && (
                           <span className="text-[10px] bg-gray-800 text-white px-2 py-0.5 rounded-full font-bold tracking-wide shadow-sm">
                             PREV: {previousLog.vas[key]}
                           </span>
                         )}
                       </div>
                       <span className={`font-bold text-lg ${colors.label}`}>{vasScores[key]}</span>
                     </div>
                     <input type="range" min="0" max="10" value={vasScores[key]} onChange={e=>handleVasChange(key, e.target.value)} className={`w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer ${colors.bg}`} />
                     <div className="flex justify-between text-xs text-gray-400 mt-1 font-medium"><span>None</span><span>Severe</span></div>
                   </div>
                 )})}
               </div>
             </div>

             <div className={`bg-white p-6 rounded-3xl shadow-sm border-l-4 ${THEMES.KBILD.border} ${THEMES.KBILD.bg} border-gray-100`}>
               <h3 className={`font-bold ${THEMES.KBILD.icon} mb-4 flex gap-2 text-lg justify-between items-center`}>
                 <span><Smile size={20}/> Quality of Life (KBILD)</span>
                 <span className="bg-yellow-300 text-yellow-900 px-4 py-2 rounded-full text-lg font-bold shadow-sm">Total: {currentKbildSum}</span>
               </h3>
               <div className="space-y-6">
                 {KBILD_QUESTIONS.map(q => {
                   // Logic to find previous response for this question
                   const prevResponseVal = previousLog?.kbild_responses?.[String(q.id)]; // Changed to String cast
                   
                   return (
                   <div key={q.id} className="bg-white p-4 rounded-xl border border-yellow-200 shadow-sm">
                     <div className="mb-3">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs mr-2 font-bold">Q{q.id}</span>
                              <span className="font-bold text-sm text-gray-800">{q.textEn}</span>
                            </div>
                            {prevResponseVal && (
                               <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-bold whitespace-nowrap ml-2 border border-gray-300 shadow-sm">
                                 (Last: {prevResponseVal})
                               </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-8 italic">{q.textHi}</p>
                     </div>
                     <div className="space-y-2 ml-2">
                       {KBILD_OPTIONS[q.optionType].map(opt=>(
                         <label key={opt.val} className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors ${kbildResponses[q.id]===opt.val ? 'bg-yellow-100 ring-1 ring-yellow-300' : 'hover:bg-gray-50'}`}>
                           <input type="radio" name={`kbild-${q.id}`} checked={kbildResponses[q.id]===opt.val} onChange={()=>setKbildResponses(p=>({...p,[q.id]:opt.val}))} className="text-yellow-600 focus:ring-yellow-500 w-4 h-4"/>
                           <div className="flex flex-col">
                             <span className="text-sm text-gray-700 font-medium">
                               <span className="font-bold mr-1">{opt.val}.</span> {opt.label}
                               {prevResponseVal === opt.val && <span className="ml-2 text-xs font-bold text-blue-600 bg-blue-50 px-1 rounded">(Last Answer)</span>}
                             </span>
                             <span className="text-xs text-gray-500 ml-4">({opt.labelHi})</span>
                           </div>
                         </label>
                       ))}
                     </div>
                   </div>
                 )})}
               </div>
             </div>

             <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all text-lg">
               {editingLogId ? "Update Log" : "Submit Log"}
             </button>
          </form>
        )}
      </div>
    );
  };

  // ... (History and Trends tabs remain similar, ensuring they use updated types)

  const renderHistoryTab = () => (
    <div className="space-y-4 max-w-3xl mx-auto">
      {patient.logs.length === 0 && <p className="text-center text-gray-400 py-10">No history found.</p>}
      {patient.logs.map(log => (
        <div key={log.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition">
           <div>
             <div className="flex items-center gap-2 mb-1">
               <span className="font-bold text-gray-800 text-lg">{log.date}</span>
               <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{log.time}</span>
               {log.isEdited && <span className="text-[10px] text-orange-500 font-bold bg-orange-50 px-1 rounded">EDITED</span>}
             </div>
             <div className="text-sm text-gray-600 flex gap-4">
                <span>SpO2: <strong className="text-blue-600">{log.spo2_rest}</strong></span>
                <span>KBILD: <strong className="text-yellow-600">{log.kbild_score}</strong></span>
             </div>
           </div>
           {log.alerts.length > 0 && <div className="bg-red-50 p-2 rounded-full text-red-500" title={log.alerts.join(', ')}><AlertTriangle size={20}/></div>}
        </div>
      ))}
    </div>
  );

  const renderTrendsTab = () => {
    // Prepare data (chronological order)
    const sortedLogs = [...patient.logs].sort((a, b) => a.timestamp - b.timestamp);
    const chartData = sortedLogs.map(log => ({
      date: log.date.slice(0, 5), // Just DD/MM
      spo2_rest: log.spo2_rest,
      spo2_exertion: log.spo2_exertion,
      kbild: log.kbild_score,
      symptomScore: log.vas[selectedSymptomTrend as keyof typeof log.vas] || 0
    }));

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
         <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp className="text-blue-500"/> Health Trends</h2>
         
         {/* SpO2 Chart */}
         <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4">SpO2 Levels</h3>
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
         </div>

         {/* Symptom Chart */}
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
               </select>
            </div>
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
         </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10 font-sans">
      <header className="bg-white shadow-sm p-4 mb-6 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2"><HeartPulse className="text-teal-500"/> {patient.name}</h1>
          <button onClick={onLogout} className="text-sm text-gray-500 hover:text-red-500 font-medium">Logout</button>
        </div>
      </header>
      <main className="px-4">
        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-6 max-w-3xl mx-auto bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
           <button onClick={()=>setActiveTab('entry')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab==='entry'?'bg-blue-100 text-blue-700 shadow-sm':'text-gray-500 hover:bg-gray-50'}`}>Entry</button>
           <button onClick={()=>setActiveTab('history')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab==='history'?'bg-blue-100 text-blue-700 shadow-sm':'text-gray-500 hover:bg-gray-50'}`}>History</button>
           <button onClick={()=>setActiveTab('trends')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab==='trends'?'bg-blue-100 text-blue-700 shadow-sm':'text-gray-500 hover:bg-gray-50'}`}>Trends</button>
        </div>

        {activeTab === 'entry' && renderEntryTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'trends' && renderTrendsTab()}
      </main>
    </div>
  );
};

export default PatientDashboard;