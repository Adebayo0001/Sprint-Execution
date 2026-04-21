/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Loader2, Send, ExternalLink } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PAYSTACK_LINK, SELAR_LINK, WHATSAPP_NUMBER } from '../constants';

interface FormData {
  full_name: string;
  email: string;
  whatsapp: string;
  goal: string;
  support_level: 'group_only' | 'group_plus_support';
  referral_source: string;
}

export default function RegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    whatsapp: '',
    goal: '',
    support_level: 'group_only',
    referral_source: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);

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

    try {
      // If choosing group_only, show upsell first
      if (formData.support_level === 'group_only' && !showUpsellModal && !showModal) {
        setShowUpsellModal(true);
        setIsLoading(false);
        return;
      }

      const docRef = await addDoc(collection(db, 'sprint_leads'), {
        ...formData,
        created_at: serverTimestamp(),
      });

      if (docRef.id) {
        setSubmittedData(formData);
        setShowModal(true);
      }
    } catch (err) {
      console.error("Error saving lead:", err);
      setError("Something went wrong. Please try again.");
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
        <p className="text-white/60">50 spots. First come, first committed.</p>
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
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/10 blur-3xl rounded-full -mr-16 -mt-16" />
              
              <div className="relative">
                <span className="text-brand-blue text-[10px] font-bold tracking-[0.3em] uppercase block mb-4">A Quick Thought</span>
                <h3 className="text-2xl md:text-3xl font-bold mb-6 leading-tight">Wait, John. Before you proceed...</h3>
                <div className="space-y-4 text-white/70 text-sm md:text-base leading-relaxed mb-10">
                  <p>
                    We’ve noticed that people on the <span className="text-white font-bold">Group + Team Support</span> tier often hit their goals 3x faster.
                  </p>
                  <p>
                    While the group energy is incredible, the standard tier doesn’t include the <span className="text-white font-bold">Personalized Roadmap</span>, the <span className="text-white font-bold">Dedicated 1-on-1 Meeting</span>, or the <span className="text-white font-bold">AI Build Tutorials</span> that show you how to build professional-grade systems from scratch.
                  </p>
                  <p>
                    If your goal is to finish this sprint with a skill that generates real value, the upgrade ensures you aren't just working hard, but working <span className="italic">effectively</span>.
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
              <h3 className="text-2xl font-bold mb-4">You're in — almost.</h3>
              <p className="text-white/70 mb-8 text-sm leading-relaxed">
                Your application has been saved. The final step is your commitment fee — this is what locks in your spot and confirms your place in the Sprint.
              </p>

              <div className="space-y-3">
                <a
                  href={PAYSTACK_LINK}
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
