# GUÍA DE DESPLIEGUE MAESTRO (ELENAAI.TECH - EUROPA)

Sigue estos pasos EXACTAMENTE en tu **Google Cloud Shell**. He limpiado el código para que no falle el "Build".

## 1. Configuración de Identidad y Proyecto
Esto asegura que trabajas en el proyecto correcto (ELENA VOICE):
```bash
gcloud config set project gen-lang-client-0454897509
```

## 2. Limpieza de Seguridad
Si el servidor de EE.UU. aún existe, lo borramos (ignora si da error de "no encontrado"):
```bash
gcloud run services delete elena-ai-by-teltelecom --region us-west1 --quiet
```

## 3. EL COMANDO DE DESPLIEGUE (Copia y pega todo)
Este comando incluye optimizaciones de memoria para que el sistema NO falle al compilar. 

**Copia y pega este bloque completo:**
```bash
gcloud run deploy elena-ai-app \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_API_KEY=<TU_GEMINI_API_KEY>" \
  --set-env-vars="TWILIO_ACCOUNT_SID=<TU_TWILIO_ACCOUNT_SID>" \
  --set-env-vars="TWILIO_AUTH_TOKEN=<TU_TWILIO_AUTH_TOKEN>" \
  --set-env-vars="APP_URL=https://elenaai.tech" \
  --set-env-vars="NODE_ENV=production" \
  --memory 2Gi \
  --cpu 2 \
  --cpu-boost
```

## 4. Vincular el dominio elenaai.tech
Una vez el comando anterior termine y te dé una URL:
1. Ve a la consola de Google Cloud -> Cloud Run.
2. Haz clic en "MANAGE CUSTOM DOMAINS".
3. Vincula `elenaai.tech` al servicio `elena-ai-app` en la región **europe-west1**.

## 5. Configuración Final Twilio
Asegúrate de que tus Webhooks en Twilio apunten a:
`https://elenaai.tech/twiml` (o a la nueva URL que te dé el comando).

---
**¿Qué hemos arreglado?**
1. **Puerto:** Ahora el servidor detecta automáticamente el puerto de Google Cloud.
2. **Dependencias:** He movido `Vite` y `Typescript` a la sección de producción para que Cloud Build no los ignore.
3. **Memoria:** He forzado 2GB para que el proceso de "Build" no se quede sin aire.
4. **Basura:** Con el nuevo archivo `.gcloudignore`, no subimos archivos temporales que causaban errores.
