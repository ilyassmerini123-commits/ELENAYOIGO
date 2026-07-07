
import React from 'react';
import { LeadData } from '../types';

interface ClientDashboardProps {
  lead?: LeadData;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ lead }) => {
  const steps = [
    { name: 'Captación Inicial', status: 'completado', date: lead?.timestamp ? lead.timestamp.toLocaleDateString() : 'Reciente' },
    { name: 'Validación Técnica', status: 'en-progreso', date: 'Pendiente' },
    { name: 'Aprobación de Contrato', status: 'espera', date: '---' },
    { name: 'Activación / Instalación', status: 'espera', date: '---' },
  ];

  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 leading-tight tracking-tighter uppercase italic">
            Hola, <span className="text-blue-600 not-italic">{lead?.nombre?.split(' ')[0] || lead?.nombre_completo?.split(' ')[0] || 'Cliente'}</span>
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Bienvenido a tu portal de seguimiento de servicios Teltelecom.</p>
        </div>
        <div className="flex items-center justify-center md:justify-end gap-3">
          <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
            Contrato Activo
          </div>
          <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 text-[10px] font-black uppercase tracking-widest">
            ID: {lead?.id?.toUpperCase() || 'PROCESANDO'}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Progress Section */}
          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5">
              <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            
            <h3 className="text-xl font-black text-slate-800 mb-10 relative z-10 flex items-center uppercase tracking-widest">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
              Estado de tu Activación
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              {steps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center text-center group">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center border-2 transition-all duration-500 mb-4 ${
                    step.status === 'completado' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 rotate-3' :
                    step.status === 'en-progreso' ? 'bg-blue-50 border-blue-600 text-blue-600 animate-pulse' :
                    'bg-white border-slate-100 text-slate-300'
                  }`}>
                    {step.status === 'completado' ? (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <span className="text-xl font-black">{idx + 1}</span>
                    )}
                  </div>
                  <h4 className={`text-[10px] font-black uppercase tracking-widest leading-tight ${step.status === 'espera' ? 'text-slate-300' : 'text-slate-800'}`}>
                    {step.name}
                  </h4>
                  <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{step.date}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Offer Details */}
          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 mb-10 flex items-center uppercase tracking-widest">
              <span className="w-2 h-2 bg-emerald-600 rounded-full mr-3"></span>
              Resumen de Oferta Contratada
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <span className="text-[10px] uppercase font-black text-slate-400 block mb-2 tracking-widest">Servicio Principal</span>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a9.05 9.05 0 0112.728 0M6.343 17.657l1.414-1.414m12.728 0l-1.414 1.414" /></svg>
                    </div>
                    <p className="font-black text-slate-800 text-lg uppercase tracking-tighter italic">
                      {lead?.paquete_servicios || lead?.tipo_calefaccion || 'Plan Estándar'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <span className="text-[10px] uppercase font-black text-slate-400 block mb-2 tracking-widest">Titular del Contrato</span>
                  <p className="font-black text-slate-800 uppercase tracking-tight">{lead?.nombre || lead?.nombre_completo || '---'}</p>
                  <p className="text-xs text-slate-500 font-mono mt-1">{lead?.dni || lead?.dni_nif_cif || '---'}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
                  <span className="text-[10px] uppercase font-black text-emerald-600 block mb-2 tracking-widest">Cita Programada</span>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="font-black text-emerald-700 text-lg uppercase tracking-tighter">
                      {lead?.disponibilidad_tecnico || 'Pendiente de asignar'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <span className="text-[10px] uppercase font-black text-slate-400 block mb-2 tracking-widest">Dirección de Instalación</span>
                  <p className="font-black text-slate-800 uppercase tracking-tight text-xs leading-relaxed">
                    {lead?.direccion || lead?.direccion_instalacion || '---'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-xl shadow-blue-200/50">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Verificación Bancaria</p>
                  <p className="text-xs font-mono text-blue-600 font-bold">{lead?.cuenta_bancaria_iban ? `**** **** **** ${lead.cuenta_bancaria_iban.slice(-4)}` : 'Pendiente'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio Final</p>
                <p className="text-3xl font-black text-blue-700 tracking-tighter italic">31.30€<span className="text-sm not-italic ml-1">/mes</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Contact Card */}
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
            
            <h3 className="text-2xl font-black mb-6 relative z-10 italic uppercase tracking-tighter">¿Dudas con tu <span className="text-blue-400 not-italic">Alta?</span></h3>
            <p className="text-slate-400 text-sm mb-10 relative z-10 leading-relaxed font-medium">
              Nuestro equipo de soporte técnico está disponible 24/7 para ayudarte con cualquier duda sobre tu nueva instalación.
            </p>
            
            <div className="space-y-4 relative z-10">
              <a href="tel:900123456" className="flex items-center p-5 bg-white/5 hover:bg-white/10 rounded-[2rem] transition-all border border-white/10 group/btn active:scale-95">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center mr-4 shadow-lg shadow-blue-900/50">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-blue-400 block tracking-widest">Línea Gratuita</span>
                  <span className="text-lg font-black tracking-tight">900 123 456</span>
                </div>
              </a>
              
              <button className="w-full py-5 bg-white text-slate-900 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all active:scale-95">
                Abrir Chat de Soporte
              </button>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Próximos Pasos</h4>
            <div className="space-y-6">
              {[
                { title: 'Recepción de Router', desc: 'En las próximas 48h laborables.' },
                { title: 'Llamada del Técnico', desc: 'Para confirmar la franja horaria.' },
                { title: 'Bienvenida Vodafone', desc: 'Recibirás tus claves de acceso.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 shrink-0"></div>
                  <div>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{item.title}</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
