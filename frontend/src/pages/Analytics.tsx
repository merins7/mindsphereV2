import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface WeeklyReport {
  weekStartDate: string;
  totalSessions: number;
  totalProductiveMins: number;
  score: number;
  chartData: { day: string; minutes: number }[];
}

export default function Analytics() {
  const { user } = useAuth();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await client.get('/api/reports/latest');
        setReport(res.data);
      } catch (error) {
        console.error('Failed to fetch report', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading insights...</div>;

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center justify-center">
         <h2 className="text-2xl font-bold text-gray-900 mb-2">No Reports Yet</h2>
         <p className="text-gray-600 mb-6">Complete a full week of sessions to generate your first report.</p>
         <Link to="/" className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2">
           <ArrowLeft size={20} /> Back to Dashboard
         </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
             <Link to="/" className="text-gray-400 hover:text-gray-900"><ArrowLeft /></Link>
             <h1 className="text-xl font-bold text-gray-900">Weekly Analytics</h1>
          </div>
          <p className="text-sm text-gray-500">Week of {new Date(report.weekStartDate).toLocaleDateString()}</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Score Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center text-center">
           <h3 className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-2">Social Media Reduction Score</h3>
           <div className="relative w-32 h-32 flex items-center justify-center">
             <svg className="w-full h-full transform -rotate-90">
               <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="none" className="text-gray-100" />
               <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="none" 
                 className={`text-indigo-600 transition-all duration-1000 ease-out`}
                 strokeDasharray={351}
                 strokeDashoffset={351 - (351 * report.score) / 100}
               />
             </svg>
             <span className="absolute text-3xl font-bold text-gray-900">{report.score}</span>
           </div>
           <p className="mt-4 text-gray-600 max-w-md">
             {report.score > 80 ? "🎉 Amazing! You've reclaimed significant time." : "Keep going! Small steps add up."}
           </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white p-6 rounded-xl shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{report.totalSessions}</p>
           </div>
           <div className="bg-white p-6 rounded-xl shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Productive Time</p>
              <p className="text-2xl font-bold text-gray-900">{report.totalProductiveMins} <span className="text-sm font-normal text-gray-400">mins</span></p>
           </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm h-80">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Activity Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={report.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="minutes" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </main>
    </div>
  );
}
