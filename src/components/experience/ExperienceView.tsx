import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ChevronLeft, ChevronRight, Play, Pause, RefreshCw, HelpCircle, MessageSquare, Sparkles, X, Home, Mic } from 'lucide-react';
import { XiaomiLogo } from '../common/XiaomiLogo';
import { CockpitView } from '../cockpit/CockpitView';
import { cn } from '../../lib/utils';
import { Device } from '../../types';

interface ExperienceViewProps {
  onBack: () => void;
}

const steps = [
  {
    step: 1,
    title: "出发回家",
    description: "开始规划回家路线，智能家居准备就绪。",
    time: "17:30",
    car: {
      title: "导航中",
      details: ["目的地: 家", "距离: 12.5km", "预计时间: 35min"],
      status: "active",
      mapActive: true
    },
    phone: {
      message: "我要回家",
      type: "voice",
    },
    home: {
      devices: [
        { name: "空调", state: "准备中", active: true },
        { name: "热水器", state: "已开启", active: true },
        { name: "安防", state: "开启中", active: true },
        { name: "扫地机", state: "回充中", active: false }
      ]
    },
    aiInsight: "✨ 我为您规划了最快路线。同时，已提前开启家中热水器与空调预热，确保您到家即享舒适。"
  },
  {
    step: 2,
    title: "路上联动",
    description: "检测到距离回家还有8分钟，智能感知环境并调节。",
    time: "17:55",
    car: {
      title: "即将到达",
      details: ["目的地: 家", "距离: 2.8km", "预计时间: 8min"],
      status: "active",
      signalSent: true
    },
    phone: {
      message: "已为您准备好回家 🏠\n客厅灯光已调至迎宾模式",
      type: "notif",
    },
    home: {
      devices: [
        { name: "空调", state: "26°C", active: true },
        { name: "空气净化", state: "强力模式", active: true },
        { name: "咖啡机", state: "预热中", active: true },
        { name: "音箱", state: "准备播放", active: true }
      ]
    },
    aiInsight: "✨ 检测到您距离家 3 公里范围内。基于您的习惯，家中已开启空气强力净化并开始预热咖啡机。"
  },
  {
    step: 3,
    title: "到达地库",
    description: "车辆进入地库，智能感应灯光亮起，家门自动解锁。",
    time: "18:00",
    car: {
      title: "车辆入位",
      details: ["自动泊车中...", "位置: B2-302", "欢迎回家"],
      status: "success",
      parking: true
    },
    phone: {
      message: "身份已确认 🔓\n欢迎回家，[用户名]",
      type: "notif",
    },
    home: {
      devices: [
        { name: "玄关灯", state: "已开启", active: true },
        { name: "智能锁", state: "已解锁", active: true },
        { name: "走廊灯", state: "已开启", active: true },
        { name: "窗帘", state: "准备中", active: true }
      ]
    },
    aiInsight: "✨ 利用地理围栏技术，当车辆检测到入库，您的家门已通过安全认证自动为您解锁。"
  },
  {
    step: 4,
    title: "推门瞬间",
    description: "推开门的一刻，为您定制的「大师情景」瞬间就绪。",
    time: "18:05",
    car: {
      title: "熄火停放",
      details: ["状态: 安全", "哨兵模式: 开启", "剩余续航: 420km"],
      status: "inactive"
    },
    phone: {
      message: "欢迎回来，今天外面32度，室内已恒定26度",
      type: "voice_large",
    },
    home: {
      devices: [
        { name: "客厅灯", state: "大师模式", active: true, color: "#FFD2A0" },
        { name: "窗帘", state: "半开 50%", active: true },
        { name: "电视", state: "续播: 小米生态", active: true },
        { name: "扫地机", state: "已停止", active: true }
      ]
    },
    aiInsight: "✨ 欢迎回家！此时此刻，灯光已调至您最爱的「暖阳」色调，电视正为您续播上次未看完的内容。"
  },
  {
    step: 5,
    title: "舒适时刻",
    description: "全生态联动，让生活自然而然。",
    time: "18:30",
    car: {
      title: "智能守护",
      details: ["哨兵模式: 正常", "电池保护: 正常"],
      status: "inactive"
    },
    phone: {
      message: "一切就绪，享受您的私人时光 ☕",
      type: "notif_final",
    },
    home: {
      devices: [
        { name: "环境监制", state: "温度26°C 湿度45%", active: true },
        { name: "电视", state: "全屏模式", active: true },
        { name: "窗帘", state: "全闭", active: true },
        { name: "联动总数", state: "12个设备", active: true }
      ]
    },
    aiInsight: "✨ 小米「人车家全生态」现已将您的 10+ 通讯协议设备无缝连接。这不仅是智能，更是陪伴。"
  }
];

