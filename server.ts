import * as fs from 'fs';

console.log("SERVER BOOTSTRAP GEMINI_API_KEY:", process.env.GEMINI_API_KEY);

// Redirección de logs eliminada para evitar interferencias

console.log("SERVER BOOTSTRAP GEMINI_API_KEY IS:", process.env.GEMINI_API_KEY);

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import twilio from "twilio";
import { GoogleGenAI } from "@google/genai";
import { getAgentInstruction } from "./src/services/agentOrchestrator";
import { ProjectType } from "./src/types";
import alawmulaw from 'alawmulaw';

const { mulaw } = alawmulaw;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    let apiKey = process['env']['GEMINI_API_KEY'];
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      try {
        const secretKey = fs.readFileSync('.gemini_secret', 'utf8').trim();
        if (secretKey) {
          apiKey = secretKey;
          console.log("Loaded GEMINI_API_KEY from .gemini_secret properly");
        }
      } catch(e) {}
    }
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      console.warn("WARNING: Using injected process.env failed or gave MY_GEMINI_API_KEY, falling back to read from process inside shell or it's hardcoded");
      throw new Error('GEMINI_API_KEY environment variable is missing or dummy: ' + apiKey);
    }
    console.log(`[getAiClient] API Key is available, length: ${apiKey.length}. Prefix: ${apiKey.substring(0, 5)}`);
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true })); // For Twilio webhooks

  const httpServer = createServer(app);
  
  // ... (dentro de socket.on("twilio_audio", ...))
  // Usar getAiClient().live.connect(...) en lugar de ai.live.connect(...)
  // (socket as any).geminiSession = await getAiClient().live.connect({ ... })
  
  // 1. Socket.io for Frontend-Backend communication
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/socket.io"
  });

  // 2. Raw WebSocket Server for Twilio Media Streams (Audio)
  const wss = new WebSocketServer({ noServer: true });
  const activeTwilioStreams = new Map<string, any>(); // Mapa para vincular streamSid -> ws

  httpServer.on('upgrade', (request, socket, head) => {
    const pathname = request.url ? request.url.split('?')[0] : '';
    console.log("Petición de upgrade recibida para path:", pathname);
    
    // Aceptamos la conexión si el path es /media
    if (pathname === '/media') {
      console.log("¡Ruta /media detectada! Aceptando upgrade...");
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else if (pathname.startsWith('/socket.io')) {
      console.log("Path de socket.io detectado, dejando pasar...");
      // Dejamos que socket.io maneje esta ruta
    } else {
      console.log("Path no manejado por upgrade, cerrando socket:", pathname);
      socket.destroy();
    }
  });

  const PORT = Number(process.env.PORT) || 3000;

  // --- TWILIO INTEGRATION ---
  
  // Endpoint to trigger an outbound call from the frontend
  app.post("/api/make-call", async (req, res) => {
    try {
      const { to_number, sipConfig } = req.body;
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const host = req.get('host');
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const appUrl = process.env.APP_URL || `${protocol}://${host}`;

      if (!accountSid || !authToken || !appUrl) {
        return res.status(500).json({ error: "Faltan credenciales de Twilio o APP_URL en las variables de entorno." });
      }

      if (!sipConfig) {
        return res.status(400).json({ error: "Falta la configuración SIP." });
      }

      const client = twilio(accountSid, authToken);

      // We use Twilio to call the customer via your SIP PBX
      const call = await client.calls.create({
        to: `sip:${to_number}@${sipConfig.server}`,
        from: sipConfig.user, // Cambiado de sip:${sipConfig.user}@${sipConfig.server} a solo el usuario
        sipAuthUsername: sipConfig.user,
        sipAuthPassword: sipConfig.pass,
        url: `${appUrl}/twiml`, // Twilio will ask this URL what to do when the customer answers
      });

      console.log("Call initiated:", call.sid);
      res.json({ success: true, callSid: call.sid });
    } catch (error: any) {
      console.error("Error making call:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.all("/twiml", (req, res) => {
    const host = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${host}/media`;
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Connect><Stream url="${wsUrl}"/></Connect></Response>`;
    res.setHeader('Content-Type', 'text/xml');
    res.send(twiml);
  });
  // --------------------------------

  // --- IVR GOIGO INTEGRATION (CUSTOM PBX WEBHOOK) ---
  app.post("/api/ivr/webhook", (req, res) => {
    try {
      const { callId, phone, status, dtmf } = req.body;
      console.log(`[IVR Webhook] Recibido evento - CallId: ${callId}, Phone: ${phone}, Status: ${status || 'N/A'}, DTMF: ${dtmf || 'N/A'}`);
      
      // Emitir evento a todos los clientes web conectados vía socket.io
      io.emit("ivr_call_event", {
        id: callId || Math.random().toString(),
        phone: phone || "Desconocido",
        status: status || (dtmf ? "COMPLETADO" : "CONECTADO"),
        dtmf: dtmf || "",
        timestamp: new Date().toLocaleTimeString().substring(0, 5)
      });

      res.json({ success: true, message: "Evento de llamada transmitido al panel Goigo" });
    } catch (err: any) {
      console.error("Error en IVR Webhook:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- AUDIO UPLOAD ENDPOINT ---
  app.post("/api/upload-audio", (req, res) => {
    try {
      const { filename, data } = req.body;
      if (!filename || !data) {
        return res.status(400).json({ error: "Faltan parámetros: filename y data (base64) son requeridos." });
      }
      
      let base64Data = data;
      if (data.includes('base64,')) {
        base64Data = data.split('base64,')[1];
      }
      
      const buffer = Buffer.from(base64Data, 'base64');
      
      const audioDir = path.join(process.cwd(), 'public', 'audio');
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }
      
      const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const filePath = path.join(audioDir, safeFilename);
      fs.writeFileSync(filePath, buffer);
      
      console.log(`[Upload] Guardado audio de campaña en: ${filePath}`);
      
      res.json({
        success: true,
        url: `/audio/${safeFilename}`,
        filename: safeFilename
      });
    } catch (error: any) {
      console.error("Error al subir audio:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- TTS GENERATION ENDPOINT ---
  app.post("/api/generate-tts", async (req, res) => {
    try {
      const { text, voice } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Falta el texto para la locución." });
      }

      let voiceName = 'Kore'; // prebuilt voice name in Gemini
      if (voice) {
        if (voice.includes('Wavenet-D') || voice.includes('Male')) {
          voiceName = 'Zephyr';
        } else if (voice.includes('Wavenet-C') || voice.includes('Femenina')) {
          voiceName = 'Kore';
        } else if (voice.includes('Neural2-F')) {
          voiceName = 'Puck';
        }
      }

      const ai = getAiClient();
      console.log(`[TTS] Generando locución con voz ${voiceName} para el texto: "${text.substring(0, 50)}..."`);

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Lee el siguiente mensaje en español con tono profesional, amable y claro: ${text}` }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName }
            }
          }
        }
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return res.status(500).json({ error: "La API de Gemini no devolvió datos de audio." });
      }

      const audioDir = path.join(process.cwd(), 'public', 'audio');
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }

      const filename = `tts_${Date.now()}.wav`;
      const filePath = path.join(audioDir, filename);
      
      const buffer = Buffer.from(base64Audio, 'base64');
      fs.writeFileSync(filePath, buffer);

      console.log(`[TTS] Guardado audio generado en: ${filePath}`);

      res.json({
        success: true,
        url: `/audio/${filename}`,
        filename: filename
      });
    } catch (error: any) {
      console.error("Error al generar TTS:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Serve the public/audio folder statically
  app.use('/audio', express.static(path.join(process.cwd(), 'public/audio')));

  // Middleware para registrar todas las peticiones
  app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url} - Headers: ${JSON.stringify(req.headers)}`);
    next();
  });

  // Handle incoming audio from Twilio
  wss.on('connection', (ws, request) => {
    console.log("¡Twilio Media Stream conectado! IP:", request.socket.remoteAddress);
    
    (ws as any).frontendSocket = null;

    // Handle audio from Gemini via frontend
    (ws as any).sendAudio = (base64Audio: string) => {
      console.log("Enviando audio a Twilio, payload size:", base64Audio.length);
      const payload = {
        event: 'media',
        streamSid: (ws as any).streamSid,
        media: { payload: base64Audio }
      };
      ws.send(JSON.stringify(payload));
    };

    ws.on('message', async (message) => {
      try {
        const msg = JSON.parse(message.toString());
        
        if (msg.event === 'start') {
          console.log("Twilio Stream iniciado. Stream SID:", msg.start.streamSid);
          (ws as any).streamSid = msg.start.streamSid;
          activeTwilioStreams.set(msg.start.streamSid, ws);
          
          // Unir el stream de Twilio a su propia sala
          (ws as any).room = msg.start.streamSid;
          
          // Buscar si hay algún frontend esperando este stream
          const allSockets = Array.from(io.sockets.sockets.values());
          console.log("Sockets conectados:", allSockets.length);
          const pendingFrontend = allSockets.find(s => (s as any).pendingFrontend);
          
          if (pendingFrontend) {
            console.log("Vinculando stream de Twilio a frontend pendiente:", pendingFrontend.id);
            (pendingFrontend as any).pendingFrontend = false;
            pendingFrontend.join(msg.start.streamSid);
            (pendingFrontend as any).twilioStream = ws;
            // NOTIFICACIÓN PROACTIVA: Informar al front-end que ya puede usar este sid
            pendingFrontend.emit('streamSid_available', msg.start.streamSid);
          } else {
             // Si no hay ninguno pendiente, también emitimos globalmente por si acaso
             io.emit('streamSid_available', msg.start.streamSid);
          }
          
          // INICIALIZACIÓN DE GEMINI DIRECTAMENTE EN TWILIO (Solo una vez)
          if (!(ws as any).geminiSessionPromise) {
            console.log("Iniciando sesión Gemini para stream:", msg.start.streamSid);
            ws.send(JSON.stringify({
               event: "mark",
               streamSid: msg.start.streamSid,
               mark: { name: "gemini_connecting" }
            }));
            
            (ws as any).geminiSessionPromise = getAiClient().live.connect({
              model: 'gemini-2.0-flash-exp',
              config: {
                systemInstruction: { parts: [{ text: getAgentInstruction('YOIGO' as ProjectType, null) }] },
                responseModalities: ["AUDIO"] as any,
              },
              callbacks: {
                onmessage: (geminiMsg: any) => {
                  console.log(`[Gemini] onmessage object keys: ${Object.keys(geminiMsg)}`);
                  if (geminiMsg.setupComplete) {
                    (ws as any).geminiReady = true;
                    console.log("Sesión Gemini inicializada. Enviando saludo forzado para que inicie la conversación...");
                    // Forzar el inicio de la conversación
                    (ws as any).geminiSessionPromise.then((session: any) => {
                       session.sendClientContent({
                         turns: [{ role: 'user', parts: [{ text: 'Hola, acabo de contestar la llamada. Preséntate y dime por qué me llamas de forma MUY breve y natural.' }] }],
                         turnComplete: true
                       });
                    });
                  }
                  console.log(`[Gemini] onmessage object keys: ${Object.keys(geminiMsg)}`);
                  if (geminiMsg.serverContent) {
                     console.log(`[Gemini] serverContent keys: ${Object.keys(geminiMsg.serverContent)}`);
                  }
                  if (geminiMsg.serverContent?.modelTurn?.parts) {
                    for (const part of geminiMsg.serverContent.modelTurn.parts) {
                      console.log(`[Gemini] Result part keys: ${Object.keys(part)}`);
                      if (part.inlineData?.data) {
                        console.log(`[Audio Line 237] Recibido dato de Gemini, longitud part: ${part.inlineData.data.length}`);
                        try {
                          const pcmBuffer = Buffer.from(part.inlineData.data, 'base64');
                          console.log(`[Audio Line 238] Buffer creado, longitud: ${pcmBuffer.length}`);
                          const pcm16Array = new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, pcmBuffer.length / 2);
                          
                          // Downsample de 24kHz a 8kHz más robusto (promediado)
                          const downsampled = new Int16Array(Math.floor(pcm16Array.length / 3));
                          for (let i = 0; i < downsampled.length; i++) {
                            // Promediado de 3 muestras para reducir aliasing y mejorar calidad
                            let sum = pcm16Array[i * 3] + pcm16Array[i * 3 + 1] + pcm16Array[i * 3 + 2];
                            downsampled[i] = Math.floor(sum / 3);
                          }
                          
                          const mulawArray = mulaw.encode(downsampled);
                          const mulawBase64 = Buffer.from(mulawArray).toString('base64');
                          console.log(`[Audio Line 251] Intentando enviar a Twilio: ws.sendAudio definido? ${(ws as any).sendAudio !== undefined}, longitud B64: ${mulawBase64.length}`);
                          
                          if ((ws as any).sendAudio) {
                            (ws as any).sendAudio(mulawBase64);
                          } else {
                            console.error("[Audio Pipeline] ERROR: sendAudio no definido en ws");
                          }
                        } catch (e) {
                          console.error("Error transcodificando audio de Gemini:", e);
                        }
                      } else {
                        console.log("[Audio Line 237] No data en inlineData");
                      }
                    }
                  }
                },
                onerror: (err: any) => {
                  console.error("Gemini Error:", err);
                },
                onclose: (event: any) => {
                  console.log(`Conexión con Gemini cerrada. Code: ${event.code}, Reason: ${event.reason}, WasClean: ${event.wasClean}`);
                }
              }
            }).catch((err: any) => {
              console.error("Error inicializando Gemini:", err);
              throw err;
            });
          }

        } else if (msg.event === 'media') {
          // Emitir audio a la sala correspondiente (Frontend)
          io.to((ws as any).streamSid).emit('twilio_audio', msg.media.payload);
          
          try {
            if (!(ws as any).geminiReady) return; // Esperar a que reciba setupComplete
            if (!(ws as any).geminiSessionPromise) return; // Esperar a que se inicie en 'start'
            const session = await (ws as any).geminiSessionPromise;
            
            // Decodificar mu-law 8kHz de Twilio a PCM 8kHz primero
            const mulawBuffer = Buffer.from(msg.media.payload, 'base64');
            const pcm8k = mulaw.decode(mulawBuffer);
            
            // Upsample de 8kHz a 16kHz (interpolación lineal simple)
            const pcm16k = new Int16Array(pcm8k.length * 2);
            for (let i = 0; i < pcm8k.length - 1; i++) {
              pcm16k[i * 2] = pcm8k[i];
              pcm16k[i * 2 + 1] = Math.floor((pcm8k[i] + pcm8k[i + 1]) / 2);
            }
            // Última muestra
            pcm16k[pcm16k.length - 2] = pcm8k[pcm8k.length - 1];
            pcm16k[pcm16k.length - 1] = pcm8k[pcm8k.length - 1];
            
            const pcmBuffer = Buffer.from(pcm16k.buffer, pcm16k.byteOffset, pcm16k.byteLength);
            const pcmBase64 = pcmBuffer.toString('base64');
            
            session.sendRealtimeInput({ media: { mimeType: 'audio/pcm;rate=16000', data: pcmBase64 } });
            
            // Log cada 50 paquetes para no saturar el log pero verificar flujo
            if (Math.random() < 0.02) {
              console.log("[Pipeline Twilio->Gemini] Audio enviado exitosamente. Longitud:", pcmBase64.length);
            }
          } catch (e) {
            console.error("Error procesando audio hacia Gemini:", e);
          }
        } else if (msg.event === 'stop') {
          console.log("Stream detenido.");
          activeTwilioStreams.delete((ws as any).streamSid);
        } else {
          console.log("Evento recibido no manejado:", msg.event);
        }
      } catch (e) {
        console.error("Error al procesar mensaje de Twilio:", e);
      }
    });

    ws.on('close', () => {
      console.log("Twilio Media Stream desconectado.");
      activeTwilioStreams.delete((ws as any).streamSid);
    });

    // ... (rest of the connection handler)

  });

  // --- SOCKET.IO LOGIC ---

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("debug", (msg) => {
      console.log("Frontend DEBUG:", msg);
    });

    // Bridge for Twilio audio
    socket.on("register_audio_bridge", (streamSid?: string) => {
      console.log("Frontend registrado para puente de audio, socket ID:", socket.id, "Stream SID solicitado:", streamSid);
      
      // Sincronización de estado: ver si ya hay una llamada activa
      console.log("DEBUG: activeTwilioStreams size:", activeTwilioStreams.size);
      if (activeTwilioStreams.size > 0) {
        for (const sid of activeTwilioStreams.keys()) {
           console.log("DEBUG: SID activo en Twilio:", sid);
        }
      }
      
      if (!streamSid && activeTwilioStreams.size > 0) {
        const activeSid = activeTwilioStreams.keys().next().value;
        console.log("Sincronizando: Ya existe stream activo, informando SID:", activeSid);
        socket.emit('streamSid_available', activeSid);
        streamSid = activeSid;
      }

      (socket as any).streamSid = streamSid;
      
      if (streamSid) {
        socket.join(streamSid);
        console.log(`Socket ${socket.id} unido a la sala del stream ${streamSid}`);
        
        // Vincular el stream de Twilio si ya está activo
        if (activeTwilioStreams.has(streamSid)) {
          (socket as any).twilioStream = activeTwilioStreams.get(streamSid);
          console.log(`Stream de Twilio ${streamSid} vinculado al socket ${socket.id}`);
        } else {
          console.log(`Stream de Twilio ${streamSid} aún no activo, marcando como pendiente.`);
          (socket as any).pendingFrontend = true;
        }
      } else {
        console.log("Socket", socket.id, "se unió sin Stream SID. Marcando como pendiente.");
        (socket as any).pendingFrontend = true;
      }
    });

    socket.on("gemini_audio", (base64Audio: string) => {
      const twilioStream = (socket as any).twilioStream;
      if (twilioStream && (twilioStream as any).sendAudio) {
        (twilioStream as any).sendAudio(base64Audio);
      }
    });

    socket.on("worker_audio", (base64Audio: string) => {
      const twilioStream = (socket as any).twilioStream;
      if (twilioStream && (twilioStream as any).sendAudio) {
        (twilioStream as any).sendAudio(base64Audio);
      }
    });

    // En la parte donde se recibe audio de Twilio (dentro del handler de WebSocket)
    // El frontend nos enviaba "twilio_audio" pero toda la lógica de Gemini ya se maneja directamente
    // en la conexión ws de Twilio para menor latencia.
    socket.on("twilio_audio", async (base64Audio: string) => {
      // Ignorar, ya no procesamos audio de twilio a través del frontend.
      // El puente directo está en wss.on('message')
    });

    // Join rooms based on user context
    socket.on("join_room", (data: { callCenterId?: string; projectId?: string; role: string }) => {
      const { callCenterId, projectId, role } = data;
      
      if (role === 'DIAMOND_ADMIN') {
        socket.join("diamond_global");
        console.log(`Diamond Admin ${socket.id} joined global room`);
      } else {
        if (callCenterId) {
          socket.join(`center_${callCenterId}`);
          console.log(`User ${socket.id} joined center room: ${callCenterId}`);
        }
        if (projectId) {
          socket.join(`project_${projectId}`);
          console.log(`User ${socket.id} joined project room: ${projectId}`);
        }
      }
    });

    // Handle new lead (sale) event
    socket.on("new_lead", (lead: any) => {
      console.log("New lead received:", lead.id);
      
      // Broadcast to Diamond Admins
      io.to("diamond_global").emit("sale_bubble", lead);

      // Broadcast to the specific call center
      if (lead.callCenterId) {
        io.to(`center_${lead.callCenterId}`).emit("sale_bubble", lead);
      }

      // Broadcast to the specific project
      if (lead.projectId) {
        io.to(`project_${lead.projectId}`).emit("sale_bubble", lead);
      }
    });

    // Handle SIP transfer request
    socket.on("sip_transfer", (data: { extension: string; reason: string; callId: string }) => {
      console.log(`SIP Transfer requested to extension ${data.extension} for call ${data.callId}. Reason: ${data.reason}`);
      // TODO: Implement actual SIP REFER logic here using a library like sip.js or a backend SIP provider API
      // This is a placeholder for the backend integration.
      
      // For now, we just log it. In a real scenario, you would send the SIP command to your PBX (178.79.157.150).
      console.log(`[SIP BACKEND] Sending REFER to 178.79.157.150 to transfer to ${data.extension}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const HOST = "0.0.0.0";

  // Escuchar en todos los interfaces en el puerto proporcionado por Cloud Run
  const server = httpServer.listen(PORT, HOST, () => {
    console.log(`Server listening on ${HOST}:${PORT}`);
  });

  server.on('error', (e) => {
    console.error("Error al iniciar el servidor:", e);
    process.exit(1); // Forzar reinicio del contenedor si el puerto está bloqueado
  });
}

startServer();
