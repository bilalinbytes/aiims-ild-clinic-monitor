
import React, { useState, useEffect } from 'react';
import { Patient, Role } from './types';
import DoctorDashboard from './components/DoctorDashboard';
import PatientDashboard from './components/PatientDashboard';
import { Stethoscope, User, Lock, HeartPulse, Activity } from 'lucide-react';

const App: React.FC = () => {
  const [role, setRole] = useState<Role>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loggedInPatient, setLoggedInPatient] = useState<Patient | null>(null);

  // Login State
  const [docId, setDocId] = useState('');
  const [docPass, setDocPass] = useState('');
  const [patientMobile, setPatientMobile] = useState('');
  const [loginError, setLoginError] = useState('');

  // Load data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('aiims_ild_patients');
    if (saved) {
      setPatients(JSON.parse(saved));
    }
  }, []);

  // Save data whenever patients change
  useEffect(() => {
    localStorage.setItem('aiims_ild_patients', JSON.stringify(patients));
  }, [patients]);

  const handleDoctorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (docId === 'doctor' && docPass === 'aiims123') {
      setRole('doctor');
      setLoginError('');
    } else {
      setLoginError('Invalid Doctor Credentials');
    }
  };

  const handlePatientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = patients.find(p => p.id === patientMobile);
    if (found) {
      setLoggedInPatient(found);
      setRole('patient');
      setLoginError('');
    } else {
      setLoginError('Mobile Number not found. Please contact your doctor.');
    }
  };

  const addPatient = (newPatient: Patient) => {
    setPatients(prev => [...prev, newPatient]);
  };

  const updatePatient = (updated: Patient) => {
    setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (loggedInPatient && loggedInPatient.id === updated.id) {
        setLoggedInPatient(updated);
    }
  };

  const deletePatient = (id: string) => {
    // Using functional state update to ensure reliability
    setPatients(prevPatients => prevPatients.filter(p => p.id !== id));
  };

  const logout = () => {
    setRole(null);
    setLoggedInPatient(null);
    setDocId('');
    setDocPass('');
    setPatientMobile('');
    setLoginError('');
  };

  if (!role) {
    return (
      // Updated to LIGHT and COLORFUL theme
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-blue-100 p-4 font-sans">
        <div className="w-full max-w-4xl bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/50">
          
          {/* Visual Side - Bright & Colorful */}
          <div className="w-full md:w-1/2 bg-gradient-to-br from-cyan-400 to-blue-500 p-12 text-white flex flex-col justify-center items-center text-center relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="bg-white/20 p-6 rounded-full mb-6 backdrop-blur-sm shadow-inner">
              <HeartPulse size={80} className="animate-pulse text-white" />
            </div>
            <h1 className="text-4xl font-extrabold mb-2 tracking-tight">AIIMS-ILD</h1>
            <p className="text-lg opacity-90 font-medium">Patient Monitoring System</p>
            <div className="mt-8 flex gap-2">
               <div className="w-3 h-3 rounded-full bg-yellow-300 animate-bounce"></div>
               <div className="w-3 h-3 rounded-full bg-red-300 animate-bounce delay-100"></div>
               <div className="w-3 h-3 rounded-full bg-green-300 animate-bounce delay-200"></div>
            </div>
          </div>

          {/* Form Side - Clean & Light */}
          <div className="w-full md:w-1/2 p-12 flex flex-col justify-center bg-white">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome</h2>
              <p className="text-gray-400 text-sm">Please select your role</p>
            </div>

            <div className="space-y-6">
              {/* Doctor Login */}
              <form onSubmit={handleDoctorLogin} className="space-y-3 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-1 text-blue-600 font-bold uppercase tracking-wider text-[10px]">
                  <Stethoscope size={14} /> Doctor Login
                </div>
                <input 
                  type="text" 
                  placeholder="Username" 
                  className="w-full px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 focus:border-blue-400 outline-none text-gray-700 placeholder-gray-400 transition-all"
                  value={docId}
                  onChange={(e) => setDocId(e.target.value)}
                />
                <input 
                  type="password" 
                  placeholder="Password" 
                  className="w-full px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 focus:border-blue-400 outline-none text-gray-700 placeholder-gray-400 transition-all"
                  value={docPass}
                  onChange={(e) => setDocPass(e.target.value)}
                />
                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                  Enter Dashboard
                </button>
              </form>

              {/* Patient Login */}
              <form onSubmit={handlePatientLogin} className="space-y-3">
                <div className="flex items-center gap-2 mb-1 text-teal-600 font-bold uppercase tracking-wider text-[10px]">
                  <User size={14} /> Patient Login
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-gray-400" size={16} />
                  <input 
                    type="tel" 
                    placeholder="10-digit Mobile Number" 
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-teal-50 border border-teal-100 focus:border-teal-400 outline-none text-gray-700 placeholder-gray-400 transition-all"
                    value={patientMobile}
                    onChange={(e) => setPatientMobile(e.target.value)}
                  />
                </div>
                <button type="submit" className="w-full bg-teal-500 text-white py-3 rounded-xl font-bold hover:bg-teal-600 transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                  Access My Records
                </button>
              </form>
              
              {loginError && (
                <div className="text-center p-3 rounded-lg bg-red-50 text-red-500 text-sm font-medium border border-red-100 animate-pulse">
                  {loginError}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {role === 'doctor' && (
        <DoctorDashboard 
          patients={patients} 
          onAddPatient={addPatient}
          onUpdatePatient={updatePatient}
          onDeletePatient={deletePatient}
          onLogout={logout} 
        />
      )}
      {role === 'patient' && loggedInPatient && (
        <PatientDashboard 
          patient={loggedInPatient} 
          onUpdatePatient={updatePatient}
          onLogout={logout} 
        />
      )}
    </>
  );
};

export default App;
