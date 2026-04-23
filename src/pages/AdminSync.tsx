import React, { useState } from 'react';
import { collection, getDocs, deleteDoc, doc, runTransaction, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { sendToGoogleSheets } from '../lib/sheets';

export default function AdminSync() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const [cleanupStatus, setCleanupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [cleanupResult, setCleanupResult] = useState({ removed: 0, total: 0 });

  const cleanupDuplicates = async () => {
    setCleanupStatus('loading');
    setError(null);

    try {
      const querySnapshot = await getDocs(collection(db, 'sprint_leads'));
      const allLeads = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));
      
      const emailMap = new Map<string, any[]>();
      allLeads.forEach(lead => {
        const email = lead.email?.toLowerCase().trim();
        if (!email) return;
        if (!emailMap.has(email)) emailMap.set(email, []);
        emailMap.get(email)!.push(lead);
      });

      let removedCount = 0;
      for (const [email, leads] of emailMap.entries()) {
        if (leads.length > 1) {
          // Sort by creation date (if exists) or keep the first one
          leads.sort((a, b) => {
            const timeA = a.created_at?.seconds || 0;
            const timeB = b.created_at?.seconds || 0;
            return timeA - timeB;
          });

          // Keep the first one, delete the rest
          const toDelete = leads.slice(1);
          for (const lead of toDelete) {
            await deleteDoc(doc(db, 'sprint_leads', lead.id));
            removedCount++;
          }
        }
      }

      // Cleanup public_feed duplicates
      const feedSnapshot = await getDocs(collection(db, 'public_feed'));
      const feedDocs = feedSnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));
      const feedMap = new Map<string, any[]>();
      
      feedDocs.forEach(item => {
        // Use email if available, fallback to unique key of name-state-country
        const key = item.email ? `email:${item.email.toLowerCase().trim()}` : `name:${item.name}-${item.state}-${item.country}`;
        if (!feedMap.has(key)) feedMap.set(key, []);
        feedMap.get(key)!.push(item);
      });

      for (const [key, items] of feedMap.entries()) {
        if (items.length > 1) {
          items.sort((a, b) => (a.created_at?.seconds || 0) - (b.created_at?.seconds || 0));
          const toDelete = items.slice(1);
          for (const item of toDelete) {
            await deleteDoc(doc(db, 'public_feed', item.id));
          }
        }
      }

      // Update global count
      if (removedCount > 0) {
        const counterRef = doc(db, 'global_stats', 'registration_count');
        await runTransaction(db, async (transaction) => {
          const counterSnap = await transaction.get(counterRef);
          if (counterSnap.exists()) {
            const newCount = Math.max(0, counterSnap.data().count - removedCount);
            transaction.update(counterRef, { count: newCount });
          }
        });
      }

      setCleanupResult({ removed: removedCount, total: allLeads.length });
      setCleanupStatus('success');
    } catch (err: any) {
      console.error("Cleanup error:", err);
      setCleanupStatus('error');
      setError(err.message || "An unknown error occurred during cleanup.");
    }
  };

  const syncData = async () => {
    const webhookUrl = import.meta.env.VITE_SHEETS_WEBHOOK_URL;
    if (!webhookUrl) {
      setStatus('error');
      setError("VITE_SHEETS_WEBHOOK_URL is not defined in environment variables.");
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const querySnapshot = await getDocs(collection(db, 'sprint_leads'));
      const total = querySnapshot.size;
      setProgress({ current: 0, total });

      let count = 0;
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        
        await sendToGoogleSheets({
          full_name: data.full_name,
          email: data.email,
          whatsapp: data.whatsapp,
          goal: data.goal,
          support_level: data.support_level === 'group_plus_support' ? "The Builder's Track" : "The Sprint",
          referred_by: data.referral_source || ''
        });
        
        count++;
        setProgress({ current: count, total });
      }

      setStatus('success');
    } catch (err: any) {
      console.error("Sync error:", err);
      setStatus('error');
      setError(err.message || "An unknown error occurred during sync.");
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-brand-dark-card border border-white/10 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-2">Sheets Data Sync</h1>
        <p className="text-white/60 mb-8 text-sm">
          This tool will fetch all current leads from Firebase and push them to your Google Sheet webhook.
        </p>

        {status === 'idle' && (
          <button
            onClick={syncData}
            className="w-full bg-brand-blue text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
          >
            <Send size={18} /> Start Synchronization
          </button>
        )}

        {status === 'loading' && (
          <div className="text-center space-y-4">
            <Loader2 className="w-10 h-10 text-brand-blue animate-spin mx-auto" />
            <p className="text-white font-medium">Syncing data...</p>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-brand-blue h-full transition-all duration-300" 
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-white/40 text-xs">
              Processed {progress.current} of {progress.total} leads
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="text-green-500" size={32} />
            </div>
            <h2 className="text-xl font-bold text-white">Sync Complete</h2>
            <p className="text-white/60 text-sm">
              All {progress.total} leads have been processed and sent to the webhook.
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="text-brand-blue font-medium text-sm hover:underline"
            >
              Run again
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="text-red-500" size={32} />
            </div>
            <h2 className="text-xl font-bold text-white">Sync Failed</h2>
            <p className="text-red-400/80 text-sm">{error}</p>
            <button
              onClick={() => setStatus('idle')}
              className="w-full bg-white/5 text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
        <div className="mt-12 pt-8 border-t border-white/5">
          <h2 className="text-xl font-bold text-white mb-2">Data Cleanup</h2>
          <p className="text-white/60 mb-6 text-sm">
            Remove duplicate registrations (same email) and update the counter.
          </p>

          {cleanupStatus === 'idle' && (
            <button
              onClick={cleanupDuplicates}
              className="w-full bg-red-500/10 text-red-500 border border-red-500/20 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all"
            >
              Remove Duplicates
            </button>
          )}

          {cleanupStatus === 'loading' && (
            <div className="text-center py-4">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto mb-2" />
              <p className="text-white text-sm">Identifying duplicates...</p>
            </div>
          )}

          {cleanupStatus === 'success' && (
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-center">
              <p className="text-green-500 font-bold mb-1">Cleanup Successful</p>
              <p className="text-white/60 text-xs">
                Removed {cleanupResult.removed} duplicates. {cleanupResult.total - cleanupResult.removed} unique leads remain.
              </p>
              <button
                onClick={() => setCleanupStatus('idle')}
                className="mt-4 text-xs text-white/40 hover:text-white underline"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
