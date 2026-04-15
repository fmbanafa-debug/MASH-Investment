import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Activity, DollarSign, Calculator, FileText, Loader2, Clock, Upload, Search, 
  ShieldCheck, Database, Download, ExternalLink, ArrowUpDown, CheckSquare, Square
} from 'lucide-react';

/**
 * BANAFA'S PHARMACOECONOMIC INTELLIGENCE
 * High-performance clinical landscape analyzer for MASH therapies.
 */

const BRANDING = "Banafa's Pharmacoeconomic Intelligence";

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

// Advanced CSV Parser handling quoted commas and line breaks perfectly
const robustCSVParse = (text) => {
  const result = [];
  let currentLine = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i+1];

    if (char === '"' && inQuotes && nextChar === '"') {
      currentVal += '"';
      i++; 
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      currentLine.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentLine.push(currentVal.trim());
      if (currentLine.some(c => c !== '')) result.push(currentLine);
      currentLine = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  if (currentVal !== '' || currentLine.length > 0) {
    currentLine.push(currentVal.trim());
    if (currentLine.some(c => c !== '')) result.push(currentLine);
  }
  return result;
};

// Data Persistence Loaders
const loadSavedAssets = () => {
  try {
    const saved = localStorage.getItem('banafa_assets');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

const loadSavedSelection = () => {
  try {
    const saved = localStorage.getItem('banafa_selection');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

export default function App() {
  const [assets, setAssets] = useState(loadSavedAssets);
  const [selectedAssets, setSelectedAssets] = useState(loadSavedSelection);
  const [investment, setInvestment] = useState(100000);
  const [activeTab, setActiveTab] = useState('explorer');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [allocation, setAllocation] = useState({ 'THR-B': 40, 'FGF21': 30, 'GLP-1': 20, 'Other': 10 });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  // Silent Persistence Hooks
  useEffect(() => {
    localStorage.setItem('banafa_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('banafa_selection', JSON.stringify(selectedAssets));
  }, [selectedAssets]);

  // Dynamic Calculator Integration based on Selection
  useEffect(() => {
    if (selectedAssets.length === 0) return;
    
    const selected = assets.filter(a => selectedAssets.includes(a.id));
    let counts = { 'THR-B': 0, 'FGF21': 0, 'GLP-1': 0, 'Other': 0 };
    
    selected.forEach(a => {
      const t = (a.target || '').toUpperCase();
      if (t.includes('THR')) counts['THR-B']++;
      else if (t.includes('FGF21')) counts['FGF21']++;
      else if (t.includes('GLP-1') || t.includes('GIP') || t.includes('GCG')) counts['GLP-1']++;
      else counts['Other']++;
    });
    
    const total = selected.length;
    if (total > 0) {
      let alloc = {
        'THR-B': Math.round((counts['THR-B'] / total) * 100),
        'FGF21': Math.round((counts['FGF21'] / total) * 100),
        'GLP-1': Math.round((counts['GLP-1'] / total) * 100),
        'Other': Math.round((counts['Other'] / total) * 100),
      };
      
      // Rectify rounding to exactly 100%
      const sum = Object.values(alloc).reduce((a, b) => a + b, 0);
      if (sum !== 100) {
        alloc['Other'] += (100 - sum);
        if (alloc['Other'] < 0) { alloc['THR-B'] += alloc['Other']; alloc['Other'] = 0; }
      }
      setAllocation(alloc);
    }
  }, [selectedAssets, assets]);

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
      
      const clinicalData = parsedRows.map((row, index) => {
        let dataStartIdx = row[0] === '' ? 1 : 0;
        const id = parseInt(row[dataStartIdx]);
        if (isNaN(id)) return null;

        return {
          id,
          name: row[dataStartIdx + 1] || 'Unknown',
          type: row[dataStartIdx + 2] || 'Unknown',
          target: row[dataStartIdx + 3] || 'Unknown',
          company: row[dataStartIdx + 4] || 'Unknown Sponsor',
          phase: row[dataStartIdx + 5] || 'Unknown'
        };
      }).filter(Boolean);

      setAssets(clinicalData);
      // Auto-select all newly ingested assets
      setSelectedAssets(clinicalData.map(a => a.id)); 
    };
    reader.readAsText(file);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredAssets = useMemo(() => {
    let result = assets;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(a => 
        a.name?.toLowerCase().includes(lower) || 
        a.company?.toLowerCase().includes(lower) || 
        a.target?.toLowerCase().includes(lower)
      );
    }
    
    result.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [assets, searchTerm, sortConfig]);

  const toggleSelection = (id) => {
    setSelectedAssets(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAllSelections = () => {
    if (selectedAssets.length === sortedAndFilteredAssets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(sortedAndFilteredAssets.map(a => a.id));
    }
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

  const exportInvestmentPlan = () => {
    const brief = reportData || "Intelligence briefing pending execution.";
    const content = `======================================================
${BRANDING.toUpperCase()}
Strategic Investment Plan Export
======================================================

1. CAPITAL & PORTFOLIO ALLOCATION
------------------------------------------------------
Total Managed Capital: $${investment.toLocaleString()}

Dynamically Linked Mechanism Weighting:
- THR-B Therapeutics:           ${allocation['THR-B']}%
- FGF21 Therapeutics:           ${allocation['FGF21']}%
- GLP-1/Incretin Therapeutics:  ${allocation['GLP-1']}%
- Speculative/Other:            ${allocation['Other']}%

*(Weightings derived from ${selectedAssets.length} selected assets)*

2. GROWTH TRAJECTORY (5-YEAR PROJECTION)
------------------------------------------------------
${yieldData.map(d => `Year ${d.year}: $${d.value.toLocaleString()}`).join('\n')}

Target ROI (Year 5): +${((yieldData[5].value/investment - 1)*100).toFixed(0)}%

3. CONFIDENTIAL STRATEGIC BRIEFING
------------------------------------------------------
${brief}

======================================================
Generated via the Regulatory Strategy Suite
${new Date().toLocaleDateString()}
`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Banafa_Investment_Plan.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      {/* Premium Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20 px-6 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-900 rounded-lg text-white shadow-inner">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-800">{BRANDING}</span>
            <div className="text-[10px] text-blue-600 font-bold uppercase tracking-widest leading-none mt-1">Regulatory Strategy Suite</div>
          </div>
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 shadow-inner hidden md:flex">
          {['explorer', 'calculator'].map(t => (
            <button 
              key={t} 
              onClick={() => setActiveTab(t)} 
              className={`px-6 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                activeTab === t ? 'bg-white text-blue-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t === 'explorer' ? 'Landscape Explorer' : 'Investment Calculator'}
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile Nav Fallback */}
      <div className="flex md:hidden bg-white border-b border-slate-200 px-4 py-2 gap-2">
         {['explorer', 'calculator'].map(t => (
            <button 
              key={t} 
              onClick={() => setActiveTab(t)} 
              className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                activeTab === t ? 'bg-blue-50 text-blue-900 border border-blue-100' : 'bg-slate-50 text-slate-500 border border-transparent'
              }`}
            >
              {t}
            </button>
          ))}
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {activeTab === 'explorer' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                  <Database className="text-blue-600" size={24} /> 
                  Clinical Pipeline Inventory
                </h2>
                <p className="text-sm text-slate-500 font-medium">Tracking {assets.length} assets. Selected: <span className="text-blue-600 font-bold">{selectedAssets.length}</span></p>
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search assets..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <label className="flex w-full md:w-auto justify-center items-center gap-2 px-6 py-2.5 bg-blue-900 text-white rounded-xl cursor-pointer text-xs font-bold hover:bg-blue-800 transition-colors shadow-md">
                  <Upload size={16} /> Ingest CSV Data
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <tr className="text-slate-500 text-[10px] uppercase font-black tracking-widest cursor-pointer select-none">
                      <th className="p-4 w-12 text-center" onClick={toggleAllSelections}>
                        {selectedAssets.length > 0 && selectedAssets.length === sortedAndFilteredAssets.length ? <CheckSquare size={16} className="text-blue-600 mx-auto" /> : <Square size={16} className="mx-auto" />}
                      </th>
                      <th className="p-4 hover:text-blue-600 transition-colors" onClick={() => handleSort('id')}>
                        <div className="flex items-center gap-1">ID <ArrowUpDown size={12} /></div>
                      </th>
                      <th className="p-4 hover:text-blue-600 transition-colors" onClick={() => handleSort('name')}>
                        <div className="flex items-center gap-1">Regulatory Asset <ArrowUpDown size={12} /></div>
                      </th>
                      <th className="p-4 hover:text-blue-600 transition-colors" onClick={() => handleSort('target')}>
                        <div className="flex items-center gap-1">Clinical Indication <ArrowUpDown size={12} /></div>
                      </th>
                      <th className="p-4 hover:text-blue-600 transition-colors" onClick={() => handleSort('company')}>
                        <div className="flex items-center gap-1">Sponsor <ArrowUpDown size={12} /></div>
                      </th>
                      <th className="p-4 hover:text-blue-600 transition-colors" onClick={() => handleSort('phase')}>
                        <div className="flex items-center gap-1">Current Phase <ArrowUpDown size={12} /></div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedAndFilteredAssets.length > 0 ? sortedAndFilteredAssets.map(a => (
                      <tr key={a.id} className={`transition-colors ${selectedAssets.includes(a.id) ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                        <td className="p-4 text-center cursor-pointer" onClick={() => toggleSelection(a.id)}>
                          {selectedAssets.includes(a.id) ? <CheckSquare size={16} className="text-blue-600 mx-auto" /> : <Square size={16} className="text-slate-300 mx-auto" />}
                        </td>
                        <td className="p-4 text-slate-400 font-mono text-xs">{a.id}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{a.name}</div>
                          <div className="text-[10px] text-slate-500 font-bold">{a.type}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold border border-indigo-100">
                            {getDetailedIndication(a.target)}
                          </span>
                          <div className="mt-1 font-mono text-[9px] text-slate-400">{a.target}</div>
                        </td>
                        <td className="p-4 font-medium">
                          <a 
                            href={`https://www.google.com/finance?q=${encodeURIComponent(a.company)}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1"
                          >
                            {a.company} <ExternalLink size={12} />
                          </a>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                            a.phase.includes('Approved') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-500 border-slate-200'
                          }`}>
                            {a.phase}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="6" className="p-20 text-center text-slate-400">
                          <Database size={48} className="mx-auto mb-4 opacity-10" />
                          <p className="font-medium">No clinical data found. Please ingest your CSV landscape file.</p>
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
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                  <Calculator size={100} />
                </div>
                
                <h3 className="font-bold text-xl mb-2 flex items-center gap-2 text-slate-800">
                  Strategic Configuration
                </h3>
                <p className="text-xs font-bold text-blue-600 bg-blue-50 inline-block px-3 py-1 rounded-md mb-8 border border-blue-100">
                  Linked to {selectedAssets.length} Selected Explorer Assets
                </p>
                
                <div className="space-y-8 relative z-10">
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Mechanism Risk Weighting (Auto-Synced)</label>
                    {Object.keys(allocation).map(k => (
                      <div key={k} className="group">
                        <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase mb-2">
                          <span>{k} Therapeutics</span>
                          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{allocation[k]}%</span>
                        </div>
                        <input 
                          type="range" 
                          value={allocation[k]} 
                          onChange={e => setAllocation({...allocation, [k]: Number(e.target.value)})} 
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                    <button 
                      onClick={generateReport} 
                      disabled={isGenerating || timeLeft > 0} 
                      className="flex-1 py-4 bg-blue-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 shadow-md"
                    >
                      {isGenerating ? <Loader2 size={18} className="animate-spin" /> : timeLeft > 0 ? `Analysis Wait: ${timeLeft}s` : "Execute Briefing"}
                    </button>
                    <button 
                      onClick={exportInvestmentPlan}
                      className="py-4 px-6 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                      <Download size={18} /> Export
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {reportData && (
                <div className="p-8 bg-white border border-blue-200 rounded-3xl shadow-xl shadow-blue-900/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <FileText size={120} />
                  </div>
                  <h4 className="font-black text-blue-900 mb-6 uppercase text-[10px] tracking-[0.2em] border-b border-blue-100 pb-3 flex items-center gap-2">
                    <ShieldCheck size={14} /> Confidential Strategic Briefing
                  </h4>
                  <div className="space-y-4 text-sm text-slate-700 leading-relaxed font-medium relative z-10">
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
                        contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} 
                        formatter={v => [`$${v.toLocaleString()}`, 'Projected Value']} 
                      />
                      <Line type="monotone" dataKey="value" stroke="#1e3a8a" strokeWidth={5} dot={{ r: 6, fill: '#1e3a8a', strokeWidth: 0 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-8 flex justify-between items-end border-t border-slate-100 pt-6">
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Year 5 Valuation</div>
                    <div className="text-3xl font-black text-slate-900">${yieldData[5].value.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Target ROI</div>
                    <div className="text-2xl font-black text-emerald-600">+{((yieldData[5].value/investment - 1)*100).toFixed(0)}%</div>
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
