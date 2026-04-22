/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { X, ArrowRight, Check, Users, ExternalLink } from 'lucide-react';
import { doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from './lib/firebase';
import RegistrationForm from './components/RegistrationForm';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Success from './pages/Success';
import AdminSync from './pages/AdminSync';
import AdminSyncButton from './components/AdminSyncButton';
import ExitIntentPopup from './components/ExitIntentPopup';
import { SUPPORT_EMAIL, SAMPLE_WORK_LINK, getDriveThumbnail } from './constants';

const LiveActivityToast = () => {
  const [activity, setActivity] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'public_feed'), orderBy('created_at', 'desc'), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const timestamp = data.created_at?.toDate()?.getTime();
        const now = Date.now();
        if (timestamp && (now - timestamp) < 30000) {
          setActivity(data);
          setVisible(true);
          const timer = setTimeout(() => setVisible(false), 5000);
          return () => clearTimeout(timer);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <AnimatePresence>
      {visible && activity && (
        <motion.div
          initial={{ opacity: 0, x: -50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed bottom-8 left-8 z-[100] bg-brand-dark-lighter border border-brand-blue/30 p-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-sm pointer-events-none"
        >
          <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center flex-shrink-0">
            <Users size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-tight">
              {activity.name} from {activity.state}, {activity.country}
            </p>
            <p className="text-[10px] text-brand-blue font-medium mt-1 uppercase tracking-wider">
              Just registered for {activity.tier}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Custom Hook for reduced motion
const useReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const listener = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);
  return reducedMotion;
};

// Reusable Section Label
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <motion.span 
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: 0.2 }}
    className="editorial-label"
  >
    {children}
  </motion.span>
);

// Animated Headline
const Headline = ({ children, className = "" }: { children: string, className?: string }) => {
  const lines = children.split('\n');
  return (
    <h2 className={`editorial-headline ${className}`}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-1">
          <motion.span
            initial={{ y: 80, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1], delay: i * 0.1 }}
            className="block"
          >
            {line}
          </motion.span>
        </span>
      ))}
    </h2>
  );
};

