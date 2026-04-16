import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'motion/react';
import { Play, Star, Sparkles, ChevronDown, CheckCircle2 } from 'lucide-react';
import { XiaomiLogo } from '../common/XiaomiLogo';
import { cn } from '../../lib/utils';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
}

const BackgroundParticles = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1 + 1,
      duration: Math.random() * 20 + 15,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-[#050505]" />
      <div className="absolute top-0 w-full h-[80vh] bg-gradient-to-b from-mi-orange/5 via-transparent to-transparent opacity-60" />
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="bg-white rounded-full opacity-[0.03]"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0.01, 0.05, 0.01],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

const LevelNode = ({ node, idx, onEnter, total }: { node: any; idx: number; onEnter: () => void; total: number; key?: any }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: 0.1 }}
      className="relative w-full flex flex-col items-center py-12"
    >
      <div className="group relative">
        {/* Connection Line */}
        {idx < total - 1 && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-[2px] h-24 bg-gradient-to-b from-mi-orange/40 via-mi-orange/10 to-transparent" />
        )}

        {/* The Node */}
        <motion.button
          onClick={() => node.primary && onEnter()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500",
            idx < 4 ? "bg-[#111] border border-white/10 shadow-2xl" : "bg-[#0a0a0a] border border-white/5 opacity-40 grayscale",
            node.primary && "shadow-[0_0_40px_rgba(255,105,0,0.2)] border-mi-orange/40 ring-4 ring-mi-orange/5"
          )}
        >
          {idx < 4 ? (
            idx === 4 - 1 ? (
              <div className="relative">
                 <Play fill="#FF6900" className="text-mi-orange w-8 h-8 ml-1" />
                 <motion.div 
                   animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                   transition={{ duration: 2, repeat: Infinity }}
                   className="absolute inset-0 bg-mi-orange rounded-full -z-10"
                 />
              </div>
            ) : (
              <CheckCircle2 className="text-mi-orange/60 w-8 h-8" />
            )
          ) : (
            <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Locked</div>
          )}
        </motion.button>

        {/* Dynamic Label */}
        <div className="absolute top-1/2 left-32 -translate-y-1/2 whitespace-nowrap">
           <div className="text-[10px] uppercase font-black tracking-[4px] text-mi-orange mb-1.5 opacity-60">Step 0{idx + 1}</div>
           <h3 className={cn(
             "text-xl font-bold tracking-tight",
             node.primary ? "text-white" : "text-white/40"
           )}>
             {node.title}
           </h3>
           <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider mt-1">{node.time} · {node.desc}</p>
        </div>
      </div>
    </motion.div>
  );
};

export const HomeView: React.FC<{ onEnterExperience: () => void }> = ({ onEnterExperience }) => {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const timelineNodes = [
    { title: "清晨唤醒", time: "07:30", type: "morning", desc: "智能开启新一天" },
    { title: "元气通勤", time: "08:30", type: "commute", desc: "SU7 就位规划" },
    { title: "高效办公", time: "10:00", type: "work", desc: "手机流转生态" },
    { title: "午间休憩", time: "12:30", type: "rest", desc: "一键躺平影院" },
    { title: "回家之路", time: "18:00", type: "home", desc: "温馨全量联动", primary: true },
    { title: "沉浸娱乐", time: "20:30", type: "night", desc: "大师情景模式" },
  ];

  return (
    <div className="relative min-h-screen bg-[#050505] text-white selection:bg-mi-orange/30">
      <BackgroundParticles />

      {/* Apple-style Glass Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 w-full z-[100] h-16 apple-glass flex items-center px-8 justify-between"
      >
        <div className="flex items-center gap-2">
           <XiaomiLogo className="w-6 h-6" />
           <span className="text-[10px] font-bold tracking-[8px] uppercase italic text-white/80">HyperOS</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-white/40">
           <span className="hover:text-white transition-colors cursor-pointer">Technology</span>
           <span className="hover:text-white transition-colors cursor-pointer">Experience</span>
           <span className="hover:text-white transition-colors cursor-pointer">Ecosystem</span>
        </nav>
        <button 
          onClick={onEnterExperience}
          className="bg-white text-black px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-mi-orange hover:text-white transition-all shadow-xl"
        >
          Explore All
        </button>
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        style={{ opacity, scale }}
        className="relative h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl px-4 pointer-events-none">
           <motion.div 
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 0.05, scale: 1 }}
             className="text-[300px] font-black tracking-tighter italic select-none"
           >
             SU7
           </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="z-10"
        >
           <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 text-gradient italic leading-[1.1]">
             人车家全生态<br/><span className="text-mi-orange">全效联动关卡</span>
           </h1>
           <p className="max-w-xl mx-auto text-lg text-white/40 font-medium leading-relaxed tracking-wide">
             探索 HyperOS 驱动下的多端流转体验，<br/>
             开启一场通向智能家园的生态模拟之旅。
           </p>
           
           <div className="mt-12 flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 px-6 py-2 bg-white/5 border border-white/10 rounded-full">
                 <Star size={14} className="text-mi-orange" fill="currentColor" />
                 <span className="text-xs font-bold tracking-widest uppercase italic">Level 04 Unlocked</span>
              </div>
           </div>
        </motion.div>

        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20"
        >
           <span className="text-[10px] font-bold uppercase tracking-[4px]">Scroll</span>
           <ChevronDown size={20} />
        </motion.div>
      </motion.section>

      {/* Experience Path */}
      <section className="relative z-10 max-w-xl mx-auto pb-64 px-8">
         <div className="mb-32 text-center">
            <h2 className="text-sm font-black uppercase tracking-[8px] text-white/20 mb-4 italic">Experience Journey</h2>
            <div className="w-12 h-[1px] bg-mi-orange/40 mx-auto" />
         </div>

         <div className="flex flex-col">
            {timelineNodes.map((node, idx) => (
              <LevelNode 
                key={idx} 
                node={node} 
                idx={idx} 
                onEnter={onEnterExperience} 
                total={timelineNodes.length} 
              />
            ))}
         </div>
         
         {/* Final CTA */}
         <motion.div 
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="mt-32 p-12 rounded-[3rem] bg-gradient-to-b from-mi-orange/10 to-transparent border border-mi-orange/20 text-center relative overflow-hidden group"
         >
            <div className="absolute inset-0 bg-mi-orange/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles className="mx-auto text-mi-orange mb-6 w-12 h-12" />
            <h3 className="text-3xl font-black tracking-tight mb-4 italic italic uppercase">立刻下班回家</h3>
            <p className="text-white/40 text-sm mb-10 max-w-xs mx-auto">准备好了吗？体验小米全系列生态设备瞬间协同的魔力。</p>
            <button 
              onClick={onEnterExperience}
              className="w-full h-20 rounded-[2rem] bg-mi-orange text-white font-black text-xl italic uppercase tracking-widest shadow-[0_20px_40px_rgba(255,105,0,0.3)] hover:scale-[1.02] transition-transform active:scale-95"
            >
              一键开启联动
            </button>
         </motion.div>
      </section>

      <footer className="py-24 border-t border-white/5 flex flex-col items-center gap-8 opacity-40">
         <XiaomiLogo className="w-8 h-8 grayscale" />
         <div className="text-[10px] font-bold tracking-[10px] uppercase italic">Better Together</div>
         <div className="text-[10px] font-medium tracking-[2px] uppercase">© 2026 HyperOS Reality Concept</div>
      </footer>
    </div>
  );
};
