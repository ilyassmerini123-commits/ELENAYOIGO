
export type ProjectType = 'ELENA' | 'YOIGO' | 'SEGUROS' | 'VERIFICATION';

export type UserRole = 'DIAMOND_ADMIN' | 'SUPERADMIN' | 'WORKER' | 'OPERATOR' | 'CLIENT' | 'LANDING';

export interface User {
  id: string;
  username: string;
  email?: string;
  password?: string;
  role: UserRole;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'CALLING';
  companyId?: string;
  callCenterId?: string;
  projectId?: ProjectType;
  lastLogin?: Date;
  isListening?: boolean; // If an admin is currently listening to this user
}

export interface Appointment {
  id: string;
  leadId: string;
  customerName: string;
  date: Date;
  type: 'INSTALLATION' | 'SALES_VISIT' | 'FOLLOW_UP';
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
}

export interface Company {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  activeCalls: number;
  totalLeads: number;
  revenue: number;
  lastActive: Date;
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
}

export interface CallCenter {
  id: string;
  name: string;
  owner: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  activeCalls: number;
  totalLeads: number;
  revenue: number;
  lastActive: Date;
  supportComments: SupportComment[];
  projectType: ProjectType;
}

export interface SupportComment {
  id: string;
  author: string;
  text: string;
  timestamp: Date;
  isPriority: boolean;
}

export interface DiamondStats {
  totalCallCenters: number;
  totalActiveCalls: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

export interface Prospect {
  id: string;
  nombre: string;
  fijo: string;
  movil: string;
  localidad: string;
  direccion?: string;
  codigo_postal?: string;
  cobertura_fibra?: 'SI' | 'NO' | 'PENDIENTE';
  envio_paquete?: 'PENDIENTE' | 'ENVIADO' | 'ENTREGADO';
  fecha_instalacion?: string;
  notas_contrato?: string;
  status: 'PENDIENTE' | 'LLAMANDO' | 'CALIFICADO' | 'RECHAZADO';
  projectId?: ProjectType;
}

export interface LeadData {
  id: string;
  timestamp: Date;
  status: 'PENDIENTE' | 'CALIFICADO' | 'VALIDADO' | 'CITA_AGENDADA';
  callCenterId?: string;
  projectId?: ProjectType;
  // Campos comunes
  nombre?: string;
  tlf?: string;
  empresa?: string;
  fecha_cita?: string;
  // Campos de Energía/General
  dni?: string;
  direccion?: string;
  codigo_postal?: string;
  email?: string;
  antiguedad_20?: 'SI' | 'NO' | '';
  tipo_calefaccion?: string;
  // Campos de Seguros y Orange/Yoigo (Compartidos)
  nombre_completo?: string;
  telefono_contacto?: string;
  dni_nie?: string;
  tipo_seguro?: string;
  compania_actual?: string;
  precio_actual?: number;
  observaciones?: string;
  // Campos de Orange/Yoigo
  direccion_instalacion?: string;
  direccion_recepcion_paquete?: string;
  lineas_moviles_portar?: string;
  lineas_fijas_portar?: string;
  paquete_servicios?: string;
  cuenta_bancaria_iban?: string;
  fecha_cita_instalacion?: string;
  comentarios_venta?: string;
  // Campos de Vodafone (Legacy)
  dni_nif_cif?: string;
  pais?: string;
  disponibilidad_tecnico?: string;
  es_negocio?: boolean;
  documentacion_adjunta_info?: string;
  observaciones_venta?: string;
  envio_paquete?: string;
  fecha_instalacion?: string;
  callTranscript?: string;
  // Elena's specific extraction fields for operator assistance
  elena_num_lineas?: string;
  elena_oferta_yoigo?: string;
  elena_ahorro_estimado?: string;
  // Operator interaction
  comentario_operador_admin?: string;
  [key: string]: any;
}

export interface CallSession {
  id: string;
  workerName: string;
  startTime: Date;
  lastTranscript: string;
  isActive: boolean;
  companyId?: string;
  isElena?: boolean;
  projectId?: ProjectType;
}

export interface CallHistoryEntry {
  id: string;
  workerName: string;
  startTime: Date;
  durationSeconds: number;
  status: 'COMPLETADA' | 'PERDIDA' | 'ERROR';
  customerPhone?: string;
  projectId?: ProjectType;
}

export interface SipConfig {
  number: string;
  user: string;
  pass: string;
  server: string;
  host: string;
  port: string;
  proxy: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
}

export interface ProjectConfig {
  maxConcurrentCalls: number;
  voiceName: string;
  voipProvider: string;
  aiTemperature: number;
  callingActive: boolean;
  scheduleStart: string;
  scheduleEnd: string;
  sipAccounts: Record<ProjectType, SipConfig>;
}

export interface TranscriptionItem {
  role: 'user' | 'elena';
  text: string;
  timestamp: Date;
}