const TypewriterText: React.FC<{ text: string }> = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    let i = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(timer);
    }, 50);
    return () => clearInterval(timer);
  }, [text]);
  return <span>{displayedText}</span>;
};

const SU7Cockpit: React.FC<{ status: string; isBlinking?: boolean }> = ({ status, isBlinking }) => {
  const [speed, setSpeed] = useState(0);
  const [temp, setTemp] = useState(26);

  useEffect(() => {
    const interval = setInterval(() => {
      if (status === 'active') {
        setSpeed(prev => {
          const target = 72;
          const delta = (Math.random() - 0.5) * 4;
          const next = prev === 0 ? target : prev + delta;
          return Math.max(68, Math.min(78, next));
        });
      } else {
        setSpeed(0);
      }
      
      setTemp(prev => {
        const delta = (Math.random() - 0.5) * 0.2;
        return Math.max(25, Math.min(27, prev + delta));
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="w-full h-full relative flex flex-col items-center justify-center bg-[#050505] rounded-2xl overflow-hidden border border-white/10 shadow-3xl">
      {/* 1:1 Reference Photo Background */}
      <img 
        src="https://r.jina.ai/i/05e0ae7ecb6540d9994c9f13e1107c13" 
        alt="Xiaomi SU7 1:1 Interior" 
        className="absolute inset-0 w-full h-full object-cover scale-[1.02] transform transition-transform duration-700 hover:scale-105"
        referrerPolicy="no-referrer"
      />
      
      {/* Immersive Lighting Layers */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
      <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay pointer-events-none" />

      {/* 1:1 Instrument Cluster Integration */}
      <div className="absolute top-[41.5%] left-1/2 -translate-x-1/2 w-[110px] h-[32px] flex items-center justify-between z-20 pointer-events-none px-1">
         {/* Left Side: Speed */}
         <div className="flex flex-col items-end justify-center">
            <motion.span 
              key={Math.floor(speed)}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: 1 }}
              className="text-[11px] font-black italic text-[#E5E5E5] tracking-tighter shadow-sm"
            >
              {Math.floor(speed)}
            </motion.span>
            <span className="text-[4px] text-[#FF6900] font-bold uppercase tracking-widest leading-none mt-0.5">km/h</span>
         </div>

         {/* Center: Gear Status Map */}
         <div className="w-8 h-8 flex items-center justify-center">
            <motion.div 
              animate={status === 'active' ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              className={cn(
                "text-[10px] font-black rounded flex items-center justify-center",
                status === 'active' ? "text-[#FF6900]" : "text-white"
              )}
            >
              {status === 'active' ? 'D' : 'P'}
            </motion.div>
         </div>

         {/* Right Side: Temp */}
         <div className="flex flex-col items-start justify-center">
            <motion.span 
              key={temp.toFixed(1)}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: 1 }}
              className="text-[11px] font-black italic text-[#E5E5E5] tracking-tighter"
            >
              {temp.toFixed(0)}°
            </motion.span>
            <span className="text-[4px] text-[#A0A0A0] font-bold uppercase tracking-widest leading-none mt-0.5">Temp</span>
         </div>
      </div>

      {/* 1:1 Central Screen Reflection Glow */}
      <div className="absolute top-[32%] right-[11%] w-[42%] h-[28%] pointer-events-none z-10 overflow-hidden">
         <motion.div 
           className="w-full h-full bg-blue-400/10 blur-xl mix-blend-screen"
           animate={status === 'active' ? { 
             opacity: [0.3, 0.6, 0.3],
             scale: [1, 1.1, 1]
           } : { opacity: 0.2 }}
           transition={{ duration: 5, repeat: Infinity }}
         />
      </div>

      {/* Dynamic Navigation Line on Central Screen */}
      <div className="absolute top-[38%] right-[22%] w-24 h-20 z-20 pointer-events-none overflow-hidden rounded-lg">
         {status === 'active' && (
            <svg className="w-full h-full opacity-60">
               <motion.path 
                 d="M10 60 Q 30 40, 50 50 T 90 20" 
                 fill="none" 
                 stroke="#FF6900" 
                 strokeWidth="1.5"
                 initial={{ pathLength: 0 }}
                 animate={{ pathLength: 1 }}
                 transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
               />
               <motion.circle 
                 r="2" 
                 fill="#FF6900"
                 animate={{ 
                    offsetDistance: ["0%", "100%"] 
                 }}
                 style={{ offsetPath: "path('M10 60 Q 30 40, 50 50 T 90 20')" }}
                 transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
               />
            </svg>
         )}
      </div>

      {/* Professional Blinkers HUD */}
      {isBlinking && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0] }}
          transition={{ duration: 0.5, repeat: 2 }}
          className="absolute inset-x-0 bottom-[10%] px-12 flex justify-between z-30 pointer-events-none"
        >
           <div className="w-6 h-1.5 bg-[#FF6900] blur-[2px] rounded-full shadow-[0_0_15px_#FF6900]" />
           <div className="w-6 h-1.5 bg-[#FF6900] blur-[2px] rounded-full shadow-[0_0_15px_#FF6900]" />
        </motion.div>
      )}

      {/* Subtle Road Environment Overlay */}
      {status === 'active' && (
        <div className="absolute inset-0 z-0 pointer-events-none">
           <div className="absolute inset-0 bg-white/5 mix-blend-overlay animate-pulse opacity-20" />
        </div>
      )}
    </div>
  );
};

