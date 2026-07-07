
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { 
  ProjectConfig, 
  LeadData, 
  CallSession, 
  CallHistoryEntry, 
  Prospect,
  Company,
  User,
  UserRole,
  ProjectType
} from '../types';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Activity, 
  Users, 
  Phone, 
  Zap, 
  Settings, 
  Database, 
  BarChart3, 
  Shield, 
  Globe, 
  Clock, 
  Search, 
  Download, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  MoreVertical,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Server,
  Key,
  Lock,
  MessageSquare,
  AlertTriangle,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { validateSipData, validateLeadData } from '../utils/validation';
import Visualizer from './Visualizer';

interface SuperAdminProps {
  currentUser: User | null;
  currentProject: ProjectType;
  setCurrentProject: (p: ProjectType) => void;
  isLocked?: boolean;
  config: ProjectConfig;
  setConfig: (c: ProjectConfig) => void;
  leads: LeadData[];
  prospects: Prospect[];
  setProspects: (p: Prospect[]) => void;
  isCalling: boolean;
  callingType: ProjectType | null;
  startCall: () => void;
  startOrangeYoigoCall: () => void;
  startTriceraCall: () => void;
  startVerificationCall: () => void;
  stopCall: () => void;
  lastError: string | null;
  activeSessions: CallSession[];
  callHistory: CallHistoryEntry[];
  companies: Company[];
  setCompanies: (c: Company[]) => void;
  users: User[];
  setUsers: (u: User[]) => void;
  onUpdateLead: (id: string, data: Partial<LeadData>) => void;
}

