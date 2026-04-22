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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const hasSeen = sessionStorage.getItem('exit_popup_shown');
    const hasSubmitted = sessionStorage.getItem('form_submitted') || localStorage.getItem('sprint_applicant');
    
    if (hasSeen || hasSubmitted) return;

    let initDelayPassed = false;
    const delayTimeout = setTimeout(() => {
      initDelayPassed = true;
    }, 10000);

    const triggerPopup = () => {
      if (!initDelayPassed) return;
      if (sessionStorage.getItem('exit_popup_shown')) return;

      const highlightsSection = document.getElementById('highlights');
      const pricingTop = highlightsSection?.offsetTop || 2000;
      const scrollY = window.scrollY;

      if (scrollY < pricingTop) {
        setActivePopup('options');
      } else {
        setActivePopup('builder');
      }

      setIsVisible(true);
      sessionStorage.setItem('exit_popup_shown', 'true');
      
      // Cleanup
      window.removeEventListener('mouseout', handleDesktopTrigger);
      window.removeEventListener('scroll', handleMobileScroll);
      clearTimeout(mobileAutoTimeout);
    };

    // DESKTOP: mouseout
    const handleDesktopTrigger = (e: MouseEvent) => {
      if (window.innerWidth >= 768 && e.clientY <= 10) {
        triggerPopup();
      }
    };

    // MOBILE 1: 30s Timeout
    const mobileAutoTimeout = setTimeout(() => {
      if (window.innerWidth < 768) {
        triggerPopup();
      }
    }, 30000);

    // MOBILE 2: Scroll-up Detection (> 80px)
    let lastScrollY = window.scrollY;
    const handleMobileScroll = () => {
      if (window.innerWidth >= 768) return;
      
      const currentScrollY = window.scrollY;
      const scrollDiff = lastScrollY - currentScrollY; // Positive means scrolled up

      if (scrollDiff > 80) {
        triggerPopup();
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('mouseout', handleDesktopTrigger);
    window.addEventListener('scroll', handleMobileScroll, { passive: true });

    return () => {
      clearTimeout(delayTimeout);
      clearTimeout(mobileAutoTimeout);
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('mouseout', handleDesktopTrigger);
      window.removeEventListener('scroll', handleMobileScroll);
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
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsVisible(false)}
            className="fixed inset-0 z-[9998] bg-black/90 backdrop-blur-sm"
          />

          {/* Popup Container */}
          <div className={`fixed inset-0 z-[9999] pointer-events-none flex ${isMobile ? 'items-end' : 'items-center justify-center p-6'}`}>
            <motion.div
              initial={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
              animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
              exit={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={`
                pointer-events-auto relative w-full bg-[#1e1e1e] shadow-2xl
                ${isMobile 
                  ? 'rounded-t-[20px] border-t border-[#4f66fd] p-6 pb-10 max-h-[85vh] overflow-y-auto' 
                  : 'max-w-[480px] rounded-[16px] border border-[#4f66fd] p-10 overflow-hidden'
                }
              `}
            >
              {/* Mobile Drag Handle */}
              {isMobile && (
                <div className="w-10 h-1 bg-[#444444] rounded-full mx-auto mb-6" />
              )}
              
              {/* Close Button - 44px touch target on mobile */}
              <button
                onClick={() => setIsVisible(false)}
                className={`absolute top-4 right-4 text-white/40 hover:text-white transition-colors flex items-center justify-center ${isMobile ? 'w-11 h-11' : 'w-8 h-8'}`}
                aria-label="Close"
              >
                <X size={24} />
              </button>

              {/* POPUP 1: Above Pricing */}
              {activePopup === 'options' && (
                <div className="flex flex-col">
                  <span className="text-[#4f66fd] uppercase text-[11px] font-bold tracking-[0.2em] mb-4 block leading-none">
                    WAIT — YOU MAY HAVE MISSED THIS
                  </span>
                  <h3 className="text-2xl md:text-[28px] font-bold text-white mb-6 leading-[1.2]">
                    You can join The Sprint<br className="hidden md:block" /> for whatever you have<br className="hidden md:block" /> right now.
                  </h3>
                  <div className="text-[#cccccc]/80 text-[15px] mb-8 leading-relaxed space-y-4">
                    <p>
                      There is no fixed price to join The Sprint group. Some people pay ₦1,000. Some pay ₦5,000. 
                      You decide — and that gets you in.
                    </p>
                    <p className="border-t border-white/5 pt-4">
                      Want more? The Builder's Track at ₦12,500 gives you a personal roadmap, direct access 
                      to Adebayo, and hands-on guidance building real AI-powered skills that can pay you 
                      after the Sprint.
                    </p>
                    <p className="text-sm italic">
                      Can't pay ₦12,500 at once? We may consider instalment payments for people who are 
                      genuinely committed. Reach out and let's talk.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={() => scrollToSection('apply', true)}
                      className={`w-full bg-[#4f66fd] hover:bg-[#3d51d4] text-white font-bold rounded-full flex items-center justify-center gap-2 transition-all ${isMobile ? 'h-[56px] text-[16px]' : 'py-4'}`}
                    >
                      Join The Sprint — Pay What You Have <ArrowRight size={18} />
                    </button>
                    <button
                      onClick={() => scrollToSection('highlights')}
                      className={`w-full bg-transparent border border-white/10 hover:border-white/30 text-white font-bold rounded-full transition-all text-center flex items-center justify-center gap-2 ${isMobile ? 'h-[52px] text-[16px]' : 'py-4'}`}
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
                      <span className="text-[#4f66fd] uppercase text-[11px] font-bold tracking-[0.2em] mb-4 block leading-none">
                        LET'S FIGURE THIS OUT
                      </span>
                      <h3 className="text-2xl md:text-[26px] font-bold text-white mb-6 leading-[1.2]">
                        Interested in The Builder's Track<br className="hidden md:block" /> but the timing isn't right?
                      </h3>
                      <div className="text-[#cccccc]/80 text-[15px] mb-8 leading-relaxed space-y-4">
                        <p>₦12,500 is a commitment — we understand.</p>
                        <p>
                          If you want in but need flexibility, reach out directly. We may consider instalment payments 
                          for people who are genuinely serious.
                        </p>
                        <p>
                          Not ready for The Builder's Track at all? You can still join The Sprint group and 
                          pay what you genuinely have — ₦2,000, ₦5,000, ₦10,000. Whatever reflects your 
                          commitment right now.
                        </p>
                        <p className="font-bold text-white italic">
                          Either way, there is a place for you here.
                        </p>
                      </div>

                      <div className="space-y-4 mb-10">
                        <a
                          href="https://wa.me/2348120723575?text=Hi%2C%20I%27m%20interested%20in%20The%20Builder%27s%20Track%20but%20would%20like%20to%20discuss%20instalment%20payment%20options."
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full bg-[#4f66fd] hover:bg-[#3d51d4] text-white font-bold rounded-full flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/10 text-center ${isMobile ? 'h-[56px] text-[16px]' : 'py-4'}`}
                        >
                          Talk to Adebayo on WhatsApp <ArrowRight size={18} />
                        </a>
                        <button
                          onClick={() => scrollToSection('apply', true)}
                          className={`w-full bg-transparent border border-white/10 hover:border-white/30 text-white font-bold rounded-full transition-all text-center flex items-center justify-center gap-2 ${isMobile ? 'h-[52px] text-[16px]' : 'py-4'}`}
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
                            className="bg-[#4f66fd] hover:bg-[#3d51d4] text-white font-bold px-5 py-3 rounded-lg text-sm transition-all disabled:opacity-50 min-w-[80px]"
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
        </>
      )}
    </AnimatePresence>
  );
}