const CountdownSection = () => {
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, mins: number, secs: number } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // April 30, 2026 at 11:59 PM Nigeria time (UTC+1)
    // This is equivalent to April 30, 2026 22:59:59 UTC
    const targetDate = new Date('2026-04-30T22:59:59Z').getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(timer);
        setIsExpired(true);
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

  return (
    <div className="bg-[#111111] w-full border-b border-white/5 py-8 md:py-10">
      <div className="max-w-7xl mx-auto px-6 md:px-24">
        {isExpired ? (
          <div className="text-center text-[#ef4444] font-bold text-lg md:text-xl py-4">
            Registration is now closed.
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-1">
              <span className="text-brand-blue text-[11px] font-bold uppercase tracking-widest block mb-1">
                COHORT 1.0 — 2026
              </span>
              <p className="text-white text-lg font-semibold">Registration closes April 30th</p>
              <p className="text-[#999999] text-sm">Cohort begins May 4th — 50 spots only</p>
            </div>

            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {[
                { label: 'Days', value: timeLeft?.days ?? 0 },
                { label: 'Hours', value: timeLeft?.hours ?? 0 },
                { label: 'Mins', value: timeLeft?.mins ?? 0 },
                { label: 'Secs', value: timeLeft?.secs ?? 0 }
              ].map((box, i) => (
                <div 
                  key={i} 
                  className="bg-[#1e1e1e] border border-brand-blue/30 rounded-lg py-4 px-5 min-w-[72px] md:min-w-[80px] text-center flex flex-col justify-center"
                >
                  <span className="text-2xl md:text-3xl font-bold text-white tabular-nums">
                    {String(box.value).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] md:text-[11px] text-brand-blue font-bold uppercase tracking-widest mt-1">
                    {box.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Navbar = () => {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="fixed top-0 left-0 w-full h-[64px] bg-[#1e1e1e]/95 backdrop-blur-md z-[1000] border-b border-white/5 px-6 md:px-24 flex items-center justify-between">
      <div className="flex items-center">
        <span className="text-white font-bold text-lg tracking-tight">
          The Sprint Execution 2026
        </span>
      </div>
      
      <div className="hidden lg:flex items-center gap-8">
        {[
          { label: 'How It Works', id: 'how-it-works' },
          { label: 'Who It\'s For', id: 'who-it-is-for' },
          { label: 'Highlights', id: 'highlights' },
          { label: 'About', id: 'about' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            className="text-[13px] uppercase tracking-widest text-white/60 hover:text-brand-blue font-medium transition-colors cursor-pointer"
          >
            {item.label}
          </button>
        ))}
        
        <button
          onClick={() => scrollToSection('apply')}
          className="bg-brand-blue text-white text-[12px] uppercase tracking-wider font-semibold px-6 py-2.5 rounded-full hover:scale-105 transition-transform"
        >
          Apply Now
        </button>
      </div>
      
      {/* Mobile Menu Button - Optional simplified version */}
      <div className="lg:hidden">
        <button onClick={() => scrollToSection('apply')} className="bg-brand-blue text-white text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-full">
          Apply
        </button>
      </div>
    </nav>
  );
};

function Home() {
  const reducedMotion = useReducedMotion();
  const [participantCount, setParticipantCount] = useState<number | null>(null);
  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  
  const parallaxValue = useTransform(scrollY, [0, 1000], [0, -300]);
  const parallaxValueHeroNum = useTransform(scrollY, [0, 1000], [0, -200]);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'global_stats', 'registration_count'), (doc) => {
      if (doc.exists()) setParticipantCount(doc.data().count);
      else setParticipantCount(0);
    });
    return () => unsubscribe();
  }, []);

  const scrollToApply = () => {
    document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="selection:bg-brand-blue/30 selection:text-white">
      <Navbar />
      <div className="pt-[64px]">
        <CountdownSection />
        <LiveActivityToast />

        {/* SECTION 1 — THE HOOK (Hero) */}
        <section ref={heroRef} className="relative min-h-screen flex flex-col justify-center px-6 md:px-24 pt-12 pb-12 overflow-hidden bg-[#1e1e1e]">
        {/* Background treatment */}
        <div className="absolute inset-0 dot-grid pointer-events-none" />
        
        {/* Animated Radial Orb */}
        <motion.div 
          animate={reducedMotion ? {} : { 
            x: [0, 30, -20, 0], 
            y: [0, -20, 10, 0],
            scale: [1, 1.1, 0.95, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-blue/18 rounded-full blur-[160px] -mr-64 -mt-64 pointer-events-none" 
        />
        
        {/* Geometric Triangles */}
        <div 
          className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-blue/5 pointer-events-none" 
          style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} 
        />
        <div 
          className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-blue/5 pointer-events-none" 
          style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }} 
        />

        {/* Decorative 90 */}
        <motion.div 
          style={reducedMotion ? {} : { y: parallaxValueHeroNum }}
          className="hidden lg:block absolute right-24 top-1/2 -translate-y-1/2 font-bold text-[320px] text-white opacity-[0.03] pointer-events-none tracking-tighter"
        >
          90
        </motion.div>

        {/* Hero Image */}
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="hidden lg:block absolute right-[-5%] top-[15%] w-[45%] h-[70%] z-0"
        >
          <div className="relative w-full h-full">
            {/* Image Glow */}
            <div className="absolute inset-0 bg-brand-blue/20 blur-[100px] rounded-full scale-75 translate-x-12 translate-y-12" />
            
            <img 
              src={getDriveThumbnail("1OB0ZE1Kmb3Q_PSYXKh7YmSDDk0MvodRs")}
              alt="The Sprint Execution Hero"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-[2rem] shadow-2xl skew-y-[-2deg] border border-white/10"
            />
            
            {/* Floating Element */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-8 -left-8 bg-[#222222] border border-white/10 p-6 rounded-2xl shadow-xl backdrop-blur-xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-blue/20 flex items-center justify-center">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-3 h-3 rounded-full bg-brand-blue" 
                  />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">Live Execution Hub</p>
                  <p className="text-white/40 text-[11px] uppercase tracking-wider">Cohort 1.0 Active</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <div className="max-w-[720px] relative z-10 w-full py-12 md:py-20">
          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-3 mb-10">
            {/* Badge 1 */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="inline-block border border-brand-blue/40 rounded-full px-5 py-1.5 bg-brand-blue/5 backdrop-blur-sm"
            >
              <span className="text-brand-blue text-[11px] font-medium tracking-widest uppercase">
                50 Persons Only — Cohort 1.0
              </span>
            </motion.div>

            {/* Badge 2 - Live Counter */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="inline-flex items-center gap-2 border border-white/10 rounded-full px-5 py-1.5 bg-white/5 backdrop-blur-sm"
            >
              <Users size={12} className="text-brand-blue" />
              <span className="text-[11px] font-medium tracking-wider">
                <span className="text-white">{participantCount ?? '...'} / 50</span>
                <span className="text-white/40 ml-1.5 uppercase">Applied</span>
              </span>
            </motion.div>
          </div>
          
          {/* Headline */}
          <h1 className="text-[44px] md:text-[80px] font-bold text-white leading-[1.1] tracking-[-0.02em] mb-8">
            {["The", "Sprint", "Execution", "2026", "–", "1.0"].map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                className="inline-block mr-[0.2em] last:mr-0"
              >
                {word}
                {i === 2 && <br className="hidden md:block" />}
              </motion.span>
            ))}
          </h1>

          {/* Subheadline */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="text-[20px] font-normal leading-[1.5] text-[#cccccc] mb-8 lg:mb-12"
          >
            90 Days. Daily Accountability. Real Results.
          </motion.p>

          {/* Mobile Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="lg:hidden w-full aspect-video mb-12 relative"
          >
            <img 
              src={getDriveThumbnail("1OB0ZE1Kmb3Q_PSYXKh7YmSDDk0MvodRs")}
              alt="The Sprint Execution Mobile Hero"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-2xl border border-white/10 shadow-lg"
            />
          </motion.div>

          {/* Bullets */}
          <div className="space-y-4 mb-12">
            {[
              "Learn a new skill — and actually finish it",
              "Complete a course, project, or career shift",
              "Build the habit of getting things done — and stay accountable doing it"
            ].map((bullet, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.2 + idx * 0.15 }}
                className="flex items-start gap-4"
              >
                <div className="w-6 h-6 rounded-full bg-brand-blue flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={14} className="text-white stroke-[3px]" />
                </div>
                <span className="text-[17px] text-white font-medium leading-relaxed">
                  {bullet}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1.8 }}
          >
            <button 
              onClick={scrollToApply} 
              className="relative overflow-hidden bg-brand-blue text-white font-semibold text-[18px] py-[18px] px-[40px] rounded-full transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_0_30px_rgba(79,102,253,0.5)] group shimmer-effect"
            >
              <span className="relative z-10 flex items-center">
                Secure My Spot
                <ArrowRight className="inline-block ml-3 group-hover:translate-x-1 transition-transform" size={20} />
              </span>
            </button>
            <p className="mt-8 text-[13px] text-[#666666] font-medium tracking-wide">
              Limited to 50 participants. Commitment required.
            </p>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2 — THE TRUTH */}
      <section className="pt-[56px] pb-[56px] md:pt-[80px] md:pb-[80px] px-6 md:px-24 bg-brand-dark">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>The truth about consistency</SectionLabel>
          
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-12 lg:gap-24 items-start">
            <Headline className="text-[34px] sm:text-[48px] md:text-[64px] font-bold leading-[1.05]">
              {"You've been\nhere before."}
            </Headline>
            
            <div className="space-y-8 max-w-2xl">
              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-[17px] md:text-[20px] text-white/90 leading-relaxed"
              >
                The course is still on tab 47. The project is still in your notes app. The goal you set in January is still waiting. Not because you&apos;re lazy. Because nothing around you made it impossible to quit.
              </motion.p>
              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-[15px] md:text-[18px]"
              >
                That&apos;s the real problem. Not motivation. Not talent. Not time. You just never had a structure that made showing up every single day non-negotiable.
              </motion.p>
              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="text-white italic text-[19px] md:text-[22px] font-normal leading-[1.5] border-l-2 border-brand-blue pl-6 md:pl-8 py-2"
              >
                The Sprint Execution is designed to support you through that middle journey. We&apos;ve built a warm, accountability-led space to help you navigate the next 90 days, so you can finish strong and feel proud of what you&apos;ve built.
              </motion.p>
            </div>
          </div>
          
          <div className="mt-24 h-px w-full bg-white/10" />
        </div>
      </section>

      {/* SECTION 3 — THE SYSTEM */}
      <section id="how-it-works" className="pt-[56px] pb-[56px] md:pt-[80px] md:pb-[80px] bg-[#0a0a0a] overflow-hidden">
        <div className="px-6 md:px-24">
          <div className="max-w-7xl mx-auto mb-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
              <div className="max-w-2xl">
                <SectionLabel>How The Sprint Works</SectionLabel>
                <h2 className="text-[40px] md:text-[52px] font-bold text-white leading-[1.1] tracking-[-0.02em] mt-0">
                  Five steps. Ninety days. One version of you that actually executes.
                </h2>
              </div>
              <div className="hidden md:block">
                <span className="text-[13px] text-white/40 uppercase tracking-[0.2em] font-medium">
                  Scroll to see all steps →
                </span>
              </div>
            </div>
          </div>

          {/* Steps Container */}
          <div className="max-w-4xl mx-auto relative px-4">
            {/* Roadmap Line (Vertical) */}
            <div className="absolute left-[30px] md:left-1/2 top-0 bottom-0 w-[1px] bg-brand-blue/30 z-0" />
            
            <div className="flex flex-col gap-12 relative z-10">
              {[
                { 
                  title: "You make the decision.", 
                  body: "Not tomorrow. Not when you feel ready. Right now — you fill out the form, name what you want to get done, and make your commitment fee. That single act separates you from everyone still thinking about it." 
                },
                { 
                  title: "You're Added to the Sprint Group", 
                  body: "Every participant joins the same space. Monday to Friday, every week, for 90 days. This is not a course group chat. There are no motivational quotes here. This is an execution environment — and the standard is real." 
                },
                { 
                  title: "Daily Execution, Monday to Friday", 
                  body: "Each day, you do something significant. Work that demands your mind, your skill, and your full attention. When the day ends, you report what you built, learned, or completed. No average tasks. No half-effort." 
                },
                { 
                  title: "We hold you to it.", 
                  body: "The team reads every single report. We notice when you drift. We call it out before it becomes a pattern. We celebrate the real wins. The environment stays clean because we protect it — every day." 
                },
                { 
                  title: "You come out different.", 
                  body: "Not just with a completed goal — though you'll have that. You come out as someone who knows they can start something hard and finish it. That identity is worth more than any single result." 
                }
              ].map((step, i) => (
                <div key={i} className="relative group">
                  {/* Milestone Marker & Connector */}
                  <div className="absolute left-[30px] md:left-1/2 top-8 -translate-x-1/2 z-20 flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-[#0a0a0a] border-2 border-brand-blue flex items-center justify-center group-hover:scale-125 transition-transform duration-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                    </div>
                    {i < 4 && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="mt-12 text-brand-blue/60"
                      >
                        <ArrowRight className="rotate-90" size={20} />
                      </motion.div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 md:gap-24`}>
                    <div className="w-full md:w-1/2" /> {/* Spacer */}
                    <motion.div 
                      initial={{ opacity: 0, x: i % 2 === 0 ? 40 : -40 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className="w-full md:w-1/2 relative bg-[#151515] p-8 md:p-10 min-h-[320px] transition-all duration-300 hover:bg-[#1a1a1a] border border-white/5 hover:border-brand-blue/40 rounded-2xl overflow-hidden pl-16 md:pl-10"
                    >
                      {/* Decorative Step Number */}
                      <span className="absolute -top-10 -left-6 font-bold text-[180px] text-brand-blue opacity-[0.08] pointer-events-none select-none z-0 group-hover:opacity-[0.12] transition-opacity">
                        {i + 1}
                      </span>

                      <div className="relative z-10">
                        <div className="mb-6 flex items-center justify-between">
                          <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-brand-blue">Phase 0{i + 1}</span>
                        </div>
                        <h3 className="text-2xl font-semibold text-white mb-4 leading-tight">
                          {step.title}
                        </h3>
                        <p className="text-[16px] text-white/50 leading-[1.8] font-normal">
                          {step.body}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — WHO THIS IS FOR */}
      <section id="who-it-is-for" className="pt-[56px] pb-[56px] md:pt-[80px] md:pb-[80px] px-6 md:px-24 bg-brand-dark">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>This is for you</SectionLabel>
          <Headline className="mb-12 text-[40px] md:text-[56px]">
            {"Whether you're building,\nshifting, or starting over —\nthere is a place for you here."}
          </Headline>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "The learner", desc: "You want to learn something new — and actually finish it this time. Not tab 47 of a YouTube playlist. A real skill, completed." },
              { title: "The career shifter", desc: "You know what you want to move toward. You just need a clear path and people who will hold you to it every single day." },
              { title: "The builder", desc: "You have something to build — a project, a product, a body of work. The Sprint gives you the environment to build it without drifting." },
              { title: "The unfinished", desc: "There's something you started that never got done. A course. A goal. A version of yourself you almost became. Let's finish it." },
              { title: "The consistent one", desc: "You're not looking for motivation. You already know discipline is the answer. You just need the right structure around you." },
              { title: "The direction-seeker", desc: "You want to grow but you're not sure into what. We'll help you build a clear roadmap — then hold you to executing it." }
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="bg-[#222222] p-8 md:p-10 rounded-xl border-l-[3px] border-brand-blue"
              >
                <h3 className="text-xl font-bold text-white mb-4">{card.title}</h3>
                <p className="text-sm leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MARQUEE TICKER */}
      <div className="w-full bg-[#4f66fd] overflow-hidden whitespace-nowrap py-0 flex items-center h-[52px]">
        <motion.div 
          animate={{ x: [0, "-50%"] }}
          transition={{ duration: 200, repeat: Infinity, ease: "linear" }}
          className="flex items-center gap-10 pr-10"
        >
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-10">
              <span className="text-white text-[14px] font-semibold uppercase tracking-[0.1em] flex items-center gap-10">
                Finished a course <span className="opacity-50">◆</span> 
                Built with AI <span className="opacity-50">◆</span> 
                Changed careers <span className="opacity-50">◆</span> 
                Learned a new skill <span className="opacity-50">◆</span> 
                Shipped a project <span className="opacity-50">◆</span> 
                Stayed consistent for 90 days <span className="opacity-50">◆</span> 
                Built an app <span className="opacity-50">◆</span> 
                Designed professionally <span className="opacity-50">◆</span> 
                Started earning <span className="opacity-50">◆</span> 
                Got something done <span className="opacity-50">◆</span> 
                Showed up every day <span className="opacity-50">◆</span> 
                Built the habit <span className="opacity-50">◆</span> 
                Finished what they started <span className="opacity-50">◆</span> 
                Made it to day 90 <span className="opacity-50">◆</span> 
                Did the work
              </span>
              <span className="text-white opacity-50">◆</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* SOCIAL PROOF SECTION */}
      <section className="pt-[56px] pb-[56px] md:pt-[100px] md:pb-[100px] px-6 md:px-24 bg-brand-dark">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel>IT HAS WORKED BEFORE</SectionLabel>
            <Headline className="text-[40px] md:text-[56px] mb-6">
              {"This is what 90 days of\nreal accountability looks like."}
            </Headline>
            <p className="text-[18px] text-[#cccccc] font-normal">
              From the Sprint Execution 2025 — last quarter. Real participants. Real reports. Real progress.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-12">
            {["1tsgWjcfGaiC-SJBYpAbg3-5zepcBSR-Y", "1LUPYlOR1p5CV2uyqeqdVI6FRVv5qXjjv"].map((driveId, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="text-[11px] text-brand-blue font-medium uppercase tracking-[0.15em] mb-4">
                  PARTICIPANT PROGRESS REPORT
                </span>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="bg-[#1a1a1a] rounded-[12px] border border-brand-blue/30 hover:border-brand-blue/80 overflow-hidden shadow-xl"
                >
                   <img 
                    src={getDriveThumbnail(driveId)} 
                    alt={`Sprint Execution 2025 Progress Report ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-auto block"
                  />
                </motion.div>
              </div>
            ))}
          </div>

          <div className="text-center space-y-6">
            <p className="text-[14px] text-[#777777] italic font-normal">
              Names and personal details blurred to protect participant privacy.
            </p>
            <p className="text-[20px] font-bold text-white">
              Your report could be here next quarter.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5 — THE TWO PATHS */}
      <section id="highlights" className="pt-[56px] pb-[56px] md:pt-[100px] md:pb-[100px] px-6 md:px-24 bg-[#161616]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel>TWO WAYS TO SPRINT</SectionLabel>
            <Headline className="text-[40px] md:text-[56px] mb-6">
              {"Everyone is welcome here.\nYou choose how deep you go."}
            </Headline>
          </div>

          <div className="flex flex-col gap-0">
            {/* The Sprint Block — Foundation */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.7 }}
               className="bg-[#1e1e1e] p-8 md:p-12 relative overflow-hidden flex flex-col border-t-[3px] border-brand-blue"
            >
              <div className="mb-10">
                <span className="text-[#4f66fd] uppercase text-[11px] font-bold tracking-[0.2em] mb-4 block">HOW TO JOIN</span>
                <h3 className="text-[40px] font-bold text-white leading-tight mb-8">
                  Start with The Sprint.<br />Pay what you have.
                </h3>
                <div className="space-y-8 text-[17px] text-[#cccccc] leading-[1.8] max-w-4xl mb-12 font-normal">
                  <p>
                    This is the foundation. Everyone starts here. You pay what genuinely reflects your commitment right now — ₦1,000, ₦2,000, ₦5,000. No fixed price. No pressure.
                  </p>

                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 pt-4 border-t border-white/5 mt-8">
                    {[
                      "You join the Sprint group immediately after payment",
                      "Every Monday to Friday, you show up and do meaningful work",
                      "At the end of each day, you post your report — what you worked on and what you achieved",
                      "The team reviews every report and responds — no one goes unnoticed",
                      "Participants who go quiet get called out — the standard is kept high for everyone",
                      "At the end of 90 days, you will have a body of work, a finished goal, or a skill you actually used"
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-[15px] text-white leading-[1.6]">
                        <span className="text-brand-blue font-bold mt-[-2px]">—</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="text-[14px] text-[#999999] italic mt-8">
                    "No average tasks. No half-effort. This is the real thing."
                  </p>
                </div>
              </div>

              <div className="mt-auto flex flex-col md:flex-row md:items-center justify-between gap-8 pt-8 border-t border-white/10">
                <div>
                  <p className="text-white text-[16px] font-semibold mb-1 uppercase tracking-wider">Pay what you have</p>
                  <p className="text-[13px] text-[#777777] font-normal">Suggested: ₦1,000 · ₦2,000 · ₦5,000</p>
                </div>
                <button 
                  onClick={scrollToApply} 
                  className="px-10 py-4 rounded-full border border-white text-white font-bold hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
                >
                  Join The Sprint <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>

            {/* Divider */}
            <div className="relative h-px w-full bg-white/[0.08] my-12 flex items-center justify-center">
              <span className="bg-[#1e1e1e] px-4 text-[13px] text-[#777777] italic">
                Want more than accountability for all 90 days?
              </span>
            </div>

            {/* The Builder's Track Block — Addition */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.7, delay: 0.2 }}
               className="bg-[#161a2e] p-8 md:p-12 relative overflow-hidden flex flex-col border-t-2 border-[#4f66fd]/60 w-full max-w-[680px] mx-auto rounded-xl shadow-2xl"
            >
              <div className="mb-10">
                <span className="text-[#4f66fd] uppercase text-[11px] font-bold tracking-[0.2em] mb-4 block">THE BUILDER'S TRACK</span>
                <h3 className="text-3xl md:text-[32px] font-bold text-white leading-tight mb-8">
                  You want someone<br />in your corner<br />for all 90 days.
                </h3>
                <div className="space-y-6 text-sm md:text-base text-[#aaaaaa] mb-12 font-normal leading-relaxed">
                  <p>
                    Some people don't just need accountability — they need direction. A clear roadmap. Someone who will work with them directly, build the path, and stay close until it's done.
                  </p>
                  <p>
                    This is that. And it goes further.
                  </p>
                  
                  <ul className="space-y-4 pt-4 border-t border-white/5">
                    {[
                      "A personal roadmap session with Adebayo Kareem built around your exact goals",
                      "A learning curriculum matched to where you want to go",
                      "Direct access to Adebayo as he builds with AI live — you watch, learn, and build alongside him in real time",
                      "Access to the AI in 2026 Bootcamp (currently in development)",
                      "Access to the Advanced AI Flyer Design Course with real samples of what you will learn to create",
                      "Recommended tools, courses, and resources tailored to your specific path",
                      "Priority guidance from the team throughout all 90 days"
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-[14px] text-white/80 leading-[1.6]">
                        <span className="text-brand-blue font-bold mt-[-2px]">—</span>
                        <span>
                          {item.includes("real samples of what you will learn to create") ? (
                            <>
                              {item.split("real samples of what you will learn to create")[0]}
                              <a href={SAMPLE_WORK_LINK} className="text-brand-blue hover:underline">
                                real samples of what you will learn to create
                              </a>
                              {item.split("real samples of what you will learn to create")[1]}
                            </>
                          ) : item}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-8 border-t border-white/5 pt-8">
                    Our goal is simple — by the time these 90 days are over, you will either have a skill that can pay you, a habit that grows your income, or a project that opens the next door. We are not here to just hold you accountable. We are here to make sure something changes.
                  </p>
                </div>
              </div>

              <div className="mt-auto border-t border-white/10 pt-8">
                <div className="mb-8">
                  <p className="text-white text-[16px] font-semibold mb-1 uppercase tracking-wider">₦12,500</p>
                  <p className="text-[13px] text-[#777777]">Everything in The Sprint, plus direct involvement from the team</p>
                  <p className="text-[12px] text-[#777777] mt-2">
                    Can't pay at once? <a href="https://wa.me/2348120723575" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">Reach out</a> — we may consider instalment payments.
                  </p>
                </div>
                <button 
                  onClick={scrollToApply} 
                  className="w-full bg-[#4f66fd] hover:bg-[#3d51d4] text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 transition-all shimmer-effect"
                >
                  Join The Builder's Track <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — THE STORY */}
      <section className="pt-[56px] pb-[56px] md:pt-[80px] md:pb-[80px] px-6 md:px-24 bg-brand-dark">
        <div className="max-w-4xl mx-auto">
          <SectionLabel>Why we charge for this</SectionLabel>
          <Headline className="mb-10 text-[52px]">
            {"We ran the first Sprint free.\nHere is what we learned."}
          </Headline>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start mb-24">
            <div className="space-y-8">
              <p>
                The first edition of The Sprint Execution was completely free. We wanted to prove something — that with the right system, the right environment, and the right level of accountability, people can get extraordinary things done. And they did.
              </p>
              <p>
                But free also attracted the wrong energy. People who weren&apos;t ready. People who joined but didn&apos;t show up. And that hurt the ones who were serious.
              </p>
            </div>
            <div className="space-y-8">
              <p>
                We wrestled with making this paid. Honestly, it wasn&apos;t an easy decision. But we realized: a commitment fee isn&apos;t about the money. It&apos;s a filter. It signals that you&apos;re choosing to be here — that you&apos;re not just curious, you&apos;re ready.
              </p>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <p className="text-[28px] md:text-[36px] italic font-normal text-white leading-[1.5] max-w-[680px] mx-auto mb-6">
              "'This isn't the price of what you'll receive. It's proof that you're ready for it.'"
            </p>
            <span className="text-sm text-white/30 uppercase tracking-[0.15em]">— The Sprint Execution Hub</span>
          </motion.div>
        </div>
      </section>

      {/* SECTION 7 — THE TEAM */}
      <section id="about" className="pt-[56px] pb-[56px] md:pt-[80px] md:pb-[80px] px-6 md:px-24 bg-[#161616]">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>Who we are</SectionLabel>
          
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-24 items-center">
            <div>
              <Headline className="mb-12 text-[48px]">
                {"We built the environment\nwe wish we'd had."}
              </Headline>
              <div className="space-y-8 max-w-2xl">
                <p>
                  The Sprint Execution Hub is a small, focused team with one obsession: helping people finish things. Not start things. Finish them. We have watched too many capable people with real goals get swallowed by the gap between intention and execution.
                </p>
                <p>
                  We don't sell motivation. We don't do hype. We build environments where showing up every day is the norm — where the people around you make drift feel strange.
                </p>
                <p>
                  Adebayo Kareem currently serves as our Lead Executor. He runs each cohort directly — reviewing reports, setting the tone, and showing up in the group every single day. His approach is the approach: direct, warm, and relentlessly focused on what you actually achieve.
                </p>
              </div>
            </div>

            <motion.div 
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               viewport={{ once: true }}
               transition={{ duration: 1 }}
               className="flex flex-col items-center lg:items-start text-center lg:text-left"
            >
              <div className="w-60 h-60 rounded-full mb-8 relative overflow-hidden group border-2 border-brand-blue/20">
                <img 
                  src={getDriveThumbnail("15qQlcwu7kLbFMr3-_tLy_JtLbCK9rmAE")} 
                  alt="Adebayo Kareem" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <h3 className="text-[20px] font-bold text-white">Adebayo Kareem</h3>
              <p className="text-brand-blue text-sm mb-1 uppercase tracking-wider font-medium">Lead Executor</p>
              <p className="text-[13px] text-white/30 mb-8 uppercase tracking-[0.1em] font-normal">Serving Cohort 1.0 — 2026</p>
              
              <div className="bg-[#1e1e1e] p-6 rounded-xl border-l-[3px] border-brand-blue italic text-white/90 text-sm leading-relaxed max-w-xs transition-transform hover:scale-[1.02] font-normal">
                "My job is to make sure that when this is over, you have something real to show for it."
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 8 — REGISTRATION FORM */}
      <section id="apply" className="pt-[56px] pb-[56px] md:pt-[80px] md:pb-[80px] px-6 md:px-24 bg-brand-dark relative">
        <div className="absolute inset-0 diagonal-grid opacity-20 pointer-events-none" />
        <div className="max-w-[780px] mx-auto relative z-10">
          <div className="text-center mb-16">
            <SectionLabel>Apply Now</SectionLabel>
            <Headline className="text-center text-[48px] md:text-[64px] mb-6">
              {"Your 90 days\nstart here."}
            </Headline>
            <p className="text-xl text-white/40">50 spots. First come, first committed.</p>
          </div>

          <div className="bg-[#1c1c1c] border border-brand-blue/20 rounded-[2rem] shadow-3xl">
            <RegistrationForm />
          </div>
        </div>
      </section>

      {/* SECTION 9 — FOOTER */}
      <footer className="py-20 px-6 md:px-24 bg-[#0f0f0f] border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 items-start">
            <div>
              <p className="text-white font-bold text-lg mb-2">The Sprint Execution Hub</p>
              <p className="text-white/40 text-sm italic">Execute. Repeat. Become.</p>
            </div>
            <div className="text-center md:text-sm text-white/30 hidden md:block">
              © 2026 The Sprint Execution Hub.<br />
              Lead Executor: Adebayo Kareem.
            </div>
            <div className="flex justify-end gap-x-8 text-sm text-white/40 font-medium">
              <a href="#" className="hover:text-brand-blue transition-colors text-[13px] uppercase tracking-wider">Privacy Policy</a>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-brand-blue transition-colors text-[13px] uppercase tracking-wider">Contact</a>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/5 text-center md:hidden text-[10px] text-white/20 uppercase tracking-widest">
            © 2026 The Sprint Execution Hub. Lead Executor: Adebayo Kareem.
          </div>
        </div>
      </footer>
      <AdminSyncButton />
      <ExitIntentPopup />
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-brand-dark overflow-x-hidden selection:bg-brand-blue selection:text-white">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/success" element={<Success />} />
          <Route path="/admin/sync" element={<AdminSync />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
