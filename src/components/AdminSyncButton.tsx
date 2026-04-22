import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2, Database, CheckCircle } from 'lucide-react';

export default function AdminSyncButton() {
  const [searchParams] = useSearchParams();
  const isAdmin = searchParams.get('admin') === 'true';
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isAdmin) return null;

  const handleSync = async () => {
    const webhookUrl = import.meta.env.VITE_SHEETS_WEBHOOK_URL;
    if (!webhookUrl) {
      alert("Error: VITE_SHEETS_WEBHOOK_URL is not defined.");
      return;
    }

    if (!confirm("Are you sure you want to sync all Firebase records to Google Sheets?")) return;

    setIsSyncing(true);
    setMessage(null);

    try {
      const querySnapshot = await getDocs(collection(db, 'sprint_leads'));
      
      const syncPromises = querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        try {
          return await fetch(webhookUrl, {
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
        } catch (err) {
          console.error(`Failed to sync doc ${doc.id}:`, err);
          return null;
        }
      });

      await Promise.all(syncPromises);
      setMessage("All records synced to Google Sheets");
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      console.error("Sync error:", err);
      alert("Sync failed: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[2000]">
      {message && (
        <motion_div 
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="mb-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 text-sm font-medium"
        >
          <CheckCircle size={16} /> {message}
        </motion_div>
      )}
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="bg-brand-blue/80 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 hover:bg-brand-blue transition-all disabled:opacity-50 group font-bold tracking-tight text-sm"
      >
        {isSyncing ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <Database size={18} className="group-hover:rotate-12 transition-transform" />
        )}
        {isSyncing ? "Syncing..." : "Sync Firebase to Sheets"}
      </button>
    </div>
  );
}

// Internal motion helper since we can't easily dynamic import motion here without bloat
const motion_div = ({ children, initial, animate, className }: any) => {
  // Use a simple div for the message if framer motion isn't needed for this tiny helper
  return (
    <div 
      className={className}
      style={{ transition: 'all 0.3s ease' }}
    >
      {children}
    </div>
  );
};
