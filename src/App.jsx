import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, ShieldAlert, Activity, DollarSign, Target, Info, Calculator, Briefcase, Search, Filter, ArrowRight, Upload, FileText, Loader2, Clock 
} from 'lucide-react';

const getIndication = (target) => {
  const t = (target || '').toUpperCase();
  if (t.includes('FGF21') || t.includes('THR')) return 'MASH w/ Fibrosis';
  if (t.includes('GLP-1') || t.includes('GIP') || t.includes('GCG')) return 'MASH w/ Obesity';
  if (t.includes('PPAR')) return 'MASH (Metabolic/Lipid)';
  return 'MASH (General)';
};

const getCategory = (company, phase) => {
  const bigPharma = ['Novo Nordisk', 'Lilly', 'Boehringer', 'GSK', 'Pfizer', 'AstraZeneca'];
  const isBigPharma = bigPharma.some(bp => (company || '').toLowerCase().includes(bp.toLowerCase()));
  if (isBigPharma) return "Big Pharma";
  if ((phase || '').toLowerCase().includes('approved')) return "Mid Cap / Approved";
  return "Growth / Speculative";
};

const rawInitialData = [
  [1, "Semaglutide", "Recombinant polypeptide", "GLP-1R", "Novo Nordisk A/S", "Approved"],
  [2, "Resmetirom", "Small molecule drug", "THR-B", "Madrigal Pharmaceuticals", "Approved"],
  [4, "Pegozafermin", "Growth factors", "FGF21R", "89bio, Inc.", "Phase 3"],
  [6, "Efruxifermin", "Fc fusion protein", "FGF21R", "Akero Inc.", "Phase 3"],
  [185, "HRS-4729", "Synthetic peptide", "GCGR x GIPR x GLP-1R", "Jiangsu Hengrui Pharma", "IND Approval"]
];

const INITIAL_ASSETS = rawInitialData.map(row => ({
  id: row[0], name: row[1], type: row[2], target: row[3], company: row[4], phase: row[5],
  indication: getIndication(row[3]), category: getCategory(row[4], row[5])
}));

const COLORS = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function App() {
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [investment, setInvestment] = useState(100000);
  const [activeTab, setActiveTab] = useState('explorer');
  const [searchTerm, setSearchTerm] = useState('');
  const [allocation, setAllocation] = useState({ 'THR-B': 40, 'FGF21': 30, 'GLP-1': 20, 'Other': 10 });

  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    let timer;
    if (timeLeft > 0) timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const marketForecast = [
    { year: '2024', revenue: 2.6 }, { year: '2025', revenue: 3.2 }, { year: '2026', revenue: 4.1 },
    { year: '2027', revenue: 5.4 }, { year: '2028', revenue: 7.2 }, { year: '2029', revenue: 9.8 },
  ];

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
          id, name: row[noIdx+1], type: row[noIdx+2], target: row[noIdx+3],
          company: (row[noIdx+4] || '').replace(/"/g, ''), phase: row[noIdx+5],
          indication: getIndication(row[noIdx+3]), category: getCategory(row[row[noIdx+4]])
        };
      }).filter(Boolean);
      if (parsed.length > 0) setAssets(parsed);
    };
    reader.readAsText(file);
  };

  const generateStrategicReport = async () => {
    setIsGenerating(true); setReportData(''); setErrorMsg('');
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investment, allocation })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Connection error.");
      setReportData(data.report);
      setTimeLeft(60);
    } catch (err) { setErrorMsg(err.message); }
    finally { setIsGenerating(false); }
  };

  const yieldData = useMemo(() => {
    const weightedGrowth = (allocation['THR-B'] * 1.12 + allocation['FGF21'] * 1.35 + allocation['GLP-1'] * 1.20 + allocation['Other'] * 1.10) / 100;
    return [0,1,2,3,4,5].map(y => ({ year: 2024+y, value: Math.round(investment * Math.pow(weightedGrowth, y)) }));
  }, [investment, allocation]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="text-blue-600" />
          <span className="font-bold text-lg">Regulatory Strategy Suite</span>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-1">
          {['explorer', 'overview', 'calculator'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{tab}</button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 pt-8">
        {activeTab === 'explorer' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Clinical Asset Pipeline ({assets.length})</h2>
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl cursor-pointer font-bold text-sm border border-blue-200">
                <Upload size={16} /> Ingest Landscape CSV
                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-xs font-bold uppercase text-slate-500">
                    <th className="px-6 py-4">Asset</th><th className="px-6 py-4">Indication</th><th className="px-6 py-4">Sponsor</th><th className="px-6 py-4">Mechanism</th><th className="px-6 py-4">Phase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assets.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())).map(asset => (
                    <tr key={asset.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-bold">{asset.name}</td>
                      <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">{asset.indication}</span></td>
                      <td className="px-6 py-4 text-sm">{asset.company}</td>
                      <td className="px-6 py-4 text-xs font-mono">{asset.target}</td>
                      <td className="px-6 py-4"><span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase border bg-slate-50">{asset.phase}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Calculator size={20} className="text-blue-600" /> Allocation Configuration</h3>
                <div className="space-y-6">
                  <input type="number" value={investment} onChange={e => setInvestment(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                  {Object.keys(allocation).map(key => (
                    <div key={key}>
                      <div className="flex justify-between text-xs font-bold uppercase text-slate-400"><span>{key}</span><span>{allocation[key]}%</span></div>
                      <input type="range" min="0" max="100" value={allocation[key]} onChange={e => setAllocation({...allocation, [key]: Number(e.target.value)})} className="w-full h-2 bg-slate-100 rounded-lg accent-blue-600" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800">
                <h4 className="font-bold mb-2 flex items-center gap-2"><FileText size={20} className="text-blue-400" /> Strategic Analysis Engine</h4>
                <button onClick={generateStrategicReport} disabled={isGenerating || timeLeft > 0} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:bg-slate-800">
                  {isGenerating ? <Loader2 size={18} className="animate-spin" /> : timeLeft > 0 ? `Cool-down: ${timeLeft}s` : "Execute Intelligence Report"}
                </button>
              </div>
            </div>
            <div className="lg:col-span-7 space-y-6">
              {reportData && (
                <div className="p-6 rounded-2xl border bg-slate-50 border-slate-200 shadow-sm italic text-sm text-slate-700 leading-relaxed border-l-4 border-blue-500">
                  {reportData.split('\n').map((p, i) => <p key={i} className="mb-4">{p}</p>)}
                </div>
              )}
              <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-bold mb-6">Capital Growth Forecast</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={yieldData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
                      <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                      <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={4} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
