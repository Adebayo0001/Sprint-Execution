import React, { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2, CheckCircle2, AlertCircle, Send } from 'lucide-react';

export default function AdminSync() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

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
        
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              full_name: data.full_name,
              email: data.email,
              whatsapp: data.whatsapp,
              goal: data.goal,
              support_level: data.support_level === 'group_plus_support' ? "The Builder's Track" : "The Sprint",
              referred_by: data.referral_source || ''
            }),
          });
          
          count++;
          setProgress({ current: count, total });
        } catch (postErr) {
          console.error(`Failed to sync doc ${doc.id}:`, postErr);
        }
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
      </div>
    </div>
  );
}
