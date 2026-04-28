/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, MessageSquare, Share2, ArrowLeft, Users, ShieldCheck } from 'lucide-react';
import { SPRINT_GROUP_LINK, BUILDERS_GROUP_LINK, WHATSAPP_CONTACT_LINK } from '../constants';
import { sendConfirmationEmail } from '../lib/email';
import emailjs from '@emailjs/browser';

export default function Success() {
  const [searchParams] = useSearchParams();
  const trackParam = searchParams.get('track');
  const emailParam = searchParams.get('email');
  const rawName = searchParams.get('name') || 'Executor';
  const name = rawName.trim().split(' ')[0];
  const [applicant, setApplicant] = React.useState<any>(null);
  const [emailFailed, setEmailFailed] = React.useState(false);
  const emailSentRef = useRef(false);

  const isBuilders = trackParam === 'builders';
  const isSprint = trackParam === 'sprint';

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);

    const initOnboarding = async () => {
      const rawApplicant = localStorage.getItem('sprint_applicant');
      if (!rawApplicant) {
        console.log("No applicant data found in localStorage");
        return;
      }

      try {
        const applicantData = JSON.parse(rawApplicant);
        setApplicant({ full_name: applicantData.name, email: applicantData.email, goal: applicantData.goal });

        // Only send email if we have a track parameter and haven't sent it yet
        if ((isBuilders || isSprint) && !emailSentRef.current) {
          emailSentRef.current = true;
          
          console.log("Sending email now to:", applicantData.email);
          
          try {
            await emailjs.send(
              import.meta.env.VITE_EMAILJS_SERVICE_ID,
              trackParam === 'builders' 
                ? import.meta.env.VITE_EMAILJS_TEMPLATE_BUILDERS 
                : import.meta.env.VITE_EMAILJS_TEMPLATE_SPRINT,
              {
                name: applicantData.name,
                email: applicantData.email,
                goal: applicantData.goal,
                sprint_group_link: SPRINT_GROUP_LINK,
                builders_group_link: BUILDERS_GROUP_LINK
              },
              import.meta.env.VITE_EMAILJS_PUBLIC_KEY
            );
            console.log("Email sent successfully");
          } catch (emailErr) {
            console.error("Email error:", emailErr);
            setEmailFailed(true);
          }
        }
      } catch (e) {
        console.error("Error in onboarding flow:", e);
      }
    };

    initOnboarding();
  }, [trackParam, isBuilders, isSprint]);

  const shareApp = () => {
    const text = `I just joined The Sprint Execution 2026. Only 50 spots available for this cohort. Secure yours here: ${window.location.origin}`;
    if (navigator.share) {
      navigator.share({
        title: 'The Sprint Execution',
        text: text,
        url: window.location.origin,
      });
    } else {
      window.open(`https://wa.me/2348120723575?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const getWhatsAppContactLink = () => {
    const applicantName = applicant?.full_name || rawName || 'Executor';
    const applicantEmail = applicant?.email || '';
    const trackName = isBuilders ? "The Builder's Track" : (isSprint ? "The Sprint" : "the program");
    
    const text = `Hi, I'm ${applicantName}.

I just filled the registration form for The Sprint Execution 2026 (Pathway: ${trackName}).

I am having some issues with payment and would like to complete my registration or make a direct transfer.

My registered email is: ${applicantEmail}

Please help me out with this.`;

    return `https://wa.me/2348120723575?text=${encodeURIComponent(text)}`;
  };

  const isDataMissing = !applicant && !trackParam;

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

        {isDataMissing ? (
          <>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight leading-[1.1]">
              Payment confirmed. You're in.
            </h1>
            <p className="text-white/60 mb-8 leading-relaxed font-normal">
              Thank you for joining The Sprint Execution 2026 – 1.0. Check your email for next steps or message us on WhatsApp at +2348120723575
            </p>
            <div className="space-y-4">
              <a 
                href="https://wa.me/2348120723575"
                className="w-full h-[52px] bg-[#25D366] text-white rounded-full flex items-center justify-center font-bold hover:scale-[1.02] transition-transform text-base shadow-lg shadow-green-500/20"
              >
                Message Us on WhatsApp →
              </a>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight leading-[1.1]">
              {isBuilders ? "Welcome to The Builder's Track!" : "Welcome to The Sprint!"}
            </h1>
            <p className="text-xl font-medium mb-4 text-white/90">
              Glad to have you, {name}!
            </p>
            <p className="text-brand-blue font-medium mb-6 text-sm bg-brand-blue/10 inline-block px-4 py-1 rounded-full">
              Your payment was received. Welcome to The Sprint Execution 2026 – 1.0.
            </p>

            {emailFailed && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                <p className="text-red-400 text-sm font-medium">
                  We could not send your confirmation email. Please message us on WhatsApp at +2348120723575 and we will sort it out.
                </p>
              </div>
            )}
            <p className="text-white/60 mb-10 leading-relaxed font-normal">
              Your commitment has been recorded. You are now part of the 50 executors for Cohort 1.0. 
              Follow the steps below to finalize your onboarding.
            </p>

            <div className="space-y-6 text-left">
              {/* WhatsApp Group Section */}
              <div className="space-y-4">
                {!isBuilders ? (
                  // The Sprint - One button
                  <a 
                    href={SPRINT_GROUP_LINK}
                    className="w-full h-[52px] bg-[#25D366] text-white rounded-full flex items-center justify-center font-bold hover:scale-[1.02] transition-transform text-base shadow-lg shadow-green-500/20"
                  >
                    Join The Sprint WhatsApp Group →
                  </a>
                ) : (
                  // The Builder's Track - Two buttons
                  <>
                    <a 
                      href={SPRINT_GROUP_LINK}
                      className="w-full h-[52px] bg-[#4f66fd] text-white rounded-full flex items-center justify-center font-bold hover:scale-[1.02] transition-transform text-base shadow-lg shadow-blue-500/20"
                    >
                      Join The Main Sprint Group →
                    </a>
                    <a 
                      href={BUILDERS_GROUP_LINK}
                      className="w-full h-[52px] border-2 border-white/20 text-white rounded-full flex items-center justify-center font-bold hover:bg-white/5 transition-all text-base"
                    >
                      Join The Builder's Track Group →
                    </a>
                  </>
                )}
                
                <p className="text-center text-[#777777] text-[13px] italic mt-4">
                  Join {isBuilders ? 'both groups' : 'the group'} before the Sprint begins. 
                  The team will reach out within 24 hours to schedule your first roadmap session.
                </p>
              </div>

              {/* Fallback Contact (Previously Step 1) */}
              <div className="mt-8 pt-8 border-t border-white/5">
                 <div className="flex items-start gap-4">
                   <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
                     <Users className="text-brand-blue" size={20} />
                   </div>
                   <div className="flex-1">
                     <h3 className="font-bold text-lg mb-1 leading-tight text-white/90">Need Help?</h3>
                     <p className="text-xs text-white/50 mb-4 font-normal">If you had issues with payment or need direct assistance.</p>
                      <a 
                        href={getWhatsAppContactLink()}
                        className="text-brand-blue hover:underline text-[13px] font-medium transition-all"
                      >
                        Reach out to the team on WhatsApp
                      </a>
                   </div>
                 </div>
              </div>

              {/* Referral Section (Previously Step 3) */}
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
          </>
        )}

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