const SuperAdminDashboard: React.FC<SuperAdminProps> = ({ 
  currentUser,
  currentProject,
  setCurrentProject,
  isLocked = false,
  config, 
  setConfig, 
  leads, 
  prospects, 
  setProspects, 
  isCalling,
  callingType,
  startCall,
  startOrangeYoigoCall,
  startTriceraCall,
  startVerificationCall,
  stopCall,
  lastError,
  activeSessions, 
  callHistory,
  companies,
  setCompanies,
  users,
  setUsers,
  onUpdateLead
}) => {
  const { t, isRTL } = useTranslation();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CAMPAIGN' | 'COMPANIES' | 'USERS' | 'SALES' | 'LEADS' | 'SIP' | 'DATABASE' | 'SUPPORT'>('OVERVIEW');
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [prospectSearch, setProspectSearch] = useState('');
  const [isTestingSip, setIsTestingSip] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadData | null>(null);
  const [newLead, setNewLead] = useState<Partial<LeadData>>({
    nombre: '', dni: '', tlf: '', direccion: '', antiguedad_20: '', tipo_calefaccion: ''
  });
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompany, setNewCompany] = useState<Partial<Company>>({
    name: '', plan: 'BASIC'
  });
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
    username: '', password: '', role: 'WORKER', status: 'OFFLINE'
  });
  const [listeningTo, setListeningTo] = useState<string | null>(null);

  // Mock data for charts
  const callData = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      calls: Math.floor(Math.random() * 50) + 10,
      leads: Math.floor(Math.random() * 10) + 2
    }));
  }, []);

  const filteredLeads = useMemo(() => 
    leads.filter(l => l.projectId === currentProject || (!l.projectId && currentProject === 'ELENA')),
  [leads, currentProject]);

  const filteredProspects = useMemo(() => 
    prospects.filter(p => p.projectId === currentProject || (!p.projectId && currentProject === 'ELENA')),
  [prospects, currentProject]);

  const filteredHistory = useMemo(() => 
    callHistory.filter(h => h.projectId === currentProject || (!h.projectId && currentProject === 'ELENA')),
  [callHistory, currentProject]);

  const filteredSessions = useMemo(() => 
    activeSessions.filter(s => s.projectId === currentProject || (!s.projectId && currentProject === 'ELENA')),
  [activeSessions, currentProject]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const conversionData = [
    { name: t('prospects'), value: filteredProspects.length },
    { name: t('contacted'), value: filteredHistory.length },
    { name: t('leads_title'), value: filteredLeads.length },
  ];

  const stats = useMemo(() => {
    const totalCalls = filteredHistory.length;
    const successfulCalls = filteredHistory.filter(h => h.status === 'COMPLETADA').length;
    const totalDuration = filteredHistory.reduce((acc, h) => acc + h.durationSeconds, 0);
    
    return {
      totalCalls,
      successRate: totalCalls > 0 ? ((filteredLeads.length / totalCalls) * 100).toFixed(1) : 0,
      activeLines: filteredSessions.length,
      avgDuration: totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0
    };
  }, [filteredLeads, filteredHistory, filteredSessions]);

  const [selectedSipAccount, setSelectedSipAccount] = useState<ProjectType>('YOIGO');

  const handleSipChange = (field: string, value: string | number) => {
    setConfig({
      ...config,
      sipAccounts: {
        ...config.sipAccounts,
        [selectedSipAccount]: {
          ...config.sipAccounts[selectedSipAccount],
          [field]: value,
          status: 'DISCONNECTED'
        }
      }
    });
  };

  const testSipConnection = async () => {
    setIsTestingSip(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const success = config.sip.server && config.sip.user && config.sip.pass;
    setConfig({
      ...config,
      sip: { ...config.sip, status: success ? 'CONNECTED' : 'ERROR' }
    });
    setIsTestingSip(false);
  };

  const filteredUsers = useMemo(() => 
    users.filter(u => u.projectId === currentProject || (!u.projectId && currentProject === 'ELENA')),
  [users, currentProject]);

  const accentColor = currentProject === 'YOIGO' ? 'blue' : currentProject === 'SEGUROS' ? 'emerald' : 'purple';
  const projectTitle = currentProject === 'YOIGO' ? t('yoigo_empresas') : currentProject === 'SEGUROS' ? t('seguros_pro') : t('elena_ai');

  return (
    <div className={`min-h-screen bg-[#f8fafc] text-slate-900 font-sans`}>
      {/* Sidebar Navigation - Desktop */}
      <div className="hidden lg:flex fixed left-0 top-0 h-full w-20 bg-white border-r border-slate-200 flex-col items-center py-8 space-y-8 z-50">
        <div className={`w-12 h-12 bg-${accentColor}-600 rounded-2xl flex items-center justify-center shadow-lg shadow-${accentColor}-200`}>
          <Zap className="text-white w-6 h-6" />
        </div>
        <nav className="flex flex-col space-y-4">
          {[
            { id: 'OVERVIEW', icon: BarChart3 },
            { id: 'CAMPAIGN', icon: Activity },
            { id: 'COMPANIES', icon: Globe },
            { id: 'USERS', icon: Users },
            { id: 'SALES', icon: Zap },
            { id: 'LEADS', icon: Database },
            { id: 'SIP', icon: Server },
            { id: 'DATABASE', icon: Settings },
            { id: 'SUPPORT', icon: MessageSquare }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`p-4 rounded-2xl transition-all ${
                activeTab === item.id 
                  ? `bg-${accentColor}-600 text-white shadow-lg shadow-${accentColor}-200` 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              <item.icon className="w-6 h-6" />
            </button>
          ))}
        </nav>
        <div className="mt-auto">
          <button className="p-4 text-slate-400 hover:text-slate-600">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 flex justify-around items-center py-4 z-50 px-4">
        {[
          { id: 'OVERVIEW', icon: BarChart3 },
          { id: 'CAMPAIGN', icon: Activity },
          { id: 'COMPANIES', icon: Globe },
          { id: 'SALES', icon: Zap },
          { id: 'LEADS', icon: Users },
          { id: 'SIP', icon: Server },
          { id: 'DATABASE', icon: Database }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`p-3 rounded-xl transition-all ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <item.icon className="w-5 h-5" />
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="lg:pl-20 pb-24 lg:pb-0">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center space-x-4">
            {/* Project Selector */}
            {!isLocked && (
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg mr-4">
                {(['ELENA', 'YOIGO', 'SEGUROS'] as ProjectType[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentProject(p)}
                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${
                      currentProject === p 
                        ? `bg-white text-${accentColor}-600 shadow-sm` 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
            {isLocked && (
              <div className="flex items-center gap-2 mr-4">
                <span className={`px-4 py-1.5 bg-${accentColor}-50 text-${accentColor}-600 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-${accentColor}-100`}>
                  {projectTitle}
                </span>
              </div>
            )}
            <div className="h-8 w-px bg-slate-200 mr-4"></div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 uppercase">
              {activeTab === 'OVERVIEW' && 'Panel de Control Global'}
              {activeTab === 'CAMPAIGN' && 'Gestión de Campañas'}
              {activeTab === 'COMPANIES' && 'Gestión de Compañías'}
              {activeTab === 'SALES' && 'Mantenimiento de Ventas'}
              {activeTab === 'LEADS' && 'Leads y Citas'}
              {activeTab === 'SIP' && 'Infraestructura SIP'}
              {activeTab === 'DATABASE' && 'Base de Datos Inteligente'}
              {activeTab === 'SUPPORT' && 'Soporte Diamond'}
            </h1>
            <div className="h-4 w-px bg-slate-200 mx-4"></div>
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${config.callingActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Motor Elena: {config.callingActive ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <LanguageSwitcher />
            <button 
              onClick={() => setShowVoicePanel(!showVoicePanel)}
              className={`relative p-2 transition-colors rounded-xl ${showVoicePanel || isCalling ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-blue-600'}`}
            >
              <Phone className={`w-6 h-6 ${isCalling ? 'animate-pulse' : ''}`} />
              {isCalling && <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse"></span>}
            </button>
            <button 
              onClick={() => setActiveTab('SUPPORT')}
              className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors"
            >
              <MessageSquare className="w-6 h-6" />
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
            <div className="flex items-center space-x-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-200">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                EA
              </div>
              <span className="text-xs font-bold text-slate-700">Super Admin</span>
            </div>
          </div>
        </header>

        <main className="p-8 max-w-[1600px] mx-auto space-y-8">
          {activeTab === 'OVERVIEW' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: t('calls_today'), value: stats.totalCalls, icon: Phone, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%', up: true },
                  { label: t('conversion_rate'), value: `${stats.successRate}%`, icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+5%', up: true },
                  { label: t('active_calls'), value: stats.activeLines, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: 'Estable', up: true },
                  { label: t('avg_duration'), value: formatDuration(stats.avgDuration), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', trend: '-2s', up: false }
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <div className={`flex items-center space-x-1 text-[10px] font-bold ${stat.up ? 'text-emerald-600' : 'text-red-600'}`}>
                        {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        <span>{stat.trend}</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <h3 className="text-3xl font-bold text-slate-800">{stat.value}</h3>
                  </div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Volumen de Actividad (24h)</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Llamadas</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Leads</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-[350px] w-full min-h-[350px] min-w-0 relative">
                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                      <AreaChart data={callData}>
                        <defs>
                          <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                        />
                        <Area type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCalls)" />
                        <Area type="monotone" dataKey="leads" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8">Embudo de Conversión</h3>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="h-[250px] w-full min-h-[250px] min-w-0 relative">
                      <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                        <PieChart>
                          <Pie
                            data={conversionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {conversionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-4 mt-8">
                      {conversionData.map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{item.name}</span>
                          </div>
                          <span className="text-sm font-black text-slate-800">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Sessions Monitor */}
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3 animate-pulse"></span>
                    Monitorización en Tiempo Real
                  </h3>
                  <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Ver todas las líneas</button>
                </div>
                <div className="divide-y divide-slate-50">
                  {filteredSessions.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 italic text-sm">No hay llamadas activas en este momento.</div>
                  ) : (
                    filteredSessions.map((session, i) => (
                      <div key={i} className="px-8 py-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-6">
                          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                            <Phone className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{session.workerName}</p>
                            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-tight">ID: {session.id}</p>
                          </div>
                        </div>
                        <div className="flex-1 mx-12">
                          {listeningTo === session.id ? (
                            <div className="flex items-center space-x-1 h-8">
                              {[...Array(12)].map((_, i) => (
                                <div 
                                  key={i} 
                                  className="w-1 bg-blue-500 rounded-full animate-bounce" 
                                  style={{ 
                                    height: `${Math.random() * 100}%`,
                                    animationDelay: `${i * 0.1}s`,
                                    animationDuration: `${0.5 + Math.random()}s`
                                  }}
                                ></div>
                              ))}
                              <span className="ml-4 text-[10px] font-black text-blue-600 uppercase tracking-widest animate-pulse">Audio en Vivo</span>
                            </div>
                          ) : (
                            <div className="bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                              <p className="text-[11px] text-slate-600 font-medium italic truncate">"{session.lastTranscript || 'Escuchando...'}"</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">En Línea</div>
                          <button 
                            onClick={() => setListeningTo(listeningTo === session.id ? null : session.id)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                              listeningTo === session.id 
                                ? 'bg-red-500 text-white shadow-lg shadow-red-200' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <Phone className={`w-3 h-3 ${listeningTo === session.id ? 'animate-pulse' : ''}`} />
                            {listeningTo === session.id ? 'Escuchando...' : 'Escuchar'}
                          </button>
                          <button className="p-2 text-slate-300 hover:text-slate-600"><MoreVertical className="w-5 h-5" /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'CAMPAIGN' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-8">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8">Estado de Campaña</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <div>
                        <p className="text-xs font-black text-slate-800 uppercase">Motor de Llamadas</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Lanzamiento automático</p>
                      </div>
                      <button 
                        onClick={() => setConfig({...config, callingActive: !config.callingActive})}
                        className={`w-14 h-8 rounded-full transition-all relative ${config.callingActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${config.callingActive ? 'left-7' : 'left-1'}`}></div>
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Líneas Concurrentes</label>
                        <span className="text-xs font-black text-blue-600">{config.maxConcurrentCalls}</span>
                      </div>
                      <input 
                        type="range" min="1" max="100" value={config.maxConcurrentCalls} 
                        onChange={(e) => setConfig({...config, maxConcurrentCalls: parseInt(e.target.value)})}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hora Inicio</label>
                        <input 
                          type="time" value={config.scheduleStart} 
                          onChange={(e) => setConfig({...config, scheduleStart: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hora Fin</label>
                        <input 
                          type="time" value={config.scheduleEnd} 
                          onChange={(e) => setConfig({...config, scheduleEnd: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8">Salud del Sistema</h3>
                  <div className="space-y-6">
                    {[
                      { label: 'Latencia Voz', value: '124ms', status: 'Optimal' },
                      { label: 'Uso de CPU', value: '32%', status: 'Stable' },
                      { label: 'Memoria', value: '1.2GB', status: 'Good' },
                      { label: 'Ancho de Banda', value: '45Mbps', status: 'Active' }
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{item.label}</span>
                        <div className="text-right">
                          <p className="text-sm font-bold">{item.value}</p>
                          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{item.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Historial de Operaciones</h3>
                  <div className="flex space-x-2">
                    <button className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-lg border border-slate-200"><Filter className="w-4 h-4" /></button>
                    <button className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-lg border border-slate-200"><Download className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trabajador</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duración</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredHistory.slice(0, 10).map((h, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5">
                            <p className="text-xs font-bold text-slate-800">{h.startTime?.toLocaleDateString()}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{h.startTime?.toLocaleTimeString()}</p>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{h.workerName}</span>
                          </td>
                          <td className="px-8 py-5">
                            <span className="font-mono text-xs font-bold text-blue-600">{formatDuration(h.durationSeconds)}</span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                              h.status === 'COMPLETADA' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {h.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'COMPANIES' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Gestión de Compañías</h2>
                  <p className="text-slate-500 text-sm">Administra y monitoriza todas las empresas activas en la plataforma.</p>
                </div>
                <button 
                  onClick={() => setShowAddCompany(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Añadir Compañía
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {companies.map((company) => (
                  <div key={company.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 hover:shadow-md transition-all relative overflow-hidden group">
                    <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-5 transition-transform group-hover:scale-110`}>
                      <Globe className="w-full h-full" />
                    </div>
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${company.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Globe className="w-6 h-6" />
                      </div>
                      <button 
                        onClick={() => {
                          const updated = companies.map(c => c.id === company.id ? { ...c, status: c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } as Company : c);
                          setCompanies(updated);
                        }}
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                          company.status === 'ACTIVE' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                      >
                        {company.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}
                      </button>
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 mb-1">{company.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Plan: {company.plan}</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Llamadas</p>
                        <p className="text-lg font-bold text-slate-800">{company.activeCalls}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Leads</p>
                        <p className="text-lg font-bold text-slate-800">{company.totalLeads}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-slate-300" />
                        <span className="text-[10px] text-slate-400 font-medium">Última act: {company.lastActive.toLocaleDateString()}</span>
                      </div>
                      <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Configurar</button>
                    </div>
                  </div>
                ))}
              </div>

              {showAddCompany && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                  <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden">
                    <div className="p-10 bg-slate-900 text-white">
                      <h3 className="text-2xl font-bold mb-2">Nueva Compañía</h3>
                      <p className="text-slate-400 text-sm">Configura una nueva empresa para empezar a operar.</p>
                    </div>
                    <div className="p-10 space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre de la Empresa</label>
                        <input 
                          type="text" 
                          value={newCompany.name}
                          onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all"
                          placeholder="Ej: Movistar Empresas"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan de Servicio</label>
                        <select 
                          value={newCompany.plan}
                          onChange={(e) => setNewCompany({...newCompany, plan: e.target.value as any})}
                          className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all"
                        >
                          <option value="BASIC">Basic (10 líneas)</option>
                          <option value="PRO">Pro (50 líneas)</option>
                          <option value="ENTERPRISE">Enterprise (Ilimitado)</option>
                        </select>
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button 
                          onClick={() => setShowAddCompany(false)}
                          className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={() => {
                            if (!newCompany.name) return;
                            const company: Company = {
                              id: `C-${Math.random().toString(36).substr(2, 5)}`,
                              name: newCompany.name,
                              status: 'ACTIVE',
                              activeCalls: 0,
                              totalLeads: 0,
                              revenue: 0,
                              lastActive: new Date(),
                              plan: newCompany.plan as any
                            };
                            setCompanies([...companies, company]);
                            setShowAddCompany(false);
                            setNewCompany({ name: '', plan: 'BASIC' });
                          }}
                          className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                        >
                          Guardar Compañía
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'SALES' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8">Rendimiento por Producto</h3>
                  <div className="h-[400px] w-full min-h-[400px] min-w-0 relative">
                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                      <LineChart data={[
                        { name: 'Lun', fibra: 400, movil: 240, seguros: 180 },
                        { name: 'Mar', fibra: 300, movil: 139, seguros: 220 },
                        { name: 'Mie', fibra: 200, movil: 980, seguros: 290 },
                        { name: 'Jue', fibra: 278, movil: 390, seguros: 200 },
                        { name: 'Vie', fibra: 189, movil: 480, seguros: 218 },
                        { name: 'Sab', fibra: 239, movil: 380, seguros: 250 },
                        { name: 'Dom', fibra: 349, movil: 430, seguros: 210 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="fibra" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="movil" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="seguros" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8">Distribución de Ventas</h3>
                  <div className="space-y-6">
                    {[
                      { label: 'Fibra Yoigo SoHo', value: 45, color: 'bg-blue-500' },
                      { label: 'Líneas Móviles', value: 30, color: 'bg-emerald-500' },
                      { label: 'Seguros Hogar', value: 15, color: 'bg-amber-500' },
                      { label: 'Otros Servicios', value: 10, color: 'bg-slate-400' }
                    ].map((item, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-slate-400">{item.label}</span>
                          <span className="text-slate-800">{item.value}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Mantenimiento de Campañas (Online/Offline)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaña</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventas Online</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventas Offline</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {[
                        { name: 'Yoigo SoHo Digital', product: 'Fibra + 2 Líneas', online: 124, offline: 45, status: 'ACTIVE' },
                        { name: 'Seguros Teltelecom', product: 'Hogar/Vida', online: 89, offline: 112, status: 'ACTIVE' },
                        { name: 'Orange Empresas', product: 'Fibra Pro', online: 56, offline: 23, status: 'PAUSED' },
                      ].map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5 font-bold text-sm text-slate-800">{c.name}</td>
                          <td className="px-8 py-5 text-xs text-slate-600">{c.product}</td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                              <Globe className="w-3 h-3 text-blue-500" />
                              <span className="font-bold text-sm">{c.online}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span className="font-bold text-sm">{c.offline}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                              c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {c.status === 'ACTIVE' ? 'Activa' : 'Pausada'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'USERS' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Gestión de <span className="text-blue-600">Usuarios</span></h2>
                <button 
                  onClick={() => setShowAddUser(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Operador
                </button>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Último Acceso</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Trabajo</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {users.map((u, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-black text-xs">
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-sm text-slate-800">{u.username}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-1 rounded">{u.role}</span>
                          </td>
                          <td className="px-8 py-5 text-xs text-slate-600">
                            {companies.find(c => c.id === u.companyId)?.name || 'N/A'}
                          </td>
                          <td className="px-8 py-5 text-xs text-slate-400 font-mono">
                            {u.lastLogin ? u.lastLogin.toLocaleString() : 'Nunca'}
                          </td>
                          <td className="px-8 py-5">
                            <button 
                              onClick={() => {
                                const newStatus = u.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
                                setUsers(users.map(user => user.id === u.id ? { ...user, status: newStatus } : user));
                              }}
                              className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                                u.status === 'ONLINE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                              }`}
                            >
                              {u.status}
                            </button>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {showAddUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                  <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-slate-200">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-6 italic">Nuevo <span className="text-blue-600">Operador</span></h3>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de Usuario</label>
                        <input 
                          type="text" 
                          value={newUser.username}
                          onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          placeholder="ej: juan_ventas"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                        <input 
                          type="password" 
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Empresa Asignada</label>
                        <select 
                          value={newUser.companyId}
                          onChange={(e) => setNewUser({...newUser, companyId: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="">Seleccionar Empresa</option>
                          {companies.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button 
                          onClick={() => setShowAddUser(false)}
                          className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={() => {
                            if (newUser.username && newUser.password) {
                              const user: User = {
                                id: `U-${Math.random().toString(36).substr(2, 9)}`,
                                username: newUser.username,
                                password: newUser.password,
                                role: 'WORKER',
                                status: 'OFFLINE',
                                companyId: newUser.companyId,
                                lastLogin: undefined
                              };
                              setUsers([...users, user]);
                              setShowAddUser(false);
                              setNewUser({ username: '', password: '', role: 'WORKER', status: 'OFFLINE' });
                            }
                          }}
                          className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200"
                        >
                          Crear Usuario
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'LEADS' && (
            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Leads Calificados y Citas</h3>
                <div className="flex space-x-2">
                  <button className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-lg border border-slate-200"><Filter className="w-4 h-4" /></button>
                  <button className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-lg border border-slate-200"><Download className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Titular / Cliente</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificación</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Info Elena (Líneas/Oferta)</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Comentario Operador</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Estatus</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredLeads.map((l, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-10 py-6">
                          <p className="text-sm font-bold text-slate-800 uppercase tracking-tight">{l.nombre || l.nombre_completo}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{l.tlf || l.telefono_contacto}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs font-bold text-slate-600 font-mono">{l.dni || l.dni_nif_cif}</p>
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-1">
                            {(l.elena_num_lineas || l.elena_oferta_yoigo) ? (
                              <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                                <div className="text-[9px] font-black text-blue-600 uppercase mb-0.5">Extraído por Elena</div>
                                <div className="text-[10px] font-bold text-slate-700">
                                  {l.elena_num_lineas && <span>{l.elena_num_lineas} Líneas • </span>}
                                  {l.elena_oferta_yoigo}
                                </div>
                                {l.elena_ahorro_estimado && <div className="text-[8px] font-black text-emerald-600 uppercase mt-0.5">Ahorro: {l.elena_ahorro_estimado}</div>}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">{l.paquete_servicios || l.tipo_calefaccion}</span>
                                {l.pais && <span className="text-[8px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">{l.pais}</span>}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {l.comentario_operador_admin ? (
                            <div className="max-w-[200px] text-[10px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                              "{l.comentario_operador_admin}"
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 italic">Sin comentarios</span>
                          )}
                        </td>
                        <td className="px-10 py-6 text-right">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            l.status === 'VALIDADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <button 
                            onClick={() => setEditingLead(l)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar Venta"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'SIP' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-12 bg-slate-900 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Server className="w-40 h-40" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className={`w-4 h-4 rounded-full ${config.sipAccounts[selectedSipAccount].status === 'CONNECTED' ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                        <h2 className="text-3xl font-bold tracking-tight">Configuración del Trunk SIP</h2>
                      </div>
                      <select 
                        value={selectedSipAccount}
                        onChange={(e) => setSelectedSipAccount(e.target.value as ProjectType)}
                        className="bg-slate-800 text-white p-3 rounded-2xl text-sm font-bold outline-none border border-slate-700"
                      >
                        <option value="ELENA">Elena</option>
                        <option value="YOIGO">Yoigo</option>
                        <option value="SEGUROS">Seguros</option>
                        <option value="VERIFICATION">Verification</option>
                      </select>
                    </div>
                    <p className="text-slate-400 max-w-xl text-lg font-light">
                      Elena AI requiere una infraestructura VoIP robusta para procesar miles de llamadas. Configura tu servidor SIP para empezar.
                    </p>
                  </div>
                </div>

                <div className="p-12 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Phone className="w-3 h-3" /> Número de Cabecera
                      </label>
                      <input 
                        type="text" value={config.sipAccounts[selectedSipAccount].number} 
                        onChange={(e) => handleSipChange('number', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold font-mono outline-none focus:border-blue-500 transition-all"
                        placeholder="Ej: 912906603"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Users className="w-3 h-3" /> Usuario SIP
                      </label>
                      <input 
                        type="text" value={config.sipAccounts[selectedSipAccount].user} 
                        onChange={(e) => handleSipChange('user', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold font-mono outline-none focus:border-blue-500 transition-all"
                        placeholder="Ej: 3493482"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Lock className="w-3 h-3" /> Clave Trunk
                      </label>
                      <input 
                        type="password" value={config.sipAccounts[selectedSipAccount].pass} 
                        onChange={(e) => handleSipChange('pass', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold font-mono outline-none focus:border-blue-500 transition-all"
                        placeholder="••••••••••••"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Globe className="w-3 h-3" /> Servidor VoIP
                      </label>
                      <input 
                        type="text" value={config.sipAccounts[selectedSipAccount].server} 
                        onChange={(e) => handleSipChange('server', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold font-mono outline-none focus:border-blue-500 transition-all"
                        placeholder="Ej: sip.unitele.es"
                      />
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {config.sipAccounts[selectedSipAccount].status === 'CONNECTED' && (
                        <div className="flex items-center space-x-2 text-emerald-600 font-bold text-sm">
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Sistema Conectado</span>
                        </div>
                      )}
                      {config.sipAccounts[selectedSipAccount].status === 'ERROR' && (
                        <div className="flex items-center space-x-2 text-red-600 font-bold text-sm">
                          <AlertCircle className="w-5 h-5" />
                          <span>Error de Conexión</span>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={testSipConnection}
                      disabled={isTestingSip}
                      className={`px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-3 ${
                        isTestingSip ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
                      }`}
                    >
                      {isTestingSip ? (
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : <Zap className="w-4 h-4" />}
                      Test Connection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'DATABASE' && (
            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-10 py-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar en la base de datos..." 
                    value={prospectSearch}
                    onChange={(e) => setProspectSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-3.5 pl-12 pr-6 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                  <button 
                    onClick={() => {
                      {/* Simulación de importación masiva con todos los campos requeridos para contrato */}
                      const mockImport: Prospect[] = [
                        { id: `IMP-${Date.now()}-1`, nombre: 'Carlos Ruiz', fijo: '910000001', movil: '600000001', localidad: 'Madrid', direccion: 'Calle Mayor 1', codigo_postal: '28001', cobertura_fibra: 'SI', envio_paquete: 'PENDIENTE', status: 'PENDIENTE' },
                        { id: `IMP-${Date.now()}-2`, nombre: 'Elena Sanz', fijo: '910000002', movil: '600000002', localidad: 'Barcelona', direccion: 'Av. Diagonal 100', codigo_postal: '08001', cobertura_fibra: 'PENDIENTE', envio_paquete: 'PENDIENTE', status: 'PENDIENTE' },
                        { id: `IMP-${Date.now()}-3`, nombre: 'Roberto Gomez', fijo: '910000003', movil: '600000003', localidad: 'Valencia', direccion: 'Plaza del Ayuntamiento 5', codigo_postal: '46001', cobertura_fibra: 'NO', envio_paquete: 'PENDIENTE', status: 'PENDIENTE' },
                      ];
                      setProspects([...mockImport, ...prospects]);
                      alert(t('db_imported_success'));
                    }}
                    className="flex-1 md:flex-none px-6 py-3.5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Importar Base de Datos
                  </button>
                  <button 
                    onClick={() => {
                      alert(t('exporting_db'));
                      // Simulación de exportación
                    }}
                    className="flex-1 md:flex-none px-6 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Exportar
                  </button>
                  <button 
                    onClick={() => setShowAddLead(true)}
                    className="flex-1 md:flex-none px-6 py-3.5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Nuevo Prospecto
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Titular / Dirección</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cobertura / Envío</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Estatus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredProspects.filter(p => p.nombre.toLowerCase().includes(prospectSearch.toLowerCase())).map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-10 py-6">
                          <p className="text-sm font-bold text-slate-800 uppercase tracking-tight">{p.nombre}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{p.direccion || 'Sin dirección'}</p>
                          <p className="text-[10px] text-slate-300 font-mono">ID: {p.id}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs font-bold text-slate-600">{p.movil}</p>
                          <p className="text-[10px] text-slate-400">Fijo: {p.fijo}</p>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${p.cobertura_fibra === 'SI' ? 'bg-emerald-500' : p.cobertura_fibra === 'NO' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                              <span className="text-[10px] font-black text-slate-600 uppercase">Fibra: {p.cobertura_fibra || 'PENDIENTE'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${p.envio_paquete === 'ENTREGADO' ? 'bg-emerald-500' : p.envio_paquete === 'ENVIADO' ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
                              <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Pack: {p.envio_paquete || 'PENDIENTE'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <div className="flex items-center justify-end space-x-4">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                              p.status === 'LLAMANDO' ? 'text-blue-600 animate-pulse' : 'text-slate-400'
                            }`}>{p.status}</span>
                            <button className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'SUPPORT' && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Comentarios de Soporte Diamond</h3>
                    <p className="text-xs text-slate-400 mt-1">Comunicación directa con la administración central</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-6">
                  {[
                    { id: '1', author: 'Diamond Admin', text: 'Hemos detectado un pico de actividad inusual. Por favor, revisen las líneas SIP.', timestamp: new Date(), isPriority: true },
                    { id: '2', author: 'Diamond Admin', text: 'Excelente tasa de conversión en la campaña de Madrid.', timestamp: new Date(Date.now() - 86400000), isPriority: false }
                  ].map((comment) => (
                    <div key={comment.id} className={`p-6 rounded-3xl border ${comment.isPriority ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${comment.isPriority ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            DA
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{comment.author}</p>
                            <p className="text-[10px] text-slate-400">{comment.timestamp.toLocaleString()}</p>
                          </div>
                        </div>
                        {comment.isPriority && (
                          <div className="flex items-center space-x-1 text-[10px] font-black text-red-600 uppercase tracking-widest">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Prioridad Alta</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{comment.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Enviar Respuesta</h3>
                <div className="space-y-4">
                  <textarea 
                    placeholder="Escribe tu mensaje para el Admin Diamond..."
                    className="w-full bg-slate-800 border border-slate-700 p-6 rounded-3xl text-sm outline-none focus:border-blue-500 transition-all min-h-[120px] resize-none"
                  ></textarea>
                  <div className="flex justify-end">
                    <button className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/20">
                      Enviar Mensaje
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Lead Modal */}
      {showAddLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Nuevo Registro Manual</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Añadir prospecto a la campaña activa</p>
              </div>
              <button onClick={() => setShowAddLead(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <Plus className="w-6 h-6 text-slate-400 rotate-45" />
              </button>
            </div>
            <div className="p-10 grid grid-cols-2 gap-6">
              {[
                { label: 'Nombre Completo', field: 'nombre', placeholder: 'Ej: Juan Pérez' },
                { label: 'DNI / NIE', field: 'dni', placeholder: '12345678X' },
                { label: 'Teléfono', field: 'tlf', placeholder: '600000000' },
                { label: 'Dirección', field: 'direccion', placeholder: 'Calle Falsa 123' },
                { label: 'Localidad', field: 'localidad', placeholder: 'Madrid' },
                { label: 'Código Postal', field: 'codigo_postal', placeholder: '28001' }
              ].map((input) => (
                <div key={input.field} className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{input.label}</label>
                  <input 
                    type="text" 
                    value={(newLead as any)[input.field]}
                    onChange={(e) => setNewLead({...newLead, [input.field]: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all"
                    placeholder={input.placeholder}
                  />
                </div>
              ))}
            </div>
            <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              <button onClick={() => setShowAddLead(false)} className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-700">Cancelar</button>
              <button 
                onClick={() => {
                  if (newLead.nombre) {
                    const prospect: Prospect = {
                      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
                      nombre: newLead.nombre || '',
                      fijo: newLead.tlf || '',
                      movil: newLead.tlf || '',
                      localidad: newLead.localidad || '',
                      direccion: newLead.direccion || '',
                      codigo_postal: newLead.codigo_postal || '',
                      cobertura_fibra: 'PENDIENTE',
                      envio_paquete: 'PENDIENTE',
                      status: 'PENDIENTE'
                    };
                    setProspects([prospect, ...prospects]);
                    setShowAddLead(false);
                    setNewLead({ nombre: '', dni: '', tlf: '', direccion: '', localidad: '', codigo_postal: '', antiguedad_20: '', tipo_calefaccion: '' });
                  }
                }}
                className="px-10 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100"
              >
                Guardar Registro
              </button>
            </div>
          </div>
        </div>
      )}

      {editingLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200"
          >
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Editar Venta / Lead</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">ID: {editingLead.id}</p>
              </div>
              <button 
                onClick={() => setEditingLead(null)}
                className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Cliente</label>
                  <input 
                    type="text" 
                    value={editingLead.nombre || editingLead.nombre_completo || ''} 
                    onChange={(e) => setEditingLead({...editingLead, nombre: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono</label>
                  <input 
                    type="text" 
                    value={editingLead.tlf || editingLead.telefono_contacto || ''} 
                    onChange={(e) => setEditingLead({...editingLead, tlf: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold font-mono outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DNI / Identificación</label>
                  <input 
                    type="text" 
                    value={editingLead.dni || editingLead.dni_nif_cif || ''} 
                    onChange={(e) => setEditingLead({...editingLead, dni: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold font-mono outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado de la Venta</label>
                  <select 
                    value={editingLead.status}
                    onChange={(e) => setEditingLead({...editingLead, status: e.target.value as any})}
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all appearance-none"
                  >
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="CALIFICADO">CALIFICADO</option>
                    <option value="VALIDADO">VALIDADO</option>
                    <option value="CITA_AGENDADA">CITA AGENDADA</option>
                  </select>
                </div>
              </div>

              <div className="space-y-6 bg-blue-50/50 p-8 rounded-[2rem] border border-blue-100">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Detalles de Fibra y Móviles
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Líneas Móviles</label>
                    <input 
                      type="text" 
                      placeholder="Ej: 2 líneas 50GB"
                      value={editingLead.elena_num_lineas || ''} 
                      onChange={(e) => setEditingLead({...editingLead, elena_num_lineas: e.target.value})}
                      className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Oferta Fibra / Paquete</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Fibra 600Mb + TV"
                      value={editingLead.elena_oferta_yoigo || editingLead.paquete_servicios || ''} 
                      onChange={(e) => setEditingLead({...editingLead, elena_oferta_yoigo: e.target.value})}
                      className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comentario del Administrador</label>
                <textarea 
                  value={editingLead.comentario_operador_admin || ''} 
                  onChange={(e) => setEditingLead({...editingLead, comentario_operador_admin: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all min-h-[100px] resize-none"
                  placeholder="Escribe un comentario o instrucción para el operador..."
                />
              </div>
            </div>

            <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => setEditingLead(null)}
                className="flex-1 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  onUpdateLead(editingLead.id, editingLead);
                  setEditingLead(null);
                }}
                className="flex-[2] bg-blue-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all"
              >
                <Save className="w-4 h-4" /> Guardar Cambios
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Voice Control Panel (Floating) */}
      <AnimatePresence>
        {(showVoicePanel || isCalling) && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-8 z-[100] w-full max-w-sm"
          >
            <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
              <div className={`p-8 text-center bg-gradient-to-br ${isCalling ? 'from-blue-600 to-indigo-700' : 'from-slate-50 to-slate-100'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${isCalling ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {isCalling ? 'Conectado' : 'Standby'}
                  </div>
                  <button 
                    onClick={() => setShowVoicePanel(false)}
                    className={`p-2 rounded-xl transition-colors ${isCalling ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-200 text-slate-400'}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className={`w-24 h-24 rounded-[2rem] mx-auto mb-6 flex items-center justify-center transition-all duration-500 ${
                  isCalling ? 'bg-white shadow-2xl scale-110' : 'bg-slate-200'
                }`}>
                  <Phone className={`w-12 h-12 ${isCalling ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`} />
                </div>
                
                <h3 className={`text-2xl font-black uppercase tracking-tighter italic ${isCalling ? 'text-white' : 'text-slate-800'}`}>
                  Elena <span className={isCalling ? 'text-blue-200' : 'text-blue-600'}>Voice</span>
                </h3>
                <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${isCalling ? 'text-white/60' : 'text-slate-400'}`}>
                  {isCalling ? 'IA en conversación activa' : 'Haz clic para iniciar demo'}
                </p>
              </div>

              <div className="p-8 space-y-4">
                {lastError && (
                  <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 mb-4">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-red-600 leading-tight">{lastError}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={callingType === 'ORANGE_YOIGO' ? stopCall : startOrangeYoigoCall}
                    disabled={isCalling && callingType !== 'ORANGE_YOIGO'}
                    className={`p-4 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all border ${
                      callingType === 'ORANGE_YOIGO' 
                        ? 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-100' 
                        : 'bg-white text-orange-600 border-orange-100 hover:bg-orange-50'
                    } ${isCalling && callingType !== 'ORANGE_YOIGO' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {callingType === 'ORANGE_YOIGO' ? 'Parar Yoigo' : 'Demo Yoigo'}
                  </button>
                  {(currentProject !== 'YOIGO' && currentUser?.email !== 'admin@elena.com') && (
                    <button 
                      onClick={callingType === 'TRICERA' ? stopCall : startTriceraCall}
                      disabled={isCalling && callingType !== 'TRICERA'}
                      className={`p-4 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all border ${
                        callingType === 'TRICERA' 
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100' 
                          : 'bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50'
                      } ${isCalling && callingType !== 'TRICERA' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {callingType === 'TRICERA' ? 'Parar Seguros' : 'Demo Seguros'}
                    </button>
                  )}
                </div>

                {(currentProject !== 'YOIGO' && currentUser?.email !== 'admin@elena.com') && (
                  <>
                    <button 
                      onClick={callingType === 'ELENA' ? stopCall : startCall}
                      disabled={isCalling && callingType !== 'ELENA'}
                      className={`w-full p-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        callingType === 'ELENA' 
                          ? 'bg-slate-900 text-white shadow-xl' 
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100'
                      } ${isCalling && callingType !== 'ELENA' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {callingType === 'ELENA' ? 'Detener Elena' : 'Hablar con Elena'}
                    </button>

                    <button 
                      onClick={callingType === 'VERIFICATION' ? stopCall : startVerificationCall}
                      disabled={isCalling && callingType !== 'VERIFICATION'}
                      className={`w-full p-4 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all border ${
                        callingType === 'VERIFICATION' 
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-lg' 
                          : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                      } ${isCalling && callingType !== 'VERIFICATION' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {callingType === 'VERIFICATION' ? 'Parar Test' : 'Modo Verificación'}
                    </button>
                  </>
                )}

                {isCalling && (
                  <div className="pt-6 border-t border-slate-100">
                    <Visualizer isActive={true} />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuperAdminDashboard;
