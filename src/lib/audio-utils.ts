export class AudioStreamer {
  private audioContext: AudioContext | null = null;
  private nextStartTime: number = 0;
  private sampleRate: number = 24000;

  constructor(sampleRate: number = 24000) {
    this.sampleRate = sampleRate;
  }

  async start() {
    this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
    await this.audioContext.resume();
  }

  stop() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  playChunk(base64Data: string) {
    if (!this.audioContext) return;

    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Int16Array(len / 2);
    for (let i = 0; i < len; i += 2) {
      bytes[i / 2] = (binaryString.charCodeAt(i + 1) << 8) | binaryString.charCodeAt(i);
    }

    const floatData = new Float32Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      floatData[i] = bytes[i] / 32768;
    }

    const buffer = this.audioContext.createBuffer(1, floatData.length, this.sampleRate);
    buffer.getChannelData(0).set(floatData);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    const startTime = Math.max(this.audioContext.currentTime, this.nextStartTime);
    source.start(startTime);
    this.nextStartTime = startTime + buffer.duration;
  }
}

export async function getMicrophoneStream() {
  return navigator.mediaDevices.getUserMedia({ audio: true });
}

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private onAudioData: (base64: string) => void;

  constructor(onAudioData: (base64: string) => void) {
    this.onAudioData = onAudioData;
  }

  async start() {
    this.stream = await getMicrophoneStream();
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    
    // Using ScriptProcessor for simplicity in this environment
    this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);
    
    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmData = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
      }
      
      const uint8 = new Uint8Array(pcmData.buffer);
      let binary = "";
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      const base64Data = btoa(binary);
      this.onAudioData(base64Data);
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
    
    // Explicitly resume context for reliability
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  stop() {
    if (this.source) this.source.disconnect();
    if (this.processor) this.processor.disconnect();
    if (this.audioContext) this.audioContext.close();
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
  }
}