const VoiceAvatar: React.FC<{ active?: boolean }> = ({ active }) => {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
       <div className={cn(
         "absolute inset-0 rounded-full border-2 border-mi-orange/30",
         active && "animate-ping"
       )} />
       <motion.div 
         className="w-10 h-10 rounded-full bg-mi-orange flex items-center justify-center shadow-[0_0_20px_#FF6900]"
         animate={active ? { scale: [1, 1.1, 1] } : {}}
         transition={{ duration: 0.5, repeat: Infinity }}
       >
          <div className="flex gap-0.5 h-3 items-center">
             {[1,2,3].map(i => (
               <motion.div 
                 key={i}
                 className="w-0.5 bg-white rounded-full"
                 animate={active ? { height: ["20%", "100%", "20%"] } : { height: "20%" }}
                 transition={{ duration: 0.4 + i*0.1, repeat: Infinity }}
               />
             ))}
          </div>
       </motion.div>
    </div>
  );
};

export const ExperienceView: React.FC<ExperienceViewProps> = ({ onBack }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [customScene, setCustomScene] = useState('');
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);
  const [apiResult, setApiResult] = useState<any>(null);
  const [showAiExplainer, setShowAiExplainer] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [userName, setUserName] = useState('体验官');
  const [showImmersiveCockpit, setShowImmersiveCockpit] = useState(false);

  const currentStep = steps[currentStepIdx];

  const handleGeminiCall = async () => {
    if (!customScene.trim()) return;
    setIsLoadingGemini(true);
    setIsAutoPlay(false);
    try {
      const resp = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene: customScene })
      });
      const data = await resp.json();
      setApiResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingGemini(false);
    }
  };

  useEffect(() => {
    if (!isAutoPlay) return;
    const timer = setTimeout(() => {
      if (currentStepIdx < steps.length - 1) {
        setCurrentStepIdx(prev => prev + 1);
      } else {
        setIsAutoPlay(false);
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [currentStepIdx, isAutoPlay]);

  const handleNext = () => {
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
    }
  };

  const restart = () => {
    setCurrentStepIdx(0);
    setIsAutoPlay(true);
  };

  const toggleBlink = () => {
    setIsBlinking(true);
    setTimeout(() => setIsBlinking(false), 800);
  };

  return (
    <motion.div 
      className="relative min-h-screen flex flex-col items-center py-12 px-4 overflow-hidden"
    >
      {/* Header */}
      <div className="w-full max-w-7xl px-8 flex justify-between items-center z-20 mb-12">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-text-sub hover:text-text-main transition-colors text-sm"
          >
            <span>←</span> 返回首页
          </button>

          <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 ml-4">
            <Sparkles size={14} className="text-mi-orange" />
            <input 
              type="text" 
              placeholder="自定义联动情景 (如：我要睡觉)" 
              className="bg-transparent outline-none text-xs w-48 text-text-sub placeholder:text-gray-600"
              value={customScene}
              onChange={(e) => setCustomScene(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGeminiCall()}
            />
            <button 
              onClick={handleGeminiCall}
              disabled={isLoadingGemini}
              className="text-mi-orange hover:text-white transition-colors disabled:opacity-50"
            >
              {isLoadingGemini ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm font-medium tracking-tight bg-white/5 px-4 py-1 rounded-full border border-white/10">
            <span className="text-mi-orange mr-2">●</span>
            {currentStep.time} · Step {currentStepIdx + 1}/{steps.length}
          </div>
          <button 
             onClick={() => setShowAiExplainer(true)}
             className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-mi-orange hover:bg-mi-orange/10 transition-colors"
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </div>

      {/* Main Panels */}
      <div className={cn(
        "flex flex-col lg:flex-row gap-8 items-center justify-center w-full max-w-7xl transition-all duration-700 flex-1 relative",
      )}>
        {/* Step 2 Signal Wave Animation */}
        {currentStep.car.signalSent && (
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[1px] bg-gradient-to-r from-mi-orange to-transparent -z-10"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}

        {/* Car Column */}
        <motion.div 
          className={cn(
            "w-[340px] h-[540px] apple-glass shadow-2xl rounded-[2.5rem] p-6 flex flex-col transition-all cursor-pointer group relative overflow-hidden",
            currentStepIdx >= 3 && "opacity-30 blur-[2px]"
          )}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: currentStepIdx >= 3 ? 0.3 : 1, x: 0 }}
          onClick={toggleBlink}
        >
          {/* Overlay Button for Immersive Experience */}
          {currentStepIdx < 3 && (
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 105, 0, 0.9)' }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowImmersiveCockpit(true);
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-mi-orange text-white px-6 py-3 rounded-full font-bold shadow-[0_10px_30px_rgba(255,105,0,0.4)] flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
            >
              <Mic size={18} />
              进入沉浸座舱
            </motion.button>
          )}

          <div className="absolute top-0 right-0 p-4 opacity-10"><XiaomiLogo className="w-12 h-12 grayscale" /></div>
          <div className="text-[10px] text-white/30 uppercase font-black tracking-[4px] mb-8 text-center">Xiaomi SU7</div>
          
          <div className="h-[220px] flex items-center justify-center mb-10 relative">
            <AnimatePresence mode="wait">
              {currentStepIdx >= 0 && currentStepIdx < 3 ? (
                <motion.div 
                  key="cockpit"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
                >
                  <SU7Cockpit status={currentStep.car.status} isBlinking={isBlinking} />
                </motion.div>
              ) : (
                <motion.div key="car-svg" className="relative p-10 bg-white/5 rounded-[2rem] border border-white/5">
                  <svg width="120" height="60" viewBox="0 0 120 60" fill="none" stroke="white" strokeWidth="1.2" className="opacity-40">
                    <path d="M10 45 L20 25 Q30 10 60 10 Q90 10 100 25 L110 45 Z" />
                    <circle cx="30" cy="45" r="8" />
                    <circle cx="90" cy="45" r="8" />
                  </svg>
                  <div className="mt-4 text-[10px] text-center text-white/20 font-bold uppercase tracking-[4px]">Parked</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="bg-white/5 rounded-[1.5rem] p-6 flex-1 flex flex-col justify-between border border-white/5 shadow-inner">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Status</span>
                {currentStep.car.status === 'success' && <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20"><div className="w-1 h-1 rounded-full bg-green-500" /><span className="text-[8px] text-green-400 font-bold uppercase">Synced</span></div>}
              </div>
              <div className="text-xl font-bold tracking-tight mb-4 text-gradient">{currentStep.car.title}</div>
              <div className="space-y-3">
                {currentStep.car.details.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 text-[11px] text-white/50 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-mi-orange/40" />
                    {d}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center pt-5 border-t border-white/5">
              <div className="text-[9px] text-white/20 font-black uppercase tracking-widest">v2.5 HyperOS</div>
              <div className="text-[12px] font-black italic text-mi-orange uppercase tracking-[2px]">{currentStep.car.status}</div>
            </div>
          </div>
        </motion.div>

        {/* Phone Column - Xiaomi 14 */}
        <motion.div 
          layout
          className={cn(
            "w-[340px] h-[580px] mi-phone-frame bg-[#050505] p-5 flex flex-col transition-all duration-700 mi-shadow-premium relative z-10 scale-105",
          )}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Phone Status Bar */}
          <div className="flex justify-between items-center px-4 pt-1 pb-4 opacity-20 text-[8px] font-black tracking-widest uppercase">
            <span>HyperOS 14</span>
            <div className="flex gap-2 items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>5G</span>
              <span>85%</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={currentStepIdx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5, ease: "circOut" }}
              className="flex-1 flex flex-col pt-12 px-2"
            >
              {isLoadingGemini ? (
                <div className="apple-glass rounded-[2rem] p-8 flex flex-col items-center justify-center gap-6 mt-12 shadow-2xl">
                   <VoiceAvatar active />
                   <div className="text-center">
                     <div className="text-sm font-bold mb-1 italic text-gradient uppercase tracking-tight">“正在思考您的情景...”</div>
                     <div className="text-[9px] text-white/30 font-black tracking-[4px] uppercase animate-pulse">Deep Scheduling</div>
                   </div>
                </div>
              ) : apiResult ? (
                <div className="apple-glass rounded-[2rem] p-6 mt-12 space-y-5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-mi-orange/40 to-transparent" />
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                       <div className="flex items-center gap-3">
                          <Sparkles size={16} className="text-mi-orange animate-float" />
                          <span className="text-[10px] font-black uppercase tracking-[3px] text-gradient">AI Logic Node</span>
                       </div>
                       <button onClick={() => setApiResult(null)} className="text-[8px] text-white/20 hover:text-white transition-colors uppercase font-black tracking-widest">Reset</button>
                    </div>
                    <div className="space-y-3.5">
                      {apiResult.devices.slice(0, 5).map((d: any, i: number) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          transition={{ delay: i * 0.1 }}
                          className="flex justify-between items-center bg-white/5 px-4 py-2.5 rounded-xl border border-white/5"
                        >
                          <span className="text-[10px] text-white/40 font-black uppercase tracking-wider">{d.name}</span>
                          <span className="text-xs text-mi-orange font-black italic tracking-tight">{d.action}</span>
                        </motion.div>
                      ))}
                    </div>
                </div>
              ) : currentStep.phone.type.includes('voice') ? (
                <div className="bg-gradient-to-br from-[#111] to-[#010101] rounded-[2.5rem] p-8 mt-12 border border-white/10 shadow-3xl relative overflow-hidden group min-h-[220px]">
                   <div className="absolute top-0 right-0 p-4 opacity-[0.03]"><Mic size={64} className="text-white" /></div>
                   <div className="flex items-center gap-5 mb-10">
                      <VoiceAvatar active />
                      <div className="text-[8px] font-black tracking-[4px] text-white/20 uppercase">Voice Assistant</div>
                   </div>
                   <div className="text-xl italic font-black leading-tight tracking-tight text-mi-orange text-gradient drop-shadow-2xl">
                     <TypewriterText text={`"${currentStep.phone.message}"`} />
                   </div>
                </div>
              ) : (
                <div className="apple-glass rounded-[2.2rem] p-7 mt-12 shadow-3xl border-t border-white/20 relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-mi-orange/5 to-transparent pointer-events-none" />
                   <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="w-10 h-10 rounded-2xl bg-mi-orange/10 flex items-center justify-center border border-mi-orange/20 shadow-inner">
                         <MessageSquare size={16} className="text-mi-orange" />
                      </div>
                      <span className="text-[9px] text-white/20 font-black uppercase tracking-[4px]">Hyper-Notif</span>
                   </div>
                   <div className="text-[15px] font-bold leading-relaxed relative z-10 tracking-tight text-white/90">
                      {currentStepIdx === 2 ? (
                        <>身份已确认 🔓<br/><span className="text-mi-orange underline underline-offset-4 decoration-mi-orange/30">欢迎回家，{userName}</span></>
                      ) : currentStep.phone.message}
                   </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Home Bar */}
          <div className="mt-auto mb-10 px-12">
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
               <motion.div 
                 className="h-full bg-gradient-to-r from-mi-orange to-[#FF8C33] shadow-[0_0_10px_#FF6900]"
                 animate={{ width: ["0%", "100%"] }}
                 transition={{ duration: 10, ease: "linear", repeat: Infinity }}
               />
            </div>
          </div>
        </motion.div>

        {/* Home Column */}
        <motion.div 
          className={cn(
            "w-[340px] h-[540px] apple-glass shadow-2xl rounded-[2.5rem] p-6 flex flex-col transition-all relative overflow-hidden",
            currentStepIdx === 3 ? "opacity-100 z-20 scale-105 border-mi-orange/30" : "opacity-30 blur-[2px]"
          )}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: currentStepIdx === 3 ? 1 : 0.3, x: 0, scale: currentStepIdx === 3 ? 1.05 : 1 }}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10"><Home size={40} className="text-white grayscale" /></div>
          <div className="text-[10px] text-white/30 uppercase font-black tracking-[4px] mb-8 text-center">Smart Home</div>
          
          <div className="h-[140px] flex items-center justify-center mb-10 relative">
             <motion.div 
               animate={currentStepIdx >= 2 ? { filter: "drop-shadow(0 0 20px rgba(255,105,0,0.4))", scale: 1.1 } : { scale: 1 }}
               className="relative"
             >
                <div className={cn(
                  "absolute inset-0 bg-mi-orange/20 blur-3xl rounded-full transition-opacity duration-1000",
                  currentStepIdx >= 2 ? "opacity-100" : "opacity-0"
                )} />
                <Home size={64} strokeWidth={1} className={cn("relative z-10 transition-colors duration-1000", currentStepIdx >= 2 ? "text-mi-orange" : "text-white/20")} />
                {currentStepIdx === 2 && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }} 
                     animate={{ opacity: 1, y: 0 }} 
                     className="absolute -top-4 -right-8 apple-glass text-mi-orange text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-xl border-mi-orange/30"
                   >
                     Unlocking
                   </motion.div>
                )}
             </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
            {currentStep.home.devices.map((device: any, idx) => (
              <motion.div 
                key={idx}
                className={cn(
                  "bg-white/5 rounded-[1.5rem] p-4 transition-all duration-700 border border-white/5 flex flex-col justify-center items-center text-center gap-2",
                  device.active && "bg-mi-orange/5 border-mi-orange/20 shadow-2xl scale-[1.02]"
                )}
                layout
              >
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  device.active ? "bg-mi-orange animate-pulse shadow-[0_0_8px_#FF6900]" : "bg-white/10"
                )} />
                <div className="text-[9px] text-white/30 uppercase font-black tracking-widest">{device.name}</div>
                <div className={cn(
                  "text-[12px] font-bold leading-tight truncate w-full tracking-tight",
                  device.active ? "text-white" : "text-white/20"
                )}>
                  {device.state}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 bg-white/5 rounded-2xl p-4 text-[9px] flex items-center gap-4 border border-white/5 shadow-inner">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-white/40 font-bold uppercase tracking-widest">System Active · 12 Nodes Connected</span>
          </div>
        </motion.div>
      </div>

      {/* AI Explainer Sidebar */}
      <AnimatePresence>
        {showAiExplainer && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]"
              onClick={() => setShowAiExplainer(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-[#121212] z-[100] border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] p-8 flex flex-col"
            >
              <div className="flex justify-between items-center mb-10">
                 <div className="flex items-center gap-3">
                    <Sparkles className="text-mi-orange" />
                    <h3 className="text-lg font-bold">AI 场景解析</h3>
                 </div>
                 <button onClick={() => setShowAiExplainer(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-white">
                    <X size={18} />
                 </button>
              </div>

              <div className="flex-1 space-y-8">
                 <div className="bg-white/5 rounded-2xl p-6 border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-50"><Sparkles size={40} className="text-mi-orange/10 group-hover:scale-110 transition-transform" /></div>
                    <div className="text-sm italic leading-relaxed text-gray-200">
                       <TypewriterText text={currentStep.aiInsight} />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="text-[10px] text-text-sub uppercase tracking-widest font-bold">涉及产品</div>
                    <div className="flex flex-wrap gap-2">
                       {['HyperOS', '澎湃智联', '车载AI', '多端流转'].map(tag => (
                         <span key={tag} className="text-[10px] bg-mi-orange/10 text-mi-orange border border-mi-orange/20 px-3 py-1 rounded-full">{tag}</span>
                       ))}
                    </div>
                 </div>

                 <div className="mt-auto pt-8 border-t border-white/5">
                    <p className="text-xs text-text-sub leading-relaxed">
                       基于 Gemini Enterprise 的智能调度引擎，已实现全量场景 350ms 内响应。
                    </p>
                 </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer Interface */}
      <div className="w-full max-w-xl flex flex-col items-center gap-6 mt-12 relative z-10">
        <motion.p 
          key={currentStepIdx + 'desc'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg tracking-[0.5px] opacity-90 text-center px-4 font-medium"
        >
          {currentStep.description}
        </motion.p>

        <div className="flex items-center gap-10 bg-[#161616]/80 backdrop-blur-xl px-10 py-4 rounded-full border border-white/10 shadow-2xl">
          <button 
            onClick={handlePrev}
            className={cn(
              "w-12 h-12 rounded-full border border-white/5 bg-white/5 flex items-center justify-center transition-all text-text-sub hover:text-white hover:bg-white/10",
              currentStepIdx === 0 && "opacity-20 pointer-events-none"
            )}
          >
            <ChevronLeft size={24} />
          </button>

          <div className="flex gap-4">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentStepIdx(idx);
                  setIsAutoPlay(false);
                }}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300 border border-white/20",
                  idx === currentStepIdx ? "bg-mi-orange border-mi-orange shadow-[0_0_12px_#FF6900] scale-125" : "hover:bg-white/20"
                )}
              />
            ))}
          </div>

          <button 
            onClick={handleNext}
            className={cn(
              "w-12 h-12 rounded-full border border-white/5 bg-white/5 flex items-center justify-center transition-all text-text-sub hover:text-white hover:bg-white/10",
              currentStepIdx === steps.length - 1 && "opacity-20 pointer-events-none"
            )}
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="flex items-center gap-10">
           <button 
             onClick={() => setIsAutoPlay(!isAutoPlay)}
             className="flex items-center gap-2 text-[10px] text-text-sub hover:text-white transition-colors"
           >
             <div className="relative flex items-center justify-center">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full bg-[#4CAF50] transition-opacity absolute",
                  isAutoPlay ? "animate-ping" : "opacity-0"
                )} />
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full relative z-10",
                  isAutoPlay ? "bg-[#4CAF50]" : "bg-gray-600"
                )} />
             </div>
             {isAutoPlay ? `自动播放中 · 10s 后切换` : "已暂停播放"}
           </button>

           {currentStepIdx === steps.length - 1 && (
             <motion.button
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               onClick={restart}
               className="text-[10px] text-mi-orange flex items-center gap-1 font-bold tracking-widest"
             >
               <RefreshCw size={12} className="mr-1" />
               再看一次
             </motion.button>
           )}
        </div>
      </div>

      {/* Immersive Cockpit Overlay */}
      <AnimatePresence>
        {showImmersiveCockpit && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[1000]"
          >
            <CockpitView onExit={() => setShowImmersiveCockpit(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

