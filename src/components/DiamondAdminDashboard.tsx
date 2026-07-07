import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { 
  LayoutDashboard, 
  Building2, 
  PhoneCall, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Search, 
  MoreVertical, 
  ExternalLink, 
  ShieldCheck,
  AlertCircle,
  Clock,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Plus,
  Server,
  Phone,
  Headset,
  Mic,
  Brain,
  Sparkles,
  Globe,
  Shield,
  Cpu,
  ChevronRight,
  Database,
  CheckCircle2,
  XCircle,
  Edit2,
  Save,
  X,
  Filter,
  Download
} from 'lucide-react';
import { CallCenter, DiamondStats, SupportComment, LeadData, ProjectType, User, CallSession, CallHistoryEntry } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Visualizer from './Visualizer';

interface DiamondAdminDashboardProps {
  currentUser: User | null;
  currentProject: ProjectType;
  stats: DiamondStats;
  callCenters: CallCenter[];
  onUpdateCallCenter: (id: string, data: Partial<CallCenter>) => void;
  onAddCallCenter: (center: CallCenter) => void;
  leads: LeadData[];
  onUpdateLead: (id: string, data: Partial<LeadData>) => void;
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
}

const DiamondAdminDashboard: React.FC<DiamondAdminDashboardProps> = ({ 
  currentUser,
  currentProject, 
  stats, 
  callCenters, 
  onUpdateCallCenter, 
  onAddCallCenter, 
  leads, 
  onUpdateLead,
  isCalling,
  callingType,
  startCall,
  startOrangeYoigoCall,
  startTriceraCall,
  startVerificationCall,
  stopCall,
  lastError,
  activeSessions,
  callHistory
}) => {
  const { t, isRTL } = useTranslation();
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'CENTERS' | 'USERS' | 'LIVE_CALLS' | 'BASE_DATOS' | 'INFRASTRUCTURE' | 'LEADS'>('DASHBOARD');
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCenter, setSelectedCenter] = useState<CallCenter | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isAddingCenter, setIsAddingCenter] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newCenterData, setNewCenterData] = useState({ name: '', owner: '' });
  const [newUserData, setNewUserData] = useState({ username: '', password: '', role: 'OPERATOR' as any, callCenterId: '' });
  const [isManualCalling, setIsManualCalling] = useState(false);
  const [callingProspect, setCallingProspect] = useState<any | null>(null);
  const [isWhispering, setIsWhispering] = useState(false);
  const [isIntervening, setIsIntervening] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadData | null>(null);

  const handleManualCall = (prospect: any) => {
    setCallingProspect(prospect);
    setIsManualCalling(true);
  };

  const stopManualCall = () => {
    setIsManualCalling(false);
    setCallingProspect(null);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.username || !newUserData.password || !newUserData.callCenterId) return;
    
    // In a real app, this would call an API
    console.log('Adding user:', newUserData);
    setIsAddingUser(false);
    setNewUserData({ username: '', password: '', role: 'OPERATOR', callCenterId: '' });
  };

  const toggleCenterStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    onUpdateCallCenter(id, { status: newStatus as any });
  };

  const handleAddCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCenterData.name || !newCenterData.owner) return;

    const newCenter: CallCenter = {
      id: `CC-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      name: newCenterData.name,
      owner: newCenterData.owner,
      status: 'ACTIVE',
      activeCalls: 0,
      totalLeads: 0,
      revenue: 0,
      lastActive: new Date(),
      supportComments: [],
      projectType: currentProject
    };

    onAddCallCenter(newCenter);
    setIsAddingCenter(false);
    setNewCenterData({ name: '', owner: '' });
  };

  const projectCallCenters = callCenters.filter(c => c.projectType === currentProject);
  const projectLeads = leads.filter(l => l.projectId === currentProject);

  const filteredCenters = projectCallCenters.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCenter || !newComment.trim()) return;

    const comment: SupportComment = {
      id: Math.random().toString(36).substr(2, 9),
      author: 'Diamond Admin',
      text: newComment,
      timestamp: new Date(),
      isPriority: false
    };

    onUpdateCallCenter(selectedCenter.id, {
      supportComments: [comment, ...selectedCenter.supportComments]
    });
    setNewComment('');
  };

  // Mock data for charts
  const chartData = [
    { name: 'Lun', calls: 400, revenue: 2400 },
    { name: 'Mar', calls: 300, revenue: 1398 },
    { name: 'Mie', calls: 200, revenue: 9800 },
    { name: 'Jue', calls: 278, revenue: 3908 },
    { name: 'Vie', calls: 189, revenue: 4800 },
    { name: 'Sab', calls: 239, revenue: 3800 },
    { name: 'Dom', calls: 349, revenue: 4300 },
  ];

  const accentColor = currentProject === 'YOIGO' ? 'blue' : currentProject === 'SEGUROS' ? 'emerald' : 'purple';
  const projectTitle = currentProject === 'YOIGO' ? 'Yoigo Empresas' : currentProject === 'SEGUROS' ? 'Seguros Pro' : 'Elena AI';

  return (
    <div className={`min-h-screen bg-[#f1f5f9] p-4 sm:p-8 font-sans`}>
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 bg-${accentColor}-600 rounded-full animate-pulse`} />
              <span className={`text-[10px] font-black text-${accentColor}-600 uppercase tracking-[0.2em]`}>Diamond Control Center • {projectTitle}</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic mb-4">
              DIAMOND <span className={`text-${accentColor}-600 font-light not-italic`}>Dashboard</span>
            </h1>
            <div className="flex items-center gap-6">
              {[
                { id: 'DASHBOARD', label: t('global_panel'), icon: LayoutDashboard },
                { id: 'CENTERS', label: t('call_centers'), icon: Building2 },
                { id: 'USERS', label: t('users'), icon: Users },
                { id: 'LIVE_CALLS', label: t('live_calls'), icon: PhoneCall },
                { id: 'LEADS', label: t('sales_leads'), icon: CheckCircle2 },
                { id: 'BASE_DATOS', label: t('database'), icon: Search },
                { id: 'INFRASTRUCTURE', label: t('infrastructure'), icon: Server }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all pb-2 border-b-2 ${
                    activeTab === tab.id ? `text-${accentColor}-600 border-${accentColor}-600` : 'text-slate-400 border-transparent hover:text-slate-600'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <button 
              onClick={() => setShowVoicePanel(!showVoicePanel)}
              className={`relative p-3 transition-all rounded-2xl border ${
                showVoicePanel || isCalling 
                  ? `bg-${accentColor}-600 text-white border-${accentColor}-600 shadow-lg shadow-${accentColor}-100` 
                  : 'bg-white text-slate-400 border-slate-200 hover:text-blue-600'
              }`}
            >
              <Phone className={`w-6 h-6 ${isCalling ? 'animate-pulse' : ''}`} />
              {isCalling && <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse"></span>}
            </button>
            <div className="glass-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className={isRTL ? 'text-left' : 'text-right'}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('total_revenue')}</p>
                <p className="text-xl font-black text-slate-900">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'DASHBOARD' && (
        <>
          {/* Global Alerts */}
          <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-red-50 border border-red-100 rounded-3xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-red-900 uppercase tracking-tight">{t('critical_incident')}</p>
              <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest">{t('latency_detected')}</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all">
            {t('view_details')}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: t('total_centers'), value: stats.totalCallCenters, icon: Building2, color: 'blue', trend: '+12%' },
          { label: t('active_calls'), value: stats.totalActiveCalls, icon: PhoneCall, color: 'purple', trend: '+5%' },
          { label: t('total_revenue'), value: `$${(stats.totalRevenue / 1000).toFixed(1)}k`, icon: DollarSign, color: 'emerald', trend: '+18%' },
          { label: t('growth'), value: `${stats.monthlyGrowth}%`, icon: TrendingUp, color: 'orange', trend: '+2%' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 bg-${stat.color}-50 rounded-2xl flex items-center justify-center text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-[10px] font-bold">
                <ArrowUpRight className="w-3 h-3" />
                {stat.trend}
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Rendimiento Global AI</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Llamadas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Ingresos</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full min-h-[300px] min-w-0 relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 900, color: '#1e293b', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCalls)" />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Actividad Reciente
          </h3>
          <div className="space-y-6">
            {[
              { type: 'NEW_CENTER', text: 'Nuevo centro "Sevilla Tech" registrado.', time: 'Hace 5 min' },
              { type: 'PAYMENT', text: 'Pago recibido de "Madrid Sales Hub".', time: 'Hace 2h' },
              { type: 'ALERT', text: 'Alerta de latencia en nodo Barcelona.', time: 'Hace 4h', urgent: true },
              { type: 'SUPPORT', text: 'Nuevo ticket de soporte de Valencia.', time: 'Hace 6h' },
              { type: 'SYSTEM', text: 'Actualización de motor Elena v4.2 completada.', time: 'Hace 12h' }
            ].map((activity, i) => (
              <div key={i} className="flex gap-4">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${activity.urgent ? 'bg-red-500 animate-ping' : 'bg-blue-500'}`}></div>
                <div>
                  <p className="text-xs font-medium text-slate-200">{activity.text}</p>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase font-black">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )}

      {(activeTab === 'CENTERS' || activeTab === 'DASHBOARD') && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Call Centers List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Centros de Llamadas Activos</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Buscar centro o dueño..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full sm:w-64"
                  />
                </div>
                <button 
                  onClick={() => setIsAddingCenter(true)}
                  className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Centro
                </button>
              </div>
            </div>

            {/* Add Center Modal */}
            <AnimatePresence>
              {isAddingCenter && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsAddingCenter(false)}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl"
                  >
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-6">Registrar Nuevo Centro</h3>
                    <form onSubmit={handleAddCenter} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Centro</label>
                        <input 
                          type="text" 
                          required
                          value={newCenterData.name}
                          onChange={(e) => setNewCenterData({...newCenterData, name: e.target.value})}
                          placeholder="Ej: Madrid Sales Hub"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Dueño</label>
                        <input 
                          type="text" 
                          required
                          value={newCenterData.owner}
                          onChange={(e) => setNewCenterData({...newCenterData, owner: e.target.value})}
                          placeholder="Ej: Carlos Rodriguez"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                      <div className="pt-4 flex gap-4">
                        <button 
                          type="button"
                          onClick={() => setIsAddingCenter(false)}
                          className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                        >
                          Cancelar
                        </button>
                        <button 
                          type="submit"
                          className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20"
                        >
                          Crear Centro
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Centro</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dueño</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Llamadas</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingresos</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCenters.map((center) => (
                    <tr 
                      key={center.id} 
                      onClick={() => setSelectedCenter(center)}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedCenter?.id === center.id ? 'bg-blue-50/50' : ''}`}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-bold">
                            {center.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{center.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-medium">ID: {center.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-medium text-slate-600">{center.owner}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          center.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 
                          center.status === 'INACTIVE' ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'
                        }`}>
                          {center.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          <p className="text-sm font-bold text-slate-900">{center.activeCalls}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-black text-slate-900">${center.revenue.toLocaleString()}</p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCenterStatus(center.id, center.status);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                              center.status === 'ACTIVE' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                          >
                            {center.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                          </button>
                          <button className="p-2 hover:bg-white rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Alertas Globales de Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-900">Mantenimiento Programado</p>
                  <p className="text-[10px] text-amber-700 mt-0.5">Nodo central en actualización mañana 04:00 AM.</p>
                </div>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-blue-900">Nueva Versión Elena AI</p>
                  <p className="text-[10px] text-blue-700 mt-0.5">v2.4 disponible para despliegue manual.</p>
                </div>
              </div>
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3">
                <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-900">Optimización de Costes</p>
                  <p className="text-[10px] text-emerald-700 mt-0.5">Reducción del 15% en latencia de red SIP.</p>
                </div>
              </div>
              <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl flex gap-3">
                <Users className="w-5 h-5 text-purple-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-purple-900">Nuevos Partners</p>
                  <p className="text-[10px] text-purple-700 mt-0.5">3 nuevos centros en lista de espera.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support & Details Sidebar */}
        <div className="space-y-8">
          {selectedCenter ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden sticky top-24"
            >
              <div className="p-8 bg-slate-900 text-white">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                    {selectedCenter.name.charAt(0)}
                  </div>
                  <button className="text-white/40 hover:text-white transition-colors">
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-1">{selectedCenter.name}</h3>
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-6">Propiedad de {selectedCenter.owner}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Total Leads</p>
                    <p className="text-xl font-black">{selectedCenter.totalLeads}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Last Active</p>
                    <p className="text-sm font-bold">{new Date(selectedCenter.lastActive).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                {/* Advanced Info Section */}
                <div className="grid grid-cols-1 gap-4 mb-8">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                        <Zap className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SIP Status</span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-100 px-2 py-1 rounded-md">Connected</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conv. Rate</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">14.2%</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-6">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Soporte y Comentarios</h4>
                </div>

                <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                  {selectedCenter.supportComments.length > 0 ? (
                    selectedCenter.supportComments.map((comment) => (
                      <div key={comment.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{comment.author}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(comment.timestamp).toLocaleDateString()}</p>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{comment.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <AlertCircle className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sin comentarios aún</p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleAddComment} className="space-y-4">
                  <textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribe un comentario de soporte..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none h-24"
                  />
                  <button 
                    type="submit"
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                  >
                    Enviar Comentario
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-6">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Selecciona un Centro</h3>
              <p className="text-sm text-slate-400 max-w-[200px]">Haz clic en un centro de llamadas para ver su información detallada y soporte.</p>
            </div>
          )}
        </div>
      </div>
    )}

      {activeTab === 'USERS' && (
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Gestión de Usuarios</h2>
              <button 
                onClick={() => setIsAddingUser(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nuevo Usuario
              </button>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Mock Users */}
                {[
                  { id: '1', username: 'admin_madrid', role: 'SUPERADMIN', center: 'Madrid Hub', status: 'ONLINE' },
                  { id: '2', username: 'op_sevilla_1', role: 'OPERATOR', center: 'Sevilla Tech', status: 'BUSY' },
                  { id: '3', username: 'op_sevilla_2', role: 'OPERATOR', center: 'Sevilla Tech', status: 'OFFLINE' },
                  { id: '4', username: 'op_valencia_1', role: 'OPERATOR', center: 'Valencia Sales', status: 'CALLING' },
                ].map((user) => (
                  <div key={user.id} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                        user.status === 'ONLINE' ? 'bg-emerald-100 text-emerald-600' :
                        user.status === 'BUSY' ? 'bg-amber-100 text-amber-600' :
                        user.status === 'CALLING' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {user.status}
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-slate-900 mb-1">{user.username}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{user.role} • {user.center}</p>
                    <div className="flex gap-2">
                      <button className="flex-1 bg-white border border-slate-200 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Editar</button>
                      <button className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-all">Suspender</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Add User Modal */}
          <AnimatePresence>
            {isAddingUser && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsAddingUser(false)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl"
                >
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-6">Crear Nuevo Usuario</h3>
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                      <input 
                        type="text" 
                        required
                        value={newUserData.username}
                        onChange={(e) => setNewUserData({...newUserData, username: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                      <input 
                        type="password" 
                        required
                        value={newUserData.password}
                        onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asignar Call Center</label>
                      <select 
                        required
                        value={newUserData.callCenterId}
                        onChange={(e) => setNewUserData({...newUserData, callCenterId: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">Seleccionar Centro...</option>
                        {projectCallCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="pt-4 flex gap-4">
                      <button type="button" onClick={() => setIsAddingUser(false)} className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50">Cancelar</button>
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-900/20">Crear Usuario</button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {activeTab === 'LIVE_CALLS' && (
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Monitoreo de Llamadas en Tiempo Real</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Escucha y asiste a tus operadores directamente</p>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Active Calls List */}
                <div className="space-y-4">
                  {[
                    { id: 'c1', operator: 'Juan Perez', center: 'Madrid Hub', duration: '02:45', status: 'TALKING', transcript: 'El cliente está interesado en la fibra de 1Gb...' },
                    { id: 'c2', operator: 'Maria Garcia', center: 'Sevilla Tech', duration: '05:12', status: 'CLOSING', transcript: 'Perfecto, procedemos con la grabación del contrato...' },
                    { id: 'c3', operator: 'Carlos Ruiz', center: 'Valencia Sales', duration: '01:20', status: 'TALKING', transcript: '¿Qué tipo de calefacción tiene actualmente?' },
                  ].map((call) => (
                    <div key={call.id} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 hover:border-blue-300 transition-all cursor-pointer group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                            <PhoneCall className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-black text-slate-900">{call.operator}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{call.center}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-blue-600">{call.duration}</p>
                          <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-100 px-2 py-0.5 rounded-md">{call.status}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 italic mb-4 line-clamp-1">"{call.transcript}"</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setIsIntervening(true)}
                          className="flex-1 bg-slate-900 text-white py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 flex items-center justify-center gap-2"
                        >
                          <Activity className="w-3 h-3" />
                          Escuchar
                        </button>
                        <button 
                          onClick={() => setIsWhispering(true)}
                          className="flex-1 bg-white border border-slate-200 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 flex items-center justify-center gap-2"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Susurrar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Transcript / Assistant */}
                <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Activity className="w-32 h-32" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                        <Zap className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black uppercase tracking-tight">Elena AI Assistant</h4>
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Análisis en Tiempo Real</p>
                      </div>
                    </div>

                    <div className="space-y-6 mb-8">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Sentimiento del Cliente</p>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="w-[85%] h-full bg-emerald-500"></div>
                          </div>
                          <span className="text-xs font-black">Positivo (85%)</span>
                        </div>
                      </div>
                      
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Sugerencia para el Operador</p>
                        <p className="text-sm text-slate-300 leading-relaxed">"El cliente ha mencionado que paga demasiado por el gas. Ofrece el pack dual con 20% de descuento adicional."</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => setIsIntervening(true)}
                      className="w-full bg-blue-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all"
                    >
                      Intervenir en Llamada
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'LEADS' && (
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Control de Ventas y Leads</h3>
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
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Comentario Admin</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Estatus</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {projectLeads.map((l, i) => (
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
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">{l.paquete_servicios || l.tipo_calefaccion}</span>
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
        </div>
      )}

      {activeTab === 'BASE_DATOS' && (
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Base de Datos Global</h2>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Buscar prospectos..."
                  className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
                />
              </div>
            </div>
            <div className="p-8">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Localidad</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Mock prospects for admin */}
                  {[
                    { id: 'p1', nombre: 'Juan Antonio Gomez', movil: '600111222', localidad: 'Madrid' },
                    { id: 'p2', nombre: 'Maria Luisa Fernandez', movil: '611222333', localidad: 'Barcelona' },
                    { id: 'p3', nombre: 'Ricardo Sanchez', movil: '622333444', localidad: 'Sevilla' },
                  ].map((p) => (
                    <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-8 py-6 font-bold text-slate-900 uppercase text-sm">{p.nombre}</td>
                      <td className="px-8 py-6 font-mono text-xs text-blue-600 font-black">{p.movil}</td>
                      <td className="px-8 py-6 text-xs text-slate-500 uppercase font-bold">{p.localidad}</td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleManualCall(p)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 ml-auto"
                        >
                          <PhoneCall className="w-3 h-3" />
                          Llamar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'INFRASTRUCTURE' && (
        <div className="max-w-7xl mx-auto">
          {/* System Status */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-slate-900/20">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Estado Global de Infraestructura
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { label: 'Nodos Activos', value: '12/12', status: 'Online' },
                { label: 'Latencia Media', value: '42ms', status: 'Optimal' },
                { label: 'Uso de GPU', value: '28%', status: 'Stable' },
                { label: 'Tráfico Voz', value: '1.2 TB', status: 'Normal' }
              ].map((item, i) => (
                <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block mb-1">{item.label}</span>
                  <p className="text-lg font-black">{item.value}</p>
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">{item.status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manual Call Overlay */}
      {isManualCalling && callingProspect && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-600 animate-pulse"></div>
            <div className="w-24 h-24 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-200 animate-bounce">
              <Phone className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Llamada Manual (Admin)</h3>
            <p className="text-sm text-slate-500 mb-6 font-bold">Llamando a <span className="text-blue-600">{callingProspect.nombre}</span></p>
            <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Número de Contacto</p>
              <p className="text-2xl font-black text-slate-800 font-mono tracking-tighter">{callingProspect.movil}</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={stopManualCall}
                className="flex-1 bg-red-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-200 transition-all"
              >
                Colgar Llamada
              </button>
            </div>
          </div>
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
                  {isIntervening ? 'INTERVENCIÓN' : 'SUSURRO'} <span className={isIntervening ? 'text-red-600' : 'text-blue-600'}>DIAMOND</span>
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {isIntervening ? 'Estás en línea con el cliente y el operador' : 'Solo el operador puede escucharte'}
                </p>
              </div>
            </div>

            <div className="bg-slate-950 rounded-[2.5rem] p-8 mb-10 border border-slate-800 shadow-inner relative overflow-hidden">
              <div className="absolute top-4 right-4 flex gap-1">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping"></div>
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping delay-75"></div>
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping delay-150"></div>
              </div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Análisis Elena AI</p>
              <p className="text-sm text-blue-100/80 font-mono leading-relaxed italic">
                "El operador está manejando bien la objeción del precio. Sugiere enfatizar la calidad del servicio técnico 24/7 incluido en el paquete..."
              </p>
            </div>

            <button 
              onClick={() => { setIsWhispering(false); setIsIntervening(false); }}
              className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-800 shadow-2xl transition-all active:scale-95"
            >
              Finalizar {isIntervening ? 'Intervención' : 'Susurro'}
            </button>
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
              <div className={`p-8 text-center bg-gradient-to-br ${isCalling ? `from-${accentColor}-600 to-${accentColor}-700` : 'from-slate-50 to-slate-100'}`}>
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
                  <Phone className={`w-12 h-12 ${isCalling ? `text-${accentColor}-600 animate-pulse` : 'text-slate-400'}`} />
                </div>
                
                <h3 className={`text-2xl font-black uppercase tracking-tighter italic ${isCalling ? 'text-white' : 'text-slate-800'}`}>
                  Elena <span className={isCalling ? `text-${accentColor}-200` : `text-${accentColor}-600`}>Voice</span>
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
                          : `bg-${accentColor}-600 text-white hover:bg-${accentColor}-700 shadow-lg shadow-${accentColor}-100`
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

export default DiamondAdminDashboard;
