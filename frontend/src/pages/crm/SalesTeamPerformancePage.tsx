import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Award, DollarSign, Target, UserCheck,
  CheckCircle2, Star, ShieldCheck, RefreshCw, BarChart2
} from 'lucide-react';
import { api } from '../../api/client';
import { useRealtime } from '../../context/RealtimeContext';

export const SalesTeamPerformancePage: React.FC = () => {
  const [data, setData] = useState<any>({
    leaderboard: [],
    total_won_revenue: 0,
    total_pipeline_revenue: 0,
    avg_deal_size: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.getSalesPerformance();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const leaderboard = data.leaderboard || [];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Sales Team Performance & Leaderboard
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Executive revenue rankings, win rate metrics, quota attainment %, and pipeline conversion velocity.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Top 3 High-Level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Closed Revenue</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-emerald-600 font-mono">
              ₹{Number(data.total_won_revenue || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-emerald-700 font-bold">Won Deals</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Active Pipeline Deals</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-blue-600 font-mono">
              ₹{Number(data.total_pipeline_revenue || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-500 font-semibold">Under Negotiation</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Average Deal Size</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              ₹{Number(data.avg_deal_size || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-500 font-semibold">Per Won Deal</span>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-black text-slate-900 text-sm tracking-tight flex items-center">
            <Award className="w-4 h-4 text-amber-500 mr-2" />
            <span>Sales Executive Leaderboard & Attainment Standings</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">Ranked by Closed Revenue</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3 w-16 text-center">Rank</th>
              <th className="px-5 py-3">Sales Executive</th>
              <th className="px-5 py-3">Designation</th>
              <th className="px-5 py-3">Total Leads</th>
              <th className="px-5 py-3">Deals Won</th>
              <th className="px-5 py-3">Closed Revenue</th>
              <th className="px-5 py-3">Pipeline Value</th>
              <th className="px-5 py-3 text-right">Attainment %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {leaderboard.map((rep: any, idx: number) => {
              const rank = idx + 1;
              const isTop = rank === 1;

              return (
                <tr key={rep.user_id} className={`hover:bg-slate-50/80 transition-colors ${isTop ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-5 py-3.5 text-center">
                    {rank === 1 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs shadow-xs">
                        1
                      </span>
                    ) : rank === 2 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-black text-xs shadow-xs">
                        2
                      </span>
                    ) : rank === 3 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/60 text-white font-black text-xs shadow-xs">
                        3
                      </span>
                    ) : (
                      <span className="font-mono font-bold text-slate-400">{rank}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-slate-900 block leading-tight">{rep.user_name}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{rep.email}</span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-700">
                    {rep.role}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-800">
                    {rep.leads_count} leads
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {rep.won_deals_count} Won
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1 font-mono">({rep.conversion_rate}%)</span>
                  </td>
                  <td className="px-5 py-3.5 font-mono font-extrabold text-slate-900">
                    ₹{rep.won_revenue.toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-3.5 font-mono font-semibold text-blue-700">
                    ₹{rep.pipeline_revenue.toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black font-mono ${
                      rep.attainment_percentage >= 100
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {rep.attainment_percentage}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
