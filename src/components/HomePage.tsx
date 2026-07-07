import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PhoneCall, 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  Zap, 
  Clock, 
  BarChart3, 
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  Headphones,
  Settings,
  Globe,
  ChevronDown,
  Sparkles,
  Cpu,
  Layers,
  MousePointer2,
  Play,
  Pause,
  Star,
  Lock,
  Rocket,
  ArrowUpRight
} from 'lucide-react';
import { translations } from '../translations';
import { ProjectType } from '../types';

interface HomePageProps {
  onStart: () => void;
  startCall: () => void;
  stopCall: () => void;
  isCalling: boolean;
  callingType: ProjectType | null;
  lastError: string | null;
}

const HomePage: React.FC<HomePageProps> = ({ onStart, startCall, stopCall, isCalling, callingType, lastError }) => {
  const [langOpen, setLangOpen] = useState(false);
  const [currentLangCode, setCurrentLangCode] = useState<'es' | 'en' | 'nl' | 'fr' | 'de' | 'ar'>('es');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const t = useMemo(() => {
    const es = (translations as any).es;
    const current = (translations as any)[currentLangCode] || es;
    
    // Función recursiva para mezclar traducciones (merge) con fallback a español
    const mergeWithFallback = (target: any, fallback: any) => {
      const result = { ...fallback };
      for (const key in target) {
        if (typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])) {
          result[key] = mergeWithFallback(target[key], fallback[key] || {});
        } else {
          result[key] = target[key];
        }
      }
      return result;
    };

    return mergeWithFallback(current, es);
  }, [currentLangCode]);

  const languages = [
    { name: 'Español', code: 'es', flag: '🇪🇸' },
    { name: 'English', code: 'en', flag: '🇺🇸' },
    { name: 'Nederlands', code: 'nl', flag: '🇳🇱' },
    { name: 'Français', code: 'fr', flag: '🇫🇷' },
    { name: 'Deutsch', code: 'de', flag: '🇩🇪' },
    { name: 'العربية', code: 'ar', flag: '🇸🇦' },
  ];

  const features = [
    {
      title: t.features.f1_title,
      desc: t.features.f1_desc,
      icon: <Layers className="w-6 h-6" />,
      color: "bg-blue-500",
      size: "col-span-2 row-span-1"
    },
    {
      title: t.features.f2_title,
      desc: t.features.f2_desc,
      icon: <Headphones className="w-6 h-6" />,
      color: "bg-emerald-500",
      size: "col-span-1 row-span-2"
    },
    {
      title: t.features.f3_title,
      desc: t.features.f3_desc,
      icon: <Zap className="w-6 h-6" />,
      color: "bg-amber-500",
      size: "col-span-1 row-span-1"
    },
    {
      title: t.features.f4_title,
      desc: t.features.f4_desc,
      icon: <Cpu className="w-6 h-6" />,
      color: "bg-indigo-500",
      size: "col-span-2 row-span-1"
    }
  ];

  const currentLangName = languages.find(l => l.code === currentLangCode)?.name || 'Español';

  return (
    <div className={`min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden ${currentLangCode === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-500 ${scrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 group-hover:rotate-12 transition-transform">
                <Zap className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-display font-bold tracking-tighter text-white uppercase italic">ELENA <span className="text-blue-500 font-light not-italic text-sm ml-1">AI</span></span>
            </div>
            
            <div className="hidden lg:flex items-center gap-10 text-[13px] font-bold uppercase tracking-widest text-white/60">
              <a href="#tecnologia" className="hover:text-emerald-500 transition-colors">{t.nav.tech}</a>
              <a href="#bento" className="hover:text-emerald-500 transition-colors">{t.nav.features}</a>
              <a href="#business" className="hover:text-emerald-500 transition-colors">{t.nav.business}</a>
              <a href="#contacto" className="hover:text-emerald-500 transition-colors">Contacto</a>
              
              <div className="relative">
                <button 
                  onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-2 hover:text-emerald-500 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>{currentLangName}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {langOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-4 w-48 glass-dark rounded-2xl shadow-2xl py-3 z-[110]"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setCurrentLangCode(lang.code as any);
                            setLangOpen(false);
                          }}
                          className="w-full text-left px-5 py-2.5 text-[11px] font-bold hover:bg-white/5 flex items-center gap-4 transition-colors text-white"
                        >
                          <span className="text-lg">{lang.flag}</span>
                          <span>{lang.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={onStart}
                className="bg-white text-black px-7 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-xl shadow-white/5"
              >
                {t.nav.access}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
          
          {/* Animated Particles */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: Math.random() * 1000 }}
                animate={{ 
                  opacity: [0, 0.5, 0], 
                  y: [Math.random() * 1000, Math.random() * 1000 - 500] 
                }}
                transition={{ 
                  duration: Math.random() * 10 + 10, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
                className="absolute w-1 h-1 bg-emerald-500 rounded-full"
                style={{ left: `${Math.random() * 100}%` }}
              />
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full glass border border-white/10 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8"
              >
                <Sparkles className="w-3 h-3" />
                {t.hero.badge}
              </motion.div>
              
              <h1 className="text-6xl lg:text-[110px] font-display font-bold leading-[0.9] tracking-tighter mb-8 text-white">
                ELENA <br />
                <span className="text-emerald-500">AI AGENT</span>
              </h1>
              
              <p className="text-xl text-white/60 mb-12 max-w-xl leading-relaxed font-light">
                {currentLangCode === 'es' 
                  ? 'No es un simple bot. Elena es el primer Agente de IA Conversacional Neuronal diseñado para liderar tu equipo de ventas y atención al cliente con una voz 100% humana.' 
                  : t.hero.desc}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(59, 130, 246, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={callingType === 'ELENA' ? stopCall : startCall}
                  disabled={isCalling && callingType !== 'ELENA'}
                  className={`flex items-center justify-center gap-4 px-8 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-2xl ${
                    callingType === 'ELENA' 
                      ? 'bg-red-500 text-white shadow-red-900/40' 
                      : 'bg-blue-600 text-white shadow-blue-900/40'
                  } ${isCalling && callingType !== 'ELENA' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {callingType === 'ELENA' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  {callingType === 'ELENA' ? (currentLangCode === 'es' ? 'Finalizar Elena' : 'End Elena') : t.hero.cta_call}
                </motion.button>
              </div>

              {/* Demo Info Cards */}
              <div className="grid grid-cols-3 gap-4 mt-12">
                <div className="glass p-6 rounded-3xl border border-white/5">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Multilingüe</p>
                  <p className="text-xs text-white/60">ES • FR • NL</p>
                </div>
                <div className="glass p-6 rounded-3xl border border-white/5">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Escalabilidad</p>
                  <p className="text-xs text-white/60">100+ Líneas</p>
                </div>
                <div className="glass p-6 rounded-3xl border border-white/5">
                  <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2">Humano</p>
                  <p className="text-xs text-white/60">100% Empatía</p>
                </div>
              </div>

              <div className="mt-8">
                <motion.button 
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onStart}
                  className="flex items-center justify-center gap-3 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest glass border border-white/10 hover:bg-white/5 transition-all text-white w-full sm:w-auto"
                >
                  {t.hero.cta_panel}
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-16 flex items-center gap-8 text-white/40">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">GDPR Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">4.9/5 Rating</span>
                </div>
              </div>

              {lastError && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[11px] font-bold flex items-center gap-3"
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  {lastError}
                </motion.div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              className="relative"
            >
              {/* Visualizer Card */}
              <div className="glass-dark rounded-[3rem] p-10 border border-white/10 shadow-3xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
                
                <div className="flex items-center justify-between mb-12">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-white/10"></div>
                    <div className="w-3 h-3 rounded-full bg-white/10"></div>
                    <div className="w-3 h-3 rounded-full bg-white/10"></div>
                  </div>
                  <div className="px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest">
                    Elena Engine v4.0
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center transition-all duration-700 ${isCalling ? 'bg-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.4)] scale-110' : 'bg-white/5'}`}>
                      <Sparkles className={`w-12 h-12 ${isCalling ? 'text-white animate-pulse' : 'text-white/20'}`} />
                    </div>
                    <div className="mt-8 text-center">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">
                        {isCalling ? 'ELENA ESTÁ HABLANDO' : 'DEMOSTRACIÓN EN VIVO'}
                      </p>
                      <p className={`text-xl font-display font-bold ${isCalling ? 'text-emerald-500' : 'text-white/20'}`}>
                        {isCalling ? 'ESCUCHA SU POTENCIAL' : 'HAZ CLIC PARA HABLAR'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 rounded-3xl bg-white/5 border border-white/5">
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">{t.hero.latency}</p>
                      <p className="text-lg font-bold text-emerald-500">120ms</p>
                    </div>
                    <div className="p-5 rounded-3xl bg-white/5 border border-white/5">
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">{t.hero.naturalness}</p>
                      <p className="text-lg font-bold text-blue-500">99.8%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/20 blur-[80px] rounded-full animate-pulse"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-600/20 blur-[80px] rounded-full animate-pulse delay-1000"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Elena AI Agent Service Section */}
      <section className="py-32 bg-gradient-to-b from-black to-emerald-950/20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="text-center mb-20">
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/20"
            >
              <Cpu className="text-white w-10 h-10" />
            </motion.div>
            <h2 className="text-4xl lg:text-7xl font-display font-bold tracking-tighter mb-6 text-white">
              CONOCE A <span className="text-emerald-500">ELENA</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto text-xl font-light">
              El servicio de Agente de IA que está redefiniendo los límites de la comunicación empresarial.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Voz Neuronal",
                desc: "Tecnología de síntesis de voz de última generación con entonación emocional humana.",
                icon: <MessageSquare className="w-6 h-6" />
              },
              {
                title: "Comprensión Total",
                desc: "Entiende contextos complejos, ironías y objeciones técnicas en tiempo real.",
                icon: <Zap className="w-6 h-6" />
              },
              {
                title: "Multitarea Masiva",
                desc: "Capaz de gestionar 1.000 conversaciones simultáneas sin degradación de calidad.",
                icon: <Layers className="w-6 h-6" />
              },
              {
                title: "Integración Omnicanal",
                desc: "Funciona en llamadas telefónicas, WhatsApp, Web y sistemas CRM corporativos.",
                icon: <Globe className="w-6 h-6" />
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-dark p-8 rounded-[2.5rem] border border-white/5 hover:border-emerald-500/30 transition-all group"
              >
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-tight">{item.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed font-light">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-20 glass-dark rounded-[3rem] p-12 border border-white/10 flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <h3 className="text-3xl font-display font-bold text-white mb-6">
                ¿Por qué elegir el <span className="text-emerald-500">Servicio Elena</span>?
              </h3>
              <ul className="space-y-4">
                {[
                  "Reducción de costes operativos del 80%",
                  "Disponibilidad total 24 horas, 365 días",
                  "Cero rotación de personal y formación",
                  "Escalabilidad instantánea según demanda",
                  "Métricas de conversión superiores al humano"
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/60">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-medium uppercase tracking-widest">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:w-1/2 w-full aspect-video rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
              <div className="relative z-10 text-center">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-4">Demo de Servicio</p>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={callingType === 'ELENA' ? stopCall : startCall}
                  className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40 group-hover:rotate-12 transition-transform"
                >
                  {callingType === 'ELENA' ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </motion.button>
                <p className="mt-6 text-sm font-bold text-white/40 uppercase tracking-widest">
                  {callingType === 'ELENA' ? 'Finalizar Demo' : 'Escuchar a Elena'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-20 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-12">
            {t.trusted.badge}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
            {['Energía Plus', 'Solar Direct', 'Telecom Global', 'Eco Solutions', 'Ventas Pro'].map((brand) => (
              <div key={brand} className="text-2xl font-display font-black tracking-tighter hover:text-emerald-500 transition-colors cursor-default text-white">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-32 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl lg:text-6xl font-display font-bold tracking-tighter mb-8 text-white">
                {(t.business as any).problem_title} <br />
                <span className="text-red-500">{(t.business as any).problem_accent}</span>
              </h2>
              <p className="text-white/40 text-lg mb-12 font-light">
                {(t.business as any).problem_desc}
              </p>
              <div className="space-y-8">
                {[
                  { title: (t.business as any).p1_title, desc: (t.business as any).p1_desc },
                  { title: (t.business as any).p2_title, desc: (t.business as any).p2_desc },
                  { title: (t.business as any).p3_title, desc: (t.business as any).p3_desc }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                      <Lock className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                      <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-[3rem] bg-gradient-to-br from-red-500/20 to-transparent blur-[100px] absolute inset-0 animate-pulse"></div>
              <div className="relative glass-dark rounded-[3rem] p-12 border border-white/5 shadow-3xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Pérdidas Operativas</span>
                </div>
                <div className="space-y-6">
                  {[85, 92, 78, 95].map((val, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black text-white/20 uppercase tracking-widest">
                        <span>Gasto {i+1}</span>
                        <span>{val}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${val}%` }}
                          className="h-full bg-red-500/40"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-emerald-500/5 blur-[150px] rounded-full"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative glass-dark rounded-[3rem] p-12 border border-emerald-500/20 shadow-3xl shadow-emerald-900/10">
                <div className="flex items-center gap-4 mb-12">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Elena AI Activa</span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { label: 'ROI', val: '+420%', color: 'text-emerald-500' },
                    { label: 'Coste', val: '-80%', color: 'text-blue-500' },
                    { label: 'Ventas', val: 'x3.5', color: 'text-amber-500' },
                    { label: 'Soporte', val: '24/7', color: 'text-indigo-500' }
                  ].map((stat, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/5 text-center">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2">{stat.label}</p>
                      <p className={`text-3xl font-display font-black ${stat.color}`}>{stat.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl lg:text-6xl font-display font-bold tracking-tighter mb-8 text-white">
                {(t.business as any).solution_title} <br />
                <span className="text-emerald-500">{(t.business as any).solution_accent}</span>
              </h2>
              <p className="text-white/40 text-lg mb-12 font-light">
                {(t.business as any).solution_desc}
              </p>
              <div className="space-y-8">
                {[
                  { title: (t.business as any).s1_title, desc: (t.business as any).s1_desc, icon: <TrendingUp className="w-6 h-6" /> },
                  { title: (t.business as any).s2_title, desc: (t.business as any).s2_desc, icon: <Clock className="w-6 h-6" /> },
                  { title: (t.business as any).s3_title, desc: (t.business as any).s3_desc, icon: <Globe className="w-6 h-6" /> }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      {React.cloneElement(item.icon as React.ReactElement, { className: "w-6 h-6 text-emerald-500" })}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                      <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Section */}
      <section id="bento" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-6xl font-display font-bold tracking-tighter mb-6 text-white">
              {t.features.title} <br />
              <span className="text-emerald-500">{t.features.title_accent}</span>
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto text-lg font-light">
              {t.features.desc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[240px]">
            {features.map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className={`${f.size} glass-dark rounded-[2.5rem] p-10 border border-white/5 flex flex-col justify-between group overflow-hidden relative`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 ${f.color} opacity-[0.03] blur-[60px] group-hover:opacity-[0.1] transition-opacity`}></div>
                
                <div className="relative z-10">
                  <div className={`w-14 h-14 ${f.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-2xl`}>
                    {f.icon}
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-3 text-white">{f.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed font-light">{f.desc}</p>
                </div>
                
                <div className="absolute bottom-6 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-5 h-5 text-white/20" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Model Section */}
      <section id="business" className="py-32 bg-white text-black rounded-[4rem] mx-6 lg:mx-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/5 text-black text-[10px] font-black uppercase tracking-widest mb-8">
                {t.business.badge}
              </div>
              <h2 className="text-5xl lg:text-7xl font-display font-bold tracking-tighter leading-[0.9] mb-8">
                {t.business.title} <br />
                <span className="text-emerald-600">{t.business.title_accent}</span>
              </h2>
              <p className="text-xl text-black/60 mb-12 leading-relaxed font-light">
                {t.business.desc}
              </p>

              <div className="space-y-6">
                {[
                  t.business.check1,
                  t.business.check2,
                  t.business.check3,
                  t.business.check4
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm uppercase tracking-tight">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 rounded-[3rem] p-12 border border-black/5 shadow-2xl">
              <div className="text-center mb-12">
                <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-2">{t.business.roi_title}</p>
                <h3 className="text-4xl font-display font-bold">-80%</h3>
                <p className="text-sm text-black/60">{t.business.roi_desc}</p>
              </div>

              <div className="space-y-8">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-black/40">{t.business.eff_elena}</span>
                    <span className="text-[10px] font-black uppercase text-emerald-600">98%</span>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded-full bg-emerald-100">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: "98%" }}
                      transition={{ duration: 1.5 }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500"
                    ></motion.div>
                  </div>
                </div>

                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-black/40">{t.business.eff_human}</span>
                    <span className="text-[10px] font-black uppercase text-slate-400">45%</span>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-200">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: "45%" }}
                      transition={{ duration: 1.5 }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-slate-400"
                    ></motion.div>
                  </div>
                </div>

                <button 
                  onClick={onStart}
                  className="w-full bg-black text-white py-6 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-black/10 mt-8"
                >
                  {t.business.cta_roi}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2026 Sales Techniques: Scarcity & Social Proof */}
      <section className="py-32 bg-emerald-600 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-[9px] font-black uppercase tracking-widest mb-6">
                <Rocket className="w-3 h-3" /> Limited Availability
              </div>
              <h2 className="text-4xl lg:text-6xl font-display font-bold tracking-tighter mb-8">
                SOLO 10 LICENCIAS <br />
                DISPONIBLES ESTE MES.
              </h2>
              <p className="text-xl text-white/80 mb-10 font-light leading-relaxed">
                Debido a la alta demanda de procesamiento de voz neuronal, limitamos el acceso a nuevos socios para garantizar la calidad 100% humana y soporte dedicado.
              </p>
              <div className="flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[1,2,3,4,5,6].map(i => (
                    <img key={i} src={`https://picsum.photos/seed/user${i}/100/100`} className="w-12 h-12 rounded-full border-4 border-emerald-600" referrerPolicy="no-referrer" />
                  ))}
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/60">
                  +150 Directores de Call Center ya en lista de espera
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              {[
                {
                  text: '"Elena AI ha cambiado las reglas del juego. Pasamos de 10 agentes a 1 instancia de Elena y nuestra facturación subió un 300% en el primer mes."',
                  author: 'Javier Domínguez',
                  role: 'CEO, Global Telecom Solutions',
                  initials: 'JD'
                },
                {
                  text: '"La capacidad de Elena para manejar objeciones es increíble. Hemos reducido el coste por lead en un 60% y la calidad ha subido."',
                  author: 'María García',
                  role: 'Directora de Operaciones, Solar Spain',
                  initials: 'MG'
                },
                {
                  text: '"Implementamos Elena en 48 horas. La integración SIP fue perfecta y los resultados fueron inmediatos. Es magia pura."',
                  author: 'Roberto Sánchez',
                  role: 'Fundador de EnergyFlow',
                  initials: 'RS'
                },
                {
                  text: '"Nunca imaginé que una IA pudiera sonar tan humana. Mis clientes ni siquiera se dan cuenta de que no es una persona."',
                  author: 'Laura Martínez',
                  role: 'Manager, Connect Plus',
                  initials: 'LM'
                },
                {
                  text: '"El ROI de Elena es imbatible. Hemos eliminado los costes de oficina y ahora escalamos sin límites."',
                  author: 'Carlos Ruiz',
                  role: 'Director, Sales Force Pro',
                  initials: 'CR'
                }
              ].map((testimonial, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-8 border border-white/20"
                >
                  <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map(j => <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className="text-lg font-display italic font-medium mb-6 leading-relaxed text-white">
                    {testimonial.text}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-white text-xs">{testimonial.initials}</div>
                    <div>
                      <p className="font-bold text-xs uppercase tracking-tight text-white">{testimonial.author}</p>
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{testimonial.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 relative">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl lg:text-8xl font-display font-bold tracking-tighter leading-[0.85] mb-12 text-white">
              {t.cta.title} <br />
              <span className="text-emerald-500">{t.cta.title_accent}</span>
            </h2>
            <p className="text-xl text-white/40 mb-16 max-w-2xl mx-auto font-light">
              {t.cta.desc}
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <button 
                onClick={onStart}
                className="bg-white text-black px-12 py-6 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-2xl shadow-white/5 flex items-center justify-center gap-3"
              >
                {t.cta.btn_panel}
                <ArrowUpRight className="w-5 h-5" />
              </button>
              <button 
                onClick={callingType === 'ELENA' ? stopCall : startCall}
                disabled={isCalling && callingType !== 'ELENA'}
                className={`glass border border-white/10 text-white px-12 py-6 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-3 ${isCalling && callingType !== 'ELENA' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {callingType === 'ELENA' ? <Pause className="w-5 h-5" /> : <PhoneCall className="w-5 h-5" />}
                {callingType === 'ELENA' ? (currentLangCode === 'es' ? 'Finalizar' : 'End') : t.cta.btn_call}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Lead Capture Section */}
      <section id="contacto" className="py-32 bg-white/[0.02] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl lg:text-6xl font-display font-bold tracking-tighter mb-8 text-white">
                ¿QUIERES ESCALAR <br />
                <span className="text-blue-500">TU NEGOCIO?</span>
              </h2>
              <p className="text-white/40 text-lg mb-12 font-light leading-relaxed">
                Déjanos tus datos y un especialista de Teltelecom te contactará para realizar una auditoría gratuita de tu centro de llamadas y mostrarte cómo Elena AI puede multiplicar tus resultados.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-widest text-white/60">Auditoría de Procesos Gratis</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-widest text-white/60">Demo Personalizada con tus Leads</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-widest text-white/60">Plan de Implementación en 48h</span>
                </div>
              </div>
            </div>

            <div className="glass-dark rounded-[3rem] p-10 border border-white/10 shadow-3xl">
              <form className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Nombre</label>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="Tu nombre" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Empresa</label>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="Nombre de tu empresa" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Email Corporativo</label>
                  <input type="email" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="email@empresa.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Teléfono</label>
                  <input type="tel" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="+34 600 000 000" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Mensaje (Opcional)</label>
                  <textarea className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all h-32 resize-none" placeholder="Cuéntanos sobre tu Call Center..."></textarea>
                </div>
                <button className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20">
                  Solicitar Información
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Zap className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-display font-bold tracking-tighter text-white">ELENA AI <span className="text-white/30 font-light text-xs ml-2">by TELTELECOM</span></span>
            </div>
            
            <div className="flex gap-12 text-[10px] font-black uppercase tracking-widest text-white/40">
              <a href="#" className="hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="hover:text-white transition-colors">Términos</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>

            <div className="text-white/20 text-[10px] font-black uppercase tracking-widest">
              © 2026 Teltelecom SARL. All Rights Reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Call Button for Mobile/Scroll */}
      <AnimatePresence>
        {scrolled && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            className="fixed bottom-10 right-10 z-[100] flex flex-col gap-4"
          >
            <button
              onClick={callingType === 'ELENA' ? stopCall : startCall}
              disabled={isCalling && callingType !== 'ELENA'}
              className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-3xl transition-all active:scale-90 relative group ${
                callingType === 'ELENA' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'
              } ${isCalling && callingType !== 'ELENA' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`absolute inset-0 rounded-[2rem] ${callingType === 'ELENA' ? 'bg-red-500 animate-ping opacity-20' : 'bg-emerald-600 animate-ping opacity-20'}`}></div>
              {callingType === 'ELENA' ? (
                <Pause className="w-8 h-8 relative z-10" />
              ) : (
                <PhoneCall className="w-8 h-8 relative z-10 group-hover:rotate-12 transition-transform" />
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;
