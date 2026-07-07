import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Phone, MapPin, User, Building2, ShieldCheck, Sparkles, X } from 'lucide-react';
import { LeadData } from '../types';

interface SaleBubbleProps {
  lead: LeadData;
  onClose: (id: string) => void;
}

const SaleBubble: React.FC<SaleBubbleProps> = ({ lead, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      className="fixed bottom-24 right-6 z-[200] w-80 glass-dark border border-emerald-500/30 rounded-3xl p-6 shadow-2xl shadow-emerald-900/20 overflow-hidden"
    >
      {/* Animated background glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">¡NUEVA VENTA!</p>
              <p className="text-[9px] text-white/40 font-bold uppercase tracking-tighter">Cerrada por Elena AI</p>
            </div>
          </div>
          <button 
            onClick={() => onClose(lead.id)}
            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center mt-0.5">
              <User className="w-3 h-3 text-white/60" />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">
                {lead.nombre || lead.nombre_completo || 'Cliente Nuevo'}
              </p>
              <p className="text-[10px] text-white/40 font-medium">
                {lead.empresa || lead.dni_nie || 'Particular'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
              <Phone className="w-3 h-3 text-white/60" />
            </div>
            <p className="text-[10px] font-mono text-white/80">
              {lead.telefono_contacto || lead.email || 'Verificado'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-emerald-500" />
            </div>
            <div className="flex-1">
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2 }}
                  className="h-full bg-emerald-500"
                ></motion.div>
              </div>
              <p className="text-[9px] text-emerald-500/80 font-black uppercase tracking-widest mt-1.5">
                {lead.status === 'CALIFICADO' ? 'CALIFICACIÓN POSITIVA' : 'CITA AGENDADA'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3 h-3 text-blue-400" />
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Verificado</span>
          </div>
          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">
            {lead.projectId || 'ELENA'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default SaleBubble;
