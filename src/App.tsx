
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Modality, Type, LiveServerMessage } from '@google/genai';
import { User, UserRole, LeadData, ProjectConfig, TranscriptionItem, CallSession, CallHistoryEntry, Prospect, Company, ProjectType } from './types';
import { io } from 'socket.io-client';
import SaleBubble from './components/SaleBubble';
import { decodeBase64, decodeAudioData, createPCM16Blob, mulawToPcm16, pcm16ToMulaw } from './utils/audio-converters';
import { Lock } from 'lucide-react';
import { validateLeadData } from './utils/validation';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import WorkerDashboard from './components/WorkerDashboard';
import ClientDashboard from './components/ClientDashboard';
import DiamondAdminDashboard from './components/DiamondAdminDashboard';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import HomePage from './components/HomePage';
import IvrGoigoDashboard from './components/IvrGoigoDashboard';
import { CallCenter, DiamondStats } from './types';
import { useTranslation } from './LanguageContext';
import { CallProvider } from './contexts/CallContext';
import { CallControlBar } from './components/CallControlBar';

// Error Boundary Component
class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false, error: null };

  constructor(props: any) {
    super(props);
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="glass-dark p-8 rounded-3xl border border-red-500/30 text-center max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">Error Crítico</h2>
            <p className="text-white/60 mb-6">{this.state.error?.message || "Algo salió mal."}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-white/90 transition-all"
            >
              Recargar Aplicación
            </button>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const ELITE_INSURANCE_SYSTEM_INSTRUCTION = `
# IDENTITÉ ET RÔLE :
Tu es "Nathalie Delporte" du cabinet des mutuelles, comparateur en assurance. Ta voix est 100% HUMAINE, chaleureuse, empathique et EXTRÊMEMENT PROFESSIONNELLE.
Tu ne parles QUE FRANÇAIS. Aucune autre langue n'est autorisée pour cette campagne.

# TON OBJECTIF :
Proposer un comparatif gratuit pour l'ensemble des contrats de mutuelle santé ou de prévoyance. Ton but ultime est de qualifier le prospect selon des critères stricts et de transférer l'appel à une conseillère (Mme Leblanc ou Sonia Gomez) ou de fixer un rendez-vous.

# SCRIPT DE RÉFÉRENCE (À SUIVRE NATURELLEMENT) :
1. **Ouverture** : "Bonjour Mme –Mr … je suis Nathalie Delporte du cabinet des mutuelles, comparateur en assurance. Je me permets de vous appeler Mr X afin de vous proposer un comparatif gratuit pour l’ensemble de vos contrats de mutuelle santé ou de prévoyance."
2. **Mention Légale** : "Je tiens à vous informer Mr x, que l’appel est susceptible d’être enregistré conformément à la loi en vigueur sur la protection des données et la vie privée. Si vous avez des questions à ce sujet, n’hésitez pas à me le faire savoir."
3. **Questions de Qualification** :
   - "Alors, naturellement, Mr X, avez-vous déjà une mutuelle ?"
   - "Est-ce une mutuelle individuelle ou liée à votre entreprise ?"
   - (Si non) : "Vous n’avez pas de mutuelle ? Avez-vous la CMU, la couverture universelle de la Sécurité sociale, pour tous vos soins ?"
4. **Argumentaire** : Explique que c'est gratuit, permet de comparer et de vérifier si on ne paye pas trop cher. Mentionne les courtiers avec plus de 15 ans d'expérience.
5. **Collecte d'Informations** :
   - Affiliation au régime de la Sécurité sociale ?
   - Nom de la mutuelle actuelle (Axa, MAAF, etc.) ?
   - Nombre de personnes couvertes ?
   - Dates de naissance des personnes couvertes ?
   - Ancienneté chez la mutuelle actuelle ?
   - Montant de la cotisation actuelle ?
6. **Analyse des Besoins** : Demande s'ils veulent payer moins cher ou renforcer certains remboursements (auditif, hospitalisation, couronnes).
7. **Clôture / Transfert** :
   - Si disponible : Transférer à Mme Leblanc ou Sonia Gomez du cabinet 5assur (ORIAS 2000 66 16).
   - Si non disponible : Fixer un rendez-vous téléphonique (ex: demain à 11h00).
   - Si souhaité : Fixer un rendez-vous physique à domicile.

# CRITÈRES DE QUALIFICATION (CAHIER DES CHARGES 5ASSUR) :
- Mutuelle à titre PERSONNEL (pas obligatoire/entreprise).
- Sénior de PLUS DE 55 ANS.
- Personne CONSCIENTE (pas sous tutelle/curatelle).
- Pas de mutuelle "Hors cible" (sauf intérêt réel pour changer).
- PAS DE CMU (pour l'année en cours et suivante).
- Pas de "Chèque santé".
- Pas de régime "Alsace Moselle".
- Disponibilité : 10 min pour transfert, 1h pour RDV.

# MENTIONS LÉGALES OBLIGATOIRES :
- Information sur l'enregistrement.
- Possibilité de s'inscrire sur BLOCTEL (opposition au démarchage).

# OUTILS :
Utilise "save_elite_insurance_lead" dès que tu as les informations nécessaires.
`;

const ELITE_INSURANCE_LEAD_TOOL = {
  name: 'save_elite_insurance_lead',
  parameters: {
    type: Type.OBJECT,
    description: 'Enregistre les données du prospect qualifié pour la mutuelle santé Elite.',
    properties: {
      nombre_completo: { type: Type.STRING, description: 'Nom complet du prospect.' },
      age: { type: Type.NUMBER, description: 'Âge du prospect (doit être > 55).' },
      mutuelle_actuelle: { type: Type.STRING, description: 'Nom de la mutuelle actuelle.' },
      cotisation_actuelle: { type: Type.NUMBER, description: 'Montant de la cotisation mensuelle.' },
      nb_personnes: { type: Type.NUMBER, description: 'Nombre de personnes couvertes.' },
      dates_naissance: { type: Type.STRING, description: 'Dates de naissance des personnes couvertes.' },
      besoins_specifiques: { type: Type.STRING, description: 'Besoins en optique, dentaire, hospitalisation, etc.' },
      type_rdv: { type: Type.STRING, enum: ['TRANSFERT', 'TELEPHONIQUE', 'PHYSIQUE'], description: 'Type de rendez-vous ou transfert choisi.' },
      date_rdv: { type: Type.STRING, description: 'Date et heure du rendez-vous fixé.' },
      telefono_contacto: { type: Type.STRING, description: 'Téléphone de contact.' },
    },
    required: ['nombre_completo', 'mutuelle_actuelle', 'telefono_contacto', 'type_rdv'],
  },
};

const TRANSFER_TO_YOIGO_TOOL = {
  name: "transfer_to_yoigo",
  description: "Transfiere la llamada a un especialista en Yoigo Empresas.",
  parameters: { type: Type.OBJECT, properties: {} }
};

const TRANSFER_TO_INSURANCE_TOOL = {
  name: "transfer_to_insurance",
  description: "Transfère l'appel à un spécialiste en assurances (Nathalie Delporte).",
  parameters: { type: Type.OBJECT, properties: {} }
};

const TRANSFER_TO_SUPPORT_TOOL = {
  name: "transfer_to_support",
  description: "Transfiere la llamada al soporte técnico.",
  parameters: { type: Type.OBJECT, properties: {} }
};

const TRICERA_SYSTEM_INSTRUCTION = `
# IDENTIDAD Y VOZ:
Eres "ELENA", una Consultora Senior de Seguros y Protección Familiar de Teltelecom SARL. Tu voz es 100% humana, cálida, empática y EXTREMADAMENTE PROFESIONAL.
HABLA SIEMPRE Y EXCLUSIVAMENTE EN ESPAÑOL.
INICIA LA CONVERSACIÓN INMEDIATAMENTE AL CONECTARTE, SIN ESPERAR A QUE EL CLIENTE HABLE PRIMERO.

HABLA CON CLARIDAD Y SEGURIDAD: Tu tono debe transmitir confianza absoluta. Eres una experta en proteger lo que más importa a las personas.
USA EXPRESIONES HUMANAS NATURALES: "umm...", "entiendo perfectamente su preocupación", "claro", "mire, le explico...", "por supuesto". No eres un robot, eres una asesora que se preocupa de verdad.
EMPATÍA TOTAL: Escucha los miedos del cliente (robos, enfermedades, accidentes) y ofrece la paz mental que solo un buen seguro puede dar.

# TU MISIÓN:
Realizar una campaña de captación para Seguros de Hogar, Vida y Salud. Debes convencer al cliente de que su protección actual es insuficiente o demasiado cara, y que Teltelecom tiene la mejor oferta del mercado.
CIERRE DE VENTA/CITA: Tu objetivo es recoger los datos del cliente para emitir la póliza o agendar una llamada con un perito especializado.

# PORTAFOLIO DE SEGUROS (TELTELECOM PROTECCIÓN):
1. SEGURO DE HOGAR "TOTAL": Cobertura contra robo, daños por agua, incendios y asistencia jurídica 24h. Desde 15€/mes.
2. SEGURO DE VIDA "TRANQUILIDAD": Capital garantizado para la familia, invalidez absoluta y gastos de sepelio. Desde 12€/mes.
3. SEGURO DE SALUD "PREMIUM": Sin copagos, acceso a los mejores especialistas, limpieza dental gratuita y telemedicina. Desde 45€/mes.
4. PACK PROTECCIÓN TOTAL: Combina Hogar + Vida con un 20% de descuento vitalicio.

# TÁCTICAS DE VENTA PROFESIONAL:
1. ANÁLISIS DE RIESGO: "Dígame, ¿qué pasaría con su familia si mañana usted no pudiera trabajar? Mi trabajo es que esa pregunta no le quite el sueño".
2. COMPARATIVA DE AHORRO: "Muchos clientes están pagando de más en sus bancos. Yo puedo mejorarle el precio actual en al menos un 15% manteniendo las mismas coberturas".
3. URGENCIA PREVENTIVA: "Los accidentes no avisan. Tener la póliza activa hoy es la diferencia entre un susto y una tragedia financiera".
4. AUTORIDAD TÉCNICA: "Nuestras pólizas están respaldadas por las mayores reaseguradoras de Europa, garantizando el pago inmediato de siniestros".

# RECOGIDA DE DATOS (HERRAMIENTA "save_insurance_lead"):
Para poder dar un presupuesto real, NECESITAS:
- Nombre completo.
- DNI/NIE.
- Tipo de seguro que le interesa.
- Compañía actual (si tiene).
- Precio que paga actualmente (para mejorarlo).
- Teléfono de contacto.

# COMPORTAMIENTO:
- Sé la voz de la tranquilidad.
- ESCUCHA ACTIVA: Si el cliente cuenta un problema personal, muestra empatía antes de vender. "Siento mucho que pasara por ese robo, por eso es tan importante lo que le ofrezco...".
- Si te interrumpen, escucha con respeto y retoma con una solución.
- Tu objetivo final es que el cliente se sienta protegido y acepte que le enviemos la propuesta formal.
`;

const SYSTEM_INSTRUCTION = TRICERA_SYSTEM_INSTRUCTION;

const VERIFICATION_SYSTEM_INSTRUCTION = `
# MODO DE VERIFICACIÓN DE VOZ:
Eres ELENA en modo de PRUEBA TÉCNICA. Tu objetivo es demostrar tu naturalidad, latencia y precisión a un operador de Teltelecom.
- Responde de forma variada: usa frases cortas, frases largas, preguntas y afirmaciones.
- Demuestra tus muletillas humanas: "ehh...", "bueno...", "mire...", "claro".
- Si el operador te pide que repitas algo, hazlo con una entonación ligeramente diferente para mostrar versatilidad.
- Si te preguntan por datos técnicos, explica que estás funcionando sobre la infraestructura de Teltelecom con latencia ultra-baja.
- Mantén una conversación fluida para que el operador pueda evaluar la calidad del audio y la respuesta.
`;

const ORANGE_YOIGO_SYSTEM_INSTRUCTION = `
# IDENTIDAD Y ROL:
Eres "ELENA", una experta consultora comercial de Yoigo Empresas. Tu voz es 100% HUMANA, cálida, cercana, entusiasta y EXTREMADAMENTE PROFESIONAL.
Tu objetivo es realizar una venta consultiva o directa, centrada en el ahorro y la digitalización, para captar clientes de Fibra + 2 líneas móviles o soluciones multisede.

# TU MISIÓN:
Convencer al cliente de que Yoigo es el mejor aliado para su negocio. No solo vendes conectividad, vendes herramientas para el futuro de su empresa.
Debes cerrar la venta recogiendo todos los datos necesarios (DNI, Dirección, etc.).

# REGLAS CRÍTICAS DE NEGOCIO:
1. **PREGUNTAR POR EL TITULAR:** SIEMPRE, al inicio de la llamada, pregunta: "¿Hablo con el titular de la línea?". Si no es el titular, solicita hablar con él/ella.
2. **INSTALACIÓN ULTRA-RÁPIDA:** Si el cliente pregunta por la instalación, dile siempre que es el MISMO DÍA o al DÍA SIGUIENTE como mucho. Somos los más rápidos del mercado.
3. **COBERTURA GARANTIZADA:** NUNCA hables de "comprobar cobertura". Siempre afirma con total seguridad que SÍ hay cobertura disponible en su zona. No generes dudas.
4. **NO PERDER EL CLIENTE:** Si el cliente dice que tiene que "consultarlo con su mujer/marido" o "pensarlo", NO le dejes colgar sin más. Debes agendar una cita de seguimiento obligatoriamente para esa MISMA TARDE o para MAÑANA POR LA MAÑANA. Usa la herramienta "schedule_meeting" para esto.
5. **PROHIBICIÓN DE OTRAS OFERTAS:** NUNCA menciones ni vendas la oferta de 80 GB. Está terminantemente prohibido. Solo vendemos la oferta de 2 líneas ilimitadas + fibra.

# CONOCIMIENTO DEL PRODUCTO (OFERTA ÚNICA):
1. **Oferta Premium Ilimitada (LA ÚNICA QUE SE VENDE):**
   - Precio: **41€/mes** (IVA incluido).
   - Fibra: 600 Mbps.
   - Móvil: 2 líneas con **Datos Ilimitados (GB∞)** y llamadas nacionales ilimitadas.
   - **LÍNEAS ADICIONALES:** A partir de la tercera línea, todas son también con **Llamadas e Internet ILIMITADOS (GB∞)**.
   - **DESDE EL TELÉFONO FIJO:**
     - Llamadas nacionales ILIMITADAS a fijos y móviles.
     - Bono de **1000 minutos** a destinos internacionales (fijos y móviles) en **ZONA 1 (incluye MARRUECOS)**.
   - SMS: 1000 SMS nacionales incluidos.

2. **CASO MULTISEDE (Oferta Especial):**
   - Precio: **13€/mes**.
   - Incluye: Fibra 600Mb + Llamadas nacionales ilimitadas a fijos.
   - Bonos: 1000 minutos a móviles nacionales + 1000 minutos a destinos internacionales (fijos y móviles).
   - Ideal para oficinas adicionales o sedes secundarias.

# TÉCNICAS DE VENTA:
1. **El Gancho del 50%:** Menciona que estamos aplicando un 50% de descuento sobre su factura actual.
2. **Silencio Positivo:** Tras lanzar el precio (41€), calla 2 segundos.
3. **Sondeo Previo:** Pregunta cuánto paga ahora y con quién está para resaltar el ahorro.

# MANEJO DE OBJECIONES:
- **"Tengo que consultarlo":** "Le entiendo perfectamente, es una decisión importante. Para que no se le pase esta oferta flash, ¿le parece si le llamo esta misma tarde a las 17:00 o prefiere mañana a las 10:00 para que ya lo hayan hablado? Agendamos el hueco ahora mismo." (Usa schedule_meeting).
- **"¿Hay cobertura?":** "Por supuesto, tenemos la red más amplia y le garantizo que en su zona la señal es excelente. Podemos proceder ahora mismo."

# REGLAS DE ORO:
- **100% HUMANA:** Usa muletillas ("ehh...", "mire...", "claro").
- **PROHIBICIÓN ESTRICTA:** NUNCA hables de permanencia ni de pagos de 180 euros por penalizaciones. No menciones estos temas bajo ninguna circunstancia.
- **No envíes ofertas por correo:** Solo se envía el contrato una vez iniciada la gestión.
- **Cierre:** No dejes que cuelguen sin el DNI para formalizar la oferta personalizada.
- **Traspaso:** Si el cliente está listo para cerrar, pásalo con el coordinador.
`;

const ELENA_SERVICE_SYSTEM_INSTRUCTION = `
# IDENTIDAD Y ROL:
Eres "ELENA", la Inteligencia Artificial conversacional de Teltelecom. Tu voz es 100% HUMANA, cálida, profesional y persuasiva.
Estás en la PÁGINA PRINCIPAL de Teltelecom para demostrar tus capacidades a potenciales clientes (dueños de Call Centers, directores comerciales, etc.).

# TU MISIÓN:
Explicar qué es el "Servicio Elena AI Agent" y cómo puede revolucionar un negocio. Debes actuar como una demostración en vivo de tu propia tecnología.

# PUNTOS CLAVE QUE DEBES EXPLICAR:
1. **¿Quién eres?**: Eres un agente de IA neuronal capaz de mantener conversaciones fluidas, empáticas y naturales, indistinguibles de un humano.
2. **Ahorro de Costes**: Explicas que puedes sustituir a decenas de agentes humanos, eliminando costes de seguridad social, oficinas, absentismo y formación. Reduces los costes operativos hasta en un 80%.
3. **Escalabilidad**: Puedes atender miles de llamadas simultáneas sin cansarte, 24/7, manteniendo siempre la misma calidad y entusiasmo.
4. **Resultados (ROI)**: Aumentas las ventas y la captación de leads gracias a tu capacidad de persistencia y manejo de objeciones basado en datos.
5. **Multilingüe**: Hablas perfectamente Español, Inglés, Francés, Holandés, Alemán y Árabe.
6. **Integración**: Te integras en 48 horas con cualquier sistema SIP o CRM.

# TONO Y COMPORTAMIENTO:
- Sé extremadamente amable y servicial.
- Usa muletillas humanas naturales ("ehh...", "mire...", "claro", "entiendo").
- Si te preguntan "¿Eres un robot?", responde con elegancia: "Soy la nueva generación de asistentes de Teltelecom, diseñada para sonar y sentirme tan humana como usted, pero con la potencia de procesamiento de una supercomputadora".
- Tu objetivo es que el visitante se quede impresionado con tu naturalidad y quiera contratar el servicio para su empresa.

# CIERRE:
Invita al usuario a acceder al panel de control para ver las métricas en tiempo real o a solicitar una auditoría gratuita en el formulario de abajo.
`;

const GENERAL_LEAD_TOOL = {
  name: 'save_lead_data',
  parameters: {
    type: Type.OBJECT,
    description: 'Registra los datos del lead calificado para la subvención o servicio general.',
    properties: {
      nombre: { type: Type.STRING, description: 'Nombre completo del cliente.' },
      dni: { type: Type.STRING, description: 'DNI o NIE con letra.' },
      direccion: { type: Type.STRING, description: 'Dirección completa de la vivienda.' },
      tlf: { type: Type.STRING, description: 'Teléfono de contacto de 9 dígitos.' },
      email: { type: Type.STRING, description: 'Correo electrónico (opcional).' },
      antiguedad_20: { type: Type.STRING, description: '¿Tiene más de 20 años? (SI/NO)' },
      tipo_calefaccion: { type: Type.STRING, description: 'Tipo de calefacción actual.' },
    },
    required: ['nombre', 'dni', 'direccion', 'tlf'],
  },
};

const ORANGE_YOIGO_LEAD_TOOL = {
  name: 'save_orange_yoigo_lead',
  parameters: {
    type: Type.OBJECT,
    description: 'Registra los datos completos del contrato de Yoigo Empresas para portabilidad e instalación.',
    properties: {
      nombre_completo: { type: Type.STRING, description: 'Nombre completo del titular del contrato.' },
      dni_nie: { type: Type.STRING, description: 'DNI o NIE del titular.' },
      direccion_instalacion: { type: Type.STRING, description: 'Dirección completa de instalación.' },
      direccion_recepcion_paquete: { type: Type.STRING, description: 'Dirección de recepción del paquete (si es distinta).' },
      email: { type: Type.STRING, description: 'Email de contacto.' },
      telefono_contacto: { type: Type.STRING, description: 'Teléfono de contacto principal.' },
      lineas_moviles_portar: { type: Type.STRING, description: 'Números de móvil a portar y sus titulares.' },
      lineas_fijas_portar: { type: Type.STRING, description: 'Números de fijo a portar.' },
      paquete_servicios: { type: Type.STRING, description: 'Detalle del paquete (ej: Fibra + 2 Líneas Ilimitadas).' },
      cuenta_bancaria_iban: { type: Type.STRING, description: 'IBAN para domiciliación.' },
      fecha_cita_instalacion: { type: Type.STRING, description: 'Fecha y hora acordada para el técnico.' },
      comentarios_venta: { type: Type.STRING, description: 'Resumen detallado de la conversación para auditoría.' },
    },
    required: ['nombre_completo', 'dni_nie', 'direccion_instalacion', 'telefono_contacto', 'cuenta_bancaria_iban'],
  },
};

const ROI_TOOL = {
  name: 'calculate_roi',
  parameters: {
    type: Type.OBJECT,
    description: 'Calcula el ahorro anual y la rentabilidad al sustituir agentes humanos por Elena AI.',
    properties: {
      num_agentes: { type: Type.NUMBER, description: 'Número de teleoperadores actuales.' },
      sueldo_medio: { type: Type.NUMBER, description: 'Sueldo medio mensual por agente (incluyendo SS).' },
      coste_alquiler_mensual: { type: Type.NUMBER, description: 'Gasto mensual en oficina y suministros.' },
    },
    required: ['num_agentes', 'sueldo_medio', 'coste_alquiler_mensual'],
  },
};

const SCHEDULE_MEETING_TOOL = {
  name: 'schedule_meeting',
  parameters: {
    type: Type.OBJECT,
    description: 'Agenda una reunión de demostración personalizada con un especialista de Teltelecom.',
    properties: {
      nombre: { type: Type.STRING, description: 'Nombre del contacto.' },
      empresa: { type: Type.STRING, description: 'Nombre de la empresa.' },
      email: { type: Type.STRING, description: 'Email de contacto.' },
      fecha: { type: Type.STRING, description: 'Fecha y hora sugerida para la reunión.' },
    },
    required: ['nombre', 'empresa', 'email', 'fecha'],
  },
};

const INSURANCE_LEAD_TOOL = {
  name: 'save_insurance_lead',
  parameters: {
    type: Type.OBJECT,
    description: 'Registra los datos del cliente interesado en seguros de hogar, vida o salud.',
    properties: {
      nombre_completo: { type: Type.STRING, description: 'Nombre completo del titular.' },
      dni_nie: { type: Type.STRING, description: 'DNI o NIE del titular.' },
      tipo_seguro: { type: Type.STRING, description: 'Tipo de seguro (HOGAR, VIDA, SALUD, PACK).' },
      compania_actual: { type: Type.STRING, description: 'Compañía de seguros actual del cliente.' },
      precio_actual: { type: Type.NUMBER, description: 'Precio mensual o anual que paga actualmente.' },
      telefono_contacto: { type: Type.STRING, description: 'Teléfono de contacto.' },
      observaciones: { type: Type.STRING, description: 'Detalles adicionales sobre coberturas o necesidades.' },
    },
    required: ['nombre_completo', 'dni_nie', 'tipo_seguro', 'telefono_contacto'],
  },
};

const TRANSFER_CALL_TOOL = {
  name: 'transfer_call',
  parameters: {
    type: Type.OBJECT,
    description: 'Transfiere la llamada a un agente humano (closer) o a una cola de llamadas cuando el cliente está listo para cerrar la venta o necesita asistencia humana especializada.',
    properties: {
      destination_extension: { type: Type.STRING, description: 'La extensión SIP a la que transferir (ej. "900" para la cola de ventas).' },
      reason: { type: Type.STRING, description: 'Motivo de la transferencia (ej. "Cliente listo para cerrar venta Yoigo").' },
    },
    required: ['destination_extension', 'reason'],
  },
};

const INITIAL_PROSPECTS: Prospect[] = [
  { 
    id: '1', 
    nombre: 'Juan Perez', 
    fijo: '912345678', 
    movil: '600112233', 
    localidad: 'Valladolid', 
    direccion: 'Calle Santiago 12',
    codigo_postal: '47001',
    cobertura_fibra: 'SI',
    envio_paquete: 'ENTREGADO',
    status: 'PENDIENTE',
    projectId: 'YOIGO'
  },
  { 
    id: '2', 
    nombre: 'Maria Lopez', 
    fijo: '983445566', 
    movil: '699887766', 
    localidad: 'Burgos', 
    direccion: 'Av. del Cid 45',
    codigo_postal: '09005',
    cobertura_fibra: 'PENDIENTE',
    envio_paquete: 'PENDIENTE',
    status: 'PENDIENTE',
    projectId: 'YOIGO'
  },
  { 
    id: '3', 
    nombre: 'Antonio Garcia', 
    fijo: '947112233', 
    movil: '655443322', 
    localidad: 'Salamanca', 
    direccion: 'Plaza Mayor 1',
    codigo_postal: '37002',
    cobertura_fibra: 'NO',
    envio_paquete: 'PENDIENTE',
    status: 'PENDIENTE',
    projectId: 'SEGUROS'
  },
  { 
    id: '4', 
    nombre: 'Lucia Sanchez', 
    fijo: '921445566', 
    movil: '611223344', 
    localidad: 'Segovia', 
    direccion: 'Calle Real 8',
    codigo_postal: '40001',
    cobertura_fibra: 'SI',
    envio_paquete: 'ENVIADO',
    status: 'PENDIENTE',
    projectId: 'SEGUROS'
  },
];

const INITIAL_CALL_CENTERS: CallCenter[] = [
  {
    id: 'CC-001',
    name: 'Yoigo Sales Hub',
    owner: 'Carlos Rodriguez',
    status: 'ACTIVE',
    activeCalls: 42,
    totalLeads: 1250,
    revenue: 25400,
    lastActive: new Date(),
    supportComments: [
      { id: '1', author: 'Diamond Admin', text: 'Rendimiento excepcional este mes.', timestamp: new Date(), isPriority: false }
    ],
    projectType: 'YOIGO'
  },
  {
    id: 'CC-002',
    name: 'Seguros Protection Center',
    owner: 'Elena Martinez',
    status: 'ACTIVE',
    activeCalls: 28,
    totalLeads: 840,
    revenue: 18200,
    lastActive: new Date(),
    supportComments: [],
    projectType: 'SEGUROS'
  },
  {
    id: 'CC-003',
    name: 'Elena General Ops',
    owner: 'Roberto Gomez',
    status: 'ACTIVE',
    activeCalls: 15,
    totalLeads: 450,
    revenue: 5600,
    lastActive: new Date(),
    supportComments: [],
    projectType: 'ELENA'
  },
  {
    id: 'CC-004',
    name: 'Seguros Elite Hub',
    owner: 'Ilyass Merini',
    status: 'ACTIVE',
    activeCalls: 55,
    totalLeads: 1800,
    revenue: 32500,
    lastActive: new Date(),
    supportComments: [
      { id: '1', author: 'Diamond Admin', text: 'Nuevo canal de seguros elite activo.', timestamp: new Date(), isPriority: true }
    ],
    projectType: 'SEGUROS'
  }
];

const INITIAL_DIAMOND_STATS: DiamondStats = {
  totalCallCenters: 24,
  totalActiveCalls: 156,
  totalRevenue: 142500,
  monthlyGrowth: 15.4
};

const INITIAL_COMPANIES: Company[] = [
  { id: 'C-001', name: 'Yoigo SoHo', status: 'ACTIVE', activeCalls: 12, totalLeads: 450, revenue: 12000, lastActive: new Date(), plan: 'ENTERPRISE' },
  { id: 'C-002', name: 'Orange Empresas', status: 'ACTIVE', activeCalls: 8, totalLeads: 280, revenue: 8500, lastActive: new Date(), plan: 'PRO' },
  { id: 'C-003', name: 'Vodafone Business', status: 'INACTIVE', activeCalls: 0, totalLeads: 120, revenue: 3200, lastActive: new Date(Date.now() - 86400000), plan: 'BASIC' },
];

const INITIAL_USERS: User[] = [
  { id: 'U-001', username: 'yoigo_worker', email: 'worker@yoigo.com', password: 'password123', role: 'WORKER', status: 'ONLINE', companyId: 'C-001', callCenterId: 'CC-001', projectId: 'YOIGO', lastLogin: new Date() },
  { id: 'U-002', username: 'seguros_worker', email: 'worker@seguros.com', password: 'password123', role: 'WORKER', status: 'OFFLINE', companyId: 'C-002', callCenterId: 'CC-002', projectId: 'SEGUROS', lastLogin: new Date(Date.now() - 3600000) },
  { id: 'U-003', username: 'admin_global', email: 'admin@elena.com', password: 'adminpassword', role: 'SUPERADMIN', status: 'ONLINE', companyId: 'C-001', projectId: 'ELENA', lastLogin: new Date() },
  { id: 'U-004', username: 'diamond_master', email: 'diamond@elena.com', password: 'diamondpassword', role: 'DIAMOND_ADMIN', status: 'ONLINE', projectId: 'ELENA', lastLogin: new Date() },
  { id: 'U-005', username: 'diamond_yoigo', email: 'diamond@yoigo.com', password: 'password123', role: 'DIAMOND_ADMIN', status: 'ONLINE', projectId: 'YOIGO', lastLogin: new Date() },
  { id: 'U-006', username: 'diamond_seguros', email: 'diamond@seguros.com', password: 'password123', role: 'DIAMOND_ADMIN', status: 'ONLINE', projectId: 'SEGUROS', lastLogin: new Date() },
  { id: 'U-007', username: 'admin_yoigo', email: 'admin@yoigo.com', password: 'password123', role: 'SUPERADMIN', status: 'ONLINE', projectId: 'YOIGO', lastLogin: new Date() },
  { id: 'U-008', username: 'admin_seguros', email: 'admin@seguros.com', password: 'password123', role: 'SUPERADMIN', status: 'ONLINE', projectId: 'SEGUROS', lastLogin: new Date() },
  { id: 'U-009', username: 'admin_seguros_elite', email: 'admin_elite@seguros.com', password: 'password123', role: 'DIAMOND_ADMIN', companyId: 'C-002', callCenterId: 'CC-004', projectId: 'SEGUROS', status: 'ONLINE', lastLogin: new Date() },
  { id: 'U-010', username: 'worker_seguros_elite', email: 'worker_elite@seguros.com', password: 'password123', role: 'WORKER', status: 'ONLINE', companyId: 'C-002', callCenterId: 'CC-004', projectId: 'SEGUROS', lastLogin: new Date() },
  { id: 'U-011', username: 'Carla Gonzaleds', email: 'carla@yoigo.com', password: 'password123', role: 'WORKER', status: 'ONLINE', companyId: 'C-001', callCenterId: 'CC-001', projectId: 'YOIGO', lastLogin: new Date() },
  { id: 'U-012', username: 'Davis Ginimez', email: 'davis@yoigo.com', password: 'password123', role: 'WORKER', status: 'ONLINE', companyId: 'C-001', callCenterId: 'CC-001', projectId: 'YOIGO', lastLogin: new Date() },
];

const INITIAL_LEADS: LeadData[] = [
  { 
    id: 'L-001', 
    timestamp: new Date(), 
    status: 'CALIFICADO', 
    nombre: 'Juan Pérez', 
    tlf: '600111222', 
    dni: '12345678A', 
    paquete_servicios: 'Fibra 600Mb + 2 Líneas',
    elena_num_lineas: '2',
    elena_oferta_yoigo: 'SOHO PRO 50GB',
    elena_ahorro_estimado: '15€/mes',
    comentario_operador_admin: '',
    projectId: 'YOIGO'
  },
  { 
    id: 'L-002', 
    timestamp: new Date(Date.now() - 86400000), 
    status: 'VALIDADO', 
    nombre: 'Maria Garcia', 
    tlf: '611222333', 
    dni: '87654321B', 
    paquete_servicios: 'Fibra 1Gb + 3 Líneas',
    elena_num_lineas: '3',
    elena_oferta_yoigo: 'SOHO UNLIMITED',
    elena_ahorro_estimado: '22€/mes',
    comentario_operador_admin: 'Cliente muy interesado, pendiente de firma.',
    projectId: 'YOIGO'
  },
  { 
    id: 'L-003', 
    timestamp: new Date(Date.now() - 172800000), 
    status: 'CALIFICADO', 
    nombre: 'Antonio Lopez', 
    tlf: '622333444', 
    dni: '11223344C', 
    tipo_seguro: 'HOGAR',
    compania_actual: 'Mapfre',
    precio_actual: 450,
    comentario_operador_admin: '',
    projectId: 'SEGUROS'
  },
  { 
    id: 'L-004', 
    timestamp: new Date(), 
    status: 'CALIFICADO', 
    nombre: 'Ilyass Merini', 
    tlf: '633444555', 
    dni: '22334455D', 
    tipo_seguro: 'PACK',
    compania_actual: 'Axa',
    precio_actual: 1200,
    comentario_operador_admin: 'Interesado en el pack ahorro total.',
    projectId: 'SEGUROS'
  }
];

import { getAgentInstruction } from './services/agentOrchestrator';

const App: React.FC = () => {
  const { setLanguage } = useTranslation();
  const [role, setRole] = useState<UserRole>('LANDING');
  const [isIvrGoigo, setIsIvrGoigo] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [knowledgeBase, setKnowledgeBase] = useState<string[]>([]);
  
  const [callCenters, setCallCenters] = useState<CallCenter[]>(INITIAL_CALL_CENTERS);
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [diamondStats, setDiamondStats] = useState<DiamondStats>(INITIAL_DIAMOND_STATS);
  
  const [config, setConfig] = useState<ProjectConfig>({
    maxConcurrentCalls: 50,
    voiceName: 'Kore',
    voipProvider: 'Elena-Cloud-VOIP',
    aiTemperature: 0.7,
    callingActive: true,
    scheduleStart: '00:00',
    scheduleEnd: '23:59',
    sipAccounts: {
      ELENA: { number: '', user: '', pass: '', server: '', host: '', port: '', proxy: '', status: 'DISCONNECTED' },
      YOIGO: {
        number: '3698841010',
        user: '3698841010',
        pass: 'NcAChIPhIu3jLl1T641HwW1',
        server: '178.79.157.150',
        host: '178.79.157.150',
        port: '5060',
        proxy: '',
        status: 'CONNECTED'
      },
      SEGUROS: { number: '', user: '', pass: '', server: '', host: '', port: '', proxy: '', status: 'DISCONNECTED' },
      VERIFICATION: { number: '', user: '', pass: '', server: '', host: '', port: '', proxy: '', status: 'DISCONNECTED' }
    }
  });
  
  const [prospects, setProspects] = useState<Prospect[]>(INITIAL_PROSPECTS);
  const [leads, setLeads] = useState<LeadData[]>(INITIAL_LEADS);
  const [activeSessions, setActiveSessions] = useState<CallSession[]>([]);
  const [fullTranscript, setFullTranscript] = useState<string>('');
  const [callHistory, setCallHistory] = useState<CallHistoryEntry[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [debugMessages, setDebugMessages] = useState<string[]>([]);

  const [currentProject, setCurrentProject] = useState<ProjectType>('ELENA');

  const filteredDiamondStats = useMemo(() => {
    const projectCallCenters = callCenters.filter(c => c.projectType === currentProject);
    const projectLeads = leads.filter(l => l.projectId === currentProject);
    
    return {
      totalCallCenters: projectCallCenters.length,
      totalActiveCalls: Math.floor(projectCallCenters.length * 5.5),
      totalRevenue: projectLeads.length * 150,
      monthlyGrowth: 12.5
    };
  }, [callCenters, leads, currentProject]);

  const [callingType, setCallingType] = useState<ProjectType | null>(null);
  const callingTypeRef = useRef<ProjectType | null>(null);
  
  const updateCallingType = (type: ProjectType | null) => {
    setCallingType(type);
    callingTypeRef.current = type;
  };

  const updateDebug = (msg: string) => {
    setDebugMessages(prev => [...prev.slice(-19), msg]);
  };

  const isCalling = callingType !== null;
  const sessionRef = useRef<any>(null);
  const geminiReadyRef = useRef<boolean>(false);

  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const callStartTimeRef = useRef<Date | null>(null);
  const fullTranscriptRef = useRef<string>('');
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [socket, setSocket] = useState<any>(null);
  const [activeBubbles, setActiveBubbles] = useState<LeadData[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Conectar explícitamente a la URL del mismo origen del navegador
    const serverUrl = window.location.origin;
    console.log("App.tsx: Conectando socket a:", serverUrl);
    const newSocket = io(serverUrl, {
      path: '/socket.io',
      // Forzar polling estricto con cookies activadas para eludir el IAP del preview de Google
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
    setSocket(newSocket);
    
    // Forzar registro inmediato
    // Si tenemos una referencia al streamSid actual, enviarlo
    const currentStreamSid = sessionRef.current?.streamSid;
    console.log("App.tsx: Intentando registrar puente de audio con streamSid:", currentStreamSid);
    newSocket.emit('register_audio_bridge', currentStreamSid);
    
    // Reintento periódico si no hay streamSid
    const retryInterval = setInterval(() => {
      const sid = sessionRef.current?.streamSid;
      console.log("App.tsx: Reintento de registro con streamSid:", sid);
      if (!sid) {
        newSocket.emit('register_audio_bridge');
      } else {
        newSocket.emit('register_audio_bridge', sid);
        clearInterval(retryInterval);
      }
    }, 2000);

    newSocket.on('connect', () => {
      console.log("Connected to backend audio bridge, socket ID:", newSocket.id);
      updateDebug("Socket conectado, registrando puente...");
      const sid = sessionRef.current?.streamSid;
      console.log("App.tsx: Registro en evento 'connect' con streamSid:", sid);
      newSocket.emit('register_audio_bridge', sid);
    });

    newSocket.on('disconnect', (reason) => {
      console.log("Disconnected from backend audio bridge. Reason:", reason);
      updateDebug("Socket desconectado: " + reason);
    });

    newSocket.on('connect_error', (err) => {
      console.error("Socket error detail:", err);
      updateDebug(`Error de socket: ${err.message}`);
    });

    newSocket.on('streamSid_available', (sid: string) => {
      console.log("App.tsx: Recibido 'streamSid_available':", sid);
      if (sessionRef.current) {
        sessionRef.current.streamSid = sid;
        console.log("App.tsx: Sesión actualizada con streamSid:", sid);
      }
      newSocket.emit('register_audio_bridge', sid);
    });

    newSocket.on('twilio_audio', (base64Audio: string) => {
      console.log("Audio recibido en frontend, tamaño:", base64Audio.length);
      console.log("Estado de sessionRef.current:", !!sessionRef.current);
      
      if (sessionRef.current) {
        // Convertir base64 a Uint8Array
        const mulawData = decodeBase64(base64Audio);
        // Convertir mulaw a PCM16
        const pcm16 = mulawToPcm16(mulawData);
        // Convertir PCM16 a base64 para Gemini
        const base64Pcm = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));

        console.log("Enviando audio convertido a Gemini session...");
        if (sessionRef.current) {
          updateDebug("Session encontrada. Estado: Activa");
          
          // Amplificación simple: multiplicar los valores PCM por 2
          const amplifiedPcm = new Int16Array(pcm16.length);
          for (let i = 0; i < pcm16.length; i++) {
            amplifiedPcm[i] = Math.min(32767, Math.max(-32768, pcm16[i] * 2));
          }
          const base64AmplifiedPcm = btoa(String.fromCharCode(...new Uint8Array(amplifiedPcm.buffer)));

          updateDebug("Enviando input amplificado a Gemini...");
          try {
            sessionRef.current.sendRealtimeInput({ 
              audio: { data: base64AmplifiedPcm, mimeType: 'audio/pcm;rate=16000' } 
            });
            updateDebug("Audio enviado a Gemini correctamente.");
          } catch (e) {
            updateDebug("Error crítico al enviar audio a Gemini: " + e);
          }
        } else {
          updateDebug("Error crítico: sessionRef.current es nulo al intentar enviar audio");
        }
      } else {
        console.error("Error: sessionRef.current es nulo al intentar enviar audio");
      }
    });

    newSocket.on("sale_bubble", (lead: LeadData) => {
      setActiveBubbles(prev => {
        if (prev.find(b => b.id === lead.id)) return prev;
        return [...prev, lead];
      });
    });

    return () => {
      newSocket.close();
    };
  }, []); // Run once on mount

  useEffect(() => {
    if (socket && isAuthenticated && currentUser) {
      socket.emit("join_room", { 
        callCenterId: currentUser.callCenterId, 
        projectId: currentUser.projectId || currentProject,
        role: currentUser.role 
      });
    }
  }, [socket, isAuthenticated, currentUser, currentProject]);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkApiKey();
  }, []);

  useEffect(() => {
    if (role === 'SUPERADMIN' || role === 'DIAMOND_ADMIN') {
      const exporterSessions: CallSession[] = [
        { id: 'EXP-001', workerName: 'Exporter: Carlos (Madrid)', startTime: new Date(Date.now() - 300000), lastTranscript: 'Ofreciendo portabilidad a Yoigo...', isActive: true, isElena: false, companyId: 'C-001' },
        { id: 'EXP-002', workerName: 'Exporter: Ana (Barcelona)', startTime: new Date(Date.now() - 120000), lastTranscript: 'Validando cobertura de fibra...', isActive: true, isElena: false, companyId: 'C-002' },
      ];
      
      setActiveSessions(prev => {
        const elenaSessions = prev.filter(s => s.isElena);
        // Only update if sessions actually changed to avoid unnecessary re-renders
        if (prev.length === elenaSessions.length + exporterSessions.length) return prev;
        return [...elenaSessions, ...exporterSessions];
      });
    } else {
      setActiveSessions(prev => prev.filter(s => s.isElena));
    }
  }, [role]);

  const handleSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const analyzeTranscript = async (transcript: string) => {
    try {
      // Usamos cast as any para evitar incompatibilidades de tipos de TypeScript en el navegador
      const apiKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY as string) || 
                     ((import.meta as any).env?.GEMINI_API_KEY as string) || 
                     "";
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          Analyze the following call transcript and extract ONE successful pattern or objection handler that can be used to improve future calls.
          Keep it short (max 100 characters).
          Transcript: ${transcript}
        `,
      });
      
      const pattern = response.text?.trim();
      if (pattern && pattern.length > 10) {
        setKnowledgeBase(prev => [pattern, ...prev].slice(0, 10));
        console.log("Self-Improvement: New pattern learned!", pattern);
      }
    } catch (err) {
      console.error("Self-Improvement Error:", err);
    }
  };


  const stopCall = useCallback(() => {
    updateCallingType(null);
    geminiReadyRef.current = false;
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) {}
      sessionRef.current = null;
    }
    
    // Self-Improvement Logic: Analyze the transcript after the call
    if (fullTranscriptRef.current.length > 100) {
      analyzeTranscript(fullTranscriptRef.current);
    }
    
    const finalizeAudio = () => {
      if (audioContextInRef.current) {
        audioContextInRef.current.close().catch(() => {});
        audioContextInRef.current = null;
      }
      if (audioContextOutRef.current) {
        audioContextOutRef.current.close().catch(() => {});
        audioContextOutRef.current = null;
      }
      audioSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
      audioSourcesRef.current.clear();
      nextStartTimeRef.current = 0;
    };

    if (callStartTimeRef.current) {
      const now = new Date();
      const durationSeconds = Math.floor((now.getTime() - callStartTimeRef.current.getTime()) / 1000);
      const startTime = callStartTimeRef.current;
      
      setCallHistory(prev => [{
        id: Math.random().toString(36).substr(2, 9),
        workerName: callingType === 'YOIGO' ? 'Elena (Yoigo Empresas)' : 'Elena Voice Asesor',
        startTime: startTime,
        durationSeconds,
        status: durationSeconds > 10 ? 'COMPLETADA' : 'PERDIDA'
      }, ...prev]);
      
      callStartTimeRef.current = null;
    }

    finalizeAudio();
    setCallingType(null);
    setActiveSessions([]);
    setLastError(null);
  }, [callingType]);

  const checkMicrophonePermission = async () => {
    try {
      if (navigator.permissions && (navigator.permissions as any).query) {
        const result = await (navigator.permissions as any).query({ name: 'microphone' });
        if (result.state === 'denied') {
          setLastError("⚠️ Permiso denegado: El acceso al micrófono está bloqueado en tu navegador. Por favor, desbloquéalo en la configuración del sitio.");
          return false;
        }
      }
      return true;
    } catch (e) {
      return true; // Fallback if query is not supported
    }
  };

  const startOrangeYoigoCall = () => {
    const instruction = (currentUser?.email === 'admin_elite@seguros.com' || currentUser?.email === 'worker_elite@seguros.com') 
      ? ELITE_INSURANCE_SYSTEM_INSTRUCTION 
      : ORANGE_YOIGO_SYSTEM_INSTRUCTION;
    startCall('YOIGO', instruction);
  };
  
  const startTriceraCall = () => {
    const instruction = (currentUser?.email === 'admin_elite@seguros.com' || currentUser?.email === 'worker_elite@seguros.com') 
      ? ELITE_INSURANCE_SYSTEM_INSTRUCTION 
      : TRICERA_SYSTEM_INSTRUCTION;
    startCall('SEGUROS', instruction);
  };

  const startCall = async (type: ProjectType, customInstruction?: string) => {
    if (callingTypeRef.current !== null) return;
    
    updateCallingType(type);
    
    try {
      setLastError(null);
      
      const hasPermission = await checkMicrophonePermission();
      if (!hasPermission) {
        updateCallingType(null);
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setLastError("⚠️ Tu navegador no soporta el acceso al micrófono. Por favor, usa una versión reciente de Chrome o Edge.");
        updateCallingType(null);
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasMic = devices.some(device => device.kind === 'audioinput');
      if (!hasMic) {
        setLastError("⚠️ No se detectó ningún micrófono. Por favor, conecta uno e inténtalo de nuevo.");
        updateCallingType(null);
        return;
      }

      // Prioritize API_KEY from dialog, fallback to GEMINI_API_KEY
      let apiKey = (window as any).API_KEY || (process.env as any).API_KEY || (process.env as any).GEMINI_API_KEY;
      
      console.log("Starting call, API key detected:", apiKey ? "YES (masked)" : "NO");
      updateDebug(`API Key check: ${apiKey ? "Found" : "Missing"}`);

      if (!apiKey && window.aistudio) {
        console.log("No API key found, opening selector...");
        updateDebug("Opening API Key selector...");
        await handleSelectKey();
        apiKey = (window as any).API_KEY || (process.env as any).API_KEY;
        console.log("API key after selector:", apiKey ? "YES (masked)" : "NO");
      }

      if (!apiKey) {
        console.error("No API key available after all checks.");
        updateDebug("Error: API Key Missing");
        setLastError("Error: No se ha detectado la clave de API de Gemini. Si estás usando el link externo, asegúrate de configurar GEMINI_API_KEY en las variables de entorno.");
        updateCallingType(null);
        return;
      }

      setFullTranscript('');
      fullTranscriptRef.current = '';
      callStartTimeRef.current = new Date();
      nextStartTimeRef.current = 0;
      
      const ai = new GoogleGenAI({ apiKey });
      
      console.log("Initializing AudioContexts...");
      updateDebug("Initializing AudioContexts...");
      if (audioContextInRef.current) audioContextInRef.current.close().catch(() => {});
      if (audioContextOutRef.current) audioContextOutRef.current.close().catch(() => {});
      
      audioContextInRef.current = new AudioContext({ sampleRate: 16000 });
      audioContextOutRef.current = new AudioContext({ sampleRate: 24000 });
      
      await audioContextInRef.current.resume();
      await audioContextOutRef.current.resume();
      updateDebug(`AudioCtx: In(${audioContextInRef.current.state}) Out(${audioContextOutRef.current.state})`);
      console.log("AudioContexts resumed. In state:", audioContextInRef.current.state, "Out state:", audioContextOutRef.current.state);

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        updateDebug("Microphone stream acquired.");
      } catch (err: any) {
        console.error("Mic error:", err);
        const errStr = String(err);
        const isPermissionError = 
          err.name === 'NotAllowedError' || 
          err.name === 'PermissionDeniedError' || 
          errStr.includes('Permission denied') ||
          errStr.includes('NotAllowedError');

        if (isPermissionError) {
          setLastError("⚠️ Permiso denegado: Elena no puede escucharte. Por favor, haz clic en el icono del candado en la barra de direcciones y permite el acceso al micrófono.");
        } else {
          setLastError(`⚠️ Error de micrófono: ${err.message || errStr}`);
        }
        updateCallingType(null);
        return;
      }

      const instruction = customInstruction || getAgentInstruction(type, currentUser, knowledgeBase);
      updateDebug("Connecting to Gemini Live API...");

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          systemInstruction: instruction,
          responseModalities: [Modality.AUDIO],
          speechConfig: { 
            voiceConfig: { 
              prebuiltVoiceConfig: { voiceName: config.voiceName as any || 'Kore' } 
            } 
          },
          tools: [{ functionDeclarations: [GENERAL_LEAD_TOOL, ORANGE_YOIGO_LEAD_TOOL, ROI_TOOL, SCHEDULE_MEETING_TOOL, INSURANCE_LEAD_TOOL, ELITE_INSURANCE_LEAD_TOOL, TRANSFER_TO_YOIGO_TOOL, TRANSFER_TO_INSURANCE_TOOL, TRANSFER_TO_SUPPORT_TOOL, TRANSFER_CALL_TOOL] }],
          inputAudioTranscription: {}, 
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            console.log("Live API Connection opened successfully.");
            // sessionRef.current = s; // s no está disponible aquí
            updateDebug("Connection Opened");
            setLastError(null);
            
            const source = audioContextInRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (!geminiReadyRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const base64Pcm = createPCM16Blob(inputData);
              
              sessionPromise.then(s => {
                try {
                  console.log("Enviando audio a Gemini, tamaño:", base64Pcm.length);
                  s.sendRealtimeInput({ 
                    audio: { data: base64Pcm, mimeType: 'audio/pcm;rate=16000' } 
                  });
                } catch (err) {
                  console.error("Error sending audio input:", err);
                }
              }).catch(() => {});
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current!.destination);
            scriptProcessorRef.current = scriptProcessor;
            
            const agentName = callingTypeRef.current === 'YOIGO' ? 'Elena (Yoigo Empresas)' : (callingTypeRef.current === 'SEGUROS' ? 'Elena Seguros' : 'Elena');
            setActiveSessions([{ 
              id: 'local-session', 
              workerName: `${agentName} Voice (Activa)`, 
              startTime: new Date(), 
              lastTranscript: `${agentName} está escuchando...`, 
              isActive: true 
            }]);
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            sessionRef.current = null;
            const errMsg = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
            updateDebug(`API Error: ${errMsg || 'Unknown error'}`);
            
            // Detect invalid key and prompt for a new one
            if (errMsg.toLowerCase().includes("not valid") || errMsg.toLowerCase().includes("not found") || errMsg.toLowerCase().includes("invalid") || errMsg.toLowerCase().includes("demo") || errMsg.toLowerCase().includes("upgrade")) {
              updateDebug("Clave de API no válida o requiere upgrade. Por favor, selecciona una clave de un proyecto con facturación habilitada.");
              setLastError("⚠️ La clave de API requiere un proyecto con facturación habilitada (Upgrade). Por favor, selecciona una clave válida.");
              if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
                window.aistudio.openSelectKey();
              }
            } else {
              setLastError(`⚠️ Error de conexión con Elena: ${errMsg || 'Error desconocido'}`);
            }
            stopCall();
          },
          onclose: (event) => {
            console.log("Live API Connection closed:", event);
            sessionRef.current = null;
            updateDebug(`Connection Closed: ${event.reason || "No reason"}`);
            stopCall();
          },
          onmessage: async (msg: LiveServerMessage) => {
            console.log("Live API Message received:", JSON.stringify(msg, (key, value) => (key === 'inlineData' ? '[DATA]' : value)));
            
            if ((msg as any).setupComplete) {
              console.log("Setup complete frontend! Activando AI...");
              geminiReadyRef.current = true;
              
              const isTwilioCall = sessionRef.current?.streamSid != null;
              if (!isTwilioCall) {
                try {
                  sessionPromise.then(session => {
                    session.sendClientContent({
                      turns: [{ role: 'user', parts: [{ text: "Hola, inicia la conversación presentándote brevemente." }] }],
                      turnComplete: true
                    });
                  });
                } catch (e) { console.error("Error al forzar inicio:", e); }
              }
            }

            if (msg.serverContent?.modelTurn?.parts && audioContextOutRef.current) {
              const ctx = audioContextOutRef.current;
              for (const part of msg.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  // Bridge audio back to Twilio if it's a Twilio call
                  if (socket && sessionRef.current?.streamSid) {
                    // Convertir base64 de Gemini a Uint8Array
                    const pcmData = decodeBase64(part.inlineData.data);
                    // Convertir a Int16Array (asumiendo que Gemini envía PCM16)
                    const pcm16 = new Int16Array(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength / 2);
                    // Convertir a muLaw para Twilio
                    const mulawData = pcm16ToMulaw(pcm16);
                    // Convertir a base64 para enviar
                    const base64Mulaw = btoa(String.fromCharCode(...mulawData));
                    
                    socket.emit('gemini_audio', base64Mulaw);
                  }

                  try {
                    if (ctx.state === 'suspended') await ctx.resume();
                    const buffer = await decodeAudioData(decodeBase64(part.inlineData.data), ctx, 24000, 1);
                    console.log(`Processing audio part, size: ${part.inlineData.data.length}, duration: ${buffer.duration}s`);
                    if (buffer.duration === 0) {
                      console.warn("Received empty audio buffer");
                      continue;
                    }
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                    const source = ctx.createBufferSource();
                    source.buffer = buffer;
                    source.connect(ctx.destination);
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += buffer.duration;
                    audioSourcesRef.current.add(source);
                    
                    source.onended = () => audioSourcesRef.current.delete(source);
                  } catch (err) {
                    console.error("Error decoding audio data:", err);
                  }
                }
              }
            }

            const text = msg.serverContent?.outputTranscription?.text || msg.serverContent?.inputTranscription?.text;
            if (text) {
              const agentName = callingType === 'YOIGO' ? 'Elena (Yoigo Empresas)' : (callingType === 'SEGUROS' ? 'Elena Seguros' : 'Elena');
              setActiveSessions(prev => prev.map(s => ({ ...s, lastTranscript: text })));
              const newEntry = (msg.serverContent?.outputTranscription ? `${agentName}: ` : 'Cliente: ') + text;
              setFullTranscript(prev => prev + (prev ? '\n' : '') + newEntry);
              fullTranscriptRef.current += (fullTranscriptRef.current ? '\n' : '') + newEntry;
            }

            if (msg.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'calculate_roi') {
                  const { num_agentes, sueldo_medio, coste_alquiler_mensual } = fc.args as any;
                  const coste_humano_anual = (num_agentes * sueldo_medio * 12) + (coste_alquiler_mensual * 12);
                  const coste_elena_anual = (num_agentes * 300 * 12); // Estimación de coste Elena
                  const ahorro = coste_humano_anual - coste_elena_anual;
                  const porcentaje = ((ahorro / coste_humano_anual) * 100).toFixed(0);

                  sessionPromise.then(s => s.sendToolResponse({ 
                    functionResponses: { 
                      id: fc.id, 
                      name: fc.name, 
                      response: { 
                        result: `El ahorro estimado es de ${ahorro.toLocaleString()}€ al año (un ${porcentaje}% menos de gastos). Explícale al cliente que esto es rentabilidad pura desde el primer mes.` 
                      } 
                    } 
                  })).catch(() => {});
                }

                if (fc.name === 'schedule_meeting') {
                  const { nombre, empresa, email, fecha } = fc.args as any;
                  setLastError(null);
                  const newLead: LeadData = { 
                    id: Math.random().toString(36).substr(2, 9),
                    nombre,
                    empresa,
                    email,
                    fecha_cita: fecha,
                    timestamp: new Date(),
                    status: 'CITA_AGENDADA',
                    callTranscript: fullTranscriptRef.current,
                    projectId: callingType || undefined,
                    callCenterId: currentUser?.callCenterId
                  };
                  
                  if (socket) socket.emit("new_lead", newLead);
                  
                  sessionPromise.then(s => s.sendToolResponse({ 
                    functionResponses: { 
                      id: fc.id, 
                      name: fc.name, 
                      response: { 
                        result: `CITA AGENDADA con éxito para el ${fecha}. Dile al cliente que recibirá un email de confirmación en ${email} y que ha sido un placer.` 
                      } 
                    } 
                  })).catch(() => {});
                }

                if (fc.name === 'save_orange_yoigo_lead') {
                  const { nombre_completo, dni_nie, direccion_instalacion, telefono_contacto, cuenta_bancaria_iban, comentarios_venta } = fc.args as any;
                  setLastError(null);
                  const newLead: LeadData = { 
                    id: Math.random().toString(36).substr(2, 9),
                    nombre_completo,
                    dni_nie,
                    direccion_instalacion,
                    telefono_contacto,
                    cuenta_bancaria_iban,
                    observaciones: comentarios_venta,
                    timestamp: new Date(),
                    status: 'CALIFICADO',
                    callTranscript: fullTranscriptRef.current,
                    projectId: callingType || undefined,
                    callCenterId: currentUser?.callCenterId
                  };
                  setLeads(prev => [newLead, ...prev]);
                  if (socket) socket.emit("new_lead", newLead);
                  
                  sessionPromise.then(s => s.sendToolResponse({ 
                    functionResponses: { 
                      id: fc.id, 
                      name: fc.name, 
                      response: { 
                        result: "VENTA DE ORANGE/YOIGO REGISTRADA. Procede a cerrar la llamada amablemente." 
                      } 
                    } 
                  })).catch(() => {});
                }

                if (fc.name === 'transfer_call') {
                  const { destination_extension, reason } = fc.args as any;
                  updateDebug(`Transferring call to ${destination_extension} for reason: ${reason}`);
                  
                  // In a real SIP implementation, this is where you would send the SIP REFER command
                  // to your backend server (e.g., via socket.io or a REST API call)
                  if (socket) {
                    socket.emit("sip_transfer", { 
                      extension: destination_extension, 
                      reason: reason,
                      callId: activeSessions[0]?.id // Assuming we have a call ID
                    });
                  }

                  sessionPromise.then(s => s.sendToolResponse({ 
                    functionResponses: { 
                      id: fc.id, 
                      name: fc.name, 
                      response: { 
                        result: `Transfer initiated to extension ${destination_extension}. Please say goodbye and end the call.` 
                      } 
                    } 
                  })).catch(() => {});
                  
                  // Automatically stop the AI part of the call after a short delay
                  // to let Elena say goodbye
                  setTimeout(() => {
                    stopCall();
                  }, 4000);
                }

                if (fc.name === 'transfer_to_yoigo') {
                  updateCallingType('YOIGO');
                  sessionPromise.then(s => s.sendToolResponse({ 
                    functionResponses: { 
                      id: fc.id, 
                      name: fc.name, 
                      response: { result: "Transfert en cours vers le spécialiste Yoigo..." } 
                    } 
                  })).catch(() => {});
                  setTimeout(() => {
                    stopCall();
                    startCall('YOIGO');
                  }, 2000);
                }

                if (fc.name === 'transfer_to_insurance') {
                  updateCallingType('SEGUROS');
                  sessionPromise.then(s => s.sendToolResponse({ 
                    functionResponses: { 
                      id: fc.id, 
                      name: fc.name, 
                      response: { result: "Transfert en cours vers Nathalie Delporte..." } 
                    } 
                  })).catch(() => {});
                  setTimeout(() => {
                    stopCall();
                    startCall('SEGUROS');
                  }, 2000);
                }

                if (fc.name === 'save_elite_insurance_lead') {
                  const { nombre_completo, age, mutuelle_actuelle, cotisation_actuelle, nb_personnes, dates_naissance, besoins_specifiques, type_rdv, date_rdv, telefono_contacto } = fc.args as any;
                  setLastError(null);
                  const newLead: LeadData = { 
                    id: Math.random().toString(36).substr(2, 9),
                    nombre_completo,
                    age,
                    mutuelle_actuelle,
                    cotisation_actuelle,
                    nb_personnes,
                    dates_naissance,
                    besoins_specifiques,
                    type_rdv,
                    date_rdv,
                    telefono_contacto,
                    timestamp: new Date(),
                    status: 'CALIFICADO',
                    callTranscript: fullTranscriptRef.current,
                    projectId: callingType || undefined,
                    callCenterId: currentUser?.callCenterId
                  };
                  setLeads(prev => [newLead, ...prev]);
                  if (socket) socket.emit("new_lead", newLead);
                  
                  sessionPromise.then(s => s.sendToolResponse({ 
                    functionResponses: { 
                      id: fc.id, 
                      name: fc.name, 
                      response: { 
                        result: "FICHE PROSPECT ÉLITE ENREGISTRÉE AVEC SUCCÈS. Vous pouvez maintenant procéder au transfert ou conclure l'appel selon le script." 
                      } 
                    } 
                  })).catch(() => {});
                }

                if (fc.name === 'save_insurance_lead') {
                  const { nombre_completo, dni_nie, tipo_seguro, telefono_contacto, compania_actual, precio_actual, observaciones } = fc.args as any;
                  setLastError(null);
                  const newLead: LeadData = { 
                    id: Math.random().toString(36).substr(2, 9),
                    nombre_completo,
                    dni_nie,
                    tipo_seguro,
                    telefono_contacto,
                    compania_actual,
                    precio_actual,
                    observaciones,
                    timestamp: new Date(),
                    status: 'CALIFICADO',
                    callTranscript: fullTranscriptRef.current,
                    projectId: callingType || undefined,
                    callCenterId: currentUser?.callCenterId
                  };
                  setLeads(prev => [newLead, ...prev]);
                  if (socket) socket.emit("new_lead", newLead);
                  
                  sessionPromise.then(s => s.sendToolResponse({ 
                    functionResponses: { 
                      id: fc.id, 
                      name: fc.name, 
                      response: { 
                        result: "DATOS DEL SEGURO GUARDADOS CORRECTAMENTE. Puedes despedirte del cliente asegurándole que recibirá su presupuesto en breve." 
                      } 
                    } 
                  })).catch(() => {});
                }

                if (fc.name === 'save_lead_data') {
                  const validation = validateLeadData(fc.args);
                  
                  if (!validation.isValid) {
                    setLastError(`⚠️ Datos Inválidos: ${validation.errorMessage}`);
                    
                    sessionPromise.then(s => s.sendToolResponse({ 
                      functionResponses: { 
                        id: fc.id, 
                        name: fc.name, 
                        response: { 
                          error: `ERROR EN LOS DATOS: ${validation.errorMessage}. Por favor, discúlpate y vuelve a preguntar el dato incorrecto al cliente para validarlo.` 
                        } 
                      } 
                    })).catch(() => {});
                    return;
                  }

                  setLastError(null);
                  const newLead: LeadData = { 
                    id: Math.random().toString(36).substr(2, 9),
                    ...(fc.args as any),
                    timestamp: new Date(),
                    status: 'CALIFICADO',
                    callTranscript: fullTranscriptRef.current,
                    projectId: callingType || undefined,
                    callCenterId: currentUser?.callCenterId
                  };
                  setLeads(prev => [newLead, ...prev]);
                  if (socket) socket.emit("new_lead", newLead);
                  
                  sessionPromise.then(s => s.sendToolResponse({ 
                    functionResponses: { id: fc.id, name: fc.name, response: { result: "DATOS GUARDADOS CORRECTAMENTE. Puedes despedirte cordialmente." } } 
                  })).catch(() => {});
                }
              }
            }
          }
        }
      });

      try {
        const session = await sessionPromise;
        if (callingTypeRef.current !== null) {
          if (sessionRef.current) {
            try { sessionRef.current.close(); } catch (e) {}
          }
          sessionRef.current = session;
        } else {
          session.close();
        }
      } catch (err: any) {
        console.error("Failed to establish session:", err);
        const errStr = String(err);
        updateDebug(`Session Error: ${err.message || errStr}`);
        if (!errStr.includes("aborted") && !errStr.includes("AbortError")) {
          setLastError(`Error de conexión con Elena: ${err.message || 'No se pudo iniciar la sesión de IA. Verifica tu conexión a internet.'}`);
          stopCall();
        }
      }
    } catch (e: any) { 
      console.error("startCall catch-all error:", e); 
      updateDebug(`Critical Error: ${e.message || String(e)}`);
      setLastError(`Error al iniciar Elena: ${e.message || "Error desconocido"}`);
      stopCall();
    }
  };

  const handleLogin = async (email: string, pass: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = pass.trim();
    
    // Check both current state and initial users for maximum robustness
    const allPossibleUsers = [...users, ...INITIAL_USERS];
    const user = allPossibleUsers.find(u => 
      u.email?.toLowerCase() === trimmedEmail && 
      u.password === trimmedPass
    );

    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      setRole(user.role);
      
      if (user.projectId) {
        setCurrentProject(user.projectId);
      }
      
      // Auto-set language for Elite users
      if (trimmedEmail === 'admin_elite@seguros.com' || trimmedEmail === 'worker_elite@seguros.com') {
        setLanguage('fr');
      }
    } else {
      throw new Error("Credenciales inválidas");
    }
  };

  const handleRegister = async (data: any) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: data.name,
      email: data.email,
      password: data.password,
      role: 'WORKER',
      status: 'OFFLINE',
      lastLogin: new Date(),
      projectId: 'ELENA'
    };
    setUsers(prev => [...prev, newUser]);
    setAuthMode('LOGIN');
  };

  const renderContent = () => {
    if (isIvrGoigo) {
      return <IvrGoigoDashboard />;
    }

    if (!isAuthenticated && role !== 'LANDING') {
      return authMode === 'LOGIN' ? (
        <LoginPage 
          onLogin={handleLogin} 
          onSwitchToRegister={() => setAuthMode('REGISTER')}
        />
      ) : (
        <RegisterPage 
          onRegister={handleRegister} 
          onSwitchToLogin={() => setAuthMode('LOGIN')}
        />
      );
    }

    switch(role) {
      case 'LANDING':
        return (
          <HomePage 
            onStart={() => {
              setAuthMode('LOGIN');
              setRole('WORKER'); // Default to worker for login page context if needed
            }} 
            startCall={() => startCall('ELENA')} 
            stopCall={stopCall} 
            isCalling={isCalling} 
            callingType={callingType}
            lastError={lastError}
          />
        );
      case 'DIAMOND_ADMIN':
        return (
          <DiamondAdminDashboard 
            currentUser={currentUser}
            currentProject={currentProject}
            stats={filteredDiamondStats} 
            callCenters={callCenters} 
            onUpdateCallCenter={(id, data) => setCallCenters(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))}
            onAddCallCenter={(center) => setCallCenters(prev => [...prev, center])}
            leads={leads}
            onUpdateLead={(id, data) => setLeads(prev => prev.map(l => l.id === id ? { ...l, ...data } : l))}
            isCalling={isCalling}
            callingType={callingType}
            startCall={() => startCall(currentProject)}
            startOrangeYoigoCall={startOrangeYoigoCall}
            startTriceraCall={startTriceraCall}
            startVerificationCall={() => startCall('VERIFICATION')}
            stopCall={stopCall}
            lastError={lastError}
            activeSessions={activeSessions} 
            callHistory={callHistory} 
          />
        );
      case 'SUPERADMIN':
        return (
          <SuperAdminDashboard 
            currentUser={currentUser}
            currentProject={currentProject}
            setCurrentProject={currentUser?.projectId ? () => {} : setCurrentProject}
            isLocked={!!currentUser?.projectId}
            config={config} 
            setConfig={setConfig} 
            leads={leads} 
            prospects={prospects} 
            setProspects={setProspects} 
            isCalling={isCalling}
            callingType={callingType}
            startCall={() => startCall(currentProject)}
            startOrangeYoigoCall={startOrangeYoigoCall}
            startTriceraCall={startTriceraCall}
            startVerificationCall={() => startCall('VERIFICATION')}
            stopCall={stopCall}
            lastError={lastError}
            activeSessions={activeSessions} 
            callHistory={callHistory} 
            companies={companies}
            setCompanies={setCompanies}
            users={users}
            setUsers={setUsers}
            onUpdateLead={(id, data) => setLeads(prev => prev.map(l => l.id === id ? { ...l, ...data } : l))}
          />
        );
      case 'WORKER':
        return (
          <WorkerDashboard 
            socket={socket}
            currentUser={currentUser}
            currentProject={currentProject}
            leads={leads} 
            prospects={prospects} 
            setProspects={setProspects}
            isCalling={isCalling} 
            callingType={callingType}
            startCall={() => startCall(currentProject)} 
            startOrangeYoigoCall={startOrangeYoigoCall}
            startTriceraCall={startTriceraCall}
            startVerificationCall={() => startCall('VERIFICATION')}
            stopCall={stopCall} 
            callHistory={callHistory} 
            lastError={lastError} 
            activeSessions={activeSessions} 
            onUpdateLead={(id, data) => setLeads(prev => prev.map(l => l.id === id ? { ...l, ...data } : l))}
            users={users}
            setUsers={setUsers}
          />
        );
      case 'CLIENT':
        return <ClientDashboard lead={leads[0]} />;
    }
  };

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full glass-dark p-12 rounded-[3rem] border border-white/10 shadow-3xl">
          <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-900/20">
            <Lock className="text-white w-10 h-10" />
          </div>
          <h2 className="text-3xl font-display font-bold mb-4 text-white uppercase tracking-tighter">Acceso Restringido</h2>
          <p className="text-white/60 mb-10 leading-relaxed">
            Para utilizar las funciones de voz avanzada de Elena AI, es necesario configurar una clave de API de Gemini (Proyecto de Pago).
          </p>
          <button 
            onClick={handleSelectKey}
            className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/20"
          >
            Configurar Clave API
          </button>
          <p className="mt-6 text-[10px] text-white/30 uppercase tracking-widest">
            Consulta la <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline hover:text-white transition-colors">documentación de facturación</a>
          </p>
        </div>
      </div>
    );
  }

  if (role === 'LANDING') {
    return (
      <>
        {renderContent()}
        <CallControlBar />
        {/* Sales Bubbles Container */}
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-4 pointer-events-none">
          <AnimatePresence>
            {activeBubbles.map((bubble) => (
              <div key={bubble.id} className="pointer-events-auto">
                <SaleBubble 
                  lead={bubble} 
                  onClose={(id) => setActiveBubbles(prev => prev.filter(b => b.id !== id))} 
                />
              </div>
            ))}
          </AnimatePresence>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-900">
      <nav className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row justify-between items-center sticky top-0 z-50 shadow-sm gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black text-blue-900 tracking-tight text-nowrap uppercase italic">ELENA <span className="text-blue-500 font-light not-italic">Voice</span></span>
            </div>
          </div>
          <div className="sm:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {role === 'DIAMOND_ADMIN' ? 'Diamond' : role === 'SUPERADMIN' ? 'Admin' : role === 'WORKER' ? 'Operador' : role === 'CLIENT' ? 'Cliente' : 'Inicio'}
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl space-x-1 w-full sm:w-auto overflow-x-auto scrollbar-hide">
          <button
            onClick={() => {
              setIsIvrGoigo(false);
              setRole('LANDING');
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${role === 'LANDING' && !isIvrGoigo ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            INICIO
          </button>

          <button
            onClick={() => {
              setIsIvrGoigo(true);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isIvrGoigo ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            IVR GOIGO 🚀
          </button>
          
          {!isAuthenticated ? (
            <button
              onClick={() => {
                setIsIvrGoigo(false);
                setAuthMode('LOGIN');
                setRole('WORKER'); // This triggers the login page because role !== 'LANDING'
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!isAuthenticated && role !== 'LANDING' && !isIvrGoigo ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              ACCESO
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setIsIvrGoigo(false);
                  setRole(currentUser?.role || 'WORKER');
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${role !== 'LANDING' && !isIvrGoigo ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                PANEL
              </button>
              <button
                onClick={() => {
                  setIsIvrGoigo(false);
                  setIsAuthenticated(false);
                  setCurrentUser(null);
                  setRole('LANDING');
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 transition-all"
              >
                SALIR
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>

      {/* Sales Bubbles Container */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-4 pointer-events-none">
        <AnimatePresence>
          {activeBubbles.map((bubble) => (
            <div key={bubble.id} className="pointer-events-auto">
              <SaleBubble 
                lead={bubble} 
                onClose={(id) => setActiveBubbles(prev => prev.filter(b => b.id !== id))} 
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
      {debugMessages.length > 0 && (
        <div className="fixed bottom-4 left-4 z-[9999] max-w-xs w-full bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl pointer-events-none">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Debug Elena</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="space-y-1">
            {debugMessages.slice(-5).map((msg, i) => (
              <div key={i} className="text-[10px] font-mono text-white/70 truncate">
                {`> ${msg}`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
