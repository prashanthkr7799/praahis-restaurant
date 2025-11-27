import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Database, CheckCircle, FileText, Filter, FileSpreadsheet } from 'lucide-react';
import { supabaseOwner } from '@shared/utils/api/supabaseOwnerClient';
import toast from 'react-hot-toast';
import { exportToExcel, exportToPDF, exportToCSV } from '@domains/analytics';

const DataExportPage = () => {
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('all');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [exportFormat, setExportFormat] = useState('excel');
  const [exporting, setExporting] = useState(false);
  const [counts, setCounts] = useState({});
  const [history, setHistory] = useState([]);

  const types = [
    { id: 'restaurants', label: 'Restaurants', table: 'restaurants' },
    { id: 'users', label: 'Users', table: 'users' },
    { id: 'orders', label: 'Orders', table: 'orders' },
    { id: 'payments', label: 'Payments', table: 'payments' },
    { id: 'billing', label: 'Billing', table: 'billing' },
    { id: 'menu_items', label: 'Menu Items', table: 'menu_items' },
    { id: 'categories', label: 'Categories', table: 'categories' },
    { id: 'tables', label: 'Tables', table: 'tables' }
  ];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchCounts(); }, [selectedRestaurant]);

  const fetchData = async () => {
    try {
      const { data } = await supabaseOwner.from('restaurants').select('id, name').order('name');
      setRestaurants(data || []);
      await fetchCounts();
      const saved = localStorage.getItem('exportHistory');
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchCounts = async () => {
    const c = {};
    for (const t of types) {
      try {
        let q = supabaseOwner.from(t.table).select('id', { count: 'exact', head: true });
        if (selectedRestaurant !== 'all') {
          q = t.id === 'restaurants' ? q.eq('id', selectedRestaurant) : q.eq('restaurant_id', selectedRestaurant);
        }
        const { count } = await q;
        c[t.id] = count || 0;
      } catch { c[t.id] = 0; }
    }
    setCounts(c);
  };

  const toggle = (id) => setSelectedTypes(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const selectAll = () => setSelectedTypes(selectedTypes.length === types.length ? [] : types.map(t => t.id));

  const doExport = async () => {
    if (!selectedTypes.length) { toast.error('Select data types'); return; }
    setExporting(true);
    try {
      const data = {};
      for (const id of selectedTypes) {
        const t = types.find(x => x.id === id);
        let q = supabaseOwner.from(t.table).select('*');
        if (selectedRestaurant !== 'all') {
          q = id === 'restaurants' ? q.eq('id', selectedRestaurant) : q.eq('restaurant_id', selectedRestaurant);
        }
        const { data: rows } = await q;
        data[id] = rows || [];
      }
      const name = selectedRestaurant === 'all' ? 'all' : restaurants.find(r => r.id === selectedRestaurant)?.name || 'data';
      const baseFilename = 'praahis-' + name.toLowerCase().replace(/\s+/g, '-') + '-' + new Date().toISOString().split('T')[0];
      const total = Object.values(data).reduce((s, a) => s + a.length, 0);

      // Export based on format
      if (exportFormat === 'excel') {
        // For Excel, export each data type as a separate sheet or file
        for (const [key, rows] of Object.entries(data)) {
          if (rows.length > 0) {
            exportToExcel(rows, `${baseFilename}-${key}.xlsx`, key);
          }
        }
      } else if (exportFormat === 'pdf') {
        // For PDF, create a report for each data type
        for (const [key, rows] of Object.entries(data)) {
          if (rows.length > 0) {
            const columns = Object.keys(rows[0]).slice(0, 6).map(k => ({ header: k.replace(/_/g, ' ').toUpperCase(), field: k }));
            exportToPDF(rows, columns, `${baseFilename}-${key}.pdf`, `${key.replace(/_/g, ' ').toUpperCase()} Report`);
          }
        }
      } else if (exportFormat === 'csv') {
        // For CSV, export each data type separately
        for (const [key, rows] of Object.entries(data)) {
          if (rows.length > 0) {
            exportToCSV(rows, `${baseFilename}-${key}.csv`);
          }
        }
      } else {
        // JSON export
        const filename = baseFilename + '.json';
        const content = JSON.stringify(data, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
      }

      const h = [{ id: Date.now(), filename: baseFilename + '.' + exportFormat, records: total, date: new Date().toISOString() }, ...history.slice(0, 19)];
      setHistory(h);
      localStorage.setItem('exportHistory', JSON.stringify(h));
      toast.success('Exported ' + total + ' records');
    } catch (e) { toast.error('Export failed'); console.error(e); }
    finally { setExporting(false); }
  };

  if (loading) return <div className="flex justify-center p-8"><RefreshCw className="w-8 h-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20"><Download className="w-6 h-6 text-emerald-400" /></div>
          <div><h1 className="text-2xl font-bold text-white">Data Export</h1><p className="text-sm text-slate-400">Export platform data</p></div>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-white/5 rounded-xl text-white flex items-center gap-2 hover:bg-white/10"><RefreshCw className="w-4 h-4" />Refresh</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10"><p className="text-2xl font-bold text-emerald-400">{counts.restaurants || 0}</p><p className="text-xs text-slate-400">Restaurants</p></div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10"><p className="text-2xl font-bold text-purple-400">{counts.orders || 0}</p><p className="text-xs text-slate-400">Orders</p></div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10"><p className="text-2xl font-bold text-amber-400">{counts.payments || 0}</p><p className="text-xs text-slate-400">Payments</p></div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10"><p className="text-2xl font-bold text-blue-400">{counts.users || 0}</p><p className="text-xs text-slate-400">Users</p></div>
      </div>

      <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-3"><Filter className="w-4 h-4 text-emerald-400" /><span className="text-white font-medium">Filter by Restaurant</span></div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedRestaurant('all')} className={`px-4 py-2 rounded-lg ${selectedRestaurant === 'all' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-300'}`}>All Restaurants</button>
          {restaurants.map(r => <button key={r.id} onClick={() => setSelectedRestaurant(r.id)} className={`px-4 py-2 rounded-lg ${selectedRestaurant === r.id ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-300'}`}>{r.name}</button>)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><Database className="w-4 h-4 text-emerald-400" /><span className="text-white font-medium">Select Data</span></div><button onClick={selectAll} className="text-sm text-slate-400 hover:text-white">{selectedTypes.length === types.length ? 'Deselect All' : 'Select All'}</button></div>
            <div className="grid grid-cols-2 gap-3">
              {types.map(t => (<button key={t.id} onClick={() => toggle(t.id)} className={`flex items-center gap-3 p-3 rounded-xl border ${selectedTypes.includes(t.id) ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}><span className="flex-1 text-left text-white">{t.label}</span><span className="text-xs text-slate-400">{counts[t.id] || 0}</span>{selectedTypes.includes(t.id) && <CheckCircle className="w-4 h-4 text-emerald-400" />}</button>))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-amber-400" /><span className="text-white font-medium">Format</span></div>
            {[
              { id: 'excel', label: 'Excel', desc: 'Spreadsheet (.xlsx)' },
              { id: 'pdf', label: 'PDF', desc: 'Document (.pdf)' },
              { id: 'csv', label: 'CSV', desc: 'Comma separated' },
              { id: 'json', label: 'JSON', desc: 'Raw data' }
            ].map(f => (<button key={f.id} onClick={() => setExportFormat(f.id)} className={`w-full p-3 rounded-lg mb-2 text-left ${exportFormat === f.id ? 'bg-emerald-500/20 border-emerald-500' : 'bg-white/5'} border border-white/10`}><span className="text-white font-medium block">{f.label}</span><span className="text-xs text-slate-400">{f.desc}</span></button>))}
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10 text-center">
            <Download className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-white font-medium mb-1">Ready to Export</p>
            <p className="text-sm text-slate-400 mb-4">{selectedTypes.length} types selected</p>
            <button onClick={doExport} disabled={exporting} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl flex items-center justify-center gap-2">{exporting ? <><RefreshCw className="w-4 h-4 animate-spin" />Exporting...</> : <><Download className="w-4 h-4" />Generate Export</>}</button>
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10"><h3 className="text-white font-medium">Export History</h3></div>
          <div className="divide-y divide-white/5">
            {history.map(h => (<div key={h.id} className="p-4 flex items-center gap-4"><CheckCircle className="w-5 h-5 text-emerald-400" /><div className="flex-1"><p className="text-white">{h.filename}</p><p className="text-xs text-slate-400">{new Date(h.date).toLocaleString()} - {h.records} records</p></div></div>))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataExportPage;
