import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Users, Target, ArrowRight, ExternalLink } from 'lucide-react';
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

export default function Compare() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const scrollToOverview = () => {
    document.getElementById('quick-overview')?.scrollIntoView({ behavior: 'smooth' });
  };

  const getWhatsAppLink = (messageType: 'instalment' | 'general' = 'general') => {
    const baseText = messageType === 'instalment' 
      ? "Hi, I'm interested in The Builder's Track but would like to discuss instalment payment options."
      : "Hi, I have some questions regarding The Sprint Execution and my registration.";

    const text = `${baseText}

I'm reaching out from the comparison page.

Please help me out with this.`;

    return `${WHATSAPP_CONTACT_LINK}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white font-sans selection:bg-[#4f66fd]/30 pb-40">
      {/* Top Header Section */}
      <header className="max-w-4xl mx-auto px-6 pt-20 text-center mb-24">
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

        <button 
          onClick={scrollToOverview}
          className="text-[#555555] hover:text-white text-[13px] font-medium transition-colors cursor-pointer"
        >
          Quick Overview ↓
        </button>
      </header>

      {/* QUICK OVERVIEW SECTION */}
      <section id="quick-overview" className="max-w-7xl mx-auto px-6 mb-32 scroll-mt-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white">What is The Sprint Execution?</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Calendar className="text-[#4f66fd]" size={24} />,
              title: "90 Days of Real Execution",
              body: "Monday to Friday, every week, for 90 days. You work on something meaningful every single day and report what you achieved. No average tasks. No half-effort."
            },
            {
              icon: <Users className="text-[#4f66fd]" size={24} />,
              title: "A Group That Holds You To It",
              body: "You are surrounded by serious people doing serious work. The team reviews every report, notices when you drift, and keeps the standard high throughout."
            },
            {
              icon: <Target className="text-[#4f66fd]" size={24} />,
              title: "You Come Out With Something Real",
              body: "A finished course. A built project. A new skill. A habit that sticks. By day 90 you will have something to show — not just a plan to show it."
            }
          ].map((card, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#1a1a1a] p-8 border-l-[3px] border-[#4f66fd] rounded-lg"
            >
              <div className="mb-6">{card.icon}</div>
              <h3 className="text-lg font-bold text-white mb-4">{card.title}</h3>
              <p className="text-[#999999] text-sm leading-[1.8]">{card.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* COMPARISON CARDS SECTION */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
        {/* Card 1: The Sprint */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-[#1a1a1a] border-t-3 border-white/15 rounded-xl p-10 flex flex-col"
        >
          <div className="mb-10">
            <span className="text-[#777777] uppercase text-[11px] font-bold tracking-[0.2em] mb-4 block">THE SPRINT</span>
            <h3 className="text-[28px] font-bold text-white mb-6 leading-[1.2]">Show up. Do the work.<br />Get it done.</h3>
          </div>

          <div className="h-px bg-white/5 mb-10" />

          <ul className="space-y-6 mb-12 flex-grow">
            {[
              "Daily accountability group",
              "Monday to Friday check-ins",
              "Daily progress reports reviewed by the team",
              "Community of serious, focused people",
              "90 days of structure that makes quitting feel wrong"
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-4 text-[#ffffff] text-[15px] leading-[2.0]">
                <span className="text-[#4f66fd] font-bold">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-4">
            <a 
              href={PAYSTACK_LINK_SPRINT} 
              className="w-full h-[52px] border border-white text-white rounded-full flex items-center justify-center font-bold hover:bg-white hover:text-black transition-all text-base"
            >
              Join The Sprint →
            </a>
            <p className="text-center text-[#777777] text-[13px] mt-1 italic">Commitment fee discussed at registration</p>
            <a 
              href={SELAR_LINK} 
              className="w-full text-center text-[#777777] hover:text-white text-[13px] font-medium block transition-colors"
            >
              International? Pay via Selar →
            </a>
          </div>
        </motion.div>

        {/* Card 2: The Builder's Track */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-[#0f1628] border-t-3 border-[#4f66fd] rounded-xl p-10 flex flex-col relative"
        >
          <div className="mb-10">
            <span className="text-[#4f66fd] uppercase text-[11px] font-bold tracking-[0.2em] mb-4 block">THE BUILDER'S TRACK</span>
            <h3 className="text-[28px] font-bold text-white mb-6 leading-[1.2]">Everything in The Sprint —<br />and we work with you directly.</h3>
          </div>

          <div className="h-px bg-[#4f66fd]/20 mb-10" />

          <div className="flex-grow flex flex-col">
            <ul className="space-y-4 mb-6">
              {[
                "Everything in The Sprint",
                "Personal roadmap session with Adebayo Kareem",
                "Custom learning curriculum for your goals",
                "Build with AI live — watch, learn, and build in real time",
                "AI in 2026 Bootcamp access",
                "Advanced AI Flyer Design Course access",
                "Recommended tools and resources for your specific path",
                "Priority guidance from the team for all 90 days"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4 text-[#ffffff] text-[15px] leading-[2.0]">
                  <span className="text-[#4f66fd] font-bold">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <a 
              href="https://adebayokareem.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#777777] italic text-[13px] hover:text-white transition-colors mb-12 flex items-center gap-1.5"
            >
              See examples of what you will build <ExternalLink size={14} />
            </a>
          </div>

          <div className="space-y-4">
            <a 
              href={PAYSTACK_LINK_BUILDERS} 
              className="w-full h-[52px] bg-[#4f66fd] text-white rounded-full flex items-center justify-center font-bold hover:bg-[#3d51d4] transition-all text-base shimmer-effect"
            >
              Join The Builder's Track →
            </a>
            <p className="text-center text-[#777777] text-[13px] mt-1 italic">Commitment fee discussed at registration</p>
            <div className="text-center space-y-3">
              <a 
                href={SELAR_LINK} 
                className="text-[#777777] hover:text-white text-[13px] font-medium block transition-colors"
              >
                International? Pay via Selar →
              </a>
              <p className="text-[13px] text-[#777777]">
                Want to pay in instalments? <a href={getWhatsAppLink('instalment')} target="_blank" rel="noopener noreferrer" className="text-[#4f66fd] font-medium hover:underline">Talk to us →</a>
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer / Bottom Section */}
      <footer className="max-w-4xl mx-auto px-6 text-center">
        <div className="h-px w-full bg-white/10 mb-12" />
        <p className="text-white/60 font-semibold mb-2">Registration closes April 30th. Cohort begins May 4th.</p>
        <a href={getWhatsAppLink('general')} target="_blank" rel="noopener noreferrer" className="text-brand-blue font-bold flex items-center justify-center gap-2 hover:underline mb-12">
          Questions? Message us on WhatsApp <ArrowRight size={16} />
        </a>
        <div className="pt-8">
          <Link to="/" className="text-[#555555] hover:text-white text-[13px] font-medium transition-colors">
            ← Back to main page
          </Link>
        </div>
      </footer>
    </div>
  );
}
