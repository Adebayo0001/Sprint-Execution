/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, MessageSquare, Share2, ArrowLeft, Users, ShieldCheck } from 'lucide-react';
import { WHATSAPP_GROUP_EXECUTORS, WHATSAPP_GROUP_SUPPORT, WHATSAPP_CONTACT_LINK } from '../constants';
import { sendConfirmationEmail } from '../lib/email';

export default function Success() {
  const [searchParams] = useSearchParams();
  const tier = searchParams.get('tier');
  const trackParam = searchParams.get('track');
  const rawName = searchParams.get('name') || 'Executor';
  const name = rawName.trim().split(' ')[0];
  const emailSentRef = useRef(false);
  const [applicant, setApplicant] = React.useState<any>(null);

  const isTeamSupport = tier === 'group_plus_support' || tier === 'Support' || trackParam === 'builders';

  useEffect(() => {
    const rawApplicant = localStorage.getItem('sprint_applicant');
    console.log("RAW localStorage 'sprint_applicant':", rawApplicant);

    if (rawApplicant) {
      try {
        const parsed = JSON.parse(rawApplicant);
        setApplicant(parsed);
      } catch (e) {
        console.error("Error parsing applicant data:", e);
      }
    }

    if (emailSentRef.current) return;
    emailSentRef.current = true;

    const initOnboarding = async () => {
      try {
        if (!rawApplicant) return;
        const parsed = JSON.parse(rawApplicant);
        // Identify track: prefer param, fallback to tier mapping
        const track = (trackParam === 'sprint' || trackParam === 'builders') 
          ? (trackParam as 'sprint' | 'builders')
          : (isTeamSupport ? 'builders' : 'sprint');

        await sendConfirmationEmail(parsed, track);
      } catch (err) {
        // Failed email must never prevent the success page from loading
        console.error("Non-blocking error in initOnboarding:", err);
      }
    };

    initOnboarding();
  }, [trackParam, isTeamSupport]);

  const shareApp = () => {
    const text = `I just joined The Sprint Execution 2026. Only 50 spots available for this cohort. Secure yours here: ${window.location.origin}`;
    if (navigator.share) {
      navigator.share({
        title: 'The Sprint Execution',
        text: text,
        url: window.location.origin,
      });
    } else {
      window.open(`${WHATSAPP_CONTACT_LINK}?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-brand-blue/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-brand-blue/20 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-brand-dark-card border border-brand-blue/30 rounded-3xl p-8 md:p-12 shadow-3xl text-center relative z-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
          className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <CheckCircle2 size={40} className="text-green-500" />
        </motion.div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight leading-[1.1]">
          {isTeamSupport ? "Welcome to The Builder's Track!" : "Welcome to The Sprint!"}
        </h1>
        <p className="text-xl font-medium mb-4 text-white/90">
          Glad to have you, {name}!
        </p>
        {applicant?.email && (
          <p className="text-brand-blue font-medium mb-6 text-sm bg-brand-blue/10 inline-block px-4 py-1 rounded-full">
            Confirmed for: {applicant.email}
          </p>
        )}
        <p className="text-white/60 mb-10 leading-relaxed font-normal">
          Your commitment has been recorded. You are now part of the 50 executors for Cohort 1.0. 
          Follow the steps below to finalize your onboarding.
        </p>

        <div className="space-y-6 text-left">
          {/* Step 1: Join Sprint Executors */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
             <div className="flex items-start gap-4">
               <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
                 <Users className="text-brand-blue" size={20} />
               </div>
               <div className="flex-1">
                 <h3 className="font-bold text-lg mb-1 leading-tight">Step 1: Join Sprint Executors</h3>
                 <p className="text-xs text-white/50 mb-4 font-normal">The main accountability hub where everything happens.</p>
                 <a 
                   href={WHATSAPP_GROUP_EXECUTORS}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all text-sm"
                 >
                   Join Sprint Executors <MessageSquare size={16} />
                 </a>
               </div>
             </div>
          </div>

          {/* Step 2 (Optional): Support Link */}
          {isTeamSupport && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-brand-blue/10 border border-brand-blue/30 p-6 rounded-2xl relative overflow-hidden"
            >
               <div className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                   <ShieldCheck className="text-white" size={20} />
                 </div>
                 <div className="flex-1">
                   <h3 className="font-bold text-lg mb-1 leading-tight">Step 2: Join Support Link</h3>
                   <p className="text-xs text-white/70 mb-4 font-medium uppercase tracking-[0.15em] italic">Exclusive for Team Support Tier</p>
                   <a 
                     href={WHATSAPP_GROUP_SUPPORT}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="inline-flex items-center gap-2 bg-white text-brand-dark font-semibold py-3 px-6 rounded-xl transition-all text-sm"
                   >
                     Join Support Portal <MessageSquare size={16} />
                   </a>
                 </div>
               </div>
            </motion.div>
          )}

          {/* Step 3: Refer */}
          <div className="pt-6 border-t border-white/5">
            <h4 className="font-medium text-[11px] mb-4 text-center text-white/40 uppercase tracking-[0.15em]">Help someone else execute</h4>
            <button 
              onClick={shareApp}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-2 group"
            >
              Spread the word <Share2 size={18} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        <div className="mt-12">
          <Link to="/" className="text-white/40 hover:text-brand-blue transition-colors text-sm flex items-center justify-center gap-2 font-normal">
            <ArrowLeft size={14} /> Back to Homepage
          </Link>
        </div>
      </motion.div>

      <div className="mt-12 text-center text-white/20 text-[10px] uppercase tracking-[0.15em] font-medium">
        Sprint Execution Hub — Cohort 1.0 — 2026
      </div>
    </div>
  );
}
