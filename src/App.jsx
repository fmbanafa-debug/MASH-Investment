import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Activity, DollarSign, Calculator, FileText, Loader2, Clock, Upload, Search, 
  ShieldCheck, Database, Download, ExternalLink, ArrowUpDown, CheckSquare, 
  Square, Edit2, Trash2, Save, X, FileDown, AlertCircle, Percent
} from 'lucide-react';

/**
 * BANAFA'S PHARMACOECONOMIC INTELLIGENCE
 * High-performance clinical landscape analyzer.
 */

const BRANDING = "Banafa's Pharmacoeconomic Intelligence";

// Generalized Indication Mapping (Auto-generated if not in CSV)
const getAutoIndication = (target) => {
  const t = (target || '').toUpperCase();
  if (t.includes('FGF21')) return 'Advanced Fibrosis';
  if (t.includes('THR-B') || t.includes('THR-β') || t.includes('THR-BETA')) return 'Liver Fat Reduction';
  if (t.includes('GLP-1') || t.includes('GIP') || t.includes('GCGR') || t.includes('GLP1')) return 'Metabolic Syndrome/Obesity';
  if (t.includes('PPAR')) return 'Insulin Resistance';
  if (t.includes('FXR') || t.includes('SCD1')) return 'Antifibrotic Path';
  if (t.includes('SGLT')) return 'Renal/Metabolic';
  if (t.includes('IL-') || t.includes('TNF')) return 'Inflammation/Immune';
  return 'General Metabolic/Unclassified';
};

// Robust CSV Parser
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

