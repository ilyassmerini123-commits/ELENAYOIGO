import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io } from 'socket.io-client';
import { 
  Phone, 
  Settings, 
  Database, 
  BarChart3, 
  Volume2, 
  Play, 
  Square, 
  Server, 
  Check, 
  AlertTriangle, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Plus, 
  Trash2, 
  Download, 
  Copy, 
  Wifi, 
  WifiOff, 
  Sparkles, 
  RefreshCw, 
  User, 
  Clock, 
  Sliders, 
  Code,
  FileAudio
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line 
} from 'recharts';

// Types for IVR Goigo
interface LeadIVR {
  id: string;
  name: string;
  phone: string;
  status: 'PENDIENTE' | 'LLAMANDO' | 'CONECTADO' | 'COMPLETADO' | 'SIN_RESPUESTA' | 'OCUPADO' | 'FALLIDO';
  dtmf: string; // '1', '2', '3', '4' o vacio
  duration: number; // en segundos
  timestamp: string;
  notes?: string;
}

interface CampaignFlow {
  welcomeAudioUrl: string;
  welcomeText: string;
  useTts: boolean;
  ttsVoice: string;
  keyActions: {
    '1': { action: string; label: string; redirectExt?: string; audioText?: string };
    '2': { action: string; label: string; redirectExt?: string; audioText?: string };
    '3': { action: string; label: string; redirectExt?: string; audioText?: string };
    '4': { action: string; label: string; redirectExt?: string; audioText?: string };
  };
}

interface PbxConfig {
  pbxType: 'asterisk' | 'freepbx' | 'issabel' | 'custom_sip';
  host: string;
  port: string;
  username: string;
  secret: string;
  amiEnabled: boolean;
  sipTrunkName: string;
  isConnected: boolean;
}

