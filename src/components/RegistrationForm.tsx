/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, Send, ExternalLink, X, Users, ArrowRight } from 'lucide-react';
import { collection, addDoc, serverTimestamp, onSnapshot, doc, runTransaction, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PAYSTACK_GROUP_LINK, PAYSTACK_TEAM_LINK, SELAR_LINK, WHATSAPP_NUMBER } from '../constants';

interface FormData {
  full_name: string;
  email: string;
  whatsapp: string;
  state: string;
  country: string;
  goal: string;
  support_level: 'group_only' | 'group_plus_support';
  referral_source: string;
}

export default function RegistrationForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    whatsapp: '',
    state: '',
    country: '',
    goal: '',
    support_level: 'group_only',
    referral_source: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [showClarityPopup, setShowClarityPopup] = useState(false);
  const [hasSeenClarity, setHasSeenClarity] = useState(false);
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);
  const [participantCount, setParticipantCount] = useState<number | null>(null);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'global_stats', 'registration_count'), (doc) => {
      if (doc.exists()) {
        setParticipantCount(doc.data().count);
      } else {
        setParticipantCount(0);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSupportSelect = (level: 'group_only' | 'group_plus_support') => {
    setFormData(prev => ({ ...prev, support_level: level }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const firstName = formData.full_name.trim().split(' ')[0] || 'Executor';

    try {
      // If choosing group_only, show upsell first
      if (formData.support_level === 'group_only' && !showUpsellModal && !showModal) {
        setShowUpsellModal(true);
        setIsLoading(false);
        return;
      }

      const leadData = {
        ...formData,
        created_at: serverTimestamp(),
      };

      // Atomic batch: Create lead, increment global counter, and add to public feed
      await runTransaction(db, async (transaction) => {
        // 1. READ FIRST: Get the counter state
        const counterRef = doc(db, 'global_stats', 'registration_count');
        const counterSnap = await transaction.get(counterRef);

        // 2. Add the lead (Write)
        const leadRef = doc(collection(db, 'sprint_leads'));
        transaction.set(leadRef, leadData);

        // 3. Add to public feed (Sanitized Write)
        const feedRef = doc(collection(db, 'public_feed'));
        transaction.set(feedRef, {
          name: firstName,
          state: formData.state,
          country: formData.country,
          tier: formData.support_level === 'group_plus_support' ? 'Group + Team Support' : 'Sprint Group Access',
          created_at: serverTimestamp()
        });

        // 4. Update the public counter (Write)
        if (!counterSnap.exists()) {
          transaction.set(counterRef, { count: 1 });
        } else {
          transaction.update(counterRef, { count: increment(1) });
        }
      });

      // 5. Optional: Sync to Google Sheet if Webhook URL is provided
      const sheetUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
      if (sheetUrl) {
        try {
          await fetch(sheetUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          });
        } catch (sheetErr) {
          console.warn("Google Sheet sync failed (non-critical):", sheetErr);
        }
      }

      setSubmittedData(formData);
      setShowModal(true);
    } catch (err: any) {
      console.error("Error saving lead:", err);
      // Display the raw error message for debugging
      const errorMessage = err.message || "An unknown error occurred";
      const errorDetails = err.code || "";
      setError(`Submission failed: ${errorMessage} ${errorDetails}. Please ensure your internet is stable.`);
    } finally {
      setIsLoading(false);
    }
  };

  const getWhatsAppLink = () => {
    if (!submittedData) return '';
    const text = `Hi, I'm ${submittedData.full_name}. I just completed my commitment fee for The Sprint Execution 2026 – 1.0. My goal for the 90 days is: ${submittedData.goal}. My email is ${submittedData.email}. Please add me to the Sprint group.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  };

  return (
    <section id="apply" className="py-20 px-6 relative subtle-grid overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 right-10 w-24 h-24 border-r-2 border-t-2 border-brand-blue/20 rotate-12 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-32 h-32 border-l-2 border-b-2 border-brand-blue/20 -rotate-12 pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center mb-16">
        <span className="text-brand-blue text-xs font-bold tracking-[0.3em] uppercase block mb-4">
          Apply Now
        </span>
        <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
          Secure your spot before it's gone.
        </h2>
        <div className="flex flex-col items-center gap-2">
          {participantCount !== null && (
            <div className="flex items-center gap-2 text-brand-blue font-bold text-sm mb-2">
              <Users size={16} />
              <span>{participantCount} / 50 Applicants already in queue</span>
            </div>
          )}
          <p className="text-white/60">50 spots only. Limited capacity remaining.</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-[680px] mx-auto bg-brand-dark-lighter border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Full Name</label>
            <input
              required
              type="text"
              name="full_name"
              placeholder="e.g. John Doe"
              className="input-field"
              value={formData.full_name}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Email Address</label>
            <input
              required
              type="email"
              name="email"
              placeholder="e.g. john@example.com"
              className="input-field"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">WhatsApp Number (with country code)</label>
            <input
              required
              type="tel"
              name="whatsapp"
              placeholder="+234 800 000 0000"
              className="input-field"
              value={formData.whatsapp}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">State / Province</label>
              <input
                required
                type="text"
                name="state"
                placeholder="e.g. Lagos"
                className="input-field"
                value={formData.state}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Country</label>
              <input
                required
                type="text"
                name="country"
                placeholder="e.g. Nigeria"
                className="input-field"
                value={formData.country}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">What do you want to get done in 90 days?</label>
            <textarea
              required
              name="goal"
              rows={4}
              placeholder="Be specific. What skill, project, habit, or goal are you committing to?"
              className="input-field resize-none"
              value={formData.goal}
              onChange={handleChange}
              onFocus={() => {
                if (!hasSeenClarity) {
                  setShowClarityPopup(true);
                  setHasSeenClarity(true);
                }
              }}
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium text-white/60">Support Level</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleSupportSelect('group_only')}
                className={`p-6 rounded-2xl border text-left transition-all w-full flex flex-col ${
                  formData.support_level === 'group_only'
                    ? 'border-brand-blue bg-brand-blue/5'
                    : 'border-white/5 hover:border-white/20'
                }`}
              >
                <div className="font-bold mb-2">Sprint Group Access</div>
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  <ul className="text-[11px] text-white/50 leading-relaxed space-y-1 list-disc pl-3">
                    <li>Daily accountability & check-ins</li>
                    <li>Full group environment</li>
                    <li>Weekly live check-ins w/ Adebayo</li>
                    <li>Career Pathway Prompt Stack</li>
                  </ul>
                  <div className="pt-2 border-t border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-brand-blue font-bold">Included Bonus:</p>
                    <p className="text-[10px] text-white/50 font-medium italic">Intro to building with AI</p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleSupportSelect('group_plus_support')}
                className={`p-6 rounded-2xl border text-left transition-all w-full flex flex-col ${
                  formData.support_level === 'group_plus_support'
                    ? 'border-brand-blue bg-brand-blue/5'
                    : 'border-white/5 hover:border-white/20'
                }`}
              >
                <div className="font-bold mb-2">Group + Team Support</div>
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  <ul className="text-[11px] text-white/50 leading-relaxed space-y-1 list-disc pl-3">
                    <li>Everything in Group Access</li>
                    <li>Personalized roadmap</li>
                    <li>Dedicated 1-on-1 meeting (Limited)</li>
                    <li>Access to paid frameworks</li>
                    <li>Access to paid templates</li>
                    <li>How to build apps, websites professionally with AI.</li>
                  </ul>
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Samples of what you'll build:</p>
                    <div className="flex flex-col gap-1.5">
                      <a 
                        href="https://adebayokareem.vercel.app/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-brand-blue hover:underline font-semibold text-[10px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        The Hub Portfolio <ExternalLink size={10} />
                      </a>
                      <a 
                        href="https://lagos-midnight-259803017967.us-west1.run.app" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-brand-blue hover:underline font-semibold text-[10px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Lagos Midnight App <ExternalLink size={10} />
                      </a>
                      <a 
                        href="https://elgantme.lovable.app" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-brand-blue hover:underline font-semibold text-[10px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        ElegantMe Boutique <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">How did you hear about The Sprint Execution? (Optional)</label>
            <input
              type="text"
              name="referral_source"
              placeholder="e.g. Twitter, Instagram, Referral"
              className="input-field"
              value={formData.referral_source}
              onChange={handleChange}
            />
          </div>

          <div className="pt-6 border-t border-white/5">
            <p className="text-[11px] text-white/40 mb-6 text-center">
              After submitting, you'll be directed to complete your commitment fee via Paystack (Nigeria) or Selar (international). Your spot is confirmed only after payment.
            </p>
            <button
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <>Apply and Commit <Send className="w-4 h-4" /></>
              )}
            </button>
            {error && <p className="text-red-500 text-xs mt-4 text-center">{error}</p>}
          </div>
        </form>
      </motion.div>

      {/* Modal Backdrop */}
      <AnimatePresence>
        {showClarityPopup && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setShowClarityPopup(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative z-10 w-full max-w-lg bg-brand-dark-card border border-brand-blue/30 rounded-3xl p-8 md:p-10 shadow-3xl text-left"
            >
              <button 
                onClick={() => setShowClarityPopup(false)}
                className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                  <Check className="w-4 h-4 text-brand-blue" />
                </div>
                <span className="text-brand-blue text-[10px] font-bold tracking-[0.3em] uppercase">Clarity is King</span>
              </div>
              
              <h3 className="text-2xl font-bold mb-4">{formData.full_name.trim().split(' ')[0] || 'Executor'}, a Quick Note on Your Goal</h3>
              
              <div className="space-y-4 text-white/70 text-sm leading-relaxed mb-8">
                <p>
                  Execution thrives on specificity. Instead of just "learning," think about what you want to <span className="text-white font-semibold">ship</span> or <span className="text-white font-semibold text-brand-blue underline decoration-brand-blue/30 underline-offset-4">become</span> by the end of these 90 days.
                </p>
                <p>
                  But here's a secret: <span className="text-white">Most people aren't 100% clear when they start, and that’s perfectly fine.</span>
                </p>
                <p>
                  Secure your spot with your current idea before we hit our 50-person limit. If you wait for the perfect wording, your spot might be gone by the time you're back.
                </p>
                <div className="bg-brand-blue/5 border border-brand-blue/10 p-5 rounded-xl space-y-3">
                  <p className="font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand-blue rounded-full" />
                    The Clarity Advantage
                  </p>
                  <p className="text-xs leading-relaxed">
                    Once you're in, you'll unlock Adebayo’s custom <span className="text-brand-blue font-bold">AI Roadmap Prompt</span>—a tool specifically designed to sit with you and distill your confusion into a sharp, actionable roadmap.
                  </p>
                  <p className="text-[10px] text-white/30 italic">
                    Note: Helping you find this deep clarity is a core reason many choose to <span className="text-white/60 hover:text-brand-blue cursor-pointer transition-colors" onClick={() => { setShowClarityPopup(false); handleSupportSelect('group_plus_support'); }}>upgrade to Team Support</span>.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowClarityPopup(false)}
                  className="btn-primary w-full py-4 text-center"
                >
                  Got it, I'll define my goal
                </button>
                <div className="flex justify-center">
                  <button 
                    onClick={() => {
                      setShowClarityPopup(false);
                      // In a real app, this would open the video modal or scroll to a video section
                      window.open('https://adebayokareem.vercel.app/', '_blank'); 
                    }}
                    className="text-[10px] text-white/40 hover:text-brand-blue transition-colors flex items-center gap-1.5"
                  >
                    Watch the "Clarity for Sprint" video <ExternalLink size={10} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showUpsellModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-xl bg-brand-dark-card border border-brand-blue/30 rounded-3xl p-8 md:p-12 shadow-3xl overflow-hidden"
            >
              <button 
                onClick={() => setShowUpsellModal(false)}
                className="absolute top-6 right-6 z-20 text-white/20 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/10 blur-3xl rounded-full -mr-16 -mt-16" />
              
              <div className="relative">
                <span className="text-brand-blue text-[10px] font-bold tracking-[0.3em] uppercase block mb-4">A Quick Thought</span>
                <h3 className="text-2xl md:text-3xl font-bold mb-6 leading-tight">Wait, {formData.full_name.trim().split(' ')[0] || 'Executor'}. Before you proceed...</h3>
                <div className="space-y-4 text-white/70 text-sm md:text-base leading-relaxed mb-10">
                  <p>
                    We’ve seen that those who choose the <span className="text-white font-bold">Group + Team Support</span> pathway tend to find their rhythm and hit their goals about 3x faster.
                  </p>
                  <p>
                    The standard group energy is life-changing, but it doesn't give you the <span className="text-white font-bold">Personalized Roadmap</span>, the <span className="text-white font-bold">1-on-1 Guidance</span>, or the <span className="text-white font-bold">AI Build Tutorials</span> needed to create high-level professional systems.
                  </p>
                  <p>
                    If you feel you might need that extra hands-on support to ensure your hard work translates into a real skill shift, the upgrade ensures you have a Lead Executor walking right beside you.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, support_level: 'group_plus_support' }));
                      setShowUpsellModal(false);
                      // Trigger submit again with new data
                      setTimeout(() => {
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                        handleSubmit(fakeEvent);
                      }, 100);
                    }}
                    className="w-full btn-primary py-5 md:text-lg"
                  >
                    Upgrade to Team Support
                  </button>
                  <button
                    onClick={() => {
                      setShowUpsellModal(false);
                      // Trigger submit with original data
                      setTimeout(() => {
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                        handleSubmit(fakeEvent);
                      }, 100);
                    }}
                    className="w-full text-white/40 text-xs hover:text-white transition-colors py-2 font-medium"
                  >
                    No, I'll stick with Basic Group Access
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-md bg-brand-dark-card border-t-4 border-brand-blue rounded-3xl p-8 md:p-10 shadow-3xl text-center"
            >
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>

              <h3 className="text-2xl font-bold mb-4">You're in, {formData.full_name.trim().split(' ')[0]} — almost.</h3>
              <p className="text-white/70 mb-8 text-sm leading-relaxed">
                Your application has been saved. The final step is your commitment fee — this is what locks in your spot and confirms your place in the Sprint.
              </p>

              <div className="space-y-3">
                <a
                  href={formData.support_level === 'group_plus_support' ? PAYSTACK_TEAM_LINK : PAYSTACK_GROUP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full btn-primary inline-flex items-center justify-center gap-2"
                >
                  Pay via Paystack <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href={SELAR_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-transparent border border-brand-blue text-white font-bold py-4 px-8 rounded-full transition-all inline-flex items-center justify-center gap-2 hover:bg-brand-blue/10"
                >
                  Pay via Selar (International) <ExternalLink className="w-4 h-4" />
                </a>
                
                <div className="h-px bg-white/10 my-4" />
                
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-full transition-all inline-flex items-center justify-center gap-2"
                >
                  I've Paid — Send Us a WhatsApp Message <Check className="w-4 h-4" />
                </a>
              </div>

              <p className="mt-8 text-[11px] text-white/40">
                After payment, you'll receive a WhatsApp message with your group invite link within 24 hours. Your payment is your confirmation.
              </p>

              <button
                onClick={() => setShowModal(false)}
                className="mt-6 text-[10px] text-white/30 hover:text-white transition-colors underline underline-offset-4"
              >
                Go back to edit my details or change plan
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
