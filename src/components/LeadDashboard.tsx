
import React from 'react';
import { LeadData } from '../types';

interface LeadDashboardProps {
  lead: LeadData;
}

const LeadDashboard: React.FC<LeadDashboardProps> = ({ lead }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold mb-4 text-green-800 flex items-center">
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Ficha del Cliente
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <label className="text-gray-500 block uppercase tracking-wider text-xs font-semibold">Nombre Completo</label>
          <p className="font-medium min-h-[1.5rem] border-b border-gray-50">{lead.nombre || '-'}</p>
        </div>
        <div className="space-y-2">
          <label className="text-gray-500 block uppercase tracking-wider text-xs font-semibold">DNI / NIE</label>
          <p className="font-medium min-h-[1.5rem] border-b border-gray-50">{lead.dni || '-'}</p>
        </div>
        <div className="space-y-2">
          <label className="text-gray-500 block uppercase tracking-wider text-xs font-semibold">Dirección</label>
          <p className="font-medium min-h-[1.5rem] border-b border-gray-50">{lead.direccion || '-'}</p>
        </div>
        <div className="space-y-2">
          <label className="text-gray-500 block uppercase tracking-wider text-xs font-semibold">Teléfono</label>
          <p className="font-medium min-h-[1.5rem] border-b border-gray-50">{lead.tlf || '-'}</p>
        </div>
        <div className="space-y-2">
          <label className="text-gray-500 block uppercase tracking-wider text-xs font-semibold">Email</label>
          <p className="font-medium min-h-[1.5rem] border-b border-gray-50">{lead.email || '-'}</p>
        </div>
        <div className="space-y-2">
          <label className="text-gray-500 block uppercase tracking-wider text-xs font-semibold">Calefacción</label>
          <p className="font-medium min-h-[1.5rem] border-b border-gray-50 uppercase">{lead.tipo_calefaccion || '-'}</p>
        </div>
        <div className="space-y-2">
          <label className="text-gray-500 block uppercase tracking-wider text-xs font-semibold">Antigüedad {'>'}20 años</label>
          <p className={`font-bold ${lead.antiguedad_20 === 'SI' ? 'text-green-600' : lead.antiguedad_20 === 'NO' ? 'text-red-600' : 'text-gray-400'}`}>
            {lead.antiguedad_20 || '-'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeadDashboard;
