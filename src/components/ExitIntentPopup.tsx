import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, Loader2, MessageSquare, CheckCircle } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sendToGoogleSheets } from '../lib/sheets';

export default function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [activePopup, setActivePopup] = useState<'options' | 'builder' | null>(null);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem('exit_intent_shown');
    const hasSubmitted = localStorage.getItem('sprint_applicant');
    
    if (hasSeen || hasSubmitted) return;

    const handleDesktopTrigger = (e: MouseEvent) => {
      if (e.clientY <= 10) {
        triggerPopup();
      }
    };

    const handleMobileTrigger = () => {
      triggerPopup();
    };

    const triggerPopup = () => {
      const highlightsSection = document.getElementById('highlights');
      const pricingTop = highlightsSection?.offsetTop || 2000; // Fallback to a reasonable scroll depth
      const scrollY = window.scrollY;

      if (scrollY < pricingTop) {
        setActivePopup('options');
      } else {
        setActivePopup('builder');
      }

      setIsVisible(true);
      sessionStorage.setItem('exit_intent_shown', 'true');
    };

    window.addEventListener('mouseout', handleDesktopTrigger);
    window.addEventListener('popstate', handleMobileTrigger);
    window.history.pushState({ entry: true }, '');

    return () => {
      window.removeEventListener('mouseout', handleDesktopTrigger);
      window.removeEventListener('popstate', handleMobileTrigger);
    };
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const emailKey = email.toLowerCase();
      const partialLeadRef = doc(db, 'partial_leads', emailKey);
      await setDoc(partialLeadRef, {
        email: emailKey,
        timestamp: serverTimestamp(),
        status: 'exit_builder_track_interest',
        source: 'exit_intent_popup_2'
      }, { merge: true });

      await sendToGoogleSheets({
        email: emailKey,
        status: 'exit_builder_track_interest',
        source: 'exit_intent_popup_2',
        sheet: 'partial'
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    } catch (err) {
      console.error("Exit intent error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (id: string, selectSprint: boolean = false) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
    if (selectSprint) {
      window.dispatchEvent(new CustomEvent('select_sprint_option'));
    }
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsVisible(false)}
            className="absolute inset-0 bg-black/95 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative z-[5001] w-full max-w-[480px] bg-[#1e1e1e] border border-[#4f66fd] rounded-[16px] p-8 md:p-10 shadow-2xl overflow-hidden"
          >
            <button
              onClick={() => setIsVisible(false)}
              className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors p-2"
            >
              <X size={20} />
            </button>

            {/* POPUP 1: Above Pricing */}
            {activePopup === 'options' && (
              <div className="flex flex-col">
                <span className="text-[#4f66fd] uppercase text-[11px] font-bold tracking-[0.2em] mb-4 block">
                  WAIT — YOU MAY HAVE MISSED THIS
                </span>
                <h3 className="text-2xl md:text-[28px] font-bold text-white mb-6 leading-[1.2]">
                  You can join The Sprint<br />for whatever you have<br />right now.
                </h3>
                <div className="text-[#cccccc]/80 text-[15px] mb-8 leading-relaxed space-y-4">
                  <p>
                    There is no fixed price to join The Sprint group. Some people pay ₦2,000. Some pay ₦5,000. 
                    You decide what your commitment looks like — and that is what gets you in.
                  </p>
                  <p className="font-bold text-white">
                    Just a decision to show up for 90 days.
                  </p>
                  <p className="text-sm border-t border-white/5 pt-4">
                    And if you want more — a personal roadmap, direct access to Adebayo, and hands-on guidance 
                    building real AI-powered skills that can pay you after the Sprint — The Builder's Track 
                    at ₦12,500 is built exactly for that.
                  </p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => scrollToSection('apply', true)}
                    className="w-full bg-[#4f66fd] hover:bg-[#3d51d4] text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 transition-all"
                  >
                    Join The Sprint — Pay What You Have <ArrowRight size={18} />
                  </button>
                  <button
                    onClick={() => scrollToSection('highlights')}
                    className="w-full bg-transparent border border-white/10 hover:border-white/30 text-white font-bold py-4 rounded-full transition-all text-center"
                  >
                    Tell Me More About The Builder's Track <ArrowRight size={18} />
                  </button>
                  <a
                    href="https://wa.me/2348120723575"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-[#777777] hover:text-white text-[13px] font-medium text-center block pt-2 transition-colors"
                  >
                    Still have questions? We're one message away.
                  </a>
                </div>
              </div>
            )}

            {/* POPUP 2: At or below Pricing */}
            {activePopup === 'builder' && (
              <div className="flex flex-col">
                {isSuccess ? (
                  <div className="text-center py-10">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <CheckCircle size={32} className="text-green-500" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-2">Got it.</h3>
                    <p className="text-white/60">Adebayo will be in touch shortly.</p>
                  </div>
                ) : (
                  <>
                    <span className="text-[#4f66fd] uppercase text-[11px] font-bold tracking-[0.2em] mb-4 block">
                      LET'S FIGURE THIS OUT
                    </span>
                    <h3 className="text-2xl md:text-[26px] font-bold text-white mb-6 leading-[1.2]">
                      Interested in The Builder's Track<br />but the timing isn't right?
                    </h3>
                    <p className="text-[#cccccc]/80 text-[15px] mb-8 leading-relaxed">
                      We get it. ₦12,500 is a commitment. If you want in but need a little flexibility, reach out to us directly. We offer instalment payments for serious people — and we'll work something out with you personally.
                    </p>

                    <div className="space-y-4 mb-10">
                      <a
                        href="https://wa.me/2348120723575?text=Hi%2C%20I%27m%20interested%20in%20The%20Builder%27s%20Track%20but%20would%20like%20to%20discuss%20instalment%20payment%20options."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-[#4f66fd] hover:bg-[#3d51d4] text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/10 text-center"
                      >
                        Talk to Adebayo on WhatsApp <ArrowRight size={18} />
                      </a>
                      <button
                        onClick={() => scrollToSection('apply', true)}
                        className="w-full bg-transparent border border-white/10 hover:border-white/30 text-white font-bold py-4 rounded-full transition-all text-center"
                      >
                        Join The Sprint Instead
                      </button>
                    </div>

                    <div className="pt-8 border-t border-white/5">
                      <p className="text-[13px] text-white/30 text-center mb-6 font-medium">
                        Still not sure? Drop your email and we'll reach out personally.
                      </p>
                      <form onSubmit={handleEmailSubmit} className="flex gap-2">
                        <input
                          required
                          type="email"
                          placeholder="Your email address"
                          className="flex-1 bg-[#0f0f0f] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#4f66fd] transition-colors"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                        <button
                          disabled={isSubmitting}
                          type="submit"
                          className="bg-[#4f66fd] hover:bg-[#3d51d4] text-white font-bold px-5 py-3 rounded-lg text-sm transition-all disabled:opacity-50"
                        >
                          {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Send →"}
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
