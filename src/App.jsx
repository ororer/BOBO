import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const getInitialData = (key, fallbackKey) => {
  try {
    const raw = localStorage.getItem(key) || localStorage.getItem(fallbackKey);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const supabaseUrl = "https://zebyzpsffpvdaoqrhonq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYnl6cHNmZnB2ZGFvcXJob25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MjYyMDYsImV4cCI6MjA5OTAwMjIwNn0.MYlkEAjcr4nzF7SzNjen9Jjux-FnCksj-BdrjB4F3pA";
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  const [feedings, setFeedings] = useState(() => getInitialData('bobo_feedings', 'bobo_cache_feedings'));
  const [diapers, setDiapers] = useState(() => getInitialData('bobo_diapers', 'bobo_cache_diapers'));
  const [solids, setSolids] = useState(() => getInitialData('bobo_solids', 'bobo_cache_solids'));
  const [growthMetrics, setGrowthMetrics] = useState(() => getInitialData('bobo_growth', 'bobo_cache_growth'));
  const [timeline, setTimeline] = useState([]);

  const [activeTab, setActiveTab] = useState('home');
  const [activeSection, setActiveSection] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');

  const [feedType, setFeedType] = useState('breastfeeding');
  const [feedSide, setFeedSide] = useState('both');
  const [duration, setDuration] = useState(10);
  const [amount, setAmount] = useState(150);
  const [bottleType, setBottleType] = useState('formula');
  const [feedNotes, setFeedNotes] = useState('');
  const [feedSaveStatus, setFeedSaveStatus] = useState('idle');

  const [diaperType, setDiaperType] = useState('wet');
  const [diaperSaveStatus, setDiaperSaveStatus] = useState('idle');

  const babyName = localStorage.getItem('bobo_name') || 'בובו';

  const rebuildTimeline = (fList, dList, sList, gList) => {
    const combined = [
      ...fList.map(f => ({ ...f, logType: f.notes?.includes('ויטמין D') ? 'vitamin_d' : f.type === 'pumping' || f.notes?.includes('[שאיבת_חלב]') ? 'pumping' : 'feeding', timestamp: f.created_at || f.timestamp })),
      ...dList.map(d => ({ ...d, logType: 'diaper', timestamp: d.created_at || d.timestamp })),
      ...sList.map(s => ({ ...s, logType: 'solid', timestamp: s.created_at || s.timestamp })),
      ...gList.map(g => ({ ...g, logType: 'growth', timestamp: g.measured_at || g.timestamp }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setTimeline(combined);
  };

  useEffect(() => {
    rebuildTimeline(feedings, diapers, solids, growthMetrics);
  }, [feedings, diapers, solids, growthMetrics]);

  const saveToLocal = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(`bobo_cache_${key.replace('bobo_', '')}`, JSON.stringify(data));
  };

  const isToday = (timestamp) => {
    if (!timestamp) return false;
    const date = new Date(timestamp);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // פעולת סנכרון מבוקרת ומאובטחת ל-Supabase
  const uploadAllToSupabase = async () => {
    setSyncStatus('syncing');
    try {
      let count = 0;

      // 1. העלאת האכלות
      if (feedings.length > 0) {
        const payload = feedings.map(f => ({
          type: f.type || 'bottle',
          side: f.side || 'both',
          duration_minutes: f.duration_minutes || null,
          amount_ml: f.amount_ml || null,
          notes: f.notes || null,
          created_at: f.created_at || f.timestamp || new Date().toISOString()
        }));
        const { error } = await supabaseClient.from('feedings').insert(payload);
        if (!error) count += payload.length;
      }

      // 2. העלאת חיתולים
      if (diapers.length > 0) {
        const payload = diapers.map(d => ({
          type: d.type || 'wet',
          notes: d.notes || null,
          created_at: d.created_at || d.timestamp || new Date().toISOString()
        }));
        const { error } = await supabaseClient.from('diapers').insert(payload);
        if (!error) count += payload.length;
      }

      // 3. העלאת מוצקים
      if (solids.length > 0) {
        const payload = solids.map(s => ({
          food_name: s.food_name || 'אוכל',
          reaction: s.reaction || 'liked',
          notes: s.notes || null,
          created_at: s.created_at || s.timestamp || new Date().toISOString()
        }));
        const { error } = await supabaseClient.from('solids').insert(payload);
        if (!error) count += payload.length;
      }

      // 4. העלאת מדדי גדילה
      if (growthMetrics.length > 0) {
        const payload = growthMetrics.map(g => ({
          metric_type: g.metric_type || 'weight',
          value: parseFloat(g.value || 0),
          unit: g.unit || 'kg',
          notes: g.notes || null,
          measured_at: g.measured_at || g.timestamp || new Date().toISOString()
        }));
        const { error } = await supabaseClient.from('growth_metrics').insert(payload);
        if (!error) count += payload.length;
      }

      setSyncStatus('success');
      alert(`✅ הסנכרון הצליח! ${count} רשומות הועלו בהצלחה ל-Supabase.`);
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err) {
      alert('שגיאה בסנכרון: ' + err.message);
      setSyncStatus('idle');
    }
  };

  const saveFeeding = async (customType) => {
    setFeedSaveStatus('saving');
    const currentType = customType || feedType;
    let finalType = currentType;
    let finalNotes = feedNotes;
    
    if (currentType === 'bottle') {
      finalNotes = `[${bottleType === 'expressed' ? 'שאוב' : 'תמ"ל'}] ${feedNotes}`.trim();
    } else if (currentType === 'pumping') {
      finalType = 'bottle';
      finalNotes = `[שאיבת_חלב] ${feedNotes}`.trim();
    }

    const newItem = {
      id: Date.now().toString(),
      type: finalType,
      side: feedSide,
      duration_minutes: currentType === 'breastfeeding' ? duration : null,
      amount_ml: (currentType === 'bottle' || currentType === 'pumping') ? amount : null,
      notes: finalNotes || null,
      created_at: new Date().toISOString()
    };

    const updated = [newItem, ...feedings];
    setFeedings(updated);
    saveToLocal('bobo_feedings', updated);

    // שמירה מיידית גם בענן ברקע
    supabaseClient.from('feedings').insert([{
      type: newItem.type,
      side: newItem.side,
      duration_minutes: newItem.duration_minutes,
      amount_ml: newItem.amount_ml,
      notes: newItem.notes,
      created_at: newItem.created_at
    }]).then();

    setFeedSaveStatus('success');
    setTimeout(() => {
      setFeedNotes(''); setActiveSection(null); setFeedSide('both'); setFeedSaveStatus('idle');
    }, 800);
  };

  const saveDiaper = async () => {
    setDiaperSaveStatus('saving');
    const newItem = {
      id: Date.now().toString(),
      type: diaperType,
      created_at: new Date().toISOString()
    };
    const updated = [newItem, ...diapers];
    setDiapers(updated);
    saveToLocal('bobo_diapers', updated);

    supabaseClient.from('diapers').insert([{
      type: newItem.type,
      created_at: newItem.created_at
    }]).then();

    setDiaperSaveStatus('success');
    setTimeout(() => {
      setActiveSection(null); setDiaperSaveStatus('idle');
    }, 800);
  };

  const actualFeedingsToday = feedings.filter(f => !f.notes?.includes('ויטמין D') && !f.notes?.includes('[שאיבת_חלב]') && f.type !== 'pumping' && isToday(f.created_at || f.timestamp));
  const todaysDiapers = diapers.filter(d => isToday(d.created_at || d.timestamp));
  const todaysTimeline = timeline.filter(item => isToday(item.timestamp) && item.logType !== 'growth');

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col pb-28 text-gray-800 dark:text-gray-100 relative">
      <header className="bg-white p-4 sticky top-0 z-40 flex justify-between items-center shadow-sm border-b">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-tr from-rose-400 via-orange-300 to-amber-300 text-white rounded-2xl flex items-center justify-center text-2xl shadow-md">👶</div>
          <div>
            <h1 className="font-extrabold text-gray-900 text-base">{babyName}</h1>
            <p className="text-[10px] font-bold text-teal-500">● {timeline.length} רשומות ביומן</p>
          </div>
        </div>
        <button 
          onClick={uploadAllToSupabase} 
          disabled={syncStatus === 'syncing'}
          className={`text-xs font-bold px-3 py-2 rounded-xl transition active:scale-95 shadow-sm flex items-center gap-1.5 ${
            syncStatus === 'syncing' ? 'bg-amber-100 text-amber-700' : syncStatus === 'success' ? 'bg-green-500 text-white' : 'bg-teal-500 text-white'
          }`}
        >
          <span>☁️</span>
          <span>{syncStatus === 'syncing' ? 'מעלה...' : syncStatus === 'success' ? 'סונכרן ✓' : 'העלה לענן'}</span>
        </button>
      </header>

      <main className="p-4 space-y-4 flex-1">
        {activeTab === 'home' && (
          <>
            <div className="grid grid-cols-2 gap-2.5 text-white">
              <div className="bg-gradient-to-br from-rose-400 to-rose-500 p-3.5 rounded-3xl shadow-lg flex flex-col justify-between">
                <span className="text-[11px] font-bold opacity-90">🍼 אכילות היום</span>
                <span className="font-black text-lg mt-1">{actualFeedingsToday.length} ארוחות</span>
              </div>
              <div className="bg-gradient-to-br from-amber-400 to-amber-500 p-3.5 rounded-3xl shadow-lg flex flex-col justify-between">
                <span className="text-[11px] font-bold opacity-90">🚼 חיתולים היום</span>
                <span className="font-black text-lg mt-1">{todaysDiapers.length} הוחלפו</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button onClick={() => { setActiveSection(activeSection === 'breast' ? null : 'breast'); setFeedType('breastfeeding'); }} className={`p-4 rounded-3xl font-bold text-sm ${activeSection === 'breast' ? 'bg-rose-400 text-white' : 'bg-white text-rose-500 border'}`}>🤱 הנקה</button>
              <button onClick={() => { setActiveSection(activeSection === 'bottle' ? null : 'bottle'); setFeedType('bottle'); }} className={`p-4 rounded-3xl font-bold text-sm ${activeSection === 'bottle' ? 'bg-cyan-400 text-white' : 'bg-white text-cyan-500 border'}`}>🍼 בקבוק</button>
              <button onClick={() => setActiveSection(activeSection === 'diaper' ? null : 'diaper')} className={`p-4 rounded-3xl font-bold text-sm col-span-2 ${activeSection === 'diaper' ? 'bg-amber-400 text-white' : 'bg-white text-amber-500 border'}`}>🚼 חיתול</button>
            </div>

            {activeSection === 'breast' && (
              <div className="bg-white p-5 rounded-3xl shadow-lg border space-y-4">
                <h3 className="font-bold text-rose-500 text-sm">🤱 עדכון הנקה</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['left', 'both', 'right'].map(s => <button key={s} onClick={() => setFeedSide(s)} className={`py-3 rounded-2xl text-sm font-bold ${feedSide === s ? 'bg-rose-400 text-white' : 'bg-gray-50'}`}>{s === 'left' ? 'שמאל' : s === 'right' ? 'ימין' : 'שניהם'}</button>)}
                </div>
                <button onClick={() => saveFeeding('breastfeeding')} className="w-full font-bold py-3.5 rounded-xl bg-rose-400 text-white">שמור</button>
              </div>
            )}

            {activeSection === 'bottle' && (
              <div className="bg-white p-5 rounded-3xl shadow-lg border space-y-4">
                <h3 className="font-bold text-cyan-500 text-sm">🍼 עדכון בקבוק</h3>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-gray-500">כמות (מ"ל):</span>
                  <input type="number" value={amount} onChange={e => setAmount(parseInt(e.target.value || 0))} className="w-24 text-center font-bold p-2 bg-gray-50 rounded-xl" />
                </div>
                <button onClick={() => saveFeeding('bottle')} className="w-full font-bold py-3.5 rounded-xl bg-cyan-400 text-white">שמור</button>
              </div>
            )}

            {activeSection === 'diaper' && (
              <div className="bg-white p-5 rounded-3xl shadow-lg border space-y-4">
                <h3 className="font-bold text-amber-500 text-sm">🚼 עדכון חיתול</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['wet', 'dirty', 'both'].map(t => <button key={t} onClick={() => setDiaperType(t)} className={`py-3.5 rounded-2xl text-sm font-bold ${diaperType === t ? 'bg-amber-400 text-white' : 'bg-gray-50'}`}>{t === 'wet' ? '💧 פיפי' : t === 'dirty' ? '💩 קקי' : '✨ שניהם'}</button>)}
                </div>
                <button onClick={saveDiaper} className="w-full font-bold py-3.5 rounded-xl bg-amber-400 text-white">שמור</button>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-gray-400">ציר זמן היום ({todaysTimeline.length})</h3>
              <div className="space-y-3">
                {todaysTimeline.map((item, i) => (
                  <div key={i} className="bg-white p-4 rounded-3xl border shadow-sm flex justify-between items-center">
                    <div>
                      <span className="text-sm font-bold">{item.logType === 'feeding' ? (item.type === 'breastfeeding' ? '🤱 הנקה' : '🍼 בקבוק') : '🚼 חיתול'}</span>
                      <p className="text-xs text-gray-400 mt-1">{new Date(item.timestamp).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-3">
            <h2 className="text-base font-bold">📋 כל ההיסטוריה ({timeline.length} רשומות)</h2>
            {timeline.map((item, i) => (
              <div key={i} className="bg-white p-4 rounded-3xl border shadow-sm flex justify-between items-center">
                <span className="text-sm font-bold">{item.logType}</span>
                <span className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleDateString('he-IL')} {new Date(item.timestamp).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}</span>
              </div>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-3 left-4 right-4 max-w-md mx-auto bg-white/90 backdrop-blur-xl border shadow-2xl rounded-3xl p-1.5 z-50 flex justify-between items-center">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-2xl flex-1 ${activeTab === 'home' ? 'text-rose-500 font-bold' : 'text-gray-400'}`}>🏠 בית</button>
        <button onClick={() => setActiveTab('timeline')} className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-2xl flex-1 ${activeTab === 'timeline' ? 'text-rose-500 font-bold' : 'text-gray-400'}`}>📋 יומן ({timeline.length})</button>
      </nav>
    </div>
  );
}
