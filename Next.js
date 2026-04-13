import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, ShieldAlert, Activity, DollarSign, Target, Info, Calculator, Briefcase, Search, Filter, ArrowRight, Upload, FileText, Loader2, Clock 
} from 'lucide-react';

const getIndication = (target, drugName) => {
  const t = (target || '').toUpperCase();
  if (t.includes('FGF21') || t.includes('THR')) return 'MASH w/ Fibrosis';
  if (t.includes('GLP-1') || t.includes('GIP') || t.includes('GCG')) return 'MASH w/ Obesity';
  if (t.includes('PPAR')) return 'MASH (Metabolic/Lipid)';
  if (t.includes('LXR') || t.includes('SCD1')) return 'MASH (Lipid Metabolism)';
  return 'MASH (General)';
};

const getCategory = (company, phase) => {
  const bigPharma = ['Novo Nordisk', 'Lilly', 'Boehringer', 'GSK', 'Pfizer', 'AstraZeneca', 'Sanofi', 'Novartis', 'Merck'];
  const isBigPharma = bigPharma.some(bp => (company || '').toLowerCase().includes(bp.toLowerCase()));
  
  if (isBigPharma) return "Big Pharma";
  if ((phase || '').toLowerCase().includes('approved')) return "Mid Cap / Approved";
  if ((phase || '').toLowerCase().includes('phase 3')) return "Small Cap (Late Stage)";
  return "Early Stage / Speculative";
};

const rawInitialData = [
  [1, "Semaglutide", "Recombinant polypeptide", "GLP-1R", "Novo Nordisk A/S", "Approved"],
  [2, "Resmetirom", "Small molecule drug", "THR-B", "Madrigal Pharmaceuticals", "Approved"],
  [3, "Saroglitazar", "Small molecule drug", "PPARα x PPARγ", "Zydus Cadila", "Approved (India)"],
  [4, "Pegozafermin", "Growth factors", "FGF21R", "89bio, Inc.", "Phase 3"],
  [5, "Lanifibranor", "Small molecule drug", "PPAR pan-agonist", "Inventiva", "Phase 3"],
  [6, "Efruxifermin", "Fc fusion protein", "FGF21R", "Akero Inc.", "Phase 3"],
  [7, "Survodutide", "Synthetic peptide", "GCGR x GLP-1R", "Boehringer Ingelheim", "Phase 3"],
  [181, "HEC138671", "Small molecule drug", "THR-α x THR-β", "Sunshine Lake Pharma", "IND Approval"],
  [185, "HRS-4729", "Synthetic peptide", "GCGR x GIPR x GLP-1R", "Jiangsu Hengrui", "IND Approval"],
  [187, "KH-629", "Small molecule drug", "THR-B", "Chengdu Kanghong", "IND Approval"]
];

const INITIAL_ASSETS = rawInitialData.map(row => ({
  id: row[0],
  name: row[1],
  type: row[2],
  target: row[3],
  company: row[4],
  phase: row[5],
  indication: getIndication(row[3], row[1]),
  category: getCategory(row[4], row[5])
}));

