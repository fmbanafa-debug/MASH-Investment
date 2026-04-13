import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Activity, DollarSign, Calculator, FileText, Loader2, Clock, Upload, ArrowRight 
} from 'lucide-react';

/**
 * Regulatory Strategy Suite - Core Interface
 * Optimized for professional consulting and regulatory landscape tracking.
 */

const getIndication = (target) => {
  const t = (target || '').toUpperCase();
  if (t.includes('FGF21') || t.includes('THR')) return 'MASH w/ Fibrosis';
  if (t.includes('GLP-1') || t.includes('GIP')) return 'MASH w/ Obesity';
  return 'MASH (Metabolic)';
};

const INITIAL_ASSETS = [
  { id: 1, name: "Semaglutide", target: "GLP-1R", company: "Novo Nordisk", phase: "Approved" },
  { id: 2, name: "Resmetirom", target: "THR-B", company: "Madrigal", phase: "Approved" },
  { id: 4, name: "Pegozafermin", target: "FGF21R", company: "89bio, Inc.", phase: "Phase 3" },
  { id: 6, name: "Efruxifermin", target: "FGF21R", company: "Akero Inc.", phase: "Phase 3" },
  { id: 185, name: "HRS-4729", target: "GCGR x GIPR x GLP-1R", company: "Jiangsu Hengrui Pharma", phase: "IND Approval" }
];

export default function App() {
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [investment, setInvestment] = useState(100000);
  const [activeTab, setActiveTab] = useState('explorer');
  const [allocation, setAllocation] = useState({ 'THR-B': 40, 'FGF21': 30, 'GLP-1': 20, 'Other': 10 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const rows = text.split('\n').slice(4).map(r => r.split(','));
      const parsed = rows.map(row => {
        let noIdx = row[0] === '' ? 1 : 0;
        const id = parseInt(row[noIdx]);
        if (isNaN(id)) return null;
        return {
          id,
          name: row[noIdx+1],
          target: row[noIdx+3],
          company: (row[noIdx+4] || '').replace(/"/g, ''),
          phase: row[noIdx+5]
        };
      }).filter(Boolean);
      if (parsed.length > 0) setAssets(parsed);
    };
    reader.readAsText(file);
  };

  const generateReport = async () => {
    setIsGenerating(true); setReportData('');
    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investment, allocation })
      });
      const data = await res.json();
      if (res.ok) {
        setReportData(data.report);
        setTimeLeft(60);
      }
    } catch (e) {
      console.error("Connection failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const yieldData = useMemo(() => {
    const growth = (allocation['THR-B']*1.12 + allocation['FGF21']*1.35 + allocation['GLP-1']*1.20 + allocation['Other']*1.10)/100;
    return [0,1,2,3,4,5].map(y => ({
      year: 2024+y,
      value: Math.round(investment * Math.pow(growth, y))
    }));
  }, [investment, allocation]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <nav className="bg-white border-b px-6 h-16 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 font-bold text-blue-600"><Activity /> Regulatory Strategy Suite</div>
        <div className="flex bg-slate-100 rounded-lg p-1">
          {['explorer', 'calculator'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-1.5 rounded-md text-sm capitalize transition-all ${activeTab === t ? 'bg-white shadow-sm' : 'text-slate-500'}`}>{t}</button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        {activeTab === 'explorer' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Clinical Pipeline Tracking</h2>
              <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg cursor-pointer text-xs font-bold border border-blue-200">
                <Upload size={14} /> Ingest Data
                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    <th className="p-4">Asset</th><th className="p-4">Indication</th><th className="p-4">Sponsor</th><th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {assets.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold">{a.name}</td>
                      <td className="p-4"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">{getIndication(a.target)}</span></td>
                      <td className="p-4 text-slate-600">{a.company}</td>
                      <td className="p-4 uppercase text-[10px] font-bold text-slate-400">{a.phase}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <h3 className="font-bold mb-4 text-slate-700">Allocation Configuration</h3>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Total Capital ($)</label>
                <input type="number" value={investment} onChange={e => setInvestment(Number(e.target.value))} className="w-full p-3 bg-slate-50 border rounded-lg mb-6 font-bold" />
                
                {Object.keys(allocation).map(k => (
                  <div key={k} className="mb-5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1"><span>{k}</span><span>{allocation[k]}%</span></div>
                    <input type="range" value={allocation[k]} onChange={e => setAllocation({...allocation, [k]: Number(e.target.value)})} className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  </div>
                ))}

                <button onClick={generateReport} disabled={isGenerating || timeLeft > 0} className="w-full mt-4 py-3 bg-slate-900 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400">
                  {isGenerating ? <Loader2 size={18} className="animate-spin" /> : timeLeft > 0 ? `Rate Limit: ${timeLeft}s` : "Execute Briefing"}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {reportData && (
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl text-sm italic text-slate-700 leading-relaxed border-l-4 border-blue-500 animate-in fade-in slide-in-from-top-4">
                  <h4 className="font-bold text-blue-800 not-italic mb-3 uppercase text-[10px] tracking-widest text-center">Strategic Market Report</h4>
                  {reportData.split('\n').filter(p => p.trim() !== '').map((p, i) => <p key={i} className="mb-4">{p}</p>)}
                </div>
              )}
              <div className="bg-white p-6 rounded-xl border shadow-sm h-64">
                <h4 className="font-bold text-slate-400 uppercase text-[10px] mb-4">Capital Appreciation Projection</h4>
                <ResponsiveContainer width="100%" height="80%">
                  <LineChart data={yieldData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="year" hide />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} formatter={v => [`$${v.toLocaleString()}`, 'Value']} />
                    <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
