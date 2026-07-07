
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  try {
    // Ensure data is 2-byte aligned for Int16Array
    // If not aligned, we need to copy to a new buffer
    let alignedData = data;
    if (data.byteOffset % 2 !== 0) {
      alignedData = new Uint8Array(data.length);
      alignedData.set(data);
    }

    const dataInt16 = new Int16Array(alignedData.buffer, alignedData.byteOffset, alignedData.length / 2);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  } catch (err) {
    console.error("decodeAudioData error:", err);
    throw err;
  }
}

export function createPCM16Blob(data: Float32Array): string {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return encodeBase64(new Uint8Array(int16.buffer));
}

// Conversión simple de muLaw a PCM16 (Twilio usa muLaw a 8kHz)
export function mulawToPcm16(mulawData: Uint8Array): Int16Array {
  const pcm16 = new Int16Array(mulawData.length);
  for (let i = 0; i < mulawData.length; i++) {
    let b = ~mulawData[i];
    let t = ((b & 0x0F) << 3) + 132;
    t <<= (b & 0x70) >> 4;
    pcm16[i] = (b & 0x80) ? (132 - t) : (t - 132);
  }
  return pcm16;
}

// Conversión simple de PCM16 a muLaw (para enviar a Twilio)
export function pcm16ToMulaw(pcmData: Int16Array): Uint8Array {
  const mulaw = new Uint8Array(pcmData.length);
  const BIAS = 0x84;
  const CLIP = 32635;

  for (let i = 0; i < pcmData.length; i++) {
    let sample = pcmData[i];
    let sign = (sample >> 8) & 0x80;
    if (sign !== 0) sample = -sample;
    if (sample > CLIP) sample = CLIP;
    sample += BIAS;

    let exponent = 7;
    for (let e = 0; e < 7; e++) {
      if (sample <= (1 << (e + 8))) {
        exponent = e;
        break;
      }
    }
    let mantissa = (sample >> (exponent + 3)) & 0x0F;
    mulaw[i] = ~(sign | (exponent << 4) | mantissa);
  }
  return mulaw;
}