const COLORS = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const App = () => {
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [investment, setInvestment] = useState(100000);
  const [activeTab, setActiveTab] = useState('explorer');
  const [searchTerm, setSearchTerm] = useState('');
  const [allocation, setAllocation] = useState({
    'THR-B': 40,
    'FGF21': 30,
    'GLP-1': 20,
    'Other': 10
  });

  // Strategy Intelligence State
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  // Rate limit timer logic
  useEffect(() => {
    let timer;
    if (timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft]);

  const marketForecast = [
    { year: '2024', revenue: 2.6 },
    { year: '2025', revenue: 3.2 },
    { year: '2026', revenue: 4.1 },
    { year: '2027', revenue: 5.4 },
    { year: '2028', revenue: 7.2 },
    { year: '2029', revenue: 9.8 },
  ];

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const rows = [];
      let curRow = [];
      let curVal = '';
      let inQuotes = false;
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) { curRow.push(curVal.trim()); curVal = ''; }
        else if (char === '\n' && !inQuotes) {
          curRow.push(curVal.trim());
          if (curRow.length > 3) rows.push(curRow);
          curRow = []; curVal = '';
        } else { if (char !== '\r') curVal += char; }
      }
      if (curVal || curRow.length > 0) { curRow.push(curVal.trim()); if (curRow.length > 3) rows.push(curRow); }

      const parsedAssets = [];
      for (const row of rows) {
        let noIdx = row[0] === '' ? 1 : 0;
        const id = parseInt(row[noIdx]);
        if (!isNaN(id)) {
          parsedAssets.push({
            id: id,
            name: row[noIdx + 1] || 'Unknown',
            type: row[noIdx + 2] || 'Unknown',
            target: row[noIdx + 3] || 'Unknown',
            company: (row[noIdx + 4] || 'Unknown').replace(/^"|"$/g, ''),
            phase: row[noIdx + 5] || 'Unknown',
            indication: getIndication(row[noIdx + 3], row[noIdx + 1]),
            category: getCategory(row[noIdx + 4], row[noIdx + 5])
          });
        }
      }
      if (parsedAssets.length > 0) setAssets(parsedAssets);
    };
    reader.readAsText(file);
  };

  const generateStrategicReport = async () => {
    // Rate limit check (60 seconds)
    const now = Date.now();
    if (now - lastRequestTime < 60000) {
      setErrorMsg(`System rate limit active. Please wait ${Math.ceil((60000 - (now - lastRequestTime)) / 1000)} seconds.`);
      return;
    }

    setIsGenerating(true);
    setReportData('');
    setErrorMsg('');

    try {
      const apiKey = 
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || 
        (typeof process !== 'undefined' && process?.env?.NEXT_PUBLIC_GEMINI_API_KEY) || 
        ""; 

      const model = "gemini-flash-latest"; 
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const promptText = `Provide a formal, high-level Strategic Regulatory and Market Intelligence Report for a $${investment.toLocaleString()} allocation in the MASH pharmaceutical sector. 
      The allocation profile is: THR-B (${allocation['THR-B']}%), FGF21 (${allocation['FGF21']}%), GLP-1/Incretins (${allocation['GLP-1']}%), and Speculative/Emerging (${allocation['Other']}%).
      
      Focus on clinical trial milestones, competitive moats, and regulatory approval pathways (FDA/EMA). 
      Maintain a sober, professional consulting tone. Format in 3 clear paragraphs with no bolding or mentions of artificial intelligence or model names.`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || "Regulatory database connection error.");
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        setReportData(text);
        setLastRequestTime(Date.now());
        setTimeLeft(60);
      } else {
        throw new Error("Report generation failed. Please review data inputs.");
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.indication.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, assets]);

  const projections = calculateReturn = () => {
    const weightedGrowth = (allocation['THR-B'] * 1.12 + allocation['FGF21'] * 1.35 + allocation['GLP-1'] * 1.20 + allocation['Other'] * 1.10) / 100;
    const years = [0, 1, 2, 3, 4, 5];
    return years.map(y => ({
      year: 2024 + y,
      value: Math.round(investment * Math.pow(weightedGrowth, y))
    }));
  };

  const yieldData = projections();
  const pieData = Object.entries(allocation).map(([name, value]) => ({ name, value }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="text-blue-600" />
            <span className="font-bold text-lg hidden sm:inline">Regulatory Strategy Suite</span>
          </div>
          <div className="flex bg-slate-100 rounded-lg p-1">
            {['explorer', 'overview', 'calculator'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
                  activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 pt-8">
        
        {/* Explorer Tab */}
        {activeTab === 'explorer' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Clinical Asset Pipeline</h2>
                <p className="text-sm text-slate-500 mt-1">Total Assets Tracked: {assets.length}.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <label className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl cursor-pointer font-bold text-sm transition-colors border border-blue-200">
                  <Upload size={16} />
                  Ingest Landscape CSV
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
                
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Filter by indication or drug..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-left relative">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">ID</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Clinical Asset</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Indication Profile</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Sponsor</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Mechanism</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Regulatory Phase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-slate-400 font-mono text-sm">{asset.id}</td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{asset.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">{asset.type}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-100">
                            {asset.indication}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">{asset.company}</td>
                        <td className="px-6 py-4 text-sm font-mono text-[11px] font-bold text-slate-500">
                          {asset.target}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${
                            asset.phase.includes('Approved') 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-slate-50 text-slate-600 border-slate-100'
                          }`}>
                            {asset.phase}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <header>
              <h1 className="text-3xl font-extrabold tracking-tight">Market Expansion Forecast</h1>
              <p className="text-slate-500 mt-2">Strategic growth projections for the MASH treatment landscape.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold mb-6">Total Addressable Market ($B)</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={marketForecast}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-2">Portfolio Hierarchy</h3>
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
                      <div>
                        <div className="text-sm font-bold">Stabilization Assets</div>
                        <div className="text-xs text-slate-500">Approved therapies & Market Leaders</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                      <div>
                        <div className="text-sm font-bold">Growth-Phase Equities</div>
                        <div className="text-xs text-slate-500">Phase 3 clinical readout candidates</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 bg-amber-500 rounded-full"></div>
                      <div>
                        <div className="text-sm font-bold">Speculative Alpha</div>
                        <div className="text-xs text-slate-500">IND-approved early innovators</div>
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('calculator')}
                  className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                >
                  Configure Allocation <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Calculator & Intelligence Tab */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Calculator size={20} className="text-blue-600" /> Allocation Configuration
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2">Total Managed Capital ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="number" 
                        value={investment}
                        onChange={(e) => setInvestment(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-600">Mechanism Weighting (%)</label>
                    {Object.keys(allocation).map((key) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold uppercase text-slate-400">
                          <span>{key}</span>
                          <span>{allocation[key]}%</span>
                        </div>
                        <input 
                          type="range"
                          min="0" max="100"
                          value={allocation[key]}
                          onChange={(e) => setAllocation({...allocation, [key]: Number(e.target.value)})}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strategic Intelligence Card */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden border border-slate-800">
                <h4 className="font-bold text-lg mb-2 flex items-center gap-2 relative z-10">
                  <FileText size={20} className="text-blue-400" /> Strategic Analysis Engine
                </h4>
                <p className="text-sm text-slate-400 leading-relaxed mb-6 relative z-10">
                  Extract a detailed regulatory landscape and market intelligence report based on your currently configured ${investment.toLocaleString()} allocation.
                </p>
                <button 
                  onClick={generateStrategicReport}
                  disabled={isGenerating || timeLeft > 0}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-500 transition-colors disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed relative z-10"
                >
                  {isGenerating ? (
                    <><Loader2 size={18} className="animate-spin" /> Retrieving Intelligence...</>
                  ) : timeLeft > 0 ? (
                    <><Clock size={18} /> Re-cool down: {timeLeft}s</>
                  ) : (
                    "Execute Market Intelligence Report"
                  )}
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              
              {/* Strategic Report Display */}
              { (reportData || errorMsg || isGenerating) && (
                <div className={`p-6 rounded-2xl border ${errorMsg ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'} shadow-sm animate-in fade-in duration-500`}>
                  <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${errorMsg ? 'text-red-700' : 'text-slate-900'}`}>
                    <FileText size={20} className={errorMsg ? 'text-red-500' : 'text-blue-600'} /> 
                    {errorMsg ? 'Strategic Update Error' : 'Confidential Intelligence Briefing'}
                  </h3>
                  
                  {isGenerating ? (
                    <div className="space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                      <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
                      <div className="h-4 bg-slate-200 rounded w-5/6 animate-pulse"></div>
                    </div>
                  ) : errorMsg ? (
                    <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
                  ) : (
                    <div className="space-y-4 text-sm text-slate-700 leading-relaxed italic border-l-4 border-blue-500 pl-4">
                      {reportData.split('\n').filter(p => p.trim() !== '').map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold mb-6">Aggregate Capital Projection</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={yieldData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                      <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                      <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={4} dot={{ r: 6, fill: '#2563eb' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-tight">Projected Capital 2029</div>
                    <div className="text-2xl font-black text-slate-800">${yieldData[5].value.toLocaleString()}</div>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl">
                    <div className="text-xs text-emerald-600 font-bold uppercase tracking-tight">Target Total Yield</div>
                    <div className="text-2xl font-black text-emerald-700">+{((yieldData[5].value/investment - 1)*100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
