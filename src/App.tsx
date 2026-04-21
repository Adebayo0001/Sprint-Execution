/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Menu, ArrowRight, CheckCircle2 } from 'lucide-react';
import RegistrationForm from './components/RegistrationForm';
import { DRIVE_HIGHLIGHTS, getDriveThumbnail } from './constants';

// Helper for smooth scroll
const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
};

export default function App() {
  const [showBanner, setShowBanner] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-brand-dark overflow-x-hidden">
      {/* Sticky Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-brand-blue text-white py-2 px-6 flex items-center justify-center text-[10px] md:text-xs font-medium tracking-tight"
          >
            <span className="text-center">
              Sprint Execution 2026 — 1.0 · 50 Spots Only · Commitment Required · Applications Now Open
            </span>
            <button 
              onClick={() => setShowBanner(false)}
              className="absolute right-4 hover:opacity-70 transition-opacity"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className={`glass-nav ${showBanner ? 'mt-8 md:mt-10' : 'mt-0'} transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="font-bold text-lg tracking-tight">The Sprint Execution Hub</div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <button onClick={() => scrollTo('how-it-works')} className="hover:text-brand-blue transition-colors">How It Works</button>
            <button onClick={() => scrollTo('who-its-for')} className="hover:text-brand-blue transition-colors">Who It's For</button>
            <button onClick={() => scrollTo('highlights')} className="hover:text-brand-blue transition-colors">Highlights</button>
            <button onClick={() => scrollTo('about')} className="hover:text-brand-blue transition-colors">About</button>
            <button 
              onClick={() => scrollTo('apply')}
              className="bg-brand-blue px-6 py-2 rounded-full hover:brightness-110 active:scale-95 transition-all"
            >
              Apply Now
            </button>
          </div>

          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <Menu size={24} />
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden absolute top-20 left-0 right-0 bg-brand-dark-lighter border-b border-white/5 p-6 flex flex-col gap-6 text-sm font-medium"
            >
              <button onClick={() => { scrollTo('how-it-works'); setIsMenuOpen(false); }}>How It Works</button>
              <button onClick={() => { scrollTo('who-its-for'); setIsMenuOpen(false); }}>Who It's For</button>
              <button onClick={() => { scrollTo('highlights'); setIsMenuOpen(false); }}>Highlights</button>
              <button onClick={() => { scrollTo('about'); setIsMenuOpen(false); }}>About</button>
              <button 
                onClick={() => { scrollTo('apply'); setIsMenuOpen(false); }}
                className="bg-brand-blue w-full py-4 rounded-full text-center"
              >
                Apply Now
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}

      <section className="pt-32 pb-20 px-6 relative subtle-grid min-h-[90vh] flex items-center">
        {/* Decorations */}
        <div className="absolute top-20 right-[10%] w-32 h-32 border-r border-t border-brand-blue/10 rotate-45 pointer-events-none" />
        <div className="absolute bottom-20 left-[5%] w-48 h-48 border-l border-b border-brand-blue/10 -rotate-12 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 border border-brand-blue/40 text-brand-blue py-1.5 px-4 rounded-full text-[10px] md:text-xs font-bold tracking-wider uppercase mb-8">
                50 Persons Only — Cohort 1.0
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] mb-8 tracking-tighter">
                The Sprint Execution <br /> 2026 – 1.0
              </h1>
              
              <p className="text-xl md:text-2xl text-white/70 font-light mb-12">
                90 Days. Daily Accountability. Real Results.
              </p>

              <div className="space-y-5 mb-12">
                {[
                  "Learn a new skill — and actually finish it",
                  "Complete a course, project, or career shift",
                  "Build the habit of getting things done — and stay accountable doing it"
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-brand-blue rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={14} className="text-white" />
                    </div>
                    <span className="text-base md:text-lg font-bold">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-start gap-4">
                <button onClick={() => scrollTo('apply')} className="btn-primary flex items-center gap-2 text-lg">
                  Secure My Spot <ArrowRight size={20} />
                </button>
                <p className="text-xs text-white/40 ml-2">Limited to 50 participants. Commitment required.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-brand-blue/20 blur-[100px] rounded-full pointer-events-none" />
              <div className="relative border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl skew-x-1">
                <img 
                  src={getDriveThumbnail("1OB0ZE1Kmb3Q_PSYXKh7YmSDDk0MvodRs")} 
                  alt="Sprint Execution Hero"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto"
                />
              </div>
              {/* Decorative detail */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 border-b-2 border-r-2 border-brand-blue/30 rounded-br-3xl pointer-events-none" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 px-6 bg-brand-dark-lighter">
        <div className="max-w-4xl mx-auto">
          <span className="text-brand-blue text-xs font-bold tracking-[0.3em] uppercase block mb-4">
            Why We Built This
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-12 leading-tight tracking-tight">
            We built this because we want to help people finally get things done.
          </h2>
          
          <div className="space-y-8 text-lg text-white/70 leading-relaxed max-w-3xl">
            <p>
              The first edition of The Sprint Execution was completely free. We wanted to prove something — that with the right system, the right environment, and the right level of accountability, people can get extraordinary things done. And they did.
            </p>
            <p>
              But free also attracted the wrong energy. People who weren't ready. People who joined but didn't show up. And that hurt the ones who were serious.
            </p>
            <p>
              We wrestled with making this paid. Honestly, it wasn't an easy decision. But we realized: a commitment fee isn't about the money. It's a filter. It signals that you're choosing to be here — that you're not just curious, you're ready.
            </p>
            
            <blockquote className="border-l-2 border-brand-blue pl-8 py-2 italic text-white text-xl md:text-2xl mt-12 bg-white/5 pr-6 rounded-r-lg">
              "So we made it 'pay what you have.' This isn't close to the value you'll receive. Not even close. But it ensures we work with people who mean it. People who want to get something done."
            </blockquote>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section id="who-its-for" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <span className="text-brand-blue text-xs font-bold tracking-[0.3em] uppercase block mb-4">
              This Is For You If…
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Whether you're starting, stuck, or <br className="hidden md:block" /> starting over — you belong here.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "You want to learn something new", desc: "You've been saying it for months. Let's make it happen in 90 days." },
              { title: "You're changing careers", desc: "The roadmap feels unclear. We'll build one with you — step by step." },
              { title: "You're building a habit", desc: "Not the motivational kind. The real, hard-won, daily kind." },
              { title: "You want to finally finish what you started", desc: "A course, a project, a goal. Let's cross the finish line." },
              { title: "You want to live with discipline", desc: "Not restriction. Discipline as freedom. The kind that compounds." },
              { title: "You want to stay consistent", desc: "90 days with structure, accountability, and people who won't let you quit." }
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-brand-dark-card border border-brand-blue/10 p-8 rounded-3xl hover:border-brand-blue/30 transition-all duration-300"
              >
                <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center mb-6">
                  <CheckCircle2 size={20} />
                </div>
                <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-brand-dark-lighter">
        <div className="max-w-4xl mx-auto">
          <div className="mb-20">
            <span className="text-brand-blue text-xs font-bold tracking-[0.3em] uppercase block mb-4">
              The System
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              This is what 90 days of real accountability looks like.
            </h2>
          </div>

          <div className="relative space-y-16">
            {/* Vertical Line */}
            <div className="absolute left-[15px] top-4 bottom-4 w-px bg-brand-blue/20" />
            
            {[
              { step: "Step 1", title: "You Apply and Commit", content: "You fill out the form, tell us what you want to get done, and make your commitment fee. This is what gets you in." },
              { step: "Step 2", title: "You're Added to the Sprint Group", content: "Every participant enters the same accountability group. Daily check-ins. Real people. Real progress. Monday to Friday." },
              { step: "Step 3", title: "Daily Execution, Monday to Friday", content: "Every day, you work. Not average work — work that requires your mind, your skill, and your full attention. At the end of each day, you report what you accomplished." },
              { step: "Step 4", title: "We Walk With You", content: "This isn't a challenge you do alone. We're in it with you. The team reviews reports, calls out drift, celebrates wins, and holds the standard high for 90 days." },
              { step: "Step 5", title: "You Come Out Different", content: "By the time the Sprint ends, you will have built something real. A skill. A habit. A completed project. A new career path. A version of yourself that executes." }
            ].map((item, i) => (
              <motion.div 
                key={i} 
                className="relative pl-12 flex flex-col gap-2"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="absolute left-0 top-1 w-[32px] h-[32px] bg-brand-dark-lighter border-2 border-brand-blue rounded-full flex items-center justify-center text-[10px] font-bold text-brand-blue z-10 transition-colors">
                  {i + 1}
                </div>
                <div className="text-brand-blue text-[10px] font-bold tracking-widest uppercase">{item.step}</div>
                <h3 className="text-2xl font-bold">{item.title}</h3>
                <p className="text-white/60 leading-relaxed max-w-2xl">{item.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-12 tracking-tight">
            Some people want to go deeper. We built that too.
          </h2>
          
          <div className="space-y-8 text-lg text-white/70 leading-relaxed mb-16">
            <p>
              Everyone in the Sprint has access to the same group, the same daily check-ins, the same accountability system. That's the foundation — and it's powerful on its own.
            </p>
            <p>
              But some people come in without a clear direction. They know they want to grow, but they're not sure what to build, what to learn, or where to begin. For those people, we go further.
            </p>
            <p>
              If you want direct involvement from the team — a personal roadmap, a learning curriculum built around your exact goals, course recommendations that match where you're headed, and access to programs and resources from Adebayo Kareem's growing content library — you can choose to go deeper when you register.
            </p>
            <p>
              This includes access to upcoming programs like the AI in 2026 Bootcamp, the Advanced AI Flyer Design Course, and other resources as they launch throughout the year.
            </p>
            <p className="font-bold text-white">
              This isn't a different tier. It's a different level of commitment — and a different level of result.
            </p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-brand-dark-card border border-brand-blue p-8 md:p-12 rounded-3xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-blue/10 rounded-full -mr-24 -mt-24 blur-3xl" />
            <h3 className="text-2xl font-bold mb-8">Group + Team Support — Maximum Growth Pathway</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-6">
                {[
                  "Personalized 90-day execution roadmap",
                  "Dedicated 1-on-1 meeting with Adebayo Kareem (Limited)",
                  "Access to premium paid frameworks",
                  "Access to expert-tested paid templates",
                  "How to build apps & websites professionally with AI"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-5 h-5 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 size={12} />
                    </div>
                    <span className="text-white font-medium">{item}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-6 bg-white/5 p-6 rounded-2xl border border-white/5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-brand-blue font-bold mb-4">You'll learn to build:</p>
                <div className="space-y-4">
                  {[
                    { name: "Live Portfolios", url: "https://adebayokareem.vercel.app/" },
                    { name: "SaaS & Productivity Apps", url: "https://lagos-midnight-259803017967.us-west1.run.app" },
                    { name: "Professional E-com Platforms", url: "https://elgantme.lovable.app" }
                  ].map((link, i) => (
                    <a 
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between group/link"
                    >
                      <span className="text-sm font-semibold group-hover/link:text-brand-blue transition-colors">{link.name}</span>
                      <ArrowRight size={14} className="text-white/20 group-hover/link:text-brand-blue transition-all" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => scrollTo('apply')}
              className="w-full md:w-auto bg-brand-blue px-10 py-4 rounded-full font-bold hover:brightness-110 active:scale-95 transition-all text-center"
            >
              Apply for Team Support
            </button>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6 bg-brand-dark-lighter">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-brand-blue text-xs font-bold tracking-[0.3em] uppercase block mb-4">
                Who We Are
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-10 tracking-tight">
                We are The Sprint Execution Hub.
              </h2>
              <div className="space-y-6 text-white/70 leading-relaxed">
                <p>
                  We're a small, focused team that believes execution is a skill — one that can be built, practiced, and refined. We built The Sprint Execution because we kept seeing the same pattern: smart, capable people with real goals, stuck in a loop of starting and stopping.
                </p>
                <p>
                  We don't sell motivation. We don't do hype. We build environments where getting things done is the norm — where accountability is real, the standard is high, and the support is genuine.
                </p>
                <p>
                  Our Lead Executor, Adebayo Kareem, brings this system to life each cohort. He's not just managing a challenge — he's executing alongside every participant, reviewing reports, setting the tone, and showing up daily. The team is built around his approach: direct, supportive, and relentlessly focused on results.
                </p>
                <p>
                  We've done this before. We've seen what happens when the right people get into the right environment. This is that environment.
                </p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-brand-dark-card border border-brand-blue/20 p-6 md:p-10 rounded-3xl text-center flex flex-col items-center"
            >
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden mb-8 border-2 border-brand-blue/30 shadow-2xl skew-x-1">
                <img 
                  src={getDriveThumbnail("1HT8Ytjq4T4rpPShYJJk_JKotQJwiyRUk")} 
                  alt="Adebayo Kareem" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top scale-[170%]"
                />
              </div>
              <h3 className="text-2xl font-bold mb-1">Adebayo Kareem</h3>
              <p className="text-white/60 mb-8 font-medium">Lead Executor, The Sprint Execution Hub</p>
              <div className="h-px bg-white/5 w-full mb-8" />
              <p className="text-white/30 text-xs font-medium tracking-wide uppercase px-4">Currently serving Cohort 1.0 — 2026</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section id="highlights" className="py-24 px-6 bg-brand-dark">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-brand-blue text-xs font-bold tracking-[0.3em] uppercase block mb-4">
              Cohort Highlights
            </span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
              Proof of Execution. <br className="hidden md:block" /> Results from our previous Sprint.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {DRIVE_HIGHLIGHTS.slice(0, 4).map((id, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 2) * 0.2 }}
                className="w-full aspect-video bg-brand-dark-card border border-white/5 rounded-3xl overflow-hidden hover:border-brand-blue/30 transition-all group cursor-pointer shadow-2xl relative"
              >
                <img
                  src={id.startsWith('FILE_ID') 
                    ? `https://picsum.photos/seed/sprint-exc-${i}/800/450` 
                    : getDriveThumbnail(id)
                  }
                  alt={`Cohort Highlight ${i + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                />
              </motion.div>
            ))}
          </div>
          
          <div className="mt-32 text-center">
            <p className="text-white/40 italic text-sm">This is what happens when you stop planning and start executing.</p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <RegistrationForm />

      {/* Footer */}
      <footer className="bg-[#111111] py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 mb-12">
            <div>
              <div className="font-bold text-2xl mb-2">The Sprint Execution Hub</div>
              <p className="text-white/40 italic font-light tracking-wide">Execute. Repeat. Become.</p>
            </div>
            
            <div className="flex gap-8 text-sm font-medium text-white/60">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          
          <div className="h-px bg-white/5 mb-12" />
          
          <div className="flex flex-col md:flex-row justify-center items-center text-[10px] md:text-xs text-white/30 uppercase tracking-[0.2em] font-medium text-center">
            <span>© 2026 The Sprint Execution Hub. All rights reserved. Lead Executor: Adebayo Kareem.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
