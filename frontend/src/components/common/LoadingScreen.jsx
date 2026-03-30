import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LoadingScreen = ({ isReady }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (progress < 100) {
      const timer = setInterval(() => {
        setProgress((prev) => Math.min(prev + Math.random() * 15, 100));
      }, 200);
      return () => clearInterval(timer);
    }
  }, [progress]);

  return (
    <AnimatePresence>
      {!isReady && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-gray-950"
        >
          {/* Futuristic Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900 to-indigo-950 opacity-90" />
          
          {/* Animated Particles */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * 100 + "%", 
                  y: Math.random() * 100 + "%",
                  opacity: Math.random() * 0.5 + 0.2
                }}
                animate={{ 
                  y: [null, "-20%", "120%"],
                  opacity: [0, 0.5, 0]
                }}
                transition={{ 
                  duration: Math.random() * 10 + 10, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
                className="absolute w-1 h-1 bg-blue-400 rounded-full blur-[1px]"
              />
            ))}
          </div>

          {/* Central Logo & Animation Container */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Neural Network Nodes Animation */}
            <div className="absolute w-[400px] h-[400px] flex items-center justify-center">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    rotate: i % 2 === 0 ? 360 : -360,
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ 
                    rotate: { duration: 20 + i * 10, repeat: Infinity, ease: "linear" },
                    scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="absolute border border-blue-500/10 rounded-full"
                  style={{ 
                    width: 120 + i * 100, 
                    height: 120 + i * 100,
                    borderStyle: i % 2 === 0 ? "solid" : "dashed",
                    background: i === 0 ? "radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)" : "none"
                  }}
                />
              ))}
              
              {/* Light Streaks */}
              <motion.div
                animate={{ 
                  rotate: 360,
                  opacity: [0.2, 0.5, 0.2]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute w-[600px] h-[1px] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent blur-[2px]"
              />
              <motion.div
                animate={{ 
                  rotate: -360,
                  opacity: [0.1, 0.3, 0.1]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute w-[800px] h-[1px] bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent blur-[3px]"
              />
            </div>

            {/* ZODO Logo / Text */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [0.8, 1.1, 1], 
                opacity: 1,
                textShadow: [
                  "0 0 10px rgba(59, 130, 246, 0.5)",
                  "0 0 30px rgba(59, 130, 246, 0.8)",
                  "0 0 10px rgba(59, 130, 246, 0.5)"
                ]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                repeatType: "reverse" 
              }}
              className="mb-8"
            >
              <h1 className="text-6xl font-black tracking-tighter text-white">
                ZODO<span className="text-blue-500">.</span>
              </h1>
            </motion.div>

            {/* AI Status Text */}
            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-blue-400/80 text-xs font-mono tracking-[0.3em] uppercase mb-4"
            >
              AI System Initializing...
            </motion.p>

            {/* Progress Container */}
            <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
              />
            </div>
            
            {/* Progress Percentage */}
            <span className="mt-2 text-slate-500 text-[10px] font-mono">
              {Math.round(progress)}%
            </span>
          </div>

          {/* Bottom Waveform (Decorative) */}
          <div className="absolute bottom-0 left-0 w-full flex items-end justify-center h-24 overflow-hidden pointer-events-none opacity-20">
            {[...Array(40)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-blue-500 mx-[2px] rounded-t-full"
                animate={{ 
                  height: [10, Math.random() * 60 + 20, 10]
                }}
                transition={{ 
                  duration: 0.5 + Math.random(), 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
