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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    setErrorMessage(null);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured. Please add it in Settings.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Initialize audio early to ensure user gesture context is captured
      if (!audioStreamer.current) {
        audioStreamer.current = new AudioStreamer(24000);
      }
      await audioStreamer.current.start();

      const sessionPromise = ai.live.connect({
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
            console.log("Live API: Connection opened");
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
              console.log("Live API: Interrupted");
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
          onerror: (err) => {
            console.error("Live API Error:", err);
            setErrorMessage("语音连接发生错误，请重试");
          },
          onclose: () => {
            console.log("Live API: Connection closed");
            setIsAiActive(false);
            setAiState('idle');
            stopRecording();
            // Clear bubbles after a short delay
            setTimeout(clearAiState, 3000);
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (error) {
      console.error("Failed to start AI session", error);
      setErrorMessage(error instanceof Error ? error.message : "无法开启语音交互，请检查麦克风权限或 API 配置");
      setIsAiActive(false);
      setAiState('idle');
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

  const clearAiState = () => {
    setTranscription('');
    setLastAiResponse('');
  };

  const toggleAi = () => {
    if (isAiActive) {
      sessionRef.current?.close();
      audioStreamer.current?.stop();
      clearAiState();
    } else {
      startAiSession();
    }
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden z-[100] flex flex-col font-sans">
      {/* Background & Ambience */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        {/* Under windshield view - simulates the road ahead */}
        <div className="absolute inset-0 transition-opacity duration-1000">
          <img 
            src="https://r.jina.ai/i/05e0ae7ecb6540d9994c9f13e1107c13" 
            alt="Xiaomi SU7 Cockpit"
            className={cn(
              "w-full h-full object-cover transition-all duration-1000",
              isDriving ? "scale-105 blur-[3px] brightness-[0.7] saturate-[0.8]" : "scale-101"
            )}
            referrerPolicy="no-referrer"
          />
        </div>
        
        {/* Horizon Road simulation - stretching highway lanes (abstract representation) */}
        {isDriving && (
          <div className="absolute inset-0 overflow-hidden opacity-30">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[200%] h-full flex justify-center">
              <div className="w-[1px] h-full bg-gradient-to-t from-white/0 via-white/20 to-white/0 -rotate-[85deg] origin-top translate-x-40" />
              <div className="w-[1px] h-full bg-gradient-to-t from-white/0 via-white/20 to-white/0 rotate-[85deg] origin-top -translate-x-40" />
            </div>
          </div>
        )}

        {/* Immersive Atmospheric Overlays */}
        <div className={cn(
          "absolute inset-0 transition-opacity duration-1000 bg-gradient-to-b from-blue-900/10 via-transparent to-black/40",
          isDriving ? "opacity-100" : "opacity-0"
        )} />
        
        {/* Dashboard Reflection on Windshield */}
        <div className="absolute top-[30%] inset-x-0 h-40 bg-gradient-to-t from-white/5 to-transparent blur-3xl pointer-events-none opacity-40" />
        
        {/* Xiaomi Orange Ambient Bleed */}
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-mi-orange/5 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-mi-orange/5 blur-[120px]" />
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

      {/* Main Experience Layout - Optimized for Driving Sightlines */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-between pb-12 pt-16 px-6">
        
        {/* HUD (Head-Up Display) / Eye-Level Sightline Area */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-24 select-none">
          <motion.div 
            animate={isDriving ? { 
              y: [0, -2, 0],
              scale: [1, 1.01, 1]
            } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center relative"
          >
            {/* Active Cruise Pulse Glow */}
            <AnimatePresence>
              {isDriving && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0.1, 0.4, 0.1], scale: 1.1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 bg-green-500/20 blur-[60px] rounded-full pointer-events-none"
                />
              )}
            </AnimatePresence>

            <div className="flex items-baseline gap-4 relative z-10">
              <motion.span 
                key={Math.round(speed)}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                className="text-[10rem] font-bold text-white tracking-tighter tabular-nums drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]"
              >
                {Math.round(speed)}
              </motion.span>
              <span className="text-3xl text-white/30 font-bold uppercase tracking-widest mb-6">km/h</span>
            </div>

            <motion.div 
              className={cn(
                "px-8 py-1.5 rounded-full text-base font-black tracking-[0.4em] transition-all duration-700",
                isDriving ? "bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.5)]" : "bg-white/10 text-white/40"
              )}
            >
              {isDriving ? "CRUISE ACTIVE" : "D GEAR"}
            </motion.div>

            {/* AI Floating Transcription within Field of View */}
            <AnimatePresence>
              {isAiActive && transcription && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-8 text-white/60 text-lg font-medium italic border-l-2 border-mi-orange pl-4 max-w-xl text-center"
                >
                  "{transcription}"
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Peripheral Widgets Layout */}
        <div className="w-full flex justify-between items-end px-4 gap-8 mb-8">
          
          {/* Navigation Card - Left Peripheral (Faded) */}
          <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: isDriving ? 0.6 : 0.9 }}
            className={cn(
              "w-72 apple-glass-light p-5 rounded-[2.5rem] border border-white/5 transition-opacity",
              isDriving && "grayscale-[0.4]"
            )}
          >
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Navigation className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-white/50">Navigator</span>
               </div>
               {/* Lane Guidance HUD Overlay Arrow */}
               {isDriving && (
                 <motion.div 
                   animate={{ x: [-2, 2, -2] }}
                   transition={{ duration: 1.5, repeat: Infinity }}
                   className="text-mi-orange"
                 >
                   <ChevronLeft className="w-5 h-5 rotate-90" />
                 </motion.div>
               )}
            </div>
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-white font-black text-xl tracking-tight leading-tight">寓所 (温馨)</span>
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">2.4km · 8 min</span>
              </div>
              <div className="text-xs text-blue-400 font-bold leading-tight flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                {NAV_INSTRUCTIONS[Math.floor(speed/30) % 4]}
              </div>
            </div>
          </motion.div>

          {/* Core Controls & Steering Context */}
          <div className="flex flex-col items-center gap-2 flex-1 pb-4 group">
            {/* Visual Haptic Feedback Ripple Container */}
            <div className="relative">
              <motion.button
                onClick={(e) => {
                  setIsDriving(!isDriving);
                  // Trigger ripple
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "relative z-10 px-12 py-5 rounded-full font-black text-sm tracking-[0.2em] uppercase transition-all duration-500",
                  isDriving 
                    ? "bg-red-500 text-white shadow-[0_20px_50px_rgba(239,68,68,0.4)]" 
                    : "bg-mi-orange text-white shadow-[0_15px_40px_rgba(255,105,0,0.5)]"
                )}
              >
                {isDriving ? "退出智能巡航" : "启动智能巡航"}
              </motion.button>
              
              {/* Ripple animation on click proxy */}
              <motion.div 
                 animate={isDriving ? { scale: [1, 2], opacity: [0.5, 0] } : {}}
                 className="absolute inset-0 bg-white/20 rounded-full z-0 pointer-events-none"
              />
            </div>

            {/* Steering Wheel Context Outline */}
            <div className="mt-8 relative w-80 h-16 opacity-30 pointer-events-none">
               <svg viewBox="0 0 400 60" className="w-full h-full text-white">
                  <path d="M10 50 Q 200 10, 390 50" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                  <circle cx="200" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="1" />
               </svg>
            </div>
          </div>

          {/* Media Player - Right Peripheral (Slim Bar) */}
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: isDriving ? 0.4 : 0.8 }}
            className={cn(
              "w-72 apple-glass-light px-4 py-3 rounded-2xl border border-white/5 flex items-center gap-4 transition-all overflow-hidden",
              isDriving && "scale-95"
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mi-orange/40 to-black border border-white/10 flex items-center justify-center shrink-0">
               <Music className="w-5 h-5 text-mi-orange" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-0.5">Media Player</div>
              <div className="text-xs text-white font-bold truncate">人车合一 - 巡航曲</div>
            </div>
            <div className="flex items-center gap-2">
               <motion.button whileTap={{ scale: 0.8 }}><Play size={14} className="text-white/60 fill-current" /></motion.button>
               <motion.button whileTap={{ scale: 0.8 }}><Volume2 size={14} className="text-white/40" /></motion.button>
            </div>
          </motion.div>
        </div>

        {/* AI Assistant Center Mini Orb - Minimalist in cockpit mode */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30">
          <motion.button
            onClick={toggleAi}
            animate={{ 
              scale: isAiActive ? [1, 1.1, 1] : 1,
              opacity: isDriving ? 0.3 : 0.8
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all",
              isAiActive ? "bg-mi-orange shadow-[0_0_30px_#FF6900]" : "bg-white/10 backdrop-blur-xl border border-white/10"
            )}
          >
            <Sparkles className={cn("w-5 h-5", isAiActive ? "text-white" : "text-white/40")} />
          </motion.button>
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
