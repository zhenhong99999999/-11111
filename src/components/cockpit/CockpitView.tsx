import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, PhoneOff, Music, Navigation, Settings, Play, Pause, ChevronLeft, Volume2, ShieldCheck, Battery, Radio, Sparkles } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { AudioStreamer, AudioRecorder } from '../../lib/audio-utils';
import { cn } from '../../lib/utils';

// Mock navigation data
const NAV_INSTRUCTIONS = [
  "继续直行 1.2 公里",
  "前方路口左转进入新世纪大道",
  "注意右侧汇入车辆",
  "已为您避开拥堵路段"
];

export const CockpitView = ({ onExit }: { onExit: () => void }) => {
  const [isDriving, setIsDriving] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [isAiActive, setIsAiActive] = useState(false);
  const [aiState, setAiState] = useState<'idle' | 'listening' | 'speaking'>('idle');
  const [transcription, setTranscription] = useState('');
  const [lastAiResponse, setLastAiResponse] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const audioStreamer = useRef<AudioStreamer | null>(null);
  const audioRecorder = useRef<AudioRecorder | null>(null);
  const sessionRef = useRef<any>(null);

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate speed in driving mode
  useEffect(() => {
    let interval: any;
    if (isDriving) {
      interval = setInterval(() => {
        setSpeed(prev => {
          if (prev < 68) return prev + 1;
          return prev + (Math.random() > 0.5 ? 0.2 : -0.2);
        });
      }, 100);
    } else {
      setSpeed(0);
    }
    return () => clearInterval(interval);
  }, [isDriving]);

  const startAiSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      audioStreamer.current = new AudioStreamer(24000);
      await audioStreamer.current.start();

      const session = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } }
          },
          systemInstruction: "你现在是小米 SU7 的车载语音助手『小爱同学』。你现在的语气应该是专业、温润且极具亲和力的。当前正在驾驶场景回家的路上。你可以控制车内温度、音乐、导航等，并与驾驶员进行情感化交流。回答要简洁，符合驾驶场景的安全需求。",
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsAiActive(true);
            setAiState('listening');
            startRecording();
          },
          onmessage: (msg: any) => {
            if (msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              setAiState('speaking');
              audioStreamer.current?.playChunk(msg.serverContent.modelTurn.parts[0].inlineData.data);
            }
            if (msg.serverContent?.interrupted) {
              // Handle interruption
            }
            if (msg.serverContent?.turnComplete) {
              setAiState('listening');
            }
            if (msg.serverContent?.outputAudioTranscription) {
              setLastAiResponse(msg.serverContent.outputAudioTranscription.text || '');
            }
            if (msg.serverContent?.inputAudioTranscription) {
              setTranscription(msg.serverContent.inputAudioTranscription.text || '');
            }
          },
          onerror: (err) => console.error("Live API Error:", err),
          onclose: () => {
            setIsAiActive(false);
            setAiState('idle');
            stopRecording();
          }
        }
      });

      sessionRef.current = await session;
    } catch (error) {
      console.error("Failed to start AI session", error);
    }
  };

  const startRecording = () => {
    if (!audioRecorder.current) {
      audioRecorder.current = new AudioRecorder((base64) => {
        if (sessionRef.current) {
          sessionRef.current.sendRealtimeInput({
            audio: { data: base64, mimeType: 'audio/pcm;rate=16000' }
          });
        }
      });
    }
    audioRecorder.current.start();
  };

  const stopRecording = () => {
    audioRecorder.current?.stop();
    audioRecorder.current = null;
  };

  const toggleAi = () => {
    if (isAiActive) {
      sessionRef.current?.close();
      audioStreamer.current?.stop();
    } else {
      startAiSession();
    }
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden z-[100] flex flex-col font-sans">
      {/* Background Image Container - 1:1 Restoration using official SU7 Interior shot */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://r.jina.ai/i/05e0ae7ecb6540d9994c9f13e1107c13" 
          alt="Xiaomi SU7 1:1 Interior"
          className="w-full h-full object-cover scale-[1.01]"
          referrerPolicy="no-referrer"
        />
        {/* Dynamic Light Overlay */}
        <div className={cn(
          "absolute inset-0 bg-blue-500/10 mix-blend-overlay transition-opacity duration-1000",
          isDriving ? "opacity-100" : "opacity-0"
        )} />
      </div>

      {/* 1:1 Instrument Cluster (Behind Steering Wheel) */}
      <div className="absolute top-[41.5%] left-1/2 -translate-x-1/2 w-[110px] h-[32px] flex items-center justify-between z-20 pointer-events-none px-1">
         {/* Left Side: Speed */}
         <div className="flex flex-col items-end justify-center">
            <motion.span 
              className="text-[11px] font-black italic text-[#E5E5E5] tracking-tighter"
            >
              {Math.round(speed)}
            </motion.span>
            <span className="text-[4px] text-mi-orange font-bold uppercase tracking-widest leading-none mt-0.5">km/h</span>
         </div>

         {/* Center: Gear */}
         <div className="w-8 h-8 flex items-center justify-center">
            <motion.div 
              animate={isDriving ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              className={cn(
                "text-[10px] font-black rounded flex items-center justify-center",
                isDriving ? "text-mi-orange" : "text-white"
              )}
            >
              {isDriving ? 'D' : 'P'}
            </motion.div>
         </div>

         {/* Right Side: Range */}
         <div className="flex flex-col items-start justify-center">
            <span className="text-[11px] font-black italic text-[#E5E5E5] tracking-tighter">420</span>
            <span className="text-[4px] text-white/40 font-bold uppercase tracking-widest leading-none mt-0.5">KM</span>
         </div>
      </div>

      {/* 1:1 Central Screen Reflection & Glow */}
      <div className="absolute top-[32%] right-[11%] w-[42%] h-[28%] pointer-events-none z-10 overflow-hidden">
         <motion.div 
           className="w-full h-full bg-blue-400/5 blur-2xl mix-blend-screen"
           animate={isAiActive ? { 
             opacity: [0.3, 0.7, 0.3],
             scale: [1, 1.2, 1]
           } : { opacity: 0 }}
           transition={{ duration: 3, repeat: Infinity }}
         />
      </div>

      {/* Central Screen Interactive Content */}
      <div className="absolute top-[33.5%] right-[15%] w-[34%] h-[24%] z-20 overflow-hidden rounded-lg pointer-events-none">
         <div className="relative w-full h-full p-2 flex flex-col gap-2">
            {/* Nav Mini Card */}
            <div className="apple-glass-light p-2 rounded-lg flex items-center gap-2 border border-white/20">
               <Navigation className="w-3 h-3 text-blue-400" />
               <div className="flex flex-col">
                  <span className="text-[6px] text-white/40 uppercase font-black">Route</span>
                  <span className="text-[8px] text-white font-bold">返回 寓所</span>
               </div>
               <div className="ml-auto text-[8px] text-mi-orange font-black">12.5km</div>
            </div>

            {/* AI Assistant Transcription Bubbles */}
            <AnimatePresence>
               {isAiActive && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col justify-end gap-1 pb-1"
                  >
                     {transcription && (
                        <div className="bg-white/10 backdrop-blur-md px-2 py-1 rounded-md self-start max-w-[80%] border border-white/10">
                           <p className="text-[7px] text-white/80">{transcription}</p>
                        </div>
                     )}
                     {lastAiResponse && (
                        <div className="bg-mi-orange/20 backdrop-blur-md px-2 py-1 rounded-md self-end max-w-[80%] border border-mi-orange/30">
                           <p className="text-[7px] text-mi-orange font-medium">{lastAiResponse}</p>
                        </div>
                     )}
                  </motion.div>
               )}
            </AnimatePresence>
         </div>
      </div>

      {/* Top Status Bar */}
      <div className="relative z-10 flex justify-between items-center p-6 text-white/60 text-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Battery className="w-4 h-4 text-mi-orange" />
            <span className="font-mono">85%</span>
          </div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4" />
            <span>5G</span>
          </div>
          <span className="text-mi-orange font-medium">小米澎湃 OS</span>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 text-lg font-medium tracking-widest text-white">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="flex items-center gap-4">
          <ShieldCheck className="w-5 h-5 text-green-400" />
          <span className="text-white/80">车况优良</span>
          <button 
            onClick={onExit}
            className="ml-4 px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors"
          >
            退出座舱
          </button>
        </div>
      </div>

      {/* Main Experience Layout */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-between py-12 px-20">
        
        {/* HUD (Head-Up Display) Area */}
        <motion.div 
          animate={{ y: isDriving ? [0, -4, 0] : 0 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2 mt-12"
        >
          <div className="flex items-baseline gap-2">
            <span className="text-8xl font-mono font-bold text-white tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              {Math.round(speed)}
            </span>
            <span className="text-2xl text-white/40 font-medium">km/h</span>
          </div>
          <div className="px-6 py-1 bg-mi-orange/20 border border-mi-orange/40 rounded-full text-mi-orange text-xs font-bold tracking-[0.2em]">
            D GEAR
          </div>
        </motion.div>

        {/* Central Dashboard & Controls */}
        <div className="w-full flex justify-between items-end gap-12">
          
          {/* Navigation Card */}
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-80 apple-glass p-6 rounded-[2rem]"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500 rounded-xl">
                <Navigation className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-white">高德地图</span>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-white/40 text-xs font-medium mb-1">正在前往</span>
                <span className="text-white font-semibold text-lg">回家 (温馨寓所)</span>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-white/80">{NAV_INSTRUCTIONS[Math.floor(speed/20) % 4]}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* AI Center Orb */}
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Outer Pulse */}
              <AnimatePresence>
                {aiState !== 'idle' && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 0.3 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-mi-orange"
                  />
                )}
              </AnimatePresence>

              {/* The Orb */}
              <motion.button
                onClick={toggleAi}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500",
                  "shadow-[0_0_60px_rgba(255,105,0,0.1)] border border-mi-orange/20",
                  isAiActive ? "bg-mi-orange/20" : "bg-white/5 backdrop-blur-3xl"
                )}
              >
                {isAiActive ? (
                  <motion.div
                    animate={{ scale: aiState === 'speaking' ? [1, 1.2, 1] : 1 }}
                    transition={{ duration: 0.5, repeat: aiState === 'speaking' ? Infinity : 0 }}
                  >
                    <Mic className="w-10 h-10 text-mi-orange" />
                  </motion.div>
                ) : (
                  <Sparkles className="w-10 h-10 text-white/30" />
                )}

                {/* Status Ring */}
                {aiState === 'listening' && (
                  <svg className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="48%"
                      fill="none"
                      stroke="rgba(255,105,0,0.4)"
                      strokeWidth="2"
                      strokeDasharray="300"
                      className="animate-[spin_2s_linear_infinite]"
                    />
                  </svg>
                )}
              </motion.button>

              <div className="absolute -bottom-16 w-80 text-center space-y-2 pointer-events-none">
                <AnimatePresence mode="wait">
                  {isAiActive && (
                    <motion.div
                      key={aiState}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-mi-orange text-sm font-bold tracking-widest uppercase"
                    >
                      {aiState === 'listening' ? "小爱正在聆听..." : "小爱正在播报..."}
                    </motion.div>
                  )}
                </AnimatePresence>
                {transcription && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-white/60 text-sm font-medium italic truncate px-4"
                  >
                    "{transcription}"
                  </motion.div>
                )}
              </div>
            </div>
            
            <motion.button
              onClick={() => setIsDriving(!isDriving)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "mt-20 px-10 py-4 rounded-full font-bold tracking-widest transition-all duration-500",
                isDriving 
                  ? "bg-red-500/20 text-red-500 border border-red-500/40" 
                  : "bg-mi-orange text-white shadow-[0_10px_40px_rgba(255,105,0,0.4)]"
              )}
            >
              {isDriving ? "停止巡航" : "启动智能巡航"}
            </motion.button>
          </div>

          {/* Media Player Card */}
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-80 apple-glass p-6 rounded-[2rem]"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-mi-orange rounded-xl">
                <Music className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-white">媒体中心</span>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mi-orange to-purple-600 flex items-center justify-center">
                <Play fill="white" className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold truncate">人车合一 - 巡航曲</span>
                <span className="text-white/40 text-xs">SU7 智能音乐推荐</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <ChevronLeft className="w-6 h-6 text-white/20" />
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Pause className="w-5 h-5 text-white" />
              </div>
              <ChevronLeft className="w-6 h-6 text-white/20 rotate-180" />
              <Volume2 className="w-5 h-5 text-white/40" />
            </div>
          </motion.div>

        </div>

        {/* Console Controls Area */}
        <div className="w-3/5 flex justify-center gap-8 mt-4">
           {[
             { icon: Mic, label: '语音' },
             { icon: Music, label: '音乐' },
             { icon: Navigation, label: '导航' },
             { icon: Settings, label: '设置' },
             { icon: PhoneOff, label: '紧急' }
           ].map((btn, i) => (
             <motion.button
               key={i}
               whileHover={{ y: -4, backgroundColor: 'rgba(255,255,255,0.1)' }}
               className="flex flex-col items-center gap-2 p-4 rounded-3xl transition-all"
             >
               <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                 <btn.icon className="w-6 h-6 text-white/60" />
               </div>
               <span className="text-[10px] text-white/40 uppercase tracking-tighter font-bold">{btn.label}</span>
             </motion.button>
           ))}
        </div>

      </div>

      {/* Interruption Overlay when AI is speaking */}
      <AnimatePresence>
        {lastAiResponse && aiState === 'speaking' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 w-[600px] text-center"
          >
             <div className="apple-glass-light p-8 rounded-[3rem] border border-white/20 shadow-2xl">
                <p className="text-xl leading-relaxed text-white font-medium">
                  {lastAiResponse}
                </p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
