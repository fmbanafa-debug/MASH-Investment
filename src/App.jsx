import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Activity, DollarSign, Calculator, FileText, Loader2, Clock, Upload, Search, ArrowRight, ShieldCheck, Database
} from 'lucide-react';

/**
 * REGULATORY STRATEGY SUITE
 * High-performance clinical landscape analyzer for MASH therapies.
 */

// Enhanced Indication Mapping based on Regulatory targets
const getDetailedIndication = (target) => {
  const t = (target || '').toUpperCase();
  if (t.includes('FGF21')) return 'MASH w/ Advanced Fibrosis';
  if (t.includes('THR-B')) return 'MASH w/ Liver Fat Reduction';
  if (t.includes('GLP-1') || t.includes('GIP') || t.includes('GCGR')) return 'MASH w/ Metabolic Syndrome/Obesity';
  if (t.includes('PPAR')) return 'MASH w/ Insulin Resistance';
  if (t.includes('FXR') || t.includes('SCD1')) return 'MASH (Antifibrotic Path)';
  return 'MASH (General Metabolic)';
};

// Professional CSV Parser that handles quoted commas
const robustCSVParse = (text) => {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  return lines.map(line => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
};

export default function App() {
  const [assets, setAssets] = useState([]);
  const [investment, setInvestment] = useState(100000);
  const [activeTab, setActiveTab] = useState('explorer');
  const [searchTerm, setSearchTerm] = useState('');
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
      const parsedRows = robustCSVParse(e.target.result);
      
      // Look for data starting after the header (usually row 3 or 4 in your specific format)
      const clinicalData = parsedRows.map(row => {
        // Find 'No.' column or skip if not a number
        let dataStartIdx = row[0] === '' ? 1 : 0;
        const id = parseInt(row[dataStartIdx]);
        if (isNaN(id)) return null;

        return {
          id,
          name: row[dataStartIdx + 1],
          type: row[dataStartIdx + 2],
          target: row[dataStartIdx + 3],
          company: row[dataStartIdx + 4],
          phase: row[dataStartIdx + 5]
        };
      }).filter(Boolean);

      setAssets(clinicalData);
    };
    reader.readAsText(file);
  };

  const filteredAssets = useMemo(() => {
    if (!searchTerm) return assets;
    const lower = searchTerm.toLowerCase();
    return assets.filter(a => 
      a.name?.toLowerCase().includes(lower) || 
      a.company?.toLowerCase().includes(lower) || 
      a.target?.toLowerCase().includes(lower)
    );
  }, [assets, searchTerm]);

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
    } catch (e) { console.error("Endpoint failure."); }
    finally { setIsGenerating(false); }
  };

  const yieldData = useMemo(() => {
    const growth = (allocation['THR-B']*1.12 + allocation['FGF21']*1.35 + allocation['GLP-1']*1.20 + allocation['Other']*1.10)/100;
    return [0,1,2,3,4,5].map(y => ({
      year: 2024+y,
      value: Math.round(investment * Math.pow(growth, y))
    }));
  }, [investment, allocation]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      {/* Premium Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20 px-6 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight">Regulatory Strategy Suite</span>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Intelligence Engine v2.0</div>
          </div>
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
          {['explorer', 'calculator'].map(t => (
            <button 
              key={t} 
              onClick={() => setActiveTab(t)} 
              className={`px-6 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                activeTab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {activeTab === 'explorer' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Database className="text-blue-500" size={24} /> 
                  Clinical Pipeline Inventory
                </h2>
                <p className="text-sm text-slate-500">Managing {assets.length} clinical assets across global markets.</p>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search assets..." 
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl cursor-pointer text-xs font-bold hover:bg-blue-700 transition-colors shadow-md">
                  <Upload size={16} /> Ingest CSV
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <tr className="text-slate-400 text-[10px] uppercase font-black tracking-widest">
                      <th className="p-4">ID</th>
                      <th className="p-4">Regulatory Asset</th>
                      <th className="p-4">Clinical Indication</th>
                      <th className="p-4">Sponsor</th>
                      <th className="p-4">Mechanism</th>
                      <th className="p-4">Current Phase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAssets.length > 0 ? filteredAssets.map(a => (
                      <tr key={a.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="p-4 text-slate-300 font-mono text-xs">{a.id}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{a.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold">{a.type}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold border border-indigo-100">
                            {getDetailedIndication(a.target)}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 font-medium">{a.company}</td>
                        <td className="p-4 font-mono text-[10px] text-slate-500 bg-slate-50/50">{a.target}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                            a.phase.includes('Approved') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {a.phase}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="6" className="p-20 text-center text-slate-400">
                          <Database size={48} className="mx-auto mb-4 opacity-10" />
                          <p className="font-medium">No clinical data ingested. Please upload your MASH landscape CSV.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-800">
                  <Calculator size={20} className="text-blue-600" /> Strategic Configuration
                </h3>
                
                <div className="space-y-8">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Managed Capital Allocation ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        type="number" 
                        value={investment} 
                        onChange={e => setInvestment(Number(e.target.value))} 
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xl focus:ring-4 focus:ring-blue-100 transition-all outline-none" 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Mechanism Risk Weighting</label>
                    {Object.keys(allocation).map(k => (
                      <div key={k} className="group">
                        <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase mb-2">
                          <span>{k} Therapeutics</span>
                          <span className="text-blue-600">{allocation[k]}%</span>
                        </div>
                        <input 
                          type="range" 
                          value={allocation[k]} 
                          onChange={e => setAllocation({...allocation, [k]: Number(e.target.value)})} 
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                        />
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={generateReport} 
                    disabled={isGenerating || timeLeft > 0} 
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 shadow-lg shadow-slate-200"
                  >
                    {isGenerating ? <Loader2 size={20} className="animate-spin" /> : timeLeft > 0 ? `Re-analysis Ready in ${timeLeft}s` : "Execute Regulatory Intelligence Briefing"}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {reportData && (
                <div className="p-8 bg-white border border-blue-100 rounded-3xl shadow-xl shadow-blue-50/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <FileText size={120} />
                  </div>
                  <h4 className="font-black text-blue-800 mb-6 uppercase text-[10px] tracking-[0.3em] border-b border-blue-100 pb-2">Confidential Briefing</h4>
                  <div className="space-y-4 text-sm text-slate-600 leading-relaxed font-medium">
                    {reportData.split('\n').filter(p => p.trim() !== '').map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                </div>
              )}

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h4 className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-8">Growth Trajectory Projection</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={yieldData}>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" hide />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }} 
                        formatter={v => [`$${v.toLocaleString()}`, 'Value']} 
                      />
                      <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={5} dot={{ r: 6, fill: '#2563eb', strokeWidth: 0 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-8 flex justify-between items-end border-t border-slate-50 pt-6">
                  <div>
                    <div className="text-[10px] font-black text-slate-300 uppercase">Year 5 Valuation</div>
                    <div className="text-3xl font-black text-slate-900">${yieldData[5].value.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Target ROI</div>
                    <div className="text-2xl font-black text-emerald-500">+{((yieldData[5].value/investment - 1)*100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
