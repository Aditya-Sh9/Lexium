import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Award, Star, Trophy, MapPin, TrendingUp } from 'lucide-react';
import api from '../../services/api';

export default function ProviderEminence() {
  const { user } = useAuth();
  const [eminenceData, setEminenceData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [eminence, lb] = await Promise.all([
          api.get('/provider/eminence'),
          api.get('/leaderboard'),
        ]);
        setEminenceData(eminence);
        setLeaderboard(lb || []);
      } catch (err) {
        console.error('Failed to load eminence', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-accent-300 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1920px] mx-auto p-6 md:p-12 font-sans bg-transparent">
      <header className="mb-12 border-b border-surface-200 pb-6">
        <h1 className="font-heading text-4xl text-primary-900">Eminence & Reputation</h1>
        <p className="font-sans text-lg text-surface-500 mt-2">Your standing within the Sovereign Digital Framework.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Shield of Counsel */}
        <section className="lg:col-span-8 bg-white/80 backdrop-blur-[20px] rounded-xl p-8 border border-white/60 shadow-diffused relative overflow-hidden flex flex-col items-center justify-center min-h-[500px]">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #0f1b2d 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          <h2 className="font-heading text-2xl text-primary-900 absolute top-8 left-8 z-10">The Shield of Counsel</h2>
          
          <div className="relative w-80 h-96 flex flex-col items-center justify-center z-10 pt-12">
            <div className="w-32 h-32 rounded-full bg-primary-800 border-4 border-accent-300 flex items-center justify-center shadow-inner relative mb-8">
              <ShieldCheck size={64} className="text-accent-300" />
              <div className="absolute -bottom-3 bg-accent-300 text-primary-950 font-sans text-xs uppercase tracking-widest font-bold px-3 py-1 rounded shadow-md">
                {eminenceData?.tier}
              </div>
            </div>

            <div className="flex gap-6">
              {eminenceData?.badges.map(badge => (
                <div key={badge.id} className={`w-14 h-14 rounded-full flex items-center justify-center border shadow-inner ${badge.earned ? 'bg-gradient-to-br from-accent-300 to-accent-500 border-accent-100 text-white' : 'bg-surface-100 border-surface-300 text-surface-400 border-dashed'}`} title={badge.name}>
                  {badge.icon === 'star' && <Star size={24} />}
                  {badge.icon === 'shield' && <ShieldCheck size={24} />}
                  {badge.icon === 'award' && <Award size={24} />}
                </div>
              ))}
            </div>
            <p className="text-primary-900 font-sans text-sm font-bold uppercase tracking-widest mt-6">
              {eminenceData?.badges.filter(b => b.earned).length} of {eminenceData?.badges.length} Pinnacle Badges Earned
            </p>
          </div>
        </section>

        {/* Milestone Requirements */}
        <section className="lg:col-span-4 bg-white rounded-xl p-8 border border-surface-200 shadow-sm flex flex-col">
          <h2 className="font-heading text-2xl text-primary-900 mb-6">Requirements</h2>
          
          <div className="space-y-6 flex-1">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-sans font-bold text-surface-700">Pro Bono Cases</span>
                <span className="text-surface-500">{eminenceData?.proBonoCompleted} / 5</span>
              </div>
              <div className="w-full bg-surface-100 rounded-full h-2">
                <div className="bg-accent-300 h-2 rounded-full" style={{ width: `${(eminenceData?.proBonoCompleted / 5) * 100}%` }}></div>
              </div>
              <p className="text-xs font-sans text-surface-500 mt-2">Complete {5 - (eminenceData?.proBonoCompleted || 0)} more to earn "Pro Bono Champion".</p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-sans font-bold text-surface-700">Total Cases Closed</span>
                <span className="text-surface-500">{eminenceData?.casesClosed} / 50</span>
              </div>
              <div className="w-full bg-surface-100 rounded-full h-2">
                <div className="bg-accent-300 h-2 rounded-full" style={{ width: `${(eminenceData?.casesClosed / 50) * 100}%` }}></div>
              </div>
              <p className="text-xs font-sans text-surface-500 mt-2">Progress toward Senior Status.</p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-sans font-bold text-surface-700">Average Rating</span>
                <span className="text-surface-500">{eminenceData?.ratingAvg} / 5.0</span>
              </div>
              <div className="w-full bg-surface-100 rounded-full h-2">
                <div className="bg-accent-300 h-2 rounded-full" style={{ width: `${(eminenceData?.ratingAvg / 5) * 100}%` }}></div>
              </div>
              <p className="text-xs font-sans text-surface-500 mt-2">Top 5% of providers in your region.</p>
            </div>
          </div>
          
          <div className="pt-6 border-t border-surface-200 mt-6 text-center">
            <span className="font-sans text-xs uppercase tracking-widest font-bold text-surface-500">Current Standing</span>
            <p className="font-heading text-3xl text-primary-900 mt-2">{eminenceData?.standing}</p>
          </div>
        </section>
      </div>

      {/* ─── Platform Leaderboard ─── */}
      <section className="mt-8 bg-white/80 backdrop-blur-[20px] rounded-xl p-8 border border-white/60 shadow-diffused">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Trophy size={20} />
          </div>
          <div>
            <h2 className="font-heading text-2xl text-primary-900">Platform Leaderboard</h2>
            <p className="font-sans text-sm text-surface-500">See where you stand among peers</p>
          </div>
        </div>

        {leaderboard.length === 0 ? (
          <p className="text-sm text-surface-500 font-sans py-6 text-center">No leaderboard data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="text-left px-4 py-3 font-sans text-xs uppercase tracking-widest font-bold text-surface-500 w-12">Rank</th>
                  <th className="text-left px-4 py-3 font-sans text-xs uppercase tracking-widest font-bold text-surface-500">Provider</th>
                  <th className="text-left px-4 py-3 font-sans text-xs uppercase tracking-widest font-bold text-surface-500 hidden md:table-cell">Specialization</th>
                  <th className="text-center px-4 py-3 font-sans text-xs uppercase tracking-widest font-bold text-surface-500">Rating</th>
                  <th className="text-center px-4 py-3 font-sans text-xs uppercase tracking-widest font-bold text-surface-500">Reviews</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((p, i) => {
                  const isCurrentUser = p.email === user?.email;
                  return (
                    <tr key={p._id} className={`border-b border-surface-100 last:border-0 transition-colors ${isCurrentUser ? 'bg-primary-50/50 border-primary-200' : 'hover:bg-surface-50'}`}>
                      <td className="px-4 py-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          i === 0 ? 'bg-gradient-to-br from-yellow-300 to-amber-500 text-white shadow-sm' :
                          i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-sm' :
                          i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-sm' :
                          'bg-surface-100 text-surface-600'
                        }`}>
                          {i < 3 ? <Trophy size={14} /> : i + 1}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${isCurrentUser ? 'bg-primary-800 text-white' : 'bg-primary-100 text-primary-800'}`}>
                            {p.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-sans text-sm font-medium text-surface-800">
                              {p.name} {isCurrentUser && <span className="text-xs text-primary-600 font-bold ml-1">(You)</span>}
                            </p>
                            <p className="font-sans text-xs text-surface-500 flex items-center gap-1"><MapPin size={10} /> {p.location || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-sans text-sm text-surface-600 hidden md:table-cell">{p.specialization}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 font-sans text-sm font-bold text-surface-800">
                          <Star size={14} className="text-amber-400 fill-amber-400" /> {p.rating?.toFixed(1) || '0.0'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-sans text-sm text-surface-600">{p.review_count || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
