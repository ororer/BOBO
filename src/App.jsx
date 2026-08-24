import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://zebyzpsffpvdaoqrhonq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYnl6cHNmZnB2ZGFvcXJob25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MjYyMDYsImV4cCI6MjA5OTAwMjIwNn0.MYlkEAjcr4nzF7SzNjen9Jjux-FnCksj-BdrjB4F3pA";
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

const getAllLocalLogs = () => {
  const items = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try {
      const val = JSON.parse(localStorage.getItem(key));
      if (Array.isArray(val)) {
        val.forEach(item => {
          if (item && (item.type || item.metric_type || item.food_name || item.amount_ml || item.duration_minutes)) {
            items.push(item);
          }
        });
      }
    } catch (e) {}
  }
  return items;
};

export default function App() {
  const [timeline, setTimeline] = useState(() => getAllLocalLogs());
  const [syncStatus, setSyncStatus] = useState('idle');
  const [activeTab, setActiveTab] = useState('home');
  const [activeSection, setActiveSection] = useState(null);
  const [feedType, setFeedType] = useState('breastfeeding');
  const [feedSide, setFeedSide] = useState('both');
  const [duration, setDuration] = useState(10);
  const [amount, setAmount] = useState(150);
  const [bottleType, setBottleType] = useState('formula');
  const [feedNotes, setFeedNotes] = useState('');
  const [diaperType, setDiaperType] = useState('wet');
  const [statusMsg, setStatusMsg] = useState('');

  const babyName = localStorage.getItem('bobo_name') || 'בובו';

  const uploadDirect = async () => {
    setSyncStatus('syncing');
    const all = getAllLocalLogs();
    
    const feedingsPayload = [];
    const diapersPayload = [];
    const solidsPayload = [];
    const growthPayload = [];

    all.forEach(item => {
      const ts = item.created_at || item.measured_at || item.timestamp || new Date().toISOString();
      if (item.food_name) {
        solidsPayload.push({ food_name: item.food_name, reaction: item.reaction || 'liked', notes: item.notes || null, created_at: ts });
      } else if (item.metric_type || item.unit === 'kg' || item.unit === 'cm') {
        growthPayload.push({ metric_type: item.metric_type || 'weight', value: parseFloat(item.value || 0), unit: item.unit || 'kg', notes: item.notes || null, measured_at: ts });
      } else if (item.type === 'wet' || item.type === 'dirty' || (item.type === 'both' && !item.side)) {
        diapersPayload.push({ type: item.type, notes: item.notes || null, created_at: ts });
      } else {
        feedingsPayload.push({
          type: item.type || 'bottle',
          side: item.side || 'both',
          duration_minutes: item.duration_minutes ? parseInt(item.duration_minutes) : null,
          amount_ml: item.amount_ml ? parseInt(item.amount_ml) : null,
          notes: item.notes || null,
          created_at: ts
        });
      }
    });

    let count = 0;
    if (feedingsPayload.length > 0) {
      for (let i = 0; i < feedingsPayload.length; i += 100) {
        const { error } = await supabaseClient.from('feedings').insert(feedingsPayload.slice(i, i + 100));
        if (!error) count += feedingsPayload.slice(i, i + 100).length;
      }
    }
    if (diapersPayload.length > 0) {
      for (let i = 0; i < diapersPayload.length; i += 100) {
        const { error } = await supabaseClient.from('diapers').insert(diapersPayload.slice(i, i + 100));
        if (!error) count += diapersPayload.slice(i, i + 100).length;
      }
    }
    if (solidsPayload.length > 0) {
      const { error } = await supabaseClient.from('solids').insert(solidsPayload);
      if (!error) count += solidsPayload.length;
    }
    if (growthPayload.length > 0) {
      const { error } = await supabaseClient.from('growth_metrics').insert(growthPayload);
      if (!error) count += growthPayload.length;
    }

    setSyncStatus('success');
    setStatusMsg(`הועלו ${count} רשומות בהצלחה!`);
    alert(`הסנכרון הסתיים בהצלחה: ${count} רשומות עלו ל-Supabase.`);
  };

  const saveFeeding = async (type) => {
    const newItem = {
      type,
      side: feedSide,
      duration_minutes: type === 'breastfeeding' ? duration : null,
      amount_ml: type === 'bottle' ? amount : null,
      notes: feedNotes || null,
      created_at: new Date().toISOString()
    };
    const current = JSON.parse(localStorage.getItem('feedings') || '[]');
    const updated = [newItem, ...current];
    localStorage.setItem('feedings', JSON.stringify(updated));
    setTimeline(getAllLocalLogs());
    await supabaseClient.from('feedings').insert([newItem]);
    setActiveSection(null);
  };

  const saveDiaper = async () => {
    const newItem = {
      type: diaperType,
      created_at: new Date().toISOString()
    };
    const current = JSON.parse(localStorage.getItem('diapers') || '[]');
    const updated = [newItem, ...current];
    localStorage.setItem('diapers', JSON.stringify(updated));
    setTimeline(getAllLocalLogs());
    await supabaseClient.from('diapers').insert([newItem]);
    setActiveSection(null);
  };

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col pb-28 text-gray-800">
      <header className="bg-white p-4 sticky top-0 z-40 flex justify-between items-center shadow-sm border-b">
        <div>
          <h1 className="font-extrabold text-base">{babyName}</h1>
          <p className="text-[11px] font-bold text-teal-600">{timeline.length} רשומות שמורות</p>
        </div>
        <button 
          onClick={uploadDirect} 
          disabled={syncStatus === 'syncing'}
          className="text-xs font-bold px-4 py-2.5 bg-teal-500 text-white rounded-xl shadow-md active:scale-95"
        >
          {syncStatus === 'syncing' ? 'מעלה...' : '☁️ סנכרן עכשיו הכל'}
        </button>
      </header>

      <main className="p-4 space-y-4 flex-1">
        {statusMsg && <div className="p-3 bg-green-100 text-green-800 rounded-xl text-center font-bold text-xs">{statusMsg}</div>}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => { setActiveSection('breast'); setFeedType('breastfeeding'); }} className="p-4 rounded-2xl bg-rose-400 text-white font-bold">🤱 הנקה</button>
          <button onClick={() => { setActiveSection('bottle'); setFeedType('bottle'); }} className="p-4 rounded-2xl bg-cyan-400 text-white font-bold">🍼 בקבוק</button>
          <button onClick={() => setActiveSection('diaper')} className="p-4 rounded-2xl bg-amber-400 text-white font-bold col-span-2">🚼 חיתול</button>
        </div>

        {activeSection === 'breast' && (
          <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
            <h3 className="font-bold text-rose-500">הנקה</h3>
            <div className="grid grid-cols-3 gap-2">
              {['left', 'both', 'right'].map(s => <button key={s} onClick={() => setFeedSide(s)} className={`p-2 rounded-xl text-xs font-bold ${feedSide === s ? 'bg-rose-400 text-white' : 'bg-gray-100'}`}>{s === 'left' ? 'שמאל' : s === 'right' ? 'ימין' : 'שניהם'}</button>)}
            </div>
            <button onClick={() => saveFeeding('breastfeeding')} className="w-full py-3 bg-rose-400 text-white rounded-xl font-bold">שמור</button>
          </div>
        )}

        {activeSection === 'bottle' && (
          <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
            <h3 className="font-bold text-cyan-500">בקבוק</h3>
            <input type="number" value={amount} onChange={e => setAmount(parseInt(e.target.value || 0))} className="w-full p-2 border rounded-xl text-center font-bold" />
            <button onClick={() => saveFeeding('bottle')} className="w-full py-3 bg-cyan-400 text-white rounded-xl font-bold">שמור</button>
          </div>
        )}

        {activeSection === 'diaper' && (
          <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
            <h3 className="font-bold text-amber-500">חיתול</h3>
            <div className="grid grid-cols-3 gap-2">
              {['wet', 'dirty', 'both'].map(t => <button key={t} onClick={() => setDiaperType(t)} className={`p-2 rounded-xl text-xs font-bold ${diaperType === t ? 'bg-amber-400 text-white' : 'bg-gray-100'}`}>{t === 'wet' ? 'פיפי' : t === 'dirty' ? 'קקי' : 'שניהם'}</button>)}
            </div>
            <button onClick={saveDiaper} className="w-full py-3 bg-amber-400 text-white rounded-xl font-bold">שמור</button>
          </div>
        )}

        <div className="space-y-2">
          <h2 className="text-sm font-bold text-gray-500">יומן פעולות ({timeline.length})</h2>
          {timeline.slice(0, 50).map((item, i) => (
            <div key={i} className="p-3 bg-white rounded-xl border shadow-sm flex justify-between text-xs font-bold">
              <span>{item.type || item.food_name || item.metric_type || 'פעולה'}</span>
              <span className="text-gray-400">{new Date(item.created_at || item.measured_at || item.timestamp || Date.now()).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
