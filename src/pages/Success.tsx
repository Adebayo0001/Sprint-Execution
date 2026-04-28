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
import { doc, getDoc, updateDoc, collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
    console.log("Step 1: Success page mounted. URL Params:", { trackParam, emailParam, rawName });
    
    // Log environment variables
    console.log("Environment Variables Check:");
    console.log("VITE_EMAILJS_PUBLIC_KEY:", import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
    console.log("VITE_EMAILJS_SERVICE_ID:", import.meta.env.VITE_EMAILJS_SERVICE_ID);
    console.log("VITE_EMAILJS_TEMPLATE_SPRINT:", import.meta.env.VITE_EMAILJS_TEMPLATE_SPRINT);
    console.log("VITE_EMAILJS_TEMPLATE_BUILDERS:", import.meta.env.VITE_EMAILJS_TEMPLATE_BUILDERS);

    const initOnboarding = async () => {
      console.log("Step 2: Track from URL =", trackParam);
      const rawApplicant = localStorage.getItem('sprint_applicant');
      let email = emailParam || '';
      let parsedApplicant = null;

      if (rawApplicant) {
        try {
          parsedApplicant = JSON.parse(rawApplicant);
          if (!email) email = parsedApplicant.email;
          setApplicant(parsedApplicant);
          console.log("LocalStorage applicant data found:", parsedApplicant);
        } catch (e) {
          console.error("Error parsing applicant data:", e);
        }
      } else {
        console.log("LocalStorage applicant data NOT found");
      }

      // Only send email if we have a track parameter (indicating a redirect from payment)
      // and we haven't sent it in this session component lifecycle
      if ((isBuilders || isSprint) && !emailSentRef.current) {
        emailSentRef.current = true;
        
        try {
          // 1. Primary path: find by specific email (URL or LocalStorage)
          if (email) {
            const emailLower = email.toLowerCase();
            console.log("Step 3: Checking Firebase for pending payment for email:", emailLower);
            const pendingRef = doc(db, 'pending_payments', emailLower);

            // TESTING BYPASS: for specific email, always reset sent status before checking
            if (emailLower === 'kareemadebayo2022@gmail.com') {
              console.log("Testing bypass detected: Resetting email_sent to false for test account.");
              await updateDoc(pendingRef, { email_sent: false }).catch(() => {
                console.log("Record might not exist yet, skipping reset.");
              });
            }

            const pendingSnap = await getDoc(pendingRef);

            if (pendingSnap.exists()) {
              const data = pendingSnap.data();
              console.log("Step 4: Pending payment record found via email lookup");
              
              if (!data.email_sent) {
                await triggerEmail(data, pendingRef);
              } else {
                console.log("Skipping: email_sent already true in Firebase for " + emailLower);
              }
              return;
            } else {
              console.log("Step 4: No pending payment record found (Skipping: no record in collection)");
            }
          } else {
            console.log("Skipping: No email found in URL or LocalStorage to lookup.");
          }

          // 2. Secondary path: Super fallback - look for any recent unsent payment
          // This handles cases where localStorage is gone AND email is missing from URL
          console.log("Step 5: Attempting super fallback - looking for recent unsent payments");
          const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
          const q = query(
            collection(db, 'pending_payments'),
            where('email_sent', '==', false),
            limit(20)
          );
          
          const recentSnap = await getDocs(q);
          if (!recentSnap.empty) {
            // Filter and sort in JS to avoid composite index requirement
            const recentDocs = recentSnap.docs
              .map(d => ({ id: d.id, ref: d.ref, ...d.data() } as any))
              .filter(d => d.created_at?.toMillis() >= fifteenMinsAgo)
              .sort((a, b) => b.created_at?.toMillis() - a.created_at?.toMillis());

            if (recentDocs.length > 0) {
              const data = recentDocs[0];
              console.log("Step 5b: Found a recent unsent payment for:", data.email);
              setApplicant({ full_name: data.name, email: data.email, goal: data.goal });
              await triggerEmail(data, data.ref);
              return;
            } else {
              console.log("Skipping: Found unsent docs but none within the last 15 mins.");
            }
          } else {
            console.log("Skipping: No unsent payments found at all in Firebase.");
          }

          // 3. Last resort: just use whatever we have in memory if we have something
          if (parsedApplicant) {
            console.log("Step 6 (Last Resort): Sending email using only localStorage data (no DB tracking)");
            const track = isBuilders ? 'builders' : 'sprint';
            await sendConfirmationEmail(parsedApplicant, track);
            console.log("Step 7: Email sent via last resort path");
          } else {
            console.log("Step 6: Total failure - no identity found via email, recent payments, or localStorage.");
          }
        } catch (err) {
          console.error("Step 8: Email logic failed =", err);
          setEmailFailed(true);
        }
      } else {
        const reason = !isBuilders && !isSprint ? "No track parameter in URL" : "emailSentRef already true";
        console.log(`Skipping email logic because: ${reason}`);
      }
    };

    const triggerEmail = async (data: any, docRef: any) => {
      const trackToUse = data.track || (isBuilders ? 'builders' : 'sprint');
      const applicantObj = {
        full_name: data.name,
        email: data.email,
        goal: data.goal
      } as any;
      
      console.log("Step 6: Attempting to send email to", data.email);
      console.log("Full applicant object being passed to EmailJS:", applicantObj);
      
      const result = await sendConfirmationEmail(applicantObj, trackToUse);
      console.log("Step 7: EmailJS response =", result);

      // Mark as sent in Firebase
      await updateDoc(docRef, { email_sent: true });
      console.log("Step 8: Email sent successfully and updated in Firebase");
    };

    initOnboarding();
  }, [trackParam, emailParam, isBuilders, isSprint, rawName]);

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
