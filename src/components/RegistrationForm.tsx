/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, Send, ExternalLink, X, Users, ArrowRight } from 'lucide-react';
import { collection, serverTimestamp, onSnapshot, doc, runTransaction, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PAYSTACK_GROUP_LINK, PAYSTACK_TEAM_LINK, SELAR_LINK, WHATSAPP_NUMBER, WHATSAPP_CONTACT_LINK } from '../constants';

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
      if (formData.support_level === 'group_only' && !showUpsellModal && !showModal) {
        setShowUpsellModal(true);
        setIsLoading(false);
        return;
      }

      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, 'global_stats', 'registration_count');
        const counterSnap = await transaction.get(counterRef);

        const leadRef = doc(collection(db, 'sprint_leads'));
        transaction.set(leadRef, {
          ...formData,
          support_level_label: formData.support_level === 'group_plus_support' ? "The Builder's Track" : "The Sprint",
          created_at: serverTimestamp(),
        });

        const feedRef = doc(collection(db, 'public_feed'));
        transaction.set(feedRef, {
          name: firstName,
          state: formData.state,
          country: formData.country,
          tier: formData.support_level === 'group_plus_support' ? "The Builder's Track" : "The Sprint",
          created_at: serverTimestamp()
        });

        if (!counterSnap.exists()) {
          transaction.set(counterRef, { count: 1 });
        } else {
          transaction.update(counterRef, { count: increment(1) });
        }
      });

      const sheetUrl = import.meta.env.VITE_SHEETS_WEBHOOK_URL;
      if (sheetUrl) {
        try {
          await fetch(sheetUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              full_name: formData.full_name,
              email: formData.email,
              whatsapp: formData.whatsapp,
              goal: formData.goal,
              support_level: formData.support_level === 'group_plus_support' ? "The Builder's Track" : "The Sprint",
              referred_by: formData.referral_source
            }),
          });
        } catch (sheetErr) {
          console.warn("Google Sheet sync failed (non-critical):", sheetErr);
        }
      }

      setSubmittedData(formData);
      localStorage.setItem('sprint_applicant', JSON.stringify(formData));
      setShowModal(true);
    } catch (err: any) {
      console.error("Error saving lead:", err);
      setError(`Submission failed: ${err.message || "An unknown error occurred"}. Please check your internet connection.`);
    } finally {
      setIsLoading(false);
    }
  };

  const getWhatsAppLink = () => {
    if (!submittedData) return '';
    const text = `Hi, I'm ${submittedData.full_name}. I just completed my commitment fee for The Sprint Execution 2026 – 1.0 (Pathway: ${submittedData.support_level === 'group_plus_support' ? "The Builder's Track" : "The Sprint"}). My goal for the 90 days is: ${submittedData.goal}. My email is ${submittedData.email}. Please add me to the Sprint group.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="w-full bg-[#1c1c1c] border border-brand-blue/20 rounded-[2rem] p-6 md:p-12 shadow-3xl">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <div>
            <label className="text-[14px] font-medium text-white/60 mb-2 block">Full Name</label>
            <input
              required
              type="text"
              name="full_name"
              placeholder="e.g. John Doe"
              className="w-full bg-brand-dark border border-white/10 rounded-lg p-5 text-white focus:outline-none focus:border-brand-blue transition-colors text-base"
              value={formData.full_name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-[14px] font-medium text-white/60 mb-2 block">Email Address</label>
            <input
              required
              type="email"
              name="email"
              placeholder="e.g. john@example.com"
              className="w-full bg-brand-dark border border-white/10 rounded-lg p-5 text-white focus:outline-none focus:border-brand-blue transition-colors text-base"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-[14px] font-medium text-white/60 mb-2 block">WhatsApp Number</label>
            <input
              required
              type="tel"
              name="whatsapp"
              placeholder="+234 800 000 0000"
              className="w-full bg-brand-dark border border-white/10 rounded-lg p-5 text-white focus:outline-none focus:border-brand-blue transition-colors text-base"
              value={formData.whatsapp}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[14px] font-medium text-white/60 mb-2 block">State</label>
              <input
                required
                type="text"
                name="state"
                placeholder="e.g. Lagos"
                className="w-full bg-brand-dark border border-white/10 rounded-lg p-5 text-white focus:outline-none focus:border-brand-blue transition-colors text-base"
                value={formData.state}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="text-[14px] font-medium text-white/60 mb-2 block">Country</label>
              <input
                required
                type="text"
                name="country"
                placeholder="e.g. Nigeria"
                className="w-full bg-brand-dark border border-white/10 rounded-lg p-5 text-white focus:outline-none focus:border-brand-blue transition-colors text-base"
                value={formData.country}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="text-[14px] font-medium text-white/60 mb-2 block">What do you want to get done in 90 days?</label>
            <textarea
              required
              name="goal"
              rows={4}
              placeholder="Be specific. What skill, project, habit, or goal are you committing to?"
              className="w-full bg-brand-dark border border-white/10 rounded-lg p-5 text-white focus:outline-none focus:border-brand-blue transition-colors text-base resize-none"
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
            <label className="text-[14px] font-medium text-white/60 mb-2 block">Choose Your Pathway</label>
            <div className="grid grid-cols-1 gap-4">
              <button
                type="button"
                onClick={() => handleSupportSelect('group_only')}
                className={`p-6 rounded-xl border text-left transition-all flex flex-col group ${
                  formData.support_level === 'group_only'
                    ? 'border-brand-blue bg-brand-blue/10'
                    : 'border-white/5 bg-[#161616] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-lg">The Sprint — Group Access</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.support_level === 'group_only' ? 'border-brand-blue' : 'border-white/20'}`}>
                    {formData.support_level === 'group_only' && <div className="w-2.5 h-2.5 bg-brand-blue rounded-full" />}
                  </div>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">Accountability, group environment, and daily standard.</p>
              </button>

              <button
                type="button"
                onClick={() => handleSupportSelect('group_plus_support')}
                className={`p-6 rounded-xl border text-left transition-all flex flex-col group ${
                  formData.support_level === 'group_plus_support'
                    ? 'border-brand-blue bg-brand-blue/10'
                    : 'border-white/5 bg-[#161616] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-lg">The Builder's Track — Direct Team Involvement</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.support_level === 'group_plus_support' ? 'border-brand-blue' : 'border-white/20'}`}>
                    {formData.support_level === 'group_plus_support' && <div className="w-2.5 h-2.5 bg-brand-blue rounded-full" />}
                  </div>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">Personal roadmap, learning plan, and direct team involvement.</p>
              </button>
            </div>
            <p className="text-[11px] text-white/30 text-center">You can discuss your choice with the team after applying. Nothing is locked in until payment.</p>
          </div>

          <div>
            <label className="text-[14px] font-medium text-white/60 mb-2 block">Referral (Optional)</label>
            <input
              type="text"
              name="referral_source"
              placeholder="Who referred you?"
              className="w-full bg-brand-dark border border-white/10 rounded-lg p-5 text-white focus:outline-none focus:border-brand-blue transition-colors text-base"
              value={formData.referral_source}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="pt-6">
          <button
            disabled={isLoading}
            className="w-full btn-editorial-pill shimmer-effect text-lg"
          >
            {isLoading ? <Loader2 className="animate-spin w-6 h-6 mx-auto" /> : "Apply and Commit →"}
          </button>
          {error && <p className="text-red-500 text-xs mt-4 text-center">{error}</p>}
        </div>
      </form>

      {/* Modals and Popups */}
      <AnimatePresence>
        {showClarityPopup && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowClarityPopup(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 w-full max-w-lg bg-brand-dark-card border border-brand-blue/30 rounded-3xl p-8 md:p-12 shadow-3xl">
              <button onClick={() => setShowClarityPopup(false)} className="absolute top-8 right-8 text-white/20 hover:text-white"><X size={20} /></button>
              <span className="editorial-label !mb-4">Clarity is King</span>
              <h3 className="text-[28px] font-bold text-white mb-6 leading-tight">{formData.full_name.trim().split(' ')[0] || 'Executor'}, a Quick Note on Your Goal</h3>
              <p className="text-white/60 mb-8 text-[15px] leading-relaxed">Execution thrives on specificity. Secure your spot with your current idea before we hit our 50-person limit. We'll help you find deep clarity once you're inside.</p>
              <button onClick={() => setShowClarityPopup(false)} className="w-full btn-editorial-pill py-4">Got it, I'll define my goal</button>
            </motion.div>
          </div>
        )}

        {showUpsellModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 w-full max-w-xl bg-brand-dark-card border border-brand-blue/30 rounded-3xl p-8 md:p-12 shadow-3xl">
              <span className="editorial-label !mb-4">A Quick Thought</span>
              <h3 className="text-2xl md:text-[32px] font-bold text-white mb-8 leading-tight">Wait, {formData.full_name.trim().split(' ')[0] || 'Executor'}. Before you proceed...</h3>
              <div className="space-y-6 text-white/70 mb-10 text-[16px] leading-relaxed">
                <p>We’ve seen that those who choose the <span className="text-white font-bold">The Builder's Track</span> tend to find their rhythm and hit their goals about 3x faster.</p>
                <p>If you feel you might need hands-on support to ensure your hard work translates into a real skill shift, the tracker ensures you have a Lead Executor walking right beside you.</p>
              </div>
              <div className="flex flex-col gap-4">
                <button onClick={() => { setFormData(prev => ({ ...prev, support_level: 'group_plus_support' })); setShowUpsellModal(false); setTimeout(() => handleSubmit({ preventDefault: () => {} } as any), 100); }} className="w-full btn-editorial-pill py-5">Upgrade to The Builder's Track</button>
                <button onClick={() => { setShowUpsellModal(false); setTimeout(() => handleSubmit({ preventDefault: () => {} } as any), 100); }} className="w-full text-white/30 text-xs hover:text-white transition-colors py-2 font-medium">No, I'll stick with The Sprint</button>
              </div>
            </motion.div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 w-full max-w-md bg-brand-dark-card border-t-[4px] border-brand-blue rounded-3xl p-8 md:p-10 shadow-3xl text-center">
              <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-white/20 hover:text-white"><X size={20} /></button>
              <h3 className="text-2xl font-bold text-white mb-4">You're in, {formData.full_name.trim().split(' ')[0]} — almost.</h3>
              <p className="text-white/60 mb-10 text-sm leading-relaxed">Your application is saved. Secure your spot now with your commitment fee.</p>
              <div className="space-y-4">
                <a href={formData.support_level === 'group_plus_support' ? PAYSTACK_TEAM_LINK : PAYSTACK_GROUP_LINK} target="_blank" rel="noopener noreferrer" className="w-full btn-editorial-pill py-4 block">Pay via Paystack</a>
                <a href={SELAR_LINK} target="_blank" rel="noopener noreferrer" className="w-full btn-editorial-outline py-4 block">Pay via Selar (International)</a>
                <div className="h-px bg-white/10 my-6" />
                <a href={getWhatsAppLink() || WHATSAPP_CONTACT_LINK} target="_blank" rel="noopener noreferrer" className="w-full bg-[#25D366] text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 hover:brightness-110 shadow-lg shadow-green-600/20">I've Paid — Notify Team <ArrowRight size={18} /></a>
              </div>
              <p className="mt-8 text-[11px] text-white/30">Your payment confirms your place. Group links follow within 24 hours.</p>
              <button onClick={() => setShowModal(false)} className="mt-6 text-[10px] text-white/30 hover:text-white underline underline-offset-4">Modify details or change plan</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