export default function App() {
  const [assets, setAssets] = useState(() => {
    const saved = localStorage.getItem('banafa_assets');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [selectedAssets, setSelectedAssets] = useState(() => {
    const saved = localStorage.getItem('banafa_selection');
    return saved ? JSON.parse(saved) : [];
  });

  const [investment, setInvestment] = useState(100000);
  const [activeTab, setActiveTab] = useState('explorer');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  
  // Advanced Grid States
  const [allocation, setAllocation] = useState({});
  const [growthRates, setGrowthRates] = useState({});
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  const [editingAsset, setEditingAsset] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Persistence
  useEffect(() => {
    localStorage.setItem('banafa_assets', JSON.stringify(assets));
    localStorage.setItem('banafa_selection', JSON.stringify(selectedAssets));
  }, [assets, selectedAssets]);

  // Dynamic Calculator Grid Generator
  useEffect(() => {
    if (selectedAssets.length === 0) {
      setAllocation({});
      return;
    }
    
    const selectedItems = assets.filter(a => selectedAssets.includes(a.id));
    let counts = {};
    
    selectedItems.forEach(a => {
      const ind = a.indication || getAutoIndication(a.target);
      counts[ind] = (counts[ind] || 0) + 1;
    });
    
    const total = selectedItems.length;
    let alloc = {};
    Object.keys(counts).forEach(key => {
      alloc[key] = Math.round((counts[key] / total) * 100);
    });
    
    // Balance to 100% cleanly
    const sum = Object.values(alloc).reduce((a, b) => a + b, 0);
    if (sum !== 100 && Object.keys(alloc).length > 0) {
      const first = Object.keys(alloc)[0];
      alloc[first] += (100 - sum);
    }
    setAllocation(alloc);

    // Initialize Default Growth Rates if not already set by user
    setGrowthRates(prev => {
      const newRates = { ...prev };
      Object.keys(counts).forEach(key => {
        if (newRates[key] === undefined) {
          if (key.includes('Fibrosis')) newRates[key] = 35; // 35% YoY
          else if (key.includes('Reduction')) newRates[key] = 12; // 12% YoY
          else if (key.includes('Obesity')) newRates[key] = 25; // 25% YoY
          else if (key.includes('Insulin')) newRates[key] = 15; // 15% YoY
          else newRates[key] = 10; // Default 10% YoY
        }
      });
      return newRates;
    });
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
      const rows = robustCSVParse(e.target.result);
      if (rows.length < 2) return;

      const headerRow = rows.find(r => r.some(c => c.toLowerCase().includes('drug') || c.toLowerCase().includes('asset')));
      const headerIdx = rows.indexOf(headerRow);
      
      const clinicalData = rows.slice(headerIdx + 1).map((row, idx) => {
        let noIdx = row[0] === '' ? 1 : 0;
        const id = parseInt(row[noIdx]) || Date.now() + idx;
        
        return {
          id,
          name: row[noIdx + 1] || 'New Asset',
          type: row[noIdx + 2] || 'Unknown',
          target: row[noIdx + 3] || 'Unknown',
          company: row[noIdx + 4] || 'Unknown Sponsor',
          phase: row[noIdx + 5] || 'Unknown',
          indication: row[noIdx + 6] || null 
        };
      }).filter(a => a.name !== 'New Asset');

      setAssets(clinicalData);
      setSelectedAssets(clinicalData.map(a => a.id)); 
    };
    reader.readAsText(file);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const processedAssets = useMemo(() => {
    let result = [...assets];
    if (searchTerm) {
      const low = searchTerm.toLowerCase();
      result = result.filter(a => 
        (a.name?.toLowerCase().includes(low)) || 
        (a.company?.toLowerCase().includes(low)) || 
        (a.target?.toLowerCase().includes(low)) ||
        (a.indication?.toLowerCase().includes(low))
      );
    }
    result.sort((a, b) => {
      let av = a[sortConfig.key];
      let bv = b[sortConfig.key];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
      if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [assets, searchTerm, sortConfig]);

  const toggleSelection = (id) => {
    setSelectedAssets(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedAssets.length} selected items from the landscape?`)) {
      setAssets(assets.filter(a => !selectedAssets.includes(a.id)));
      setSelectedAssets([]);
    }
  };

  const handleEditClick = (asset) => {
    setEditingAsset(asset.id);
    setEditFormData({ ...asset });
  };

  const handleSaveEdit = () => {
    setAssets(assets.map(a => a.id === editingAsset ? editFormData : a));
    setEditingAsset(null);
  };

  const exportSelectedCSV = () => {
    const selected = assets.filter(a => selectedAssets.includes(a.id));
    let csv = "No.,Drug,Drug Type,Target,Company,Phase,Indication\n";
    selected.forEach(a => {
      const esc = (s) => {
        const str = String(s || '');
        return (str.includes(',') || str.includes('"')) ? `"${str.replace(/"/g, '""')}"` : str;
      };
      csv += `${a.id},${esc(a.name)},${esc(a.type)},${esc(a.target)},${esc(a.company)},${esc(a.phase)},${esc(a.indication || getAutoIndication(a.target))}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Banafa_Asset_Landscape.csv';
    link.click();
  };

  const exportInvestmentPlan = () => {
    const brief = reportData || "Strategic brief pending execution.";
    const content = `======================================================
${BRANDING.toUpperCase()}
Strategic Investment Plan Report
======================================================

1. FINANCIAL SUMMARY
------------------------------------------------------
Total Principal Capital: $${investment.toLocaleString()}
Projected ROI (Year 5): +${((yieldData[5].value/investment - 1)*100).toFixed(0)}%

2. DYNAMIC INDICATION ALLOCATION & TARGET YIELDS
------------------------------------------------------
${Object.entries(allocation).map(([k, v]) => `- ${k.padEnd(35)} ${v}% Share  |  +${growthRates[k]}% YoY Growth`).join('\n')}

*(Calculated from ${selectedAssets.length} distinct assets)*

3. GROWTH TRAJECTORY PROJECTION
------------------------------------------------------
${yieldData.map(d => `Year ${d.year}: $${d.value.toLocaleString()}`).join('\n')}

4. CONFIDENTIAL STRATEGIC BRIEFING
------------------------------------------------------
${brief}

Generated on: ${new Date().toLocaleString()}
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Banafa_Strategic_Plan.txt';
    link.click();
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
      if (res.ok) { setReportData(data.report); setTimeLeft(60); }
    } catch (e) { console.error("Network error."); }
    finally { setIsGenerating(false); }
  };

  // Restored Exponential Compounding Calculation
  const yieldData = useMemo(() => {
    let weightedGrowth = 0;
    Object.entries(allocation).forEach(([key, weight]) => {
      const annualRate = growthRates[key] !== undefined ? growthRates[key] : 10;
      const multiplier = 1 + (annualRate / 100);
      weightedGrowth += multiplier * (weight / 100);
    });
    
    if (weightedGrowth === 0) weightedGrowth = 1.10;

    return [0,1,2,3,4,5].map(y => ({ 
      year: 2024+y, 
      value: Math.round(investment * Math.pow(weightedGrowth, y)) 
    }));
  }, [investment, allocation, growthRates]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-900 rounded-lg text-white shadow-lg"><ShieldCheck size={20} /></div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-800 uppercase">{BRANDING}</span>
            <div className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-0.5">Regulatory & Economic Intelligence</div>
          </div>
        </div>
        <div className="hidden md:flex bg-slate-100 rounded-xl p-1 border border-slate-200">
          {['explorer', 'calculator'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${activeTab === t ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {t === 'explorer' ? 'Landscape Inventory' : 'Strategic Calculator'}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {activeTab === 'explorer' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800"><Database className="text-blue-600" size={24} /> Asset Landscape</h2>
                <p className="text-sm text-slate-500 font-medium tracking-tight">Tracking {assets.length} items. Active Selection: <span className="text-blue-600 font-bold">{selectedAssets.length}</span></p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input type="text" placeholder="Filter inventory..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                {selectedAssets.length > 0 && (
                  <>
                    <button onClick={exportSelectedCSV} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 text-white rounded-xl text-[11px] font-bold shadow-sm transition-all hover:bg-emerald-800"><FileDown size={14} /> Export Selected</button>
                    <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-xl text-[11px] font-bold shadow-sm transition-all hover:bg-red-700"><Trash2 size={14} /> Bulk Delete</button>
                  </>
                )}
                <label className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white rounded-xl cursor-pointer text-[11px] font-bold shadow-md hover:bg-blue-800 transition-all">
                  <Upload size={14} /> Ingest CSV <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <tr className="text-slate-500 text-[10px] uppercase font-black tracking-widest select-none">
                      <th className="p-4 w-12 text-center cursor-pointer" onClick={() => setSelectedAssets(selectedAssets.length === processedAssets.length ? [] : processedAssets.map(a => a.id))}>
                        {selectedAssets.length > 0 ? <CheckSquare size={16} className="text-blue-600 mx-auto" /> : <Square size={16} className="mx-auto" />}
                      </th>
                      <th className="p-4 cursor-pointer hover:text-blue-600" onClick={() => handleSort('id')}>ID <ArrowUpDown size={10} className="inline ml-1" /></th>
                      <th className="p-4 cursor-pointer hover:text-blue-600" onClick={() => handleSort('name')}>Asset <ArrowUpDown size={10} className="inline ml-1" /></th>
                      <th className="p-4 cursor-pointer hover:text-blue-600" onClick={() => handleSort('target')}>Indication Profile <ArrowUpDown size={10} className="inline ml-1" /></th>
                      <th className="p-4 cursor-pointer hover:text-blue-600" onClick={() => handleSort('company')}>Sponsor / Search <ArrowUpDown size={10} className="inline ml-1" /></th>
                      <th className="p-4 cursor-pointer hover:text-blue-600" onClick={() => handleSort('phase')}>Phase <ArrowUpDown size={10} className="inline ml-1" /></th>
                      <th className="p-4 text-center">Mod</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {processedAssets.map(a => {
                      const isEdit = editingAsset === a.id;
                      return isEdit ? (
                        <tr key={a.id} className="bg-blue-50/40">
                          <td className="p-4"></td>
                          <td className="p-4 font-mono text-[10px] text-slate-400">{a.id}</td>
                          <td className="p-4">
                            <input type="text" value={editFormData.name || ''} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-full text-xs font-bold border-b border-blue-300 outline-none px-1 bg-white mb-1" />
                            <input type="text" value={editFormData.type || ''} onChange={e => setEditFormData({...editFormData, type: e.target.value})} className="w-full text-[10px] border-b border-blue-300 outline-none px-1 bg-white" />
                          </td>
                          <td className="p-4">
                            <input type="text" value={editFormData.indication || ''} onChange={e => setEditFormData({...editFormData, indication: e.target.value})} placeholder={getAutoIndication(a.target)} className="w-full text-[10px] font-bold text-indigo-700 border-b border-blue-300 outline-none px-1 bg-white mb-1" />
                            <input type="text" value={editFormData.target || ''} onChange={e => setEditFormData({...editFormData, target: e.target.value})} className="w-full font-mono text-[9px] border-b border-blue-300 outline-none px-1 bg-white" />
                          </td>
                          <td className="p-4"><input type="text" value={editFormData.company || ''} onChange={e => setEditFormData({...editFormData, company: e.target.value})} className="w-full text-sm border-b border-blue-300 outline-none px-1 bg-white" /></td>
                          <td className="p-4"><input type="text" value={editFormData.phase || ''} onChange={e => setEditFormData({...editFormData, phase: e.target.value})} className="w-full text-[10px] uppercase border-b border-blue-300 outline-none px-1 bg-white" /></td>
                          <td className="p-4 flex gap-2 justify-center"><button onClick={handleSaveEdit} className="text-emerald-600 hover:scale-110 transition-transform"><Save size={16}/></button><button onClick={() => setEditingAsset(null)} className="text-red-500 hover:scale-110 transition-transform"><X size={16}/></button></td>
                        </tr>
                      ) : (
                        <tr key={a.id} className={`group ${selectedAssets.includes(a.id) ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                          <td className="p-4 text-center cursor-pointer" onClick={() => toggleSelection(a.id)}>
                            {selectedAssets.includes(a.id) ? <CheckSquare size={16} className="text-blue-600 mx-auto" /> : <Square size={16} className="text-slate-300 mx-auto transition-colors group-hover:border-slate-400" />}
                          </td>
                          <td className="p-4 text-slate-400 font-mono text-[10px]">{a.id}</td>
                          <td className="p-4 font-bold text-slate-800">
                            {a.name}
                            <div className="mt-0.5 text-[10px] text-slate-500 font-normal">{a.type}</div>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold border border-indigo-100 uppercase tracking-tight">{a.indication || getAutoIndication(a.target)}</span>
                            <div className="mt-1 text-[9px] text-slate-400 font-mono">{a.target}</div>
                          </td>
                          <td className="p-4 font-medium text-blue-800">
                            <a href={`https://www.google.com/search?q=${encodeURIComponent(a.company)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline underline-offset-2">{a.company} <ExternalLink size={10} /></a>
                          </td>
                          <td className="p-4 uppercase text-[10px] font-bold text-slate-400">{a.phase}</td>
                          <td className="p-4 text-center"><button onClick={() => handleEditClick(a)} className="text-slate-300 hover:text-blue-600 transition-colors"><Edit2 size={14}/></button></td>
                        </tr>
                      );
                    })}
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
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none"><Calculator size={100} /></div>
                <h3 className="font-bold text-xl mb-1 text-slate-800 tracking-tight">Strategic Matrix Config</h3>
                <p className="text-[10px] font-bold text-blue-600 bg-blue-50 inline-block px-3 py-1 rounded-md mb-8 border border-blue-100">Calculated from {selectedAssets.length} Selections</p>
                
                <div className="space-y-8 relative z-10">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Managed Capital Principal ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="number" value={investment} onChange={e => setInvestment(Number(e.target.value))} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xl focus:ring-4 focus:ring-blue-100 transition-all outline-none" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Risk & Returns Parameters</label>
                    
                    {Object.keys(allocation).length > 0 ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase tracking-widest">
                            <tr>
                              <th className="p-3">Indication Pool</th>
                              <th className="p-3 text-center">Weight (%)</th>
                              <th className="p-3 text-center">Target YoY (%)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {Object.entries(allocation).map(([k, v]) => (
                              <tr key={k} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3 font-bold text-slate-700 leading-tight">{k}</td>
                                <td className="p-3">
                                  <div className="flex items-center justify-center">
                                    <input 
                                      type="number" 
                                      value={v} 
                                      onChange={(e) => setAllocation({...allocation, [k]: Number(e.target.value)})} 
                                      className="w-16 text-center bg-blue-50 border border-blue-100 rounded-md py-1.5 font-bold text-blue-700 outline-none focus:ring-2 focus:ring-blue-500" 
                                    />
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center justify-center gap-0.5">
                                    <span className="text-emerald-600 font-black">+</span>
                                    <input 
                                      type="number" 
                                      value={growthRates[k] || 0} 
                                      onChange={(e) => setGrowthRates({...growthRates, [k]: Number(e.target.value)})} 
                                      className="w-16 text-center bg-emerald-50 border border-emerald-100 rounded-md py-1.5 font-bold text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500" 
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 flex flex-col items-center gap-2 border border-dashed border-slate-200"><AlertCircle size={20} /> Check assets in the landscape inventory to enable dynamic grid</div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-slate-100">
                    <button onClick={generateReport} disabled={isGenerating || timeLeft > 0 || !selectedAssets.length} className="flex-1 py-4 bg-blue-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 shadow-lg shadow-blue-900/10">
                      {isGenerating ? <Loader2 size={18} className="animate-spin" /> : timeLeft > 0 ? `Wait: ${timeLeft}s` : "Execute Briefing"}
                    </button>
                    <button onClick={exportInvestmentPlan} className="py-4 px-6 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm"><Download size={20} /></button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {reportData && (
                <div className="p-8 bg-white border border-blue-200 rounded-3xl shadow-xl shadow-blue-900/5 relative overflow-hidden animate-in slide-in-from-top-2">
                  <h4 className="font-black text-blue-900 mb-6 uppercase text-[10px] tracking-[0.2em] border-b border-blue-100 pb-3 flex items-center gap-2"><ShieldCheck size={14} /> Intelligence Decision Brief</h4>
                  <div className="space-y-4 text-sm text-slate-700 leading-relaxed font-medium">{reportData.split('\n').filter(p => p.trim()).map((p, i) => <p key={i}>{p}</p>)}</div>
                </div>
              )}

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h4 className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] mb-10 text-center uppercase">{BRANDING} Trajectory</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={yieldData}>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" hide />
                      <YAxis hide />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 'bold' }} formatter={v => [`$${v.toLocaleString()}`, 'Portfolio Valuation']} />
                      <Line type="monotone" dataKey="value" stroke="#1e3a8a" strokeWidth={5} dot={{ r: 5, fill: '#1e3a8a', strokeWidth: 0 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-8 flex justify-between items-end border-t border-slate-100 pt-6">
                  <div><div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Estimated Value (5Y)</div><div className="text-3xl font-black text-slate-900 tracking-tighter">${yieldData[5].value.toLocaleString()}</div></div>
                  <div className="text-right"><div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Efficiency</div><div className="text-2xl font-black text-emerald-600">+{( (yieldData[5].value / investment - 1) * 100 ).toFixed(0)}%</div></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
