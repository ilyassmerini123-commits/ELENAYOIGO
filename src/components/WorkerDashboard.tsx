
import React, { useState, useMemo } from 'react';
import { useTranslation } from '../LanguageContext';
import { useWorkerAudio } from '../hooks/useWorkerAudio';
import { useLiveListen } from '../hooks/useLiveListen';
import LanguageSwitcher from './LanguageSwitcher';
import { Headset, MessageSquare, Volume2, Users, TrendingUp, Activity, Zap } from 'lucide-react';
import { LeadData, CallHistoryEntry, Prospect, CallSession, User, ProjectType } from '../types';
import { validateLeadData } from '../utils/validation';
import Visualizer from './Visualizer';

interface WorkerProps {
  socket: any;
  currentUser: User | null;
  currentProject: ProjectType;
  leads: LeadData[];
  prospects: Prospect[];
  setProspects: React.Dispatch<React.SetStateAction<Prospect[]>>;
  isCalling: boolean;
  callingType: ProjectType | null;
  startCall: () => void;
  startOrangeYoigoCall: () => void;
  startTriceraCall: () => void;
  startVerificationCall: () => void;
  stopCall: () => void;
  callHistory: CallHistoryEntry[];
  lastError: string | null;
  activeSessions: CallSession[];
  onUpdateLead: (id: string, data: Partial<LeadData>) => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const WorkerDashboard: React.FC<WorkerProps> = ({ socket, currentUser: loggedInUser, currentProject, leads, prospects, setProspects, isCalling, callingType, startCall, startOrangeYoigoCall, startTriceraCall, startVerificationCall, stopCall, callHistory, lastError, activeSessions, onUpdateLead, users, setUsers }) => {
  useWorkerAudio(socket);
  useLiveListen(socket);
  const { t, isRTL } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'PROSPECTOS' | 'LEADS' | 'CITAS' | 'VENTAS' | 'HISTORIAL' | 'SUPPORT' | 'LIVE_CALLS'>('PROSPECTOS');
  const [isAddProspectModalOpen, setIsAddProspectModalOpen] = useState(false);
  const [newProspect, setNewProspect] = useState<Partial<Prospect>>({ nombre: '', movil: '', localidad: '', projectId: currentProject });
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<LeadData>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isManualCalling, setIsManualCalling] = useState(false);
  const [callingProspect, setCallingProspect] = useState<Prospect | null>(null);
  const [callStatus, setCallStatus] = useState<'IN_PROGRESS' | 'HUNG_UP'>('IN_PROGRESS');
  const [isWhispering, setIsWhispering] = useState(false);
  const [isIntervening, setIsIntervening] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeGroup, setActiveGroup] = useState('elena_standard');
  const aiGroups = ['elena_standard', 'elena_insurance', 'elena_energy', 'elena_real_estate'];

  const handleManualCall = async (prospect: Prospect) => {
    setCallingProspect(prospect);
    setIsManualCalling(true);
    setCallStatus('IN_PROGRESS');
    
    try {
      const response = await fetch('/api/make-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_number: prospect.movil || prospect.fijo,
          sipConfig: {
            user: '3698841010',
            pass: 'NcAChIPhIu3jLl1T641HwW1',
            server: '178.79.157.150'
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate call');
      }
      console.log("Call initiated successfully");
    } catch (error) {
      console.error("Error making call:", error);
      alert(`Error al iniciar la llamada: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setIsManualCalling(false);
    }
  };

  const stopManualCall = () => {
    setCallStatus('HUNG_UP');
    setTimeout(() => {
      setIsManualCalling(false);
      setCallingProspect(null);
      setCallStatus('IN_PROGRESS');
    }, 2000);
  };

  // Use the logged in user passed from props
  const currentUser = loggedInUser || users.find(u => u.role === 'OPERATOR') || users[0];

  const toggleStatus = () => {
    if (currentUser) {
      setUsers(prev => prev.map(u => 
        u.id === currentUser.id 
          ? { ...u, status: u.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE' } 
          : u
      ));
    }
  };

  const [selectedTranscript, setSelectedTranscript] = useState<string | null>(null);
  const [dismissedError, setDismissedError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();
    const projectLeads = leads.filter(l => l.projectId === currentProject || (!l.projectId && currentProject === 'ELENA'));
    const projectProspects = prospects.filter(p => p.projectId === currentProject || (!p.projectId && currentProject === 'ELENA'));
    const projectHistory = callHistory.filter(h => h.projectId === currentProject || (!h.projectId && currentProject === 'ELENA'));
    
    const totalCalls = projectHistory.length;
    const avgDuration = totalCalls > 0 
      ? projectHistory.reduce((acc, h) => acc + h.durationSeconds, 0) / totalCalls 
      : 0;

    return {
      totalLeads: projectLeads.length,
      callsToday: projectHistory.filter(h => h.startTime && h.startTime.toDateString() === todayStr).length,
      totalCalls,
      conversionRate: totalCalls > 0 ? ((projectLeads.length / totalCalls) * 100).toFixed(1) : 0,
      totalProspects: projectProspects.length,
      avgDuration
    };
  }, [leads, callHistory, prospects, currentProject]);

  const filteredLeads = leads
    .filter(l => l.projectId === currentProject || (!l.projectId && currentProject === 'ELENA'))
    .filter(l => 
      (l.nombre || l.nombre_completo)?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (l.dni || l.dni_nif_cif)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.tlf || l.telefono_contacto)?.includes(searchTerm)
    );

  const filteredProspects = prospects
    .filter(p => p.projectId === currentProject || (!p.projectId && currentProject === 'ELENA'))
    .filter(p => 
      p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.fijo?.includes(searchTerm) ||
      p.movil?.includes(searchTerm) ||
      p.localidad?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const filteredHistory = callHistory
    .filter(h => h.projectId === currentProject || (!h.projectId && currentProject === 'ELENA'))
    .filter(h => 
      h.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      h.customerPhone?.includes(searchTerm)
    );

  const currentTranscript = activeSessions.length > 0 ? activeSessions[0].lastTranscript : null;

  const handleEditStart = (lead: LeadData) => {
    setEditingLeadId(lead.id);
    setEditingData(lead);
    setValidationErrors({});
  };

  const handleEditChange = (field: keyof LeadData, value: any) => {
    const newData = { ...editingData, [field]: value };
    setEditingData(newData);
    
    // Real-time validation
    const errors: Record<string, string> = {};
    
    // Map array errors to fields for better UI feedback
    if (field === 'dni' && value && !/^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$|^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i.test(value.replace(/[\s-]/g, ''))) {
      errors.dni = t('invalid_dni');
    }
    if (field === 'tlf' && value && !/^[6789]\d{8}$/.test(value.replace(/\s/g, ''))) {
      errors.tlf = t('invalid_phone');
    }
    if (field === 'cuenta_bancaria_iban' && value && !/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(value.replace(/\s/g, ''))) {
      errors.cuenta_bancaria_iban = t('invalid_iban');
    }
    
    setValidationErrors(errors);
  };

  const handleEditSave = () => {
    const validation = validateLeadData(editingData);
    if (!validation.isValid) {
      alert(t('fix_errors_before_save'));
      return;
    }
    if (editingLeadId) {
      onUpdateLead(editingLeadId, editingData);
      setEditingLeadId(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const accentColor = currentProject === 'YOIGO' ? 'blue' : currentProject === 'SEGUROS' ? 'emerald' : 'purple';
  const projectTitle = currentProject === 'YOIGO' ? t('yoigo_empresas') : currentProject === 'SEGUROS' ? t('seguros_pro') : t('elena_ai');

  const showError = lastError && lastError !== dismissedError;
  const filteredCallHistory = filteredHistory;

  return (
    <div className="flex flex-col lg:flex-row h-full bg-[#f8fafc] overflow-hidden">
      {/* Global Error Banner */}
      {showError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-4 animate-in slide-in-from-top-8 duration-500">
          <div className="bg-red-600 text-white p-6 rounded-[2rem] shadow-2xl shadow-red-200 border-2 border-red-400 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h5 className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">{t('system_alert')}</h5>
                <p className="font-bold text-sm leading-tight">{lastError}</p>
                {lastError.includes('Permiso denegado') && (
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-3 px-4 py-1.5 bg-white text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-50 shadow-lg transition-all"
                  >
                    {t('reload_page')}
                  </button>
                )}
              </div>
            </div>
            <button 
              onClick={() => setDismissedError(lastError)}
              className="p-3 hover:bg-white/10 rounded-xl transition-colors shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Manual Call Overlay */}
      {isManualCalling && callingProspect && (
        <div className="fixed bottom-4 right-4 z-[200] w-80 bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{t('manual_call')}</h3>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase ${callStatus === 'IN_PROGRESS' ? 'text-emerald-600' : 'text-red-600'}`}>
                {callStatus === 'IN_PROGRESS' ? t('in_progress') : t('hung_up')}
              </span>
              <div className={`w-2 h-2 rounded-full ${callStatus === 'IN_PROGRESS' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-2">{t('calling_to')} <span className="text-blue-600 font-bold">{callingProspect.nombre}</span></p>
          <p className="text-lg font-black text-slate-800 font-mono mb-6">{callingProspect.movil || callingProspect.fijo}</p>
          {callStatus === 'IN_PROGRESS' && (
            <button 
              onClick={stopManualCall}
              className="w-full bg-red-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all"
            >
              {t('hang_up')}
            </button>
          )}
        </div>
      )}

      {/* Whisper/Intervene Overlay */}
      {(isWhispering || isIntervening) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-3 ${isIntervening ? 'bg-red-600' : 'bg-blue-600'} animate-pulse`}></div>
            
            <div className="flex items-center gap-6 mb-10">
              <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl ${isIntervening ? 'bg-red-600 shadow-red-200' : 'bg-blue-600 shadow-blue-200'}`}>
                {isIntervening ? <Headset className="w-10 h-10" /> : <MessageSquare className="w-10 h-10" />}
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">
                  {isIntervening ? t('intervention') : t('whisper')} <span className={isIntervening ? 'text-red-600' : 'text-blue-600'}>{t('active_status')}</span>
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {isIntervening ? t('intervention_desc') : t('whisper_desc')}
                </p>
              </div>
            </div>

            <div className="bg-slate-950 rounded-[2.5rem] p-8 mb-10 border border-slate-800 shadow-inner relative overflow-hidden">
              <div className="absolute top-4 right-4 flex gap-1">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping"></div>
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping delay-75"></div>
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping delay-150"></div>
              </div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">{t('real_time_transcript')}</p>
              <p className="text-sm text-blue-100/80 font-mono leading-relaxed italic">
                "{t('real_time_transcript_placeholder')}"
              </p>
            </div>

            <button 
              onClick={() => { setIsWhispering(false); setIsIntervening(false); }}
              className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-800 shadow-2xl transition-all active:scale-95"
            >
              {t('finish')} {isIntervening ? t('intervention') : t('whisper')}
            </button>
          </div>
        </div>
      )}

      <aside className="w-full lg:w-96 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-6 lg:p-8 flex flex-col space-y-6 lg:space-y-8 shrink-0 shadow-sm z-10 overflow-y-auto max-h-[40vh] lg:max-h-full">
        <div className="space-y-4">
            <h3 className={`text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center`}>
              <span className={`w-1.5 h-1.5 bg-${accentColor}-600 rounded-full mr-2`}></span>
              {t('neural_network')} ({projectTitle})
            </h3>
          <div className={`bg-gradient-to-br from-${accentColor}-50 via-white to-indigo-50 rounded-[3rem] p-8 text-center border border-${accentColor}-100 shadow-xl relative overflow-hidden group`}>
            <div className={`w-28 h-28 rounded-[2.5rem] mx-auto mb-6 flex items-center justify-center transition-all duration-1000 ${
              isCalling ? `bg-${accentColor}-600 shadow-2xl shadow-${accentColor}-300 scale-105 ring-[12px] ring-${accentColor}-50 rotate-3` : 'bg-slate-200 grayscale'
            }`}>
               <svg className={`w-14 h-14 ${isCalling ? 'text-white animate-pulse' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
               </svg>
            </div>
            
            <h4 className="font-black text-slate-800 text-2xl uppercase tracking-tighter italic">{currentProject === 'ELENA' ? 'Elena' : projectTitle} <span className={`text-${accentColor}-600 not-italic`}>Voice</span></h4>
            
            <div className="mt-4 flex items-center justify-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${currentUser?.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {currentUser?.status === 'ONLINE' ? t('working_online') : t('offline_mode')}
              </span>
              <button 
                onClick={toggleStatus}
                className="ml-2 p-1 hover:bg-slate-100 rounded-lg transition-colors"
                title={t('change_status')}
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>
            </div>

            <p className="text-[10px] text-slate-500 mt-4 uppercase font-black tracking-widest opacity-80 leading-relaxed">
              {t('elena_intro')}
            </p>
            
            <div className="mt-8 space-y-3">
              <div className="pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('ai_groups')}</h3>
                  <button className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline">+{t('add_new')}</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {aiGroups.map(group => (
                    <button
                      key={group}
                      onClick={() => setActiveGroup(group)}
                      className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${
                        activeGroup === group 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' 
                          : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200'
                      }`}
                    >
                      {t(group)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('intelligence_level')}</span>
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{t('ultra')}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
                </div>
              </div>

              <button 
                onClick={callingType === 'ORANGE_YOIGO' ? stopCall : startOrangeYoigoCall}
                disabled={isCalling && callingType !== 'ORANGE_YOIGO'}
                className={`w-full font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-3 group active:scale-95 ${
                  callingType === 'ORANGE_YOIGO' 
                    ? 'bg-orange-800 text-white shadow-orange-200' 
                    : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200'
                } ${isCalling && callingType !== 'ORANGE_YOIGO' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {callingType === 'ORANGE_YOIGO' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1H9a1 1 0 01-1-1V7z" clipRule="evenodd" /></svg>
                ) : (
                  <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                )}
                <span className="text-[10px] uppercase tracking-widest text-nowrap">
                  {callingType === 'ORANGE_YOIGO' ? t('stop_orange_yoigo') : t('demo_orange_yoigo')}
                </span>
              </button>

              {(currentProject !== 'YOIGO' && loggedInUser?.email !== 'admin@elena.com') && (
                <button 
                  onClick={callingType === 'TRICERA' ? stopCall : startTriceraCall}
                  disabled={isCalling && callingType !== 'TRICERA'}
                  className={`w-full font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-3 group active:scale-95 ${
                    callingType === 'TRICERA' 
                      ? 'bg-emerald-800 text-white shadow-emerald-200' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                  } ${isCalling && callingType !== 'TRICERA' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {callingType === 'TRICERA' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1H9a1 1 0 01-1-1V7z" clipRule="evenodd" /></svg>
                  ) : (
                    <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                  )}
                  <span className="text-[10px] uppercase tracking-widest text-nowrap">
                    {callingType === 'TRICERA' ? t('stop_seguros') : t('demo_seguros')}
                  </span>
                </button>
              )}

              {(currentProject !== 'YOIGO' && loggedInUser?.email !== 'admin@elena.com') && (
                <button 
                  onClick={callingType === 'ELENA' ? stopCall : startCall}
                  disabled={isCalling && callingType !== 'ELENA'}
                  className={`w-full font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-3 group active:scale-95 ${
                    callingType === 'ELENA' 
                      ? 'bg-slate-800 text-white shadow-slate-200' 
                      : 'bg-blue-700 hover:bg-blue-800 text-white shadow-blue-200'
                  } ${isCalling && callingType !== 'ELENA' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {callingType === 'ELENA' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1H9a1 1 0 01-1-1V7z" clipRule="evenodd" /></svg>
                  ) : (
                    <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                  )}
                  <span className="text-[10px] uppercase tracking-widest text-nowrap">
                    {callingType === 'ELENA' ? t('stop_elena') : t('talk_to_elena')}
                  </span>
                </button>
              )}

              {(currentProject !== 'YOIGO' && loggedInUser?.email !== 'admin@elena.com') && (
                <button 
                  onClick={callingType === 'VERIFICATION' ? stopCall : startVerificationCall}
                  disabled={isCalling && callingType !== 'VERIFICATION'}
                  className={`w-full font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-3 group active:scale-95 ${
                    callingType === 'VERIFICATION' 
                      ? 'bg-emerald-800 text-white shadow-emerald-200' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                  } ${isCalling && callingType !== 'VERIFICATION' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {callingType === 'VERIFICATION' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1H9a1 1 0 01-1-1V7z" clipRule="evenodd" /></svg>
                  ) : (
                    <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 3a1 1 0 012 0v5.5a.5.5 0 001 0V4a1 1 0 112 0v4.5a.5.5 0 001 0V6a1 1 0 112 0v5a7 7 0 11-14 0V9a1 1 0 012 0v2.5a.5.5 0 001 0V4a1 1 0 012 0v4.5a.5.5 0 001 0V3z" clipRule="evenodd" /></svg>
                  )}
                  <span className="text-[10px] uppercase tracking-widest text-nowrap">
                    {callingType === 'VERIFICATION' ? t('stop_test') : t('verification_mode')}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {isCalling ? (
          <div className={`flex-1 bg-slate-950 rounded-[2rem] p-6 flex flex-col justify-end overflow-hidden relative border border-slate-800 shadow-2xl`}>
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-${accentColor}-600 via-indigo-400 to-${accentColor}-600 animate-pulse`}></div>
            <div className="relative z-10 space-y-4">
              <Visualizer isActive={true} />
              <div className={`h-32 overflow-y-auto text-[10px] text-${accentColor}-100/70 font-mono leading-relaxed bg-black/60 p-4 rounded-xl border border-white/10 shadow-inner scrollbar-hide`}>
                <div className="space-y-2">
                  {currentTranscript ? (
                    <p className="animate-in fade-in duration-300">
                      <span className={`text-${accentColor}-400 font-black uppercase text-[8px] block mb-1`}>{t('live_prefix')}</span>
                      "{currentTranscript}"
                    </p>
                  ) : (
                    <p className="opacity-50">{t('elena_processing')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50 group">
             <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-200 mb-6 border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
             </div>
             <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">
               {t('elena_waiting')}
             </p>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-8 lg:px-12 lg:py-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 lg:gap-10">
          <div className="flex items-center w-full lg:w-auto overflow-x-auto scrollbar-hide">
            <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200 shadow-sm w-full lg:w-auto">
              <button onClick={() => setActiveTab('PROSPECTOS')} className={`flex-1 lg:flex-none px-4 lg:px-8 py-3 lg:py-4 rounded-[1.2rem] text-[9px] lg:text-[10px] font-black tracking-widest transition-all uppercase text-nowrap ${activeTab === 'PROSPECTOS' ? `bg-white text-${accentColor}-700 shadow-lg border border-slate-100` : 'text-slate-500 hover:text-slate-800'}`}>{t('database')}</button>
              <button onClick={() => setActiveTab('LEADS')} className={`flex-1 lg:flex-none px-4 lg:px-8 py-3 lg:py-4 rounded-[1.2rem] text-[9px] lg:text-[10px] font-black tracking-widest transition-all uppercase text-nowrap ${activeTab === 'LEADS' ? `bg-white text-${accentColor}-700 shadow-lg border border-slate-100` : 'text-slate-500 hover:text-slate-800'}`}>{t('leads')}</button>
              <button onClick={() => setActiveTab('CITAS')} className={`flex-1 lg:flex-none px-4 lg:px-8 py-3 lg:py-4 rounded-[1.2rem] text-[9px] lg:text-[10px] font-black tracking-widest transition-all uppercase text-nowrap ${activeTab === 'CITAS' ? `bg-white text-${accentColor}-700 shadow-lg border border-slate-100` : 'text-slate-500 hover:text-slate-800'}`}>{t('appointments')}</button>
              <button onClick={() => setActiveTab('VENTAS')} className={`flex-1 lg:flex-none px-4 lg:px-8 py-3 lg:py-4 rounded-[1.2rem] text-[9px] lg:text-[10px] font-black tracking-widest transition-all uppercase text-nowrap ${activeTab === 'VENTAS' ? `bg-white text-${accentColor}-700 shadow-lg border border-slate-100` : 'text-slate-500 hover:text-slate-800'}`}>{t('sales')}</button>
              <button onClick={() => setActiveTab('HISTORIAL')} className={`flex-1 lg:flex-none px-4 lg:px-8 py-3 lg:py-4 rounded-[1.2rem] text-[9px] lg:text-[10px] font-black tracking-widest transition-all uppercase text-nowrap ${activeTab === 'HISTORIAL' ? `bg-white text-${accentColor}-700 shadow-lg border border-slate-100` : 'text-slate-500 hover:text-slate-800'}`}>{t('history')}</button>
              <button onClick={() => setActiveTab('LIVE_CALLS')} className={`flex-1 lg:flex-none px-4 lg:px-8 py-3 lg:py-4 rounded-[1.2rem] text-[9px] lg:text-[10px] font-black tracking-widest transition-all uppercase text-nowrap ${activeTab === 'LIVE_CALLS' ? `bg-white text-${accentColor}-700 shadow-lg border border-slate-100` : 'text-slate-500 hover:text-slate-800'}`}>{t('live_calls')}</button>
              <button onClick={() => setActiveTab('SUPPORT')} className={`flex-1 lg:flex-none px-4 lg:px-8 py-3 lg:py-4 rounded-[1.2rem] text-[9px] lg:text-[10px] font-black tracking-widest transition-all uppercase text-nowrap ${activeTab === 'SUPPORT' ? `bg-white text-${accentColor}-700 shadow-lg border border-slate-100` : 'text-slate-500 hover:text-slate-800'}`}>{t('support')}</button>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full lg:w-auto">
            {!(currentUser?.email === 'admin_elite@seguros.com' || currentUser?.email === 'worker_elite@seguros.com') && (
              <LanguageSwitcher />
            )}
            <div className="relative group flex-1 lg:w-96">
               <input type="text" placeholder={`${t('search')}...`} className={`w-full bg-white border-2 border-slate-100 py-5 pl-14 pr-8 rounded-[2rem] text-xs font-bold focus:ring-8 focus:ring-${accentColor}-500/5 focus:border-${accentColor}-500 outline-none shadow-xl transition-all`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
               <svg className="w-6 h-6 text-slate-300 absolute left-5 top-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
        </header>

        <div className="flex-1 p-12 overflow-y-auto scrollbar-hide bg-slate-50/30">
          <div className="max-w-[1600px] mx-auto flex flex-col xl:flex-row gap-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Sales Pipeline Sidebar (Super Dashboard Feature) */}
            <div className="w-full xl:w-80 shrink-0 space-y-8">
              <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{t('sales_pipeline')}</h3>
                </div>
                <div className="space-y-6">
                  {[
                    { label: t('prospects'), value: stats.totalProspects, color: 'bg-slate-200', width: '100%' },
                    { label: t('contacted'), value: stats.totalCalls, color: 'bg-blue-500', width: '75%' },
                    { label: t('leads'), value: stats.totalLeads, color: 'bg-indigo-500', width: '45%' },
                    { label: t('completed_sales'), value: leads.filter(l => l.status === 'VALIDADO').length, color: 'bg-emerald-500', width: '20%' },
                  ].map((step, i) => (
                    <div key={i} className="relative">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2 px-1">
                        <span className="text-slate-400">{step.label}</span>
                        <span className="text-slate-900">{step.value}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                        <div className={`${step.color} h-full rounded-full transition-all duration-1000`} style={{ width: step.width }}></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-10 pt-8 border-t border-slate-50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('conversion_rate')}</span>
                    <span className="text-xl font-black text-emerald-600 tracking-tighter">{stats.conversionRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('avg_duration')}</span>
                    <span className="text-xl font-black text-blue-600 tracking-tighter">{Math.round(stats.avgDuration)}s</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-[3rem] shadow-2xl p-8 text-white">
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-black uppercase tracking-tight">{t('activity_feed')}</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { time: '2m', text: t('elena_closed_sale'), type: 'sale' },
                    { time: '5m', text: t('new_lead_captured'), type: 'lead' },
                    { time: '12m', text: t('call_finished'), type: 'call' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${item.type === 'sale' ? 'bg-emerald-500' : item.type === 'lead' ? 'bg-blue-500' : 'bg-slate-500'}`}></div>
                      <div>
                        <p className="text-[10px] font-medium text-slate-300 leading-tight">{item.text}</p>
                        <span className="text-[8px] font-black text-slate-500 uppercase">{item.time} {t('ago')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-12 min-w-0">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 group hover:border-blue-500 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Zap className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase">{t('active')}</span>
                  </div>
                  <div className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{stats.totalCalls}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('total_calls')}</div>
                </div>

                <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 group hover:border-emerald-500 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg uppercase">+{stats.conversionRate}%</span>
                  </div>
                  <div className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{stats.totalLeads}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('leads')}</div>
                </div>

                <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 group hover:border-indigo-500 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <Activity className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase">{t('today')}</span>
                  </div>
                  <div className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{stats.callsToday}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('calls_today')}</div>
                </div>
              </div>

            {/* Leads Calificados por Elena */}
            <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                    {t('qualified_leads')}
                  </h3>
                  <button onClick={() => setActiveTab('LEADS')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">{t('view_all_leads')}</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredLeads.slice(0, 3).map(lead => (
                    <div key={lead.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/40 flex items-center space-x-4 group hover:border-emerald-200 transition-all">
                       <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       </div>
                       <div className="flex-1 min-w-0">
                          <h4 className="font-black text-slate-800 uppercase text-xs truncate">{lead.nombre}</h4>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="text-[9px] text-slate-400 font-bold font-mono">{lead.dni}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">{lead.tlf}</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 uppercase">{t('qualified')}</span>
                       </div>
                    </div>
                  ))}
                  {filteredLeads.length === 0 && (
                    <div className="col-span-full p-12 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                       <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-200 mx-auto mb-4 border border-slate-100 shadow-sm">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       </div>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{t('no_leads_yet')}</p>
                       <p className="text-[9px] text-slate-300 font-bold mt-1 uppercase">{t('elena_will_capture')}</p>
                    </div>
                  )}
               </div>
            </div>

            {activeTab === 'PROSPECTOS' && (
              <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                <div className="p-8 flex justify-end">
                  <button 
                    onClick={() => setIsAddProspectModalOpen(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                  >
                    {t('add_prospect')}
                  </button>
                </div>
                <table className="w-full text-left text-sm">
                  <thead><tr className="bg-slate-50/80 border-b border-slate-100"><th className="px-10 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest">{t('owner')}</th><th className="px-8 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest">{t('landline')}</th><th className="px-8 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest">{t('mobile')}</th><th className="px-8 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest">{t('location')}</th><th className="px-10 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest text-right">{t('action')}</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredProspects.map(p => (
                      <tr key={p.id} className="hover:bg-blue-50/30 transition-all group">
                        <td className="px-10 py-7"><div className="font-black text-slate-800 uppercase text-sm">{p.nombre}</div></td>
                        <td className="px-8 py-7 font-mono text-xs text-slate-500">{p.fijo}</td>
                        <td className="px-8 py-7"><span className="font-mono text-xs font-black text-blue-700 bg-blue-100 px-4 py-2 rounded-2xl border border-blue-200">{p.movil}</span></td>
                        <td className="px-8 py-7"><span className="text-[10px] font-black text-slate-600 uppercase bg-slate-100 px-4 py-2 rounded-full border border-slate-200">{p.localidad}</span></td>
                        <td className="px-10 py-7 text-right">
                          <div className="flex justify-end items-center gap-3">
                            <button 
                              onClick={() => handleManualCall(p)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2"
                            >
                              <Headset className="w-3 h-3" />
                              {t('call')}
                            </button>
                            <button 
                              onClick={() => alert(`${t('elena_calling')} ${p.nombre || p.movil}`)}
                              className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2"
                            >
                              <Zap className="w-3 h-3" />
                              {t('elena')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Add Prospect Modal */}
            {isAddProspectModalOpen && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl">
                <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-6">{t('add_prospect')}</h3>
                  <div className="space-y-4">
                    <input type="text" placeholder={t('name')} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-bold outline-none" value={newProspect.nombre} onChange={(e) => setNewProspect({...newProspect, nombre: e.target.value})} />
                    <input type="text" placeholder={t('mobile')} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-bold outline-none" value={newProspect.movil} onChange={(e) => setNewProspect({...newProspect, movil: e.target.value})} />
                    <input type="text" placeholder={t('location')} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-bold outline-none" value={newProspect.localidad} onChange={(e) => setNewProspect({...newProspect, localidad: e.target.value})} />
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button onClick={() => setIsAddProspectModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">{t('cancel')}</button>
                    <button onClick={() => {
                      if (!newProspect.nombre || !newProspect.movil) {
                        alert(t('fill_required_fields'));
                        return;
                      }
                      const prospect: Prospect = {
                        id: Math.random().toString(36).substr(2, 9),
                        nombre: newProspect.nombre!,
                        movil: newProspect.movil!,
                        localidad: newProspect.localidad || '',
                        projectId: currentProject,
                        fijo: '',
                        status: 'PENDIENTE'
                      };
                      setProspects(prev => [prospect, ...prev]);
                      setIsAddProspectModalOpen(false);
                      setNewProspect({ nombre: '', movil: '', localidad: '', projectId: currentProject });
                    }} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all">{t('save')}</button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'LEADS' && (
              <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="px-10 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest">{t('owner_client')}</th>
                      <th className="px-8 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest">{t('identification')}</th>
                      <th className="px-8 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest">{t('elena_info')}</th>
                      <th className="px-8 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest">{t('admin_comment')}</th>
                      <th className="px-10 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest text-right">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredLeads.map(l => (
                      <tr key={l.id} className="hover:bg-blue-50/30 transition-all">
                        <td className="px-10 py-7">
                          {editingLeadId === l.id ? (
                            <div className="space-y-2">
                              <input 
                                type="text" 
                                value={editingData.nombre || editingData.nombre_completo || ''} 
                                onChange={(e) => handleEditChange(editingData.nombre_completo !== undefined ? 'nombre_completo' : 'nombre', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
                                placeholder={t('full_name')}
                              />
                              <input 
                                type="text" 
                                value={editingData.tlf || editingData.telefono_contacto || ''} 
                                onChange={(e) => handleEditChange(editingData.telefono_contacto !== undefined ? 'telefono_contacto' : 'tlf', e.target.value)}
                                className={`w-full bg-slate-50 border ${validationErrors.tlf ? 'border-red-500' : 'border-slate-200'} p-2 rounded-lg text-xs font-bold outline-none focus:border-blue-500`}
                                placeholder={t('phone')}
                              />
                            </div>
                          ) : (
                            <>
                              <div className="font-black text-slate-800 uppercase text-sm">{l.nombre || l.nombre_completo}</div>
                              {l.empresa && <div className="text-[9px] font-black text-blue-600 uppercase">{l.empresa}</div>}
                              <div className="text-[10px] text-slate-500">{l.tlf || l.telefono_contacto}</div>
                              {l.es_negocio && <span className="text-[8px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded uppercase mt-1 inline-block">{t('business_label')}</span>}
                            </>
                          )}
                        </td>
                        <td className="px-8 py-7">
                          {editingLeadId === l.id ? (
                            <div className="relative">
                              <input 
                                type="text" 
                                value={editingData.dni || editingData.dni_nif_cif || ''} 
                                onChange={(e) => handleEditChange(editingData.dni_nif_cif !== undefined ? 'dni_nif_cif' : 'dni', e.target.value)}
                                className={`w-full bg-slate-50 border ${validationErrors.dni ? 'border-red-500' : 'border-slate-200'} p-2 rounded-lg text-xs font-mono font-bold outline-none focus:border-blue-500`}
                                placeholder={t('dni_cif')}
                              />
                            </div>
                          ) : (
                            <span className="font-mono text-xs text-slate-500">{l.dni || l.dni_nif_cif || l.dni_nie}</span>
                          )}
                        </td>
                        <td className="px-8 py-7">
                          {editingLeadId === l.id ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <input 
                                  type="number" 
                                  value={editingData.elena_num_lineas || ''} 
                                  onChange={(e) => handleEditChange('elena_num_lineas', parseInt(e.target.value))}
                                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
                                  placeholder={t('num_lines')}
                                />
                                <input 
                                  type="text" 
                                  value={editingData.elena_ahorro_estimado || ''} 
                                  onChange={(e) => handleEditChange('elena_ahorro_estimado', e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
                                  placeholder={t('est_savings')}
                                />
                              </div>
                              <input 
                                type="text" 
                                value={editingData.elena_oferta_yoigo || ''} 
                                onChange={(e) => handleEditChange('elena_oferta_yoigo', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
                                placeholder={t('yoigo_offer')}
                              />
                              <div className="pt-2 border-t border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{t('original_package')}:</p>
                                {editingData.paquete_servicios !== undefined ? (
                                  <input 
                                    type="text" 
                                    value={editingData.paquete_servicios || ''} 
                                    onChange={(e) => handleEditChange('paquete_servicios', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
                                    placeholder={t('contracted_package')}
                                  />
                                ) : (
                                  <input 
                                    type="text" 
                                    value={editingData.tipo_calefaccion || ''} 
                                    onChange={(e) => handleEditChange('tipo_calefaccion', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
                                    placeholder={t('heating')}
                                  />
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {(l.elena_num_lineas || l.elena_oferta_yoigo) && (
                                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[9px] font-black text-blue-600 uppercase">{t('elena_ai_extracted')}</span>
                                    {l.elena_ahorro_estimado && <span className="text-[9px] font-black text-emerald-600">{t('savings')}: {l.elena_ahorro_estimado}</span>}
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-700">
                                    {l.elena_num_lineas && <span>{l.elena_num_lineas} {t('lines')} • </span>}
                                    {l.elena_oferta_yoigo}
                                  </div>
                                </div>
                              )}
                              <div className="space-y-1">
                                {l.paquete_servicios ? (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <div className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 inline-block">{l.paquete_servicios}</div>
                                      {l.pais && <div className="text-[8px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">{l.pais}</div>}
                                    </div>
                                  </>
                                ) : l.tipo_seguro ? (
                                  <div className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 inline-block">{t('insurance_label')}: {l.tipo_seguro}</div>
                                ) : (
                                  <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-100">{l.tipo_calefaccion}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-7">
                          {editingLeadId === l.id ? (
                            <textarea 
                              value={editingData.comentario_operador_admin || ''} 
                              onChange={(e) => handleEditChange('comentario_operador_admin', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-blue-500 min-h-[80px] resize-none"
                              placeholder={t('write_comment')}
                            />
                          ) : (
                            <div className="max-w-[200px]">
                              {l.comentario_operador_admin ? (
                                <p className="text-[10px] text-slate-600 italic leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                                  "{l.comentario_operador_admin}"
                                </p>
                              ) : (
                                <span className="text-[10px] text-slate-300 italic">{t('no_comments')}</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-10 py-7 text-right">
                          <div className="flex justify-end items-center space-x-3">
                            <button 
                              onClick={() => {
                                setCallingProspect(l);
                                setIsManualCalling(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                              title={t('call')}
                            >
                              <Headset className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => {
                                // Logic to trigger Elena calling this lead
                                alert(`${t('elena_calling')} ${l.nombre || l.tlf}`);
                              }}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                              title={t('elena_call')}
                            >
                              <Zap className="w-5 h-5" />
                            </button>
                            {l.callTranscript && (
                              <button 
                                onClick={() => setSelectedTranscript(l.callTranscript || null)}
                                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                title={t('view_recording')}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                              </button>
                            )}
                            {editingLeadId === l.id ? (
                              <div className="flex space-x-2">
                                <button onClick={() => setEditingLeadId(null)} className="p-2 text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                <button onClick={handleEditSave} className="p-2 text-emerald-500 hover:text-emerald-700"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button>
                              </div>
                            ) : (
                              <button onClick={() => handleEditStart(l)} className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 transition-all">{t('edit')}</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'CITAS' && (
              <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                <div className="p-10 border-b border-slate-100">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{t('scheduled_appointments')}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('appointment_management')}</p>
                </div>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="px-10 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest">{t('client')}</th>
                      <th className="px-8 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest">{t('date_time')}</th>
                      <th className="px-8 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest">{t('type')}</th>
                      <th className="px-10 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest text-right">{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredLeads.filter(l => l.status === 'CITA_AGENDADA').map(l => (
                      <tr key={l.id} className="hover:bg-slate-50 transition-all">
                        <td className="px-10 py-7">
                          <div className="font-black text-slate-800 uppercase text-sm">{l.nombre || l.nombre_completo}</div>
                          <div className="text-[10px] text-slate-400">{l.tlf || l.telefono_contacto}</div>
                        </td>
                        <td className="px-8 py-7">
                          <div className="font-bold text-slate-700">{l.fecha_cita || l.fecha_cita_instalacion || t('not_defined')}</div>
                        </td>
                        <td className="px-8 py-7">
                          <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 uppercase">{t('installation')}</span>
                        </td>
                        <td className="px-10 py-7 text-right">
                          <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100 uppercase">{t('pending')}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'VENTAS' && (
              <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                <div className="p-10 border-b border-slate-100">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{t('completed_sales')}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('validated_contracts')}</p>
                </div>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="px-10 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest">{t('client')}</th>
                      <th className="px-8 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest">{t('product')}</th>
                      <th className="px-8 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest">{t('amount')}</th>
                      <th className="px-10 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest text-right">{t('date')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredLeads.filter(l => l.status === 'VALIDADO').map(l => (
                      <tr key={l.id} className="hover:bg-emerald-50/30 transition-all">
                        <td className="px-10 py-7">
                          <div className="font-black text-slate-800 uppercase text-sm">{l.nombre || l.nombre_completo}</div>
                          <div className="text-[10px] text-slate-400">{l.dni || l.dni_nif_cif}</div>
                        </td>
                        <td className="px-8 py-7">
                          <div className="text-xs font-bold text-slate-600 uppercase">{l.paquete_servicios || l.tipo_seguro || t('general_service')}</div>
                        </td>
                        <td className="px-8 py-7">
                          <div className="text-sm font-black text-emerald-600">{l.precio_actual ? `${l.precio_actual}€` : '-'}</div>
                        </td>
                        <td className="px-10 py-7 text-right">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">{new Date(l.timestamp).toLocaleDateString()}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'LIVE_CALLS' && (
              <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                <div className="p-10 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{t('real_time_calls')}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('center_activity_monitoring')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t('live')}</span>
                  </div>
                </div>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="px-10 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest">{t('operator')}</th>
                      <th className="px-8 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest">{t('duration')}</th>
                      <th className="px-8 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest">{t('status')}</th>
                      <th className="px-10 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest text-right">{t('action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[
                      { id: 'lc1', operator: 'Carlos Ruiz', duration: '04:12', status: t('speaking') },
                      { id: 'lc2', operator: 'Ana Martínez', duration: '01:45', status: t('verifying') },
                    ].map(call => (
                      <tr key={call.id} className="hover:bg-slate-50 transition-all">
                        <td className="px-10 py-7">
                          <div className="font-black text-slate-800 uppercase text-sm">{call.operator}</div>
                        </td>
                        <td className="px-8 py-7 font-mono text-xs text-blue-600">{call.duration}</td>
                        <td className="px-8 py-7">
                          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 uppercase">{call.status}</span>
                        </td>
                        <td className="px-10 py-7 text-right">
                          <div className="flex justify-end items-center gap-3">
                            <button 
                              onClick={() => setIsListening(true)}
                              className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-lg"
                            >
                              <Volume2 className="w-3 h-3" />
                              {t('listen')}
                            </button>
                            <button 
                              onClick={() => setIsWhispering(true)}
                              className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-blue-600 flex items-center gap-2"
                            >
                              <MessageSquare className="w-3 h-3" />
                              {t('whisper')}
                            </button>
                            <button 
                              onClick={() => setIsIntervening(true)}
                              className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-2"
                            >
                              <Headset className="w-3 h-3" />
                              {t('intervene')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'SUPPORT' && (
              <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{t('admin_support')}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('direct_communication_diamond')}</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Mock support comments from admin */}
                  {[
                    { id: 's1', author: 'Diamond Admin', text: t('good_job_yesterday'), timestamp: new Date(Date.now() - 3600000) },
                    { id: 's2', author: 'Diamond Admin', text: t('remember_verify_dni'), timestamp: new Date(Date.now() - 86400000) },
                  ].map(comment => (
                    <div key={comment.id} className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{comment.author}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{comment.timestamp.toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">{comment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'HISTORIAL' && (
              <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead><tr className="bg-slate-50/80 border-b border-slate-100"><th className="px-10 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest">{t('date')}</th><th className="px-8 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest">{t('duration')}</th><th className="px-10 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest text-right">{t('result')}</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredCallHistory.map(h => (
                      <tr key={h.id} className="hover:bg-slate-50 transition-all">
                        <td className="px-10 py-7"><div className="font-black text-slate-800 text-sm">{h.startTime?.toLocaleDateString()}</div><div className="text-[10px] text-slate-400 uppercase">{h.startTime?.toLocaleTimeString()}</div></td>
                        <td className="px-8 py-7 font-mono text-xs text-blue-600">{formatDuration(h.durationSeconds)}</td>
                        <td className="px-10 py-7 text-right"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${h.status === 'COMPLETADA' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{h.status === 'COMPLETADA' ? t('completed') : h.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>

      {/* Listening Overlay */}
      {isListening && (
        <div className="fixed bottom-10 right-10 z-[120] bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-800 animate-in slide-in-from-bottom-10 duration-500 flex items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center animate-pulse">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">{t('live')}</div>
              <div className="text-sm font-black uppercase tracking-tight">{t('listen')} - {t('elena_ai')}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="w-1 bg-blue-500 rounded-full animate-bounce" style={{ height: `${Math.random() * 20 + 10}px`, animationDelay: `${i * 0.1}s` }}></div>
            ))}
          </div>
          <button 
            onClick={() => setIsListening(false)}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            {t('stop_call')}
          </button>
        </div>
      )}

      {/* Manual Call Overlay */}
      {isManualCalling && callingProspect && (
        <div className="fixed inset-0 z-[130] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl p-12 text-center border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-200 animate-pulse">
              <Headset className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">{t('call')}...</h3>
            <p className="text-lg font-bold text-slate-600 mb-8">{callingProspect.nombre || callingProspect.nombre_completo}</p>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-12">{callingProspect.telefono || callingProspect.telefono_contacto}</div>
            
            <div className="flex justify-center gap-4">
              <button 
                onClick={stopManualCall}
                className="flex-1 py-5 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-100 transition-all"
              >
                {t('stop_call')}
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedTranscript && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
            <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase italic">{t('recording')} <span className="text-blue-600 not-italic">{t('voice_ia')}</span></h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{t('full_call_transcript')}</p>
              </div>
              <button onClick={() => setSelectedTranscript(null)} className="p-3 hover:bg-slate-200 rounded-2xl transition-colors">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-10 overflow-y-auto flex-1 bg-slate-50/30">
              <div className="space-y-4 font-mono text-xs leading-relaxed">
                {selectedTranscript.split('\n').map((line, i) => {
                  const isElena = line.startsWith('Elena:');
                  const isLukas = line.startsWith('Lukas:');
                  const isAgent = isElena || isLukas;
                  const agentName = isLukas ? t('lukas') : t('elena');
                  
                  return (
                    <div key={i} className={`p-4 rounded-2xl border ${isAgent ? 'bg-blue-50 border-blue-100 text-blue-800 ml-4' : 'bg-white border-slate-100 text-slate-700 mr-4'}`}>
                      <span className="font-black uppercase text-[9px] block mb-1 opacity-50">{isAgent ? agentName : t('client')}</span>
                      {line.replace(/^(Elena|Lukas|Cliente|Client): /, '')}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="px-10 py-6 bg-white border-t border-slate-100 flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedTranscript(null)}
                className="px-10 py-4 bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 shadow-xl transition-all"
              >
                {t('close_transcript')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
