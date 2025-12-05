import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { HERO_CONTENT } from '../constants';

export const Hero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-gold-200 bg-gold-50 text-gold-700 shadow-sm"
          >
            <span className="flex h-2 w-2 rounded-full bg-gold-500 animate-pulse"></span>
            <span className="text-sm font-bold tracking-wide">
              {HERO_CONTENT.badge}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8 text-stone-900 leading-[1.1]"
          >
            {HERO_CONTENT.title} <br />
            <span className="relative inline-block text-gold-500">
               {HERO_CONTENT.titleHighlight}
               {/* Underline decoration */}
               <svg className="absolute w-full h-3 -bottom-1 left-0 text-gold-300 opacity-60" viewBox="0 0 200 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.00025 6.99997C25.7263 1.33333 138.006 -5.33334 198.003 3.49997" stroke="currentColor" strokeWidth="3"></path></svg>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-stone-600 mb-10 leading-relaxed max-w-2xl mx-auto font-medium"
          >
            {HERO_CONTENT.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button className="w-full sm:w-auto px-8 py-4 bg-gold-500 text-white font-bold rounded-2xl hover:bg-gold-600 transition-all transform hover:scale-105 hover:shadow-[0_10px_30px_rgba(255,179,0,0.3)] flex items-center justify-center gap-2 group shadow-lg shadow-gold-500/20">
              {HERO_CONTENT.ctaPrimary}
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-stone-700 font-bold rounded-2xl hover:bg-stone-50 border border-stone-200 hover:border-gold-300 transition-all flex items-center justify-center gap-2 group shadow-sm hover:shadow-md">
              <PlayCircle className="text-gold-500 group-hover:scale-110 transition-transform" />
              {HERO_CONTENT.ctaSecondary}
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};