export default function IvrGoigoDashboard() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'campaign' | 'monitor' | 'leads' | 'pbx' | 'analytics'>('monitor');
  
  // App states
  const [pbxConfig, setPbxConfig] = useState<PbxConfig>({
    pbxType: 'custom_sip',
    host: '178.79.157.150',
    port: '5060',
    username: '3698841010',
    secret: 'NcAChIPhIu3jLl1T641HwW1',
    amiEnabled: true,
    sipTrunkName: 'Trunk_Yoigo_SIP',
    isConnected: true
  });

  const [campaignFlow, setCampaignFlow] = useState<CampaignFlow>({
    welcomeAudioUrl: '',
    welcomeText: 'Hola soy Laura Le llamamos de Yoigo. Disfrute de nuestra fibra 600 megas, y dos líneas móviles ilimitadas por solo 33€ más IVA. Como beneficio exclusivo, tendrá acceso a terminales desde solo 1 euro, o la posibilidad de financiar los nuevos iPhone 17 Pro Max y Android. El pack incluye televisión gratuita y asesoría jurídica gratuita para siempre. Y si tiene una segunda vivienda por solo 13€ más IVA para mas detalles pulse 1. Si no le interesa, pulse 2. Para que le llamemos en otro momento, pulse 3.',
    useTts: true,
    ttsVoice: 'es-ES-Neural2-F',
    keyActions: {
      '1': { action: 'TAG_INTEREST', label: 'Más Detalles / Interés Yoigo', audioText: 'Perfecto. Hemos registrado su interés. Un asesor de Yoigo le llamará en unos minutos. Gracias.' },
      '2': { action: 'OPT_OUT', label: 'No Interesado / Lista de Exclusión', audioText: 'Lamentamos las molestias, su número ha sido eliminado de nuestra base de datos.' },
      '3': { action: 'SCHEDULE_CALL', label: 'Llamar en otro momento', audioText: 'Entendido, agendamos la llamada de seguimiento para otro momento más oportuno. ¡Hasta luego!' },
      '4': { action: 'TRANSFER', label: 'Transferir a Agente (Ext 100)', redirectExt: '100', audioText: 'Le transferimos en directo con nuestro asesor de Yoigo. Por favor espere.' }
    }
  });

  const [uploading, setUploading] = useState(false);
  const [generatingTts, setGeneratingTts] = useState(false);
  const [playStatus, setPlayStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (playStatus === url) {
      setPlayStatus(null);
      return;
    }
    audioRef.current = new Audio(url);
    audioRef.current.play()
      .then(() => {
        setPlayStatus(url);
        audioRef.current!.onended = () => {
          setPlayStatus(null);
        };
      })
      .catch(err => {
        console.error("Error playing audio:", err);
        alert("No se pudo reproducir el archivo de audio. Asegúrate de haberlo cargado o generado primero.");
      });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const response = await fetch('/api/upload-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, data: base64String })
        });
        const result = await response.json();
        if (result.success) {
          setCampaignFlow(prev => ({
            ...prev,
            welcomeAudioUrl: result.url
          }));
          alert(`¡Audio subido con éxito!: ${result.filename}`);
        } else {
          alert(`Error al subir: ${result.error || 'Intente de nuevo'}`);
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error(error);
      alert(`Error de lectura: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateTts = async () => {
    if (!campaignFlow.welcomeText) {
      alert("Por favor ingresa un mensaje de bienvenida.");
      return;
    }
    setGeneratingTts(true);
    try {
      const response = await fetch('/api/generate-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: campaignFlow.welcomeText,
          voice: campaignFlow.ttsVoice
        })
      });
      const result = await response.json();
      if (result.success) {
        setCampaignFlow(prev => ({
          ...prev,
          welcomeAudioUrl: result.url
        }));
        alert(`¡Audio de Voz AI generado con éxito! Nombre: ${result.filename}`);
      } else {
        alert(`Error de generación: ${result.error || 'Verifique su clave API de Gemini'}`);
      }
    } catch (error: any) {
      console.error(error);
      alert(`Error de red: ${error.message}`);
    } finally {
      setGeneratingTts(false);
    }
  };

  const [leads, setLeads] = useState<LeadIVR[]>([
    { id: '1', name: 'Juan Gómez', phone: '+34612345678', status: 'COMPLETADO', dtmf: '1', duration: 32, timestamp: '12:35:10', notes: 'Interesado en Yoigo' },
    { id: '2', name: 'María Rodríguez', phone: '+34622334455', status: 'COMPLETADO', dtmf: '4', duration: 45, timestamp: '12:38:22', notes: 'Transferido a Agente' },
    { id: '3', name: 'Carlos López', phone: '+34699887766', status: 'SIN_RESPUESTA', dtmf: '', duration: 0, timestamp: '12:40:05', notes: 'Llamada no contestada' },
    { id: '4', name: 'Ana Belén Martínez', phone: '+34677553311', status: 'COMPLETADO', dtmf: '2', duration: 28, timestamp: '12:41:40', notes: 'No interesado' },
    { id: '5', name: 'Pedro Sánchez', phone: '+34655442211', status: 'COMPLETADO', dtmf: '3', duration: 15, timestamp: '12:43:11', notes: 'Llamar en otro momento' }
  ]);

  useEffect(() => {
    const socket = io(window.location.origin, {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('IvrGoigoDashboard: Socket conectado con éxito');
      setPbxConfig(prev => ({ ...prev, isConnected: true }));
    });

    socket.on('disconnect', () => {
      console.log('IvrGoigoDashboard: Socket desconectado');
      setPbxConfig(prev => ({ ...prev, isConnected: false }));
    });

    socket.on('ivr_call_event', (event: any) => {
      console.log('Recibido ivr_call_event desde el PBX real:', event);
      setLeads(prev => {
        const exists = prev.find(l => l.id === event.id);
        if (exists) {
          return prev.map(l => l.id === event.id ? { 
            ...l, 
            status: event.status, 
            dtmf: event.dtmf || l.dtmf,
            notes: event.dtmf ? campaignFlow.keyActions[event.dtmf as '1' | '2' | '3' | '4']?.label : l.notes
          } : l);
        } else {
          const newLead: LeadIVR = {
            id: event.id,
            name: 'Cliente SIP Entrante',
            phone: event.phone,
            status: event.status,
            dtmf: event.dtmf || '',
            duration: 15,
            timestamp: event.timestamp || new Date().toLocaleTimeString().substring(0, 5),
            notes: event.dtmf ? campaignFlow.keyActions[event.dtmf as '1' | '2' | '3' | '4']?.label : 'Llamada conectada en directo'
          };
          return [newLead, ...prev];
        }
      });
    });

    return () => {
      socket.close();
    };
  }, [campaignFlow]);

  // Simulator State
  const [simName, setSimName] = useState('Cliente Demo');
  const [simPhone, setSimPhone] = useState('+34600112233');
  const [simCallState, setSimCallState] = useState<'IDLE' | 'DIALING' | 'RINGING' | 'CONNECTED' | 'PLAYING_AUDIO' | 'COMPLETED'>('IDLE');
  const [simActiveLead, setSimActiveLead] = useState<LeadIVR | null>(null);
  const [simDuration, setSimDuration] = useState(0);
  const [simKeyPressed, setSimKeyPressed] = useState<string | null>(null);
  const [simLog, setSimLog] = useState<string[]>([]);

  // Webhook and AMI Code Blocks (for PBX copy-paste documentation)
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const asteriskDialplan = `[ivr-goigo-context]
exten => s,1,Answer()
 same => n,Set(CALL_ID=\${UNIQUEID})
 same => n,Set(CLIENT_PHONE=\${CALLERID(num)})
 same => n,Verbose(1, --- Iniciando Llamada IVR Goigo para \${CLIENT_PHONE} ---)
 same => n,System(curl -X POST -H "Content-Type: application/json" -d '{"callId":"\${CALL_ID}", "phone":"\${CLIENT_PHONE}", "status":"CONECTADO"}' http://YOUR_SERVER_IP:3000/api/ivr/webhook)
 ; Reproducir audio de bienvenida y esperar respuesta DTMF (tiempo límite: 8s)
 same => n,Read(INPUT_KEY,custom/bienvenida_goigo,1,,1,8)
 same => n,Verbose(1, --- DTMF Recibido de \${CLIENT_PHONE}: \${INPUT_KEY} ---)
 ; Enviar selección a nuestro sistema en tiempo real
 same => n,System(curl -X POST -H "Content-Type: application/json" -d '{"callId":"\${CALL_ID}", "phone":"\${CLIENT_PHONE}", "dtmf":"\${INPUT_KEY}"}' http://YOUR_SERVER_IP:3000/api/ivr/webhook)
 ; Ejecutar acción según selección
 same => n,GotoIf($["\${INPUT_KEY}" = "1"]?interesado,1)
 same => n,GotoIf($["\${INPUT_KEY}" = "2"]?agendar,1)
 same => n,GotoIf($["\${INPUT_KEY}" = "3"]?baja,1)
 same => n,GotoIf($["\${INPUT_KEY}" = "4"]?agente,1)
 same => n,Goto(no_valido,1)

exten => interesado,1,Playback(custom/gracias_interes)
 same => n,Hangup()

exten => agendar,1,Playback(custom/gracias_agendar)
 same => n,Hangup()

exten => baja,1,Playback(custom/baja_confirmada)
 same => n,Hangup()

exten => agente,1,Playback(custom/transfiriendo_agente)
 same => n,Dial(SIP/100,20) ; Llama a la extensión interna 100 de tu PBX
 same => n,Hangup()

exten => no_valido,1,Playback(custom/error_opcion)
 same => n,Hangup()`;

  const asteriskAmiConfig = `; Configuración en /etc/asterisk/manager.conf para que Goigo IVR lance llamadas
[${pbxConfig.username}]
secret = ${pbxConfig.secret}
deny = 0.0.0.0/0.0.0.0
permit = 127.0.0.1/255.255.255.255
permit = YOUR_NODE_SERVER_IP/255.255.255.255
read = system,call,log,verbose,agent,user,config,dtmf
write = system,call,agent,user,originate`;

  const triggerCallScript = `// Endpoint interno que se puede llamar para realizar marcaciones automáticas desde NodeJS usando AMI
import Net from 'net';

function originateCall(clientPhone, clientName) {
  const client = new Net.Socket();
  client.connect(${pbxConfig.port}, '${pbxConfig.host}', () => {
    client.write('Action: Login\\r\\nUsername: ${pbxConfig.username}\\r\\nSecret: ${pbxConfig.secret}\\r\\n\\r\\n');
  });

  client.on('data', (data) => {
    const response = data.toString();
    if (response.includes('Success') && response.includes('Authentication accepted')) {
      // Lanzar llamada saliente a través del Trunk de llamadas propio
      const originateCmd = \`Action: Originate\\r\\n\` +
        \`Channel: SIP/${pbxConfig.sipTrunkName}/\${clientPhone}\\r\\n\` +
        \`Context: ivr-goigo-context\\r\\n\` +
        \`Exten: s\\r\\n\` +
        \`Priority: 1\\r\\n\` +
        \`CallerID: "IVR Goigo" <\${clientPhone}>\\r\\n\` +
        \`Variable: name=\${clientName}\\r\\n\` +
        \`Async: true\\r\\n\\r\\n\`;
      client.write(originateCmd);
    }
  });
}`;

  // Simulator timer effect
  const durationInterval = useRef<any>(null);
  useEffect(() => {
    if (simCallState === 'CONNECTED' || simCallState === 'PLAYING_AUDIO') {
      durationInterval.current = setInterval(() => {
        setSimDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    }
    return () => clearInterval(durationInterval.current);
  }, [simCallState]);

  // Connect/Disconnect Mock PBX
  const handleTogglePbx = () => {
    setPbxConfig(prev => ({ ...prev, isConnected: !prev.isConnected }));
  };

  // Trigger Mock Call
  const startSimCall = () => {
    if (!simPhone) return;
    setSimDuration(0);
    setSimKeyPressed(null);
    setSimCallState('DIALING');
    setSimLog([`[${new Date().toLocaleTimeString()}] Inicializando conexión AMI con Asterisk...`]);
    
    // Step 1: Dialing
    setTimeout(() => {
      setSimCallState('RINGING');
      setSimLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Canal SIP originado con Trunk '${pbxConfig.sipTrunkName}' hacia ${simPhone}. Estado: Sonando...`]);
    }, 1500);

    // Step 2: Answered
    setTimeout(() => {
      setSimCallState('CONNECTED');
      setSimLog(prev => [
        ...prev, 
        `[${new Date().toLocaleTimeString()}] Llamada contestada por el cliente.`,
        `[${new Date().toLocaleTimeString()}] Ejecutando webhook inicial 'CONECTADO' hacia nuestro servidor...`
      ]);
      // Add active lead to top of state
      const newLead: LeadIVR = {
        id: Math.random().toString(),
        name: simName || 'Cliente Anónimo',
        phone: simPhone,
        status: 'CONECTADO',
        dtmf: '',
        duration: 0,
        timestamp: new Date().toLocaleTimeString().substring(0, 5)
      };
      setSimActiveLead(newLead);
      setLeads(prev => [newLead, ...prev]);
    }, 4000);

    // Step 3: Playing Audio
    setTimeout(() => {
      setSimCallState('PLAYING_AUDIO');
      setSimLog(prev => [
        ...prev, 
        `[${new Date().toLocaleTimeString()}] Reproduciendo audio de campaña: "${campaignFlow.welcomeText.substring(0, 50)}..."`,
        `[${new Date().toLocaleTimeString()}] PBX esperando pulsación DTMF de tecla (1, 2, 3 o 4)`
      ]);

      if (campaignFlow.welcomeAudioUrl) {
        if (audioRef.current) audioRef.current.pause();
        audioRef.current = new Audio(campaignFlow.welcomeAudioUrl);
        audioRef.current.play().catch(e => console.log("Sim play error:", e));
      } else {
        const speech = new SpeechSynthesisUtterance(campaignFlow.welcomeText);
        speech.lang = 'es-ES';
        window.speechSynthesis.speak(speech);
      }
    }, 6000);
  };

  // Simulating Key Press
  const pressSimKey = (key: string) => {
    if (simCallState !== 'PLAYING_AUDIO' && simCallState !== 'CONNECTED') return;
    setSimKeyPressed(key);

    if (audioRef.current) {
      audioRef.current.pause();
    }
    window.speechSynthesis.cancel();
    
    // Find the mapping text/action
    const actionObj = campaignFlow.keyActions[key as '1' | '2' | '3' | '4'];
    const logMsg = `[${new Date().toLocaleTimeString()}] Cliente pulsó tecla DTMF: [${key}] (${actionObj.label})`;
    setSimLog(prev => [...prev, logMsg]);

    // Play transition audio response
    setTimeout(() => {
      setSimLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] PBX reproduce audio de acción: "${actionObj.audioText}"`]);
      const speech = new SpeechSynthesisUtterance(actionObj.audioText);
      speech.lang = 'es-ES';
      window.speechSynthesis.speak(speech);
    }, 1000);

    // Finish call
    setTimeout(() => {
      setSimCallState('COMPLETED');
      setSimLog(prev => [
        ...prev, 
        `[${new Date().toLocaleTimeString()}] Fin de llamada. Enviando webhook final DTMF='${key}' al servidor.`,
        `[${new Date().toLocaleTimeString()}] Canal SIP colgado de forma segura (Hangup).`
      ]);

      window.speechSynthesis.cancel();

      // Update leads state
      setLeads(prev => prev.map(l => {
        if (simActiveLead && l.id === simActiveLead.id) {
          return {
            ...l,
            status: 'COMPLETED',
            dtmf: key,
            duration: simDuration + 4,
            notes: actionObj.label
          };
        }
        return l;
      }));
      setSimActiveLead(null);
    }, 4500);
  };

  // Cancel Sim Call
  const stopSimCall = () => {
    if (simCallState === 'IDLE' || simCallState === 'COMPLETED') return;
    setSimCallState('COMPLETED');
    setSimLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Interrupción forzada. Llamada cancelada.`]);

    if (audioRef.current) {
      audioRef.current.pause();
    }
    window.speechSynthesis.cancel();
    
    setLeads(prev => prev.map(l => {
      if (simActiveLead && l.id === simActiveLead.id) {
        return {
          ...l,
          status: 'FALLIDO',
          duration: simDuration,
          notes: 'Llamada colgada manualmente'
        };
      }
      return l;
    }));
    setSimActiveLead(null);
  };

  // Copy helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  // Analytics Math
  const totalCalls = leads.length;
  const completedCalls = leads.filter(l => l.status === 'COMPLETED').length;
  const answeredRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;
  
  const dtmfCounts = {
    '1': leads.filter(l => l.dtmf === '1').length,
    '2': leads.filter(l => l.dtmf === '2').length,
    '3': leads.filter(l => l.dtmf === '3').length,
    '4': leads.filter(l => l.dtmf === '4').length,
  };

  const chartData = [
    { name: 'Interés Placas (1)', value: dtmfCounts['1'], color: '#10b981' },
    { name: 'Agendar Seguimiento (2)', value: dtmfCounts['2'], color: '#3b82f6' },
    { name: 'Darse de baja (3)', value: dtmfCounts['3'], color: '#ef4444' },
    { name: 'Conectar Agente (4)', value: dtmfCounts['4'], color: '#8b5cf6' }
  ];

  return (
    <div className="min-h-screen bg-[#070913] text-white p-4 sm:p-8 font-sans">
      
      {/* Upper Navigation & Branding Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-[#0d1227] border border-white/5 rounded-[2rem] p-6 lg:p-8 shadow-2xl gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-cyan-500/20">
              <PhoneCall className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  GOIGO <span className="font-light not-italic text-white">IVR</span>
                </h1>
                <span className="bg-cyan-500/10 text-cyan-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-cyan-500/20 uppercase tracking-widest">
                  Custom PBX Engine
                </span>
              </div>
              <p className="text-white/60 text-xs sm:text-sm mt-1">
                Plataforma limpia para control de llamadas automáticas, captura de DTMF y CRM en tiempo real
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Connection Widget */}
            <div className={`flex items-center space-x-3 px-5 py-3 rounded-2xl border text-sm font-semibold transition-all w-full sm:w-auto justify-between ${
              pbxConfig.isConnected 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pbxConfig.isConnected ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${pbxConfig.isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                </span>
                <span className="uppercase text-xs tracking-wider">
                  {pbxConfig.isConnected ? 'Asterisk Conectado' : 'Asterisk Desconectado'}
                </span>
              </div>
              <button 
                onClick={handleTogglePbx}
                className={`text-xs px-3 py-1 rounded-lg font-bold border transition-all ${
                  pbxConfig.isConnected 
                    ? 'bg-emerald-600/20 text-emerald-400 border-emerald-400/30 hover:bg-emerald-600/30' 
                    : 'bg-red-600/20 text-red-400 border-red-400/30 hover:bg-red-600/30'
                }`}
              >
                {pbxConfig.isConnected ? 'Desconectar' : 'Conectar PBX'}
              </button>
            </div>

            {/* General Tabs Selector */}
            <div className="flex bg-[#070913] p-1.5 rounded-2xl border border-white/5 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('monitor')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex-1 sm:flex-initial justify-center ${activeTab === 'monitor' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-white/60 hover:text-white'}`}
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Simulador</span>
              </button>
              <button
                onClick={() => setActiveTab('campaign')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex-1 sm:flex-initial justify-center ${activeTab === 'campaign' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-white/60 hover:text-white'}`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Flujo IVR</span>
              </button>
              <button
                onClick={() => setActiveTab('leads')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex-1 sm:flex-initial justify-center ${activeTab === 'leads' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-white/60 hover:text-white'}`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Leads / Respuestas</span>
              </button>
              <button
                onClick={() => setActiveTab('pbx')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex-1 sm:flex-initial justify-center ${activeTab === 'pbx' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-white/60 hover:text-white'}`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>PBX Config</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex-1 sm:flex-initial justify-center ${activeTab === 'analytics' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-white/60 hover:text-white'}`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Métricas</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: PBX & CALL MONITOR SIMULATOR */}
          {activeTab === 'monitor' && (
            <motion.div
              key="monitor"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              
              {/* Left Column: Trigger Panel */}
              <div className="bg-[#0d1227] border border-white/5 rounded-[2rem] p-6 sm:p-8 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-black uppercase tracking-tight text-white flex items-center space-x-2">
                      <PhoneOutgoing className="text-cyan-400 w-5 h-5" />
                      <span>Lanzador de Pruebas</span>
                    </h2>
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  </div>
                  
                  <p className="text-white/60 text-xs mb-6 leading-relaxed">
                    Esta herramienta te permite simular en tiempo real cómo tu PBX (Asterisk/SIP) realiza una llamada telefónica saliente, procesa la respuesta del cliente y detecta las pulsaciones DTMF.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-white/40 tracking-wider mb-2">Nombre del Lead</label>
                      <input 
                        type="text" 
                        value={simName}
                        onChange={(e) => setSimName(e.target.value)}
                        placeholder="Ej. Juan Carlos López"
                        disabled={simCallState !== 'IDLE' && simCallState !== 'COMPLETED'}
                        className="w-full bg-[#070913] border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white focus:outline-none focus:border-cyan-500/50 transition-all disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-white/40 tracking-wider mb-2">Número de Teléfono (SIP/Trunk)</label>
                      <input 
                        type="text" 
                        value={simPhone}
                        onChange={(e) => setSimPhone(e.target.value)}
                        placeholder="Ej. +34600112233"
                        disabled={simCallState !== 'IDLE' && simCallState !== 'COMPLETED'}
                        className="w-full bg-[#070913] border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white focus:outline-none focus:border-cyan-500/50 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  {simCallState === 'IDLE' || simCallState === 'COMPLETED' ? (
                    <button
                      onClick={startSimCall}
                      className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/10"
                    >
                      <Play className="w-4 h-4 fill-black" />
                      <span>Iniciar Simulación IVR</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopSimCall}
                      className="w-full bg-red-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span>Colgar / Interrumpir</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Middle Column: Call Simulator State Canvas */}
              <div className="lg:col-span-2 bg-[#0d1227] border border-white/5 rounded-[2rem] p-6 sm:p-8 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                    <div>
                      <h2 className="text-lg font-black uppercase tracking-tight text-white">Canal SIP Activo (Simulador PBX)</h2>
                      <p className="text-xs text-white/40">Visualización de eventos y respuesta telefónica</p>
                    </div>
                    {simCallState !== 'IDLE' && (
                      <div className="flex items-center space-x-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <span className="font-mono text-sm font-bold text-cyan-400">
                          00:{simDuration < 10 ? `0${simDuration}` : simDuration}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Simulator Screen */}
                  <div className="bg-[#070913] border border-white/5 rounded-[2rem] p-6 mb-6 min-h-[220px] flex flex-col justify-center items-center text-center relative overflow-hidden">
                    
                    {/* Background audio wave decor */}
                    {(simCallState === 'CONNECTED' || simCallState === 'PLAYING_AUDIO') && (
                      <div className="absolute inset-x-0 bottom-0 flex justify-center items-end h-20 opacity-30 gap-1 px-4 pointer-events-none">
                        {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map((bar) => (
                          <div 
                            key={bar} 
                            style={{ 
                              height: `${Math.floor(Math.random() * 80) + 10}%`,
                              animationDuration: `${0.4 + Math.random() * 0.8}s` 
                            }} 
                            className="bg-cyan-500 w-1 rounded-t-full animate-pulse"
                          />
                        ))}
                      </div>
                    )}

                    {simCallState === 'IDLE' && (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/30 mx-auto border border-white/5">
                          <Phone className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-white/80 font-bold text-lg">Línea Telefónica Libre</p>
                          <p className="text-white/40 text-xs max-w-sm mx-auto mt-1">Configura un lead a la izquierda e inicia la simulación para probar el árbol de decisiones del IVR.</p>
                        </div>
                      </div>
                    )}

                    {simCallState === 'DIALING' && (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center text-cyan-400 mx-auto border border-cyan-500/20 animate-bounce">
                          <PhoneOutgoing className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-white/80 font-bold text-lg">Marcando a través de Trunk SIP...</p>
                          <p className="text-cyan-400 text-sm font-mono mt-1">{simPhone}</p>
                          <p className="text-white/30 text-[10px] uppercase tracking-widest mt-4">Iniciando protocolo de llamada SIP</p>
                        </div>
                      </div>
                    )}

                    {simCallState === 'RINGING' && (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-400 mx-auto border border-yellow-500/20 animate-pulse">
                          <PhoneIncoming className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-white/80 font-bold text-lg">Llamando (Ringing)...</p>
                          <p className="text-yellow-400 text-sm font-mono mt-1">{simPhone}</p>
                          <p className="text-white/30 text-[10px] uppercase tracking-widest mt-4">Esperando respuesta del destinatario</p>
                        </div>
                      </div>
                    )}

                    {simCallState === 'CONNECTED' && (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mx-auto border border-emerald-500/20">
                          <Check className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-white/80 font-bold text-lg">¡Llamada Contestada!</p>
                          <p className="text-emerald-400 text-sm font-mono mt-1">{simPhone} - {simName}</p>
                          <p className="text-white/40 text-xs mt-3">Estableciendo flujo de audio bidireccional...</p>
                        </div>
                      </div>
                    )}

                    {simCallState === 'PLAYING_AUDIO' && (
                      <div className="space-y-4 max-w-lg z-10">
                        <div className="flex items-center justify-center space-x-2 text-cyan-400 text-sm font-bold uppercase tracking-widest animate-pulse">
                          <Volume2 className="w-5 h-5" />
                          <span>Reproduciendo Audio Campaña</span>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                          <p className="text-white/90 italic text-sm leading-relaxed">
                            "{campaignFlow.welcomeText}"
                          </p>
                        </div>
                        <p className="text-white/40 text-xs">Simula que el cliente responde pulsando uno de los números en el teclado abajo:</p>
                      </div>
                    )}

                    {simCallState === 'COMPLETED' && (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white mx-auto border border-white/5">
                          <Square className="w-6 h-6 fill-white" />
                        </div>
                        <div>
                          <p className="text-white/80 font-bold text-lg">Llamada Finalizada (Hangup)</p>
                          {simKeyPressed ? (
                            <span className="inline-block bg-cyan-500/10 text-cyan-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-cyan-500/20 mt-2">
                              Opción Registrada: Tecla {simKeyPressed}
                            </span>
                          ) : (
                            <span className="inline-block bg-white/5 text-white/50 text-xs font-bold px-3 py-1.5 rounded-xl border border-white/5 mt-2">
                              Sin selección de teclado
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Keyboard DTMF simulation */}
                  {(simCallState === 'CONNECTED' || simCallState === 'PLAYING_AUDIO') && (
                    <div className="mt-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-xs text-white/60 font-bold mb-3 uppercase tracking-wider text-center">Teclado DTMF de Respuesta del Cliente</p>
                      <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                        {['1', '2', '3', '4'].map((key) => {
                          const act = campaignFlow.keyActions[key as '1' | '2' | '3' | '4'];
                          return (
                            <button
                              key={key}
                              onClick={() => pressSimKey(key)}
                              className={`p-4 rounded-2xl flex flex-col items-center justify-center border text-center transition-all cursor-pointer ${
                                simKeyPressed === key 
                                  ? 'bg-cyan-500 text-black border-cyan-400 scale-[0.96] shadow-lg shadow-cyan-500/20' 
                                  : 'bg-[#070913] text-white border-white/5 hover:border-white/20 hover:bg-white/5'
                              }`}
                            >
                              <span className="text-2xl font-black">{key}</span>
                              <span className={`text-[9px] mt-1 line-clamp-1 opacity-70 ${simKeyPressed === key ? 'text-black' : 'text-white/50'}`}>
                                {act.label.split(' ')[0]}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Logs Screen */}
                  <div className="mt-4">
                    <span className="block text-[10px] font-bold uppercase text-white/40 tracking-wider mb-2">Logs de Eventos Asterisk AMI / Webhooks (Tiempo Real)</span>
                    <div className="bg-[#070913] rounded-2xl p-4 border border-white/5 font-mono text-[11px] space-y-2 max-h-36 overflow-y-auto scrollbar-thin">
                      {simLog.length === 0 ? (
                        <span className="text-white/30 italic">No hay actividad en curso...</span>
                      ) : (
                        simLog.map((log, index) => (
                          <div key={index} className="text-white/80 border-l border-cyan-500/20 pl-2">
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 2: IVR FLOW & KEY CONFIG */}
          {activeTab === 'campaign' && (
            <motion.div
              key="campaign"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              
              {/* Campaign Welcome Config */}
              <div className="bg-[#0d1227] border border-white/5 rounded-[2rem] p-6 sm:p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-tight text-white flex items-center space-x-2">
                      <Volume2 className="text-cyan-400 w-5 h-5" />
                      <span>Mensaje de Bienvenida del IVR</span>
                    </h2>
                    <p className="text-xs text-white/40">Configura el audio que escuchará el cliente nada más contestar la llamada</p>
                  </div>
                  <div className="flex items-center space-x-2 bg-[#070913] p-1 rounded-xl border border-white/5">
                    <button 
                      onClick={() => setCampaignFlow(prev => ({ ...prev, useTts: true }))}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${campaignFlow.useTts ? 'bg-cyan-500 text-black' : 'text-white/60 hover:text-white'}`}
                    >
                      Text-to-Speech (Voz AI)
                    </button>
                    <button 
                      onClick={() => setCampaignFlow(prev => ({ ...prev, useTts: false }))}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${!campaignFlow.useTts ? 'bg-cyan-500 text-black' : 'text-white/60 hover:text-white'}`}
                    >
                      Archivo de Audio (.WAV)
                    </button>
                  </div>
                </div>

                {campaignFlow.useTts ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-white/40 tracking-wider mb-2">Locución del Mensaje (En Español)</label>
                      <textarea 
                        value={campaignFlow.welcomeText}
                        onChange={(e) => setCampaignFlow(prev => ({ ...prev, welcomeText: e.target.value }))}
                        rows={4}
                        className="w-full bg-[#070913] border border-white/10 rounded-2xl p-4 text-sm font-semibold text-white focus:outline-none focus:border-cyan-500/50 transition-all leading-relaxed"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-white/40 tracking-wider mb-2">Voz del Sintetizador</label>
                        <select 
                          value={campaignFlow.ttsVoice}
                          onChange={(e) => setCampaignFlow(prev => ({ ...prev, ttsVoice: e.target.value }))}
                          className="w-full bg-[#070913] border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                        >
                          <option value="es-ES-Neural2-F">Español de España - Laura (Voz Femenina Natural Neural2)</option>
                          <option value="es-ES-Wavenet-C">Español de España - Voz Femenina (Wavenet C)</option>
                          <option value="es-ES-Wavenet-D">Español de España - Voz Masculina (Wavenet D)</option>
                          <option value="es-LA-Wavenet-A">Español Latinoamericano - Voz Femenina (Wavenet A)</option>
                        </select>
                      </div>
                      <div className="bg-[#070913] p-4 rounded-2xl border border-white/5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                          <p className="text-xs font-bold text-white">Pruebas de Audio y Locución</p>
                          <p className="text-[10px] text-white/40 mt-1">Genera o escucha la locución mediante el sintetizador integrado o Gemini</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button 
                            onClick={() => {
                              const speech = new SpeechSynthesisUtterance(campaignFlow.welcomeText);
                              speech.lang = 'es-ES';
                              window.speechSynthesis.speak(speech);
                            }}
                            className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Escuchar Local</span>
                          </button>
                          <button 
                            onClick={handleGenerateTts}
                            disabled={generatingTts}
                            className="bg-cyan-500 text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                          >
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                            <span>{generatingTts ? 'Generando...' : 'Generar Real (Voz IA)'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#070913] border border-dashed border-white/10 rounded-2xl p-8 text-center flex flex-col items-center justify-center relative">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="audio/*" 
                      onChange={handleFileUpload} 
                    />
                    <FileAudio className="w-12 h-12 text-cyan-400 mb-3" />
                    <p className="text-sm font-bold text-white">Arrastra o sube tu archivo .WAV de campaña</p>
                    <p className="text-[10px] text-white/40 mt-1 max-w-sm">Recomendado: Mono, 8000Hz o 16000Hz PCM, 16 bits (Formatos estándar compatibles con Asterisk PBX / SIP)</p>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="bg-cyan-500 text-black px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider mt-4 hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      {uploading ? 'Subiendo...' : 'Seleccionar Archivo Audio'}
                    </button>
                  </div>
                )}

                {/* Shared Active Audio File Preview */}
                {campaignFlow.welcomeAudioUrl && (
                  <div className="mt-6 bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400">
                        <Volume2 className="w-5 h-5 animate-bounce" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Audio Activo Registrado para el IVR</p>
                        <p className="text-[10px] text-cyan-400 font-mono mt-0.5">{campaignFlow.welcomeAudioUrl}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handlePlayAudio(campaignFlow.welcomeAudioUrl)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                          playStatus === campaignFlow.welcomeAudioUrl 
                            ? 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30' 
                            : 'bg-cyan-500 text-black border-cyan-400 hover:brightness-110'
                        }`}
                      >
                        {playStatus === campaignFlow.welcomeAudioUrl ? 'Detener' : 'Escuchar WAV'}
                      </button>
                      <button 
                        onClick={() => setCampaignFlow(prev => ({ ...prev, welcomeAudioUrl: '' }))}
                        className="bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 p-2 rounded-xl text-white/60 transition-all"
                        title="Eliminar audio activo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* DTMF Actions Builder */}
              <div className="bg-[#0d1227] border border-white/5 rounded-[2rem] p-6 sm:p-8 shadow-xl">
                <div className="mb-6 border-b border-white/5 pb-4">
                  <h2 className="text-lg font-black uppercase tracking-tight text-white flex items-center space-x-2">
                    <Sliders className="text-cyan-400 w-5 h-5" />
                    <span>Configuración de Teclado DTMF (Árbol de Decisiones)</span>
                  </h2>
                  <p className="text-xs text-white/40">Define qué ocurre exactamente cuando un cliente presiona una tecla numérica en su teléfono móvil</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['1', '2', '3', '4'].map((key) => {
                    const actionItem = campaignFlow.keyActions[key as '1' | '2' | '3' | '4'];
                    return (
                      <div key={key} className="bg-[#070913] border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                            <div className="flex items-center space-x-3">
                              <span className="w-8 h-8 bg-cyan-500 text-black rounded-lg flex items-center justify-center font-black text-lg">
                                {key}
                              </span>
                              <span className="text-xs font-black uppercase text-white/60 tracking-wider">Acción Teclado</span>
                            </div>
                            <span className="text-[10px] bg-white/5 px-2.5 py-1 rounded-md text-cyan-400 border border-white/5 font-mono uppercase">
                              Tecla {key}
                            </span>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Nombre / Etiqueta de la acción</label>
                              <input 
                                type="text"
                                value={actionItem.label}
                                onChange={(e) => {
                                  const updatedActions = { ...campaignFlow.keyActions };
                                  updatedActions[key as '1' | '2' | '3' | '4'].label = e.target.value;
                                  setCampaignFlow(prev => ({ ...prev, keyActions: updatedActions }));
                                }}
                                className="w-full bg-[#0d1227] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500/50"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Acción del Backend</label>
                              <select 
                                value={actionItem.action}
                                onChange={(e) => {
                                  const updatedActions = { ...campaignFlow.keyActions };
                                  updatedActions[key as '1' | '2' | '3' | '4'].action = e.target.value;
                                  setCampaignFlow(prev => ({ ...prev, keyActions: updatedActions }));
                                }}
                                className="w-full bg-[#0d1227] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none"
                              >
                                <option value="TAG_INTEREST">Marcar con Interés Comercial (CRM)</option>
                                <option value="SCHEDULE_CALL">Agendar Llamada de Seguimiento</option>
                                <option value="OPT_OUT">Baja de Base de Datos (Lista Negra)</option>
                                <option value="TRANSFER">Transferir Llamada (SIP Transfer / Dial)</option>
                              </select>
                            </div>

                            {actionItem.action === 'TRANSFER' && (
                              <div>
                                <label className="block text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Extensión PBX Destino</label>
                                <input 
                                  type="text"
                                  value={actionItem.redirectExt || ''}
                                  onChange={(e) => {
                                    const updatedActions = { ...campaignFlow.keyActions };
                                    updatedActions[key as '1' | '2' | '3' | '4'].redirectExt = e.target.value;
                                    setCampaignFlow(prev => ({ ...prev, keyActions: updatedActions }));
                                  }}
                                  placeholder="Ej. 100 o SIP/agente-01"
                                  className="w-full bg-[#0d1227] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500/50"
                                />
                              </div>
                            )}

                            <div>
                              <label className="block text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Locución de Respuesta Final</label>
                              <textarea 
                                value={actionItem.audioText}
                                onChange={(e) => {
                                  const updatedActions = { ...campaignFlow.keyActions };
                                  updatedActions[key as '1' | '2' | '3' | '4'].audioText = e.target.value;
                                  setCampaignFlow(prev => ({ ...prev, keyActions: updatedActions }));
                                }}
                                rows={2}
                                className="w-full bg-[#0d1227] border border-white/10 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500/50"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 3: LEADS & CRM RESPONSES */}
          {activeTab === 'leads' && (
            <motion.div
              key="leads"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              
              {/* Filter controls and Lead counts */}
              <div className="bg-[#0d1227] border border-white/5 rounded-[2rem] p-6 sm:p-8 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-6 gap-4">
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-tight text-white">Registro de Llamadas IVR y Clientes</h2>
                    <p className="text-xs text-white/40">Visualiza el historial completo de llamadas automáticas lanzadas con su selección correspondiente</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <button 
                      onClick={() => setLeads([])}
                      className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-500/20 transition-all flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Limpiar Datos</span>
                    </button>
                    <button 
                      onClick={() => copyToClipboard(JSON.stringify(leads, null, 2), 'leads')}
                      className="bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all flex items-center space-x-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{copiedSection === 'leads' ? '¡Copiado!' : 'Exportar JSON'}</span>
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto mt-6">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        <th className="py-4 px-4">Cliente / Contacto</th>
                        <th className="py-4 px-4">Teléfono</th>
                        <th className="py-4 px-4">Fecha / Hora</th>
                        <th className="py-4 px-4">Estado SIP</th>
                        <th className="py-4 px-4">Respuesta DTMF</th>
                        <th className="py-4 px-4 text-center">Duración</th>
                        <th className="py-4 px-4">Notas de Campaña</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm font-semibold">
                      {leads.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-white/30 italic">
                            No hay llamadas registradas en este momento. Utiliza el Simulador en la primera pestaña para lanzar llamadas de prueba.
                          </td>
                        </tr>
                      ) : (
                        leads.map((lead) => {
                          let badgeBg = 'bg-white/5 text-white/50 border-white/5';
                          let dtmfText = 'Sin Selección';
                          let dtmfColor = 'bg-[#070913] text-white/40 border-white/10';

                          if (lead.dtmf === '1') {
                            dtmfText = 'Tecla 1: Interés';
                            dtmfColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                          } else if (lead.dtmf === '2') {
                            dtmfText = 'Tecla 2: Agendar';
                            dtmfColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                          } else if (lead.dtmf === '3') {
                            dtmfText = 'Tecla 3: Baja';
                            dtmfColor = 'bg-red-500/10 text-red-400 border-red-500/20';
                          } else if (lead.dtmf === '4') {
                            dtmfText = 'Tecla 4: Agente';
                            dtmfColor = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
                          }

                          if (lead.status === 'CONECTADO') badgeBg = 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20';
                          else if (lead.status === 'LLAMANDO') badgeBg = 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20 animate-pulse';
                          else if (lead.status === 'COMPLETADO') badgeBg = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
                          else if (lead.status === 'FALLIDO') badgeBg = 'bg-red-500/15 text-red-400 border-red-500/20';

                          return (
                            <tr key={lead.id} className="hover:bg-white/2 transition-colors">
                              <td className="py-4 px-4 flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/60">
                                  <User className="w-4 h-4" />
                                </div>
                                <span className="text-white font-bold">{lead.name}</span>
                              </td>
                              <td className="py-4 px-4 font-mono text-xs text-white/70">{lead.phone}</td>
                              <td className="py-4 px-4 text-xs text-white/50">{lead.timestamp}</td>
                              <td className="py-4 px-4">
                                <span className={`inline-block border rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeBg}`}>
                                  {lead.status}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`inline-block border rounded-xl px-2.5 py-1 text-xs font-bold ${dtmfColor}`}>
                                  {dtmfText}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center font-mono text-xs text-white/80">{lead.duration}s</td>
                              <td className="py-4 px-4 text-xs text-white/60 italic max-w-xs truncate">{lead.notes || 'Ninguna'}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 4: PBX CONFIG & CODE INTEGRATION */}
          {activeTab === 'pbx' && (
            <motion.div
              key="pbx"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              
              {/* PBX Credentials Form */}
              <div className="bg-[#0d1227] border border-white/5 rounded-[2rem] p-6 sm:p-8 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                    <h2 className="text-lg font-black uppercase tracking-tight text-white flex items-center space-x-2">
                      <Settings className="text-cyan-400 w-5 h-5" />
                      <span>Ajustes de Servidor PBX</span>
                    </h2>
                    <span className="bg-cyan-500/10 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono">AMI</span>
                  </div>

                  <p className="text-white/60 text-xs mb-6 leading-relaxed">
                    Configura las credenciales de tu servidor Asterisk local para habilitar la marcación automática saliente usando el protocolo AMI (Asterisk Manager Interface).
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-white/40 tracking-wider mb-2">Sistema VoIP Propio</label>
                      <select 
                        value={pbxConfig.pbxType}
                        onChange={(e: any) => setPbxConfig(prev => ({ ...prev, pbxType: e.target.value }))}
                        className="w-full bg-[#070913] border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                      >
                        <option value="asterisk">Asterisk (Consola Pura)</option>
                        <option value="freepbx">FreePBX Panel</option>
                        <option value="issabel">Issabel PBX Server</option>
                        <option value="custom_sip">SIP Softswitch / Gateway VoIP</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold uppercase text-white/40 tracking-wider mb-2">Host / Dirección IP</label>
                        <input 
                          type="text"
                          value={pbxConfig.host}
                          onChange={(e) => setPbxConfig(prev => ({ ...prev, host: e.target.value }))}
                          placeholder="192.168.1.100"
                          className="w-full bg-[#070913] border border-white/10 rounded-2xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-white/40 tracking-wider mb-2">Puerto AMI</label>
                        <input 
                          type="text"
                          value={pbxConfig.port}
                          onChange={(e) => setPbxConfig(prev => ({ ...prev, port: e.target.value }))}
                          placeholder="5038"
                          className="w-full bg-[#070913] border border-white/10 rounded-2xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-white/40 tracking-wider mb-2">Nombre de Usuario AMI</label>
                      <input 
                        type="text"
                        value={pbxConfig.username}
                        onChange={(e) => setPbxConfig(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="goigouser"
                        className="w-full bg-[#070913] border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-white/40 tracking-wider mb-2">Contraseña Secreta AMI (Secret)</label>
                      <input 
                        type="password"
                        value={pbxConfig.secret}
                        onChange={(e) => setPbxConfig(prev => ({ ...prev, secret: e.target.value }))}
                        placeholder="••••••••••••••"
                        className="w-full bg-[#070913] border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-white/40 tracking-wider mb-2">Identificador del Trunk SIP Propio</label>
                      <input 
                        type="text"
                        value={pbxConfig.sipTrunkName}
                        onChange={(e) => setPbxConfig(prev => ({ ...prev, sipTrunkName: e.target.value }))}
                        placeholder="Trunk_SIP_Propio"
                        className="w-full bg-[#070913] border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white focus:outline-none"
                      />
                      <p className="text-[10px] text-white/30 mt-1">Este identificador define la ruta de salida de tus llamadas de forma gratuita.</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleTogglePbx}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all mt-6 ${
                    pbxConfig.isConnected 
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                      : 'bg-white text-black hover:bg-white/90 shadow-lg shadow-white/5'
                  }`}
                >
                  {pbxConfig.isConnected ? '✓ PBX Conectado Satisfactoriamente' : 'Verificar Conexión de Servidor'}
                </button>
              </div>

              {/* PBX Setup Code Documentation */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Dialplan Asterisk Guide */}
                <div className="bg-[#0d1227] border border-white/5 rounded-[2rem] p-6 sm:p-8 shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-sm font-black uppercase text-cyan-400 tracking-wider">1. Configuración de Dialplan Asterisk (extensions.conf)</h3>
                      <p className="text-xs text-white/40">Copia este bloque de código dentro del archivo de configuración de tu centralita Asterisk para capturar la respuesta y DTMF del cliente</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(asteriskDialplan, 'dialplan')}
                      className="bg-[#070913] border border-white/5 hover:border-white/10 p-2 rounded-xl text-white/60 hover:text-white transition-all flex items-center space-x-1"
                    >
                      <Copy className="w-4 h-4" />
                      <span className="text-[10px] uppercase font-bold">{copiedSection === 'dialplan' ? '¡Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                  <pre className="bg-[#070913] p-4 rounded-xl border border-white/5 text-[10px] font-mono text-cyan-300 overflow-x-auto max-h-60 scrollbar-thin leading-relaxed">
                    {asteriskDialplan}
                  </pre>
                </div>

                {/* Manager AMI Config Guide */}
                <div className="bg-[#0d1227] border border-white/5 rounded-[2rem] p-6 sm:p-8 shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-sm font-black uppercase text-cyan-400 tracking-wider">2. Habilitar Acceso AMI (manager.conf)</h3>
                      <p className="text-xs text-white/40">Permite que nuestro servidor se conecte al puerto de comandos AMI para lanzar la llamada desde la interfaz gráfica</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(asteriskAmiConfig, 'ami')}
                      className="bg-[#070913] border border-white/5 hover:border-white/10 p-2 rounded-xl text-white/60 hover:text-white transition-all flex items-center space-x-1"
                    >
                      <Copy className="w-4 h-4" />
                      <span className="text-[10px] uppercase font-bold">{copiedSection === 'ami' ? '¡Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                  <pre className="bg-[#070913] p-4 rounded-xl border border-white/5 text-[10px] font-mono text-cyan-300 overflow-x-auto max-h-48 scrollbar-thin leading-relaxed">
                    {asteriskAmiConfig}
                  </pre>
                </div>

                {/* Script Originate NodeJS Guide */}
                <div className="bg-[#0d1227] border border-white/5 rounded-[2rem] p-6 sm:p-8 shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-sm font-black uppercase text-cyan-400 tracking-wider">3. Código de Conexión y Marcación desde NodeJS</h3>
                      <p className="text-xs text-white/40">Fragmento de código backend en NodeJS (Socket TCP) que automatiza las llamadas usando la línea propia de SIP</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(triggerCallScript, 'script')}
                      className="bg-[#070913] border border-white/5 hover:border-white/10 p-2 rounded-xl text-white/60 hover:text-white transition-all flex items-center space-x-1"
                    >
                      <Copy className="w-4 h-4" />
                      <span className="text-[10px] uppercase font-bold">{copiedSection === 'script' ? '¡Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                  <pre className="bg-[#070913] p-4 rounded-xl border border-white/5 text-[10px] font-mono text-cyan-300 overflow-x-auto max-h-56 scrollbar-thin leading-relaxed">
                    {triggerCallScript}
                  </pre>
                </div>

              </div>

            </motion.div>
          )}

          {/* TAB 5: ANALYTICS */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              
              {/* Bento-grid with top KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* KPI 1 */}
                <div className="bg-[#0d1227] border border-white/5 rounded-2xl p-6 shadow-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-white/40 tracking-wider">Llamadas Lanzadas</span>
                    <h3 className="text-3xl font-black text-white mt-1">{totalCalls}</h3>
                    <p className="text-[10px] text-cyan-400 font-semibold mt-1">Línea SIP Propia Activa</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <PhoneCall className="w-6 h-6" />
                  </div>
                </div>

                {/* KPI 2 */}
                <div className="bg-[#0d1227] border border-white/5 rounded-2xl p-6 shadow-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-white/40 tracking-wider">Tasa de Respuesta</span>
                    <h3 className="text-3xl font-black text-white mt-1">{answeredRate}%</h3>
                    <p className="text-[10px] text-emerald-400 font-semibold mt-1">Llamadas completas con éxito</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Check className="w-6 h-6" />
                  </div>
                </div>

                {/* KPI 3 */}
                <div className="bg-[#0d1227] border border-white/5 rounded-2xl p-6 shadow-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-white/40 tracking-wider">Interés Comercial</span>
                    <h3 className="text-3xl font-black text-emerald-400 mt-1">{dtmfCounts['1']} leads</h3>
                    <p className="text-[10px] text-white/40 mt-1">Clientes que pulsaron [1]</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                </div>

                {/* KPI 4 */}
                <div className="bg-[#0d1227] border border-white/5 rounded-2xl p-6 shadow-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-white/40 tracking-wider">Transferencias en Directo</span>
                    <h3 className="text-3xl font-black text-purple-400 mt-1">{dtmfCounts['4']} llamadas</h3>
                    <p className="text-[10px] text-white/40 mt-1">Desviadas a Extensión 100</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <PhoneIncoming className="w-6 h-6" />
                  </div>
                </div>

              </div>

              {/* Visual Charts using Recharts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Chart 1: DTMF Keystroke distribution */}
                <div className="bg-[#0d1227] border border-white/5 rounded-[2rem] p-6 sm:p-8 shadow-xl">
                  <h3 className="text-base font-black uppercase text-white tracking-tight mb-6">Distribución de Opciones DTMF (Teclado)</h3>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" stroke="#ffffff" fontSize={11} tickLine={false} />
                        <YAxis stroke="#ffffff" fontSize={11} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#070913', borderColor: 'rgba(255,255,255,0.1)' }} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Call results breakdown */}
                <div className="bg-[#0d1227] border border-white/5 rounded-[2rem] p-6 sm:p-8 shadow-xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-black uppercase text-white tracking-tight mb-6">Eficiencia de Marcación IVR</h3>
                    <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
                      
                      {/* Pie chart */}
                      <div className="w-48 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Completados', value: completedCalls },
                                { name: 'Fallidos/No Responde', value: totalCalls - completedCalls }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              <Cell fill="#10b981" />
                              <Cell fill="#ef4444" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Legend detail */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 rounded-full bg-emerald-500" />
                          <div>
                            <p className="text-xs text-white/50">Llamada Respondida y DTMF Capturado</p>
                            <p className="text-base font-bold text-white">{completedCalls} llamadas ({answeredRate}%)</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <div>
                            <p className="text-xs text-white/50">Llamadas Fallidas / Sin Respuesta / Ocupado</p>
                            <p className="text-base font-bold text-white">{totalCalls - completedCalls} llamadas ({100 - answeredRate}%)</p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
