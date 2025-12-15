import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { saveEventToBuffer } from '../utils/syncManager';
import { ArrowLeft, Clock } from 'lucide-react';

export default function SessionRunner() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const start = async () => {
      try {
        const res = await client.post('/api/sessions/start', { contentId });
        setSessionId(res.data.id);
      } catch (error) {
        alert('Failed to start session');
        navigate('/');
      }
    };
    if (contentId) start();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [contentId, navigate]);

  useEffect(() => {
    if (sessionId) {
      timerRef.current = setInterval(() => {
        setElapsed(e => e + 1);
        
        // Log "Heartbeat" VIEW event every 30s to buffer
        if (elapsed > 0 && elapsed % 30 === 0) {
           saveEventToBuffer({
             sessionId,
             type: 'VIEW',
             timestamp: new Date().toISOString()
           });
        }
      }, 1000);
    }
    return () => clearInterval(timerRef.current!);
  }, [sessionId, elapsed]);

  const handleFinish = async () => {
    if (!sessionId) return;
    try {
      // Final event
      await saveEventToBuffer({
          sessionId,
          type: 'COMPLETE',
          timestamp: new Date().toISOString()
      });
      
      // End session
      await client.post('/api/sessions/end', { sessionId, duration: elapsed });
      
      navigate('/');
    } catch (error) {
      console.error('Failed to end session', error);
      // Even if API fails, navigate back. Background sync will handle events.
      // Ideally queue the "End Session" request too in SyncManager, but for MVP keep simple.
      navigate('/');
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="p-4 flex justify-between items-center bg-zinc-900">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white" aria-label="Go back">
          <ArrowLeft />
        </button>
        <div className="flex items-center gap-2 font-mono text-xl">
           <Clock size={20} className="text-indigo-400" />
           {formatTime(elapsed)}
        </div>
        <div /> 
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full aspect-video bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700">
           {/* Placeholder for Content Player */}
           <div className="text-center">
             <p className="text-zinc-500 mb-4">Content Player Placeholder</p>
             <h2 className="text-2xl font-bold mb-2">Simulating Content: {contentId}</h2>
             <p className="text-indigo-400 animate-pulse">Running Session...</p>
           </div>
        </div>
      </main>

      <footer className="p-8 flex justify-center bg-zinc-900">
         <button 
           onClick={handleFinish}
           className="px-8 py-3 bg-red-600 rounded-full font-bold hover:bg-red-700 transition"
         >
           End Session
         </button>
      </footer>
    </div>
  );
}
