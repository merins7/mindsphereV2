import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, AlertTriangle } from 'lucide-react';

interface FlagCase {
  id: string;
  reason: string;
  details?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  content: {
    title: string;
    url: string;
  };
  reporter: {
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [cases, setCases] = useState<FlagCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await client.get('/api/moderation/cases');
        setCases(res.data);
      } catch (error) {
        console.error('Failed to fetch cases', error);
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'ADMIN') {
      fetchCases();
    }
  }, [user]);

  const handleResolve = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await client.post(`/api/moderation/cases/${id}/resolve`, { status, note: 'Resolved via dashboard' });
      setCases(cases.map(c => c.id === id ? { ...c, status } : c));
    } catch (error) {
      alert('Failed to update case');
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
        <div className="bg-white p-8 rounded shadow text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="mb-4">You do not have permission to view this page.</p>
          <Link to="/" className="text-indigo-600 hover:underline">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
           <Link to="/" className="text-gray-400 hover:text-gray-900"><ArrowLeft /></Link>
           <h1 className="text-xl font-bold text-gray-900">Moderation Dashboard</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div>Loading cases...</div>
        ) : cases.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No pending moderation cases.</div>
        ) : (
          <div className="space-y-4">
            {cases.map(c => (
              <div key={c.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      c.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      c.status === 'APPROVED' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {c.status}
                    </span>
                    <span className="text-sm text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-1">{c.content.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">Reported by: {c.reporter.name} ({c.reporter.email})</p>
                  <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                    <strong className="block text-xs uppercase text-gray-500 mb-1">Reason: {c.reason}</strong>
                    {c.details}
                  </div>
                </div>
                
                {c.status === 'PENDING' && (
                  <div className="flex flex-col gap-2 justify-center min-w-[140px]">
                    <button 
                      onClick={() => handleResolve(c.id, 'APPROVED')}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100 font-medium text-sm transition"
                    >
                      <AlertTriangle size={16} /> Mark as Violation
                    </button>
                    <button 
                      onClick={() => handleResolve(c.id, 'REJECTED')}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 font-medium text-sm transition"
                    >
                      <Check size={16} /> Dismiss Report
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
