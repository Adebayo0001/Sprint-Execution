import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, X, ArrowRight } from 'lucide-react';
import { PAYSTACK_LINK_SPRINT, PAYSTACK_LINK_BUILDERS, SELAR_LINK, WHATSAPP_CONTACT_LINK } from '../constants';
import { Link } from 'react-router-dom';

const CompactTimer = () => {
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, mins: number, secs: number } | null>(null);

  useEffect(() => {
    const targetDate = new Date('2026-04-30T22:59:59Z').getTime();
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(timer);
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, mins, secs });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!timeLeft) return null;

  return (
    <div className="flex gap-2 justify-center mb-12">
      {[timeLeft.days, timeLeft.hours, timeLeft.mins, timeLeft.secs].map((val, i) => (
        <div key={i} className="bg-[#242424] border border-white/5 rounded-md w-12 h-12 flex items-center justify-center">
          <span className="text-white font-bold text-lg tabular-nums">
            {String(val).padStart(2, '0')}
          </span>
        </div>
      ))}
    </div>
  );
};

const FeatureRow = ({ feature, sprint, builder, isLast = false, highlight = false }: { 
  feature: string, 
  sprint: boolean | string, 
  builder: boolean | string, 
  isLast?: boolean,
  highlight?: boolean
}) => (
  <div className={`grid grid-cols-[1fr,100px,100px] md:grid-cols-[1fr,160px,160px] border-b border-white/5 ${isLast ? 'border-b-0' : ''} group`}>
    <div className="py-5 text-[#999999] text-sm md:text-base font-medium flex items-center pr-4">
      {feature}
    </div>
    
    {/* Sprint Column */}
    <div className="py-5 flex items-center justify-center border-l border-white/5">
      {typeof sprint === 'boolean' ? (
        sprint ? (
          <div className="w-5 h-5 bg-[#4f66fd] rounded-full flex items-center justify-center">
            <Check size={12} className="text-white stroke-[3]" />
          </div>
        ) : (
          <div className="w-5 h-5 bg-[#2a2a2a] rounded-full flex items-center justify-center">
            <X size={12} className="text-[#555555] stroke-[3]" />
          </div>
        )
      ) : (
        <span className="text-[11px] text-[#555555] italic font-medium">{sprint}</span>
      )}
    </div>

    {/* Builder Column */}
    <div className={`py-5 flex items-center justify-center border-l border-white/5 bg-[#4f66fd]/[0.02] relative`}>
      <div className="absolute inset-y-0 left-0 w-px bg-[#4f66fd]/20" />
      <div className="absolute inset-y-0 right-0 w-px bg-[#4f66fd]/20" />
      {typeof builder === 'boolean' ? (
        builder ? (
          <div className="w-5 h-5 bg-[#4f66fd] rounded-full flex items-center justify-center">
            <Check size={12} className="text-white stroke-[3]" />
          </div>
        ) : (
          <div className="w-5 h-5 bg-[#2a2a2a] rounded-full flex items-center justify-center">
            <X size={12} className="text-[#555555] stroke-[3]" />
          </div>
        )
      ) : (
        <span className="text-[11px] text-[#555555] italic font-medium">{builder}</span>
      )}
    </div>
  </div>
);

export default function Compare() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white font-sans selection:bg-[#4f66fd]/30">
      <main className="max-w-4xl mx-auto px-6 py-20 pb-40">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[#4f66fd] uppercase text-[11px] font-bold tracking-[0.2em] mb-6 block"
          >
            THE SPRINT EXECUTION 2026 – 1.0
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-[48px] font-bold text-white mb-6 leading-[1.1]"
          >
            Two ways in.<br />One standard.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[#cccccc] text-[17px] leading-relaxed max-w-2xl mx-auto mb-10"
          >
            Every participant gets the same accountability environment. The difference is how much direct involvement you want from us.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <CompactTimer />
          </motion.div>
        </div>

        {/* Comparison Table */}
        <section className="mb-32">
          <div className="grid grid-cols-[1fr,100px,100px] md:grid-cols-[1fr,160px,160px] mb-4">
            <div></div>
            <div className="text-center px-2">
              <span className="text-[10px] font-bold text-[#4f66fd] block mb-1 uppercase tracking-wider">THE SPRINT</span>
              <span className="text-sm font-bold text-white block mb-0.5">Pay what you have</span>
              <span className="text-[9px] text-[#555555] block leading-tight">₦2k · ₦5k · ₦10k</span>
            </div>
            <div className="text-center px-2">
              <span className="text-[10px] font-bold text-[#4f66fd] block mb-1 uppercase tracking-wider leading-none">THE BUILDER'S<br/>TRACK</span>
              <span className="text-sm font-bold text-white block mb-0.5">₦12,500</span>
              <span className="text-[9px] text-[#555555] block">Everything + more</span>
            </div>
          </div>

          <div className="border-t border-white/10">
            <FeatureRow feature="Daily accountability group" sprint={true} builder={true} />
            <FeatureRow feature="Monday to Friday check-ins" sprint={true} builder={true} />
            <FeatureRow feature="Daily progress reports" sprint={true} builder={true} />
            <FeatureRow feature="Team reviews your reports" sprint={true} builder={true} />
            <FeatureRow feature="Personal roadmap session" sprint={false} builder={true} />
            <FeatureRow feature="Custom learning curriculum" sprint={false} builder={true} />
            <FeatureRow feature="Direct access to Adebayo" sprint={false} builder={true} />
            <FeatureRow feature="Build with AI live sessions" sprint={false} builder={true} />
            <FeatureRow feature="AI in 2026 Bootcamp access" sprint={false} builder={true} />
            <FeatureRow feature="Advanced AI Flyer Design Course" sprint={false} builder={true} />
            <FeatureRow feature="Priority guidance for 90 days" sprint={false} builder={true} />
            <FeatureRow feature="Instalment payment option" sprint={false} builder="On request" isLast={true} />
          </div>

          <div className="grid grid-cols-[1fr,100px,100px] md:grid-cols-[1fr,160px,160px] mt-8">
            <div></div>
            <div className="flex justify-center px-1">
              <button onClick={() => window.location.href = PAYSTACK_LINK_SPRINT} className="w-full h-10 border border-white/20 text-white rounded-full text-[11px] font-bold hover:bg-white hover:text-black transition-all">Join →</button>
            </div>
            <div className="flex justify-center px-1">
              <button onClick={() => window.location.href = PAYSTACK_LINK_BUILDERS} className="w-full h-10 bg-[#4f66fd] text-white rounded-full text-[11px] font-bold hover:bg-[#3d51d4] transition-all">Join Track →</button>
            </div>
          </div>
        </section>

        {/* Payment Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
          {/* Card 1: The Sprint */}
          <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-xl p-8 md:p-10 flex flex-col">
            <span className="text-[#4f66fd] uppercase text-[11px] font-bold tracking-[0.2em] mb-4">THE SPRINT</span>
            <h3 className="text-2xl font-bold text-white mb-4 leading-tight">Pay what reflects<br />your commitment.</h3>
            <p className="text-[#999999] text-sm leading-relaxed mb-10">No fixed amount. Join the group, show up every day, and get something real done in 90 days.</p>
            <div className="mt-auto">
              <div className="mb-6">
                <span className="text-white text-xl font-bold">₦2,000 — ₦50,000</span>
                <span className="text-[#555555] text-xs block mt-1 uppercase tracking-wider font-semibold">You decide</span>
              </div>
              <div className="space-y-4">
                <a href={PAYSTACK_LINK_SPRINT} target="_blank" rel="noopener noreferrer" className="w-full h-[52px] border border-white text-white rounded-full flex items-center justify-center font-bold hover:bg-white hover:text-black transition-all">Pay via Paystack →</a>
                <a href={SELAR_LINK} target="_blank" rel="noopener noreferrer" className="w-full text-center text-[#777777] hover:text-white text-[13px] font-medium block transition-colors">Pay via Selar (International) →</a>
              </div>
            </div>
          </div>

          {/* Card 2: The Builder's Track */}
          <div className="bg-[#161a2e] border border-[#4f66fd]/40 rounded-xl p-8 md:p-10 flex flex-col relative overflow-hidden">
            <span className="text-[#4f66fd] uppercase text-[11px] font-bold tracking-[0.2em] mb-4">THE BUILDER'S TRACK</span>
            <h3 className="text-4xl font-bold text-white mb-1 leading-none">₦12,500</h3>
            <span className="text-[#4f66fd] text-[11px] font-bold uppercase tracking-widest mb-6 block">Or reach out about instalments</span>
            <p className="text-[#999999] text-sm leading-relaxed mb-10">Everything in The Sprint plus a personal roadmap, direct access to Adebayo, live AI building sessions, and access to the Hub's course library.</p>
            <div className="mt-auto">
              <div className="space-y-4">
                <a href={PAYSTACK_LINK_BUILDERS} target="_blank" rel="noopener noreferrer" className="w-full h-[52px] bg-[#4f66fd] text-white rounded-full flex items-center justify-center font-bold hover:bg-[#3d51d4] transition-all shimmer-effect">Pay via Paystack →</a>
                <a href={SELAR_LINK} target="_blank" rel="noopener noreferrer" className="w-full text-center text-[#777777] hover:text-white text-[13px] font-medium block transition-colors">Pay via Selar (International) →</a>
              </div>
              <a href={WHATSAPP_CONTACT_LINK} target="_blank" rel="noopener noreferrer" className="w-full text-center text-[#555555] hover:text-[#4f66fd] text-[11px] font-bold uppercase tracking-widest mt-6 block transition-colors">Want to discuss instalments?</a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center">
          <div className="h-px w-full bg-white/10 mb-12" />
          <p className="text-white/60 font-semibold mb-2">Registration closes April 30th. Cohort begins May 4th.</p>
          <a href={WHATSAPP_CONTACT_LINK} target="_blank" rel="noopener noreferrer" className="text-brand-blue font-bold flex items-center justify-center gap-2 hover:underline mb-12">
            Questions? Message us on WhatsApp <ArrowRight size={16} />
          </a>
          <Link to="/" className="text-[#555555] hover:text-white text-[13px] font-medium transition-colors">
            ← Back to main page
          </Link>
        </footer>
      </main>
    </div>
  );
}
