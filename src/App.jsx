import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const VAPID_PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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

const THEME_CONFIGS = {
  rose: {
    id: 'rose',
    name: 'ורוד בייבי',
    colorHex: '#fb7185',
    primaryBtn: 'bg-rose-400 text-white',
    activeTab: 'text-rose-500 font-extrabold',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    headerGrad: 'from-rose-400 via-orange-300 to-amber-300'
  },
  teal: {
    id: 'teal',
    name: 'טורקיז מנטה',
    colorHex: '#14b8a6',
    primaryBtn: 'bg-teal-500 text-white',
    activeTab: 'text-teal-500 font-extrabold',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
    headerGrad: 'from-teal-400 via-cyan-300 to-emerald-300'
  },
  purple: {
    id: 'purple',
    name: 'סגול לבנדר',
    colorHex: '#a855f7',
    primaryBtn: 'bg-purple-500 text-white',
    activeTab: 'text-purple-500 font-extrabold',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
    headerGrad: 'from-purple-400 via-fuchsia-300 to-indigo-300'
  },
  amber: {
    id: 'amber',
    name: 'כתום שקיעה',
    colorHex: '#f59e0b',
    primaryBtn: 'bg-amber-500 text-white',
    activeTab: 'text-amber-500 font-extrabold',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    headerGrad: 'from-amber-400 via-orange-300 to-rose-300'
  }
};

export default function App() {
  const [feedings, setFeedings] = useState(() => getInitialData('feedings', 'bobo_feedings'));
  const [diapers, setDiapers] = useState(() => getInitialData('diapers', 'bobo_diapers'));
  const [solids, setSolids] = useState(() => getInitialData('solids', 'bobo_solids'));
  const [growthMetrics, setGrowthMetrics] = useState(() => getInitialData('growth_metrics', 'bobo_growth'));
  const [timeline, setTimeline] = useState([]);

  const [activeTab, setActiveTab] = useState('home');
  const [activeSection, setActiveSection] = useState(null); 

  const [themePreset, setThemePreset] = useState(() => localStorage.getItem('bobo_theme') || 'rose');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('bobo_dark') === 'true');
  const [defaultMl, setDefaultMl] = useState(() => parseInt(localStorage.getItem('bobo_def_ml') || '150'));
  const [targetFeeds, setTargetFeeds] = useState(() => parseInt(localStorage.getItem('bobo_target_feeds') || '8'));
  const [targetDiapers, setTargetDiapers] = useState(() => parseInt(localStorage.getItem('bobo_target_diapers') || '6'));
  const [feedIntervalHours, setFeedIntervalHours] = useState(() => parseFloat(localStorage.getItem('bobo_feed_interval')) || 3);
  const [notifyLeadMinutes, setNotifyLeadMinutes] = useState(() => parseInt(localStorage.getItem('bobo_notify_lead') || '10'));

  const [defaultBottleType, setDefaultBottleType] = useState(() => localStorage.getItem('bobo_def_bottle_type') || 'formula');
  const [defaultBreastDuration, setDefaultBreastDuration] = useState(() => parseInt(localStorage.getItem('bobo_def_breast_dur') || '10'));
  const [showVitaminDButton, setShowVitaminDButton] = useState(() => localStorage.getItem('bobo_show_vit_d') !== 'false');
  const [showLastSideStat, setShowLastSideStat] = useState(() => localStorage.getItem('bobo_show_last_side') !== 'false');

  const [babyName, setBabyName] = useState(() => localStorage.getItem('bobo_name') || 'בובו');
  const [babyGender, setBabyGender] = useState(() => localStorage.getItem('bobo_gender') || 'בן');
  const [babyDob, setBabyDob] = useState(() => localStorage.getItem('bobo_dob') || '');

  const [feedType, setFeedType] = useState('breastfeeding'); 
  const [feedSide, setFeedSide] = useState('both');
  const [duration, setDuration] = useState(10);
  const [amount, setAmount] = useState(150);
  const [bottleType, setBottleType] = useState('formula'); 
  const [feedNotes, setFeedNotes] = useState('');
  const [feedSaveStatus, setFeedSaveStatus] = useState('idle');

  const [timerTime, setTimerTime] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timerRef = useRef(null);

  const [diaperType, setDiaperType] = useState('wet'); 
  const [diaperNotes, setDiaperNotes] = useState('');
  const [diaperSaveStatus, setDiaperSaveStatus] = useState('idle');

  const [solidFood, setSolidFood] = useState('');
  const [solidReaction, setSolidReaction] = useState('liked');
  const [solidNotes, setSolidNotes] = useState('');
  const [solidSaveStatus, setSolidSaveStatus] = useState('idle');

  const [growthType, setGrowthType] = useState('weight');
  const [growthValue, setGrowthValue] = useState('');
  const [growthNotes, setGrowthNotes] = useState('');
  const [growthSaveStatus, setGrowthSaveStatus] = useState('idle');

  const [editingItem, setEditingItem] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [editValue1, setEditValue1] = useState(''); 
  const [editSelect1, setEditSelect1] = useState(''); 
  const [editSelect2, setEditSelect2] = useState(''); 
  const [editTimestamp, setEditTimestamp] = useState(''); 
  const [editSaveStatus, setEditSaveStatus] = useState('idle');

  const [vitDSuccess, setVitDSuccess] = useState(false);
  const [expandedPumpingDate, setExpandedPumpingDate] = useState(null);

  const [lastFeedTime, setLastFeedTime] = useState(null);
  const [timeToNextFeed, setTimeToNextFeed] = useState(null);
  
  const [timelineFilter, setTimelineFilter] = useState('all');
  const [selectedTimelineDate, setSelectedTimelineDate] = useState('');

  const [showReportModal, setShowReportModal] = useState(false);
  const [trendsDaysRange, setTrendsDaysRange] = useState(7);
  const [activeTrendTooltip, setActiveTrendTooltip] = useState(null);
  
  const fileInputRef = useRef(null);
  const jsonUploaderRef = useRef(null);
  const currentTheme = THEME_CONFIGS[themePreset] || THEME_CONFIGS.rose;

  const quickSolids = ['בטטה', 'גזר', 'קישוא', 'דלעת', 'בננה', 'אבוקדו', 'טחינה', 'תפוח'];

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
    localStorage.setItem(`bobo_${key}`, JSON.stringify(data));
  };

  const isToday = (timestamp) => {
    if (!timestamp) return false;
    const date = new Date(timestamp);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const getTagColor = (item) => {
    if (item.logType === 'vitamin_d') return 'text-violet-700 bg-violet-100 dark:text-violet-200 dark:bg-violet-900/50';
    if (item.logType === 'pumping') return 'text-purple-700 bg-purple-100 dark:text-purple-200 dark:bg-purple-900/50';
    if (item.logType === 'feeding') {
      return item.type === 'breastfeeding' ? 'text-rose-700 bg-rose-100 dark:text-rose-200 dark:bg-rose-900/50' : 'text-cyan-700 bg-cyan-100 dark:text-cyan-200 dark:bg-cyan-900/50';
    }
    if (item.logType === 'diaper') return 'text-amber-700 bg-amber-100 dark:text-amber-200 dark:bg-amber-900/50';
    if (item.logType === 'solid') return 'text-emerald-700 bg-emerald-100 dark:text-emerald-200 dark:bg-emerald-900/50';
    if (item.logType === 'growth') return 'text-teal-700 bg-teal-100 dark:text-teal-200 dark:bg-teal-900/50';
    return 'text-gray-600 bg-gray-50 dark:text-gray-300 dark:bg-gray-800';
  };

  const getNodeColor = (item) => {
    if (item.logType === 'vitamin_d') return 'bg-violet-400 ring-violet-100 dark:ring-violet-900';
    if (item.logType === 'pumping') return 'bg-purple-400 ring-purple-100 dark:ring-purple-900';
    if (item.logType === 'feeding') {
      return item.type === 'breastfeeding' ? 'bg-rose-400 ring-rose-100 dark:ring-rose-900' : 'bg-cyan-400 ring-cyan-100 dark:ring-cyan-900';
    }
    if (item.logType === 'diaper') return 'bg-amber-400 ring-amber-100 dark:ring-amber-900';
    if (item.logType === 'solid') return 'bg-emerald-400 ring-emerald-100 dark:ring-emerald-900';
    if (item.logType === 'growth') return 'bg-teal-400 ring-teal-100 dark:ring-teal-900';
    return 'bg-gray-400 ring-gray-100 dark:ring-gray-800';
  };

  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); } 
    else { document.documentElement.classList.remove('dark'); }
    localStorage.setItem('bobo_dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const significantFeedings = feedings.filter(f => {
      const isNotVitD = !f.notes?.includes('ויטמין D');
      const isNotPumping = !f.notes?.includes('[שאיבת_חלב]') && f.type !== 'pumping';
      const isSignificant = f.type === 'breastfeeding' || (f.type === 'bottle' && (f.amount_ml || 0) >= 60);
      return isNotVitD && isNotPumping && isSignificant;
    });

    if (significantFeedings.length > 0) {
      const lastTime = new Date(significantFeedings[0].created_at || significantFeedings[0].timestamp).getTime();
      setLastFeedTime(lastTime);
    } else {
      setLastFeedTime(null);
    }
  }, [feedings]);

  useEffect(() => {
    if (!lastFeedTime) {
      setTimeToNextFeed(null);
      return;
    }
    const intervalMs = feedIntervalHours * 60 * 60 * 1000;
    const targetTime = lastFeedTime + intervalMs;
    const updateCountdown = () => setTimeToNextFeed(targetTime - Date.now());
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lastFeedTime, feedIntervalHours]);

  useEffect(() => {
    if (isTimerActive) {
      timerRef.current = setInterval(() => {
        setTimerTime(p => {
          const next = p + 1;
          setDuration(Math.max(1, Math.ceil(next / 60)));
          return next;
        });
      }, 1000);
    } else { if (timerRef.current) clearInterval(timerRef.current); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerActive]);

  // ייבוא וסנכרון ישיר מה-JSON ששמור בנייד
  const handleDirectBackupUpload = (e) => {
    const fileReader = new FileReader();
    if (!e.target.files || e.target.files.length === 0) return;
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const f = data.feedings || [];
        const d = data.diapers || [];
        const s = data.solids || [];
        const g = data.growthMetrics || [];

        setFeedings(f); saveToLocal('feedings', f);
        setDiapers(d); saveToLocal('diapers', d);
        setSolids(s); saveToLocal('solids', s);
        setGrowthMetrics(g); saveToLocal('growth_metrics', g);

        let count = 0;
        if (f.length > 0) {
          const payload = f.map(item => ({
            type: item.type || 'bottle',
            side: item.side || 'both',
            duration_minutes: item.duration_minutes || null,
            amount_ml: item.amount_ml || null,
            notes: item.notes || null,
            created_at: item.created_at || item.timestamp || new Date().toISOString()
          }));
          for (let i = 0; i < payload.length; i += 100) {
            await supabaseClient.from('feedings').insert(payload.slice(i, i + 100));
          }
          count += payload.length;
        }

        if (d.length > 0) {
          const payload = d.map(item => ({
            type: item.type || 'wet',
            notes: item.notes || null,
            created_at: item.created_at || item.timestamp || new Date().toISOString()
          }));
          for (let i = 0; i < payload.length; i += 100) {
            await supabaseClient.from('diapers').insert(payload.slice(i, i + 100));
          }
          count += payload.length;
        }

        alert(`✅ הגיבוי נטען ו-${count} רשומות עלו בהצלחה ל-Supabase!`);
      } catch (err) {
        alert("שגיאה בטעינת הקובץ: " + err.message);
      }
    };
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
    saveToLocal('feedings', updated);

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
      setFeedNotes(''); setTimerTime(0); setIsTimerActive(false); setActiveSection(null); setFeedSide('both'); setFeedSaveStatus('idle');
    }, 800);
  };

  const saveDiaper = async () => {
    setDiaperSaveStatus('saving');
    const newItem = {
      id: Date.now().toString(),
      type: diaperType,
      notes: diaperNotes || null,
      created_at: new Date().toISOString()
    };
    const updated = [newItem, ...diapers];
    setDiapers(updated);
    saveToLocal('diapers', updated);

    supabaseClient.from('diapers').insert([{
      type: newItem.type,
      notes: newItem.notes,
      created_at: newItem.created_at
    }]).then();

    setDiaperSaveStatus('success');
    setTimeout(() => {
      setDiaperNotes(''); setActiveSection(null); setDiaperSaveStatus('idle');
    }, 800);
  };

  const saveSolid = async () => {
    if (!solidFood.trim()) return;
    setSolidSaveStatus('saving');
    const newItem = {
      id: Date.now().toString(),
      food_name: solidFood.trim(),
      reaction: solidReaction,
      notes: solidNotes.trim() || null,
      created_at: new Date().toISOString()
    };
    const updated = [newItem, ...solids];
    setSolids(updated);
    saveToLocal('solids', updated);

    supabaseClient.from('solids').insert([{
      food_name: newItem.food_name,
      reaction: newItem.reaction,
      notes: newItem.notes,
      created_at: newItem.created_at
    }]).then();

    setSolidSaveStatus('success');
    setTimeout(() => {
      setSolidFood(''); setSolidNotes(''); setSolidReaction('liked'); setActiveSection(null); setSolidSaveStatus('idle');
    }, 800);
  };

  const logVitaminD = async () => {
    const newItem = {
      id: Date.now().toString(),
      type: 'bottle',
      side: 'both',
      amount_ml: null,
      duration_minutes: null,
      notes: '💊 ויטמין D - 2 טיפות',
      created_at: new Date().toISOString()
    };
    const updated = [newItem, ...feedings];
    setFeedings(updated);
    saveToLocal('feedings', updated);
    setVitDSuccess(true);
    setTimeout(() => setVitDSuccess(false), 1500);
  };

  const saveGrowth = async () => {
    const num = parseFloat(growthValue);
    if (isNaN(num) || num <= 0) return;
    setGrowthSaveStatus('saving');
    const newItem = {
      id: Date.now().toString(),
      metric_type: growthType,
      value: num,
      unit: growthType === 'weight' ? 'kg' : 'cm',
      notes: growthNotes || null,
      measured_at: new Date().toISOString()
    };
    const updated = [newItem, ...growthMetrics];
    setGrowthMetrics(updated);
    saveToLocal('growth_metrics', updated);

    supabaseClient.from('growth_metrics').insert([{
      metric_type: newItem.metric_type,
      value: newItem.value,
      unit: newItem.unit,
      notes: newItem.notes,
      measured_at: newItem.measured_at
    }]).then();

    setGrowthSaveStatus('success');
    setTimeout(() => {
      setGrowthValue(''); setGrowthNotes(''); setGrowthSaveStatus('idle');
    }, 800);
  };

  const deleteTimelineItem = (item) => {
    if (!confirm('האם למחוק פעולה זו מהיומן?')) return;
    if (item.logType === 'feeding' || item.logType === 'vitamin_d' || item.logType === 'pumping') {
      const updated = feedings.filter(f => f.id !== item.id);
      setFeedings(updated);
      saveToLocal('feedings', updated);
    } else if (item.logType === 'diaper') {
      const updated = diapers.filter(d => d.id !== item.id);
      setDiapers(updated);
      saveToLocal('diapers', updated);
    } else if (item.logType === 'solid') {
      const updated = solids.filter(s => s.id !== item.id);
      setSolids(updated);
      saveToLocal('solids', updated);
    } else if (item.logType === 'growth') {
      const updated = growthMetrics.filter(g => g.id !== item.id);
      setGrowthMetrics(updated);
      saveToLocal('growth_metrics', updated);
    }
  };

  const getBabyAge = () => {
    if (!babyDob) return babyGender === 'בת' ? 'בת' : 'בן';
    const days = Math.floor((new Date().getTime() - new Date(babyDob).getTime()) / (1000 * 60 * 60 * 24));
    const prefix = babyGender === 'בת' ? 'בת' : 'בן';
    if (days <= 0) return `${prefix} היום`; if (days < 7) return `${prefix} ${days} ימים`;
    if (days < 28) return `${prefix} ${Math.floor(days / 7)} שבועות`;
    return `${prefix} ${Math.floor(days / 30.4)} חודשים`;
  };

  const actualBabyFeedings = feedings.filter(f => !f.notes?.includes('ויטמין D') && !f.notes?.includes('[שאיבת_חלב]') && f.type !== 'pumping');
  const actualFeedingsToday = actualBabyFeedings.filter(f => isToday(f.created_at || f.timestamp));
  const todaysDiapers = diapers.filter(d => isToday(d.created_at || d.timestamp));
  const mainTimelineLogs = timeline.filter(item => item.logType !== 'growth');
  const todaysTimeline = mainTimelineLogs.filter(item => isToday(item.timestamp));

  const totalDurationToday = actualFeedingsToday.filter(f => f.type === 'breastfeeding').reduce((a, c) => a + (c.duration_minutes || 0), 0);
  const totalMlToday = actualFeedingsToday.filter(f => f.type === 'bottle').reduce((a, c) => a + (c.amount_ml || 0), 0);
  const lastActionWithSide = mainTimelineLogs.find(item => item.logType === 'feeding');
  const lastSide = lastActionWithSide?.side || 'both';

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col pb-28 text-gray-800 dark:text-gray-100 relative">
      <header className="bg-white/90 dark:bg-gray-800/95 backdrop-blur-md p-4 sticky top-0 z-40 flex justify-between items-center shadow-sm border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 bg-gradient-to-tr ${currentTheme.headerGrad} text-white rounded-2xl flex items-center justify-center text-2xl shadow-md`}>👶</div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-gray-900 dark:text-white text-base">{babyName}</h1>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${currentTheme.badge}`}>{getBabyAge()}</span>
            </div>
            <p className="text-[10px] font-bold text-teal-500">● {timeline.length} רשומות</p>
          </div>
        </div>
        
        <button 
          onClick={() => jsonUploaderRef.current?.click()} 
          className="text-xs font-bold bg-gradient-to-r from-teal-400 to-emerald-400 text-white px-3.5 py-2 rounded-xl shadow-md active:scale-95"
        >
          ☁️ סנכרן מגיבוי
        </button>
        <input ref={jsonUploaderRef} type="file" accept=".json" onChange={handleDirectBackupUpload} className="hidden" />
      </header>

      <main className="p-4 space-y-4 flex-1 relative">
        {activeTab === 'home' && (
          <>
            <div className="grid grid-cols-2 gap-2.5 text-white">
              <div className="bg-gradient-to-br from-rose-400 to-rose-500 p-3.5 rounded-3xl shadow-lg flex flex-col justify-between">
                <div className="flex justify-between items-center"><span className="text-[11px] font-bold opacity-90">🍼 אכילות היום</span><span className="font-black text-sm">{actualFeedingsToday.length}/{targetFeeds}</span></div>
                <p className="text-[10px] font-medium opacity-90 mt-2">{totalDurationToday > 0 && `${totalDurationToday} דק'`} {totalMlToday > 0 && `| ${totalMlToday} מ"ל`}</p>
              </div>

              <div className="bg-gradient-to-br from-amber-400 to-amber-500 p-3.5 rounded-3xl shadow-lg flex flex-col justify-between">
                <div className="flex justify-between items-center"><span className="text-[11px] font-bold opacity-90">🚼 חיתולים היום</span><span className="font-black text-sm">{todaysDiapers.length}/{targetDiapers}</span></div>
                <p className="text-[10px] font-medium opacity-90 mt-2">{todaysDiapers.length} הוחלפו היום</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button onClick={() => { setActiveSection(activeSection === 'breast' ? null : 'breast'); setFeedType('breastfeeding'); }} className={`p-4 rounded-3xl font-bold text-sm ${activeSection === 'breast' ? 'bg-rose-400 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-rose-500 shadow-sm border border-rose-100 dark:border-gray-700'}`}>🤱 הנקה</button>
              <button onClick={() => { setActiveSection(activeSection === 'bottle' ? null : 'bottle'); setFeedType('bottle'); }} className={`p-4 rounded-3xl font-bold text-sm ${activeSection === 'bottle' ? 'bg-cyan-400 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-cyan-500 shadow-sm border border-cyan-100 dark:border-gray-700'}`}>🍼 בקבוק</button>
              <button onClick={() => { setActiveSection(activeSection === 'pumping' ? null : 'pumping'); setFeedType('pumping'); }} className={`p-4 rounded-3xl font-bold text-sm ${activeSection === 'pumping' ? 'bg-purple-400 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-purple-500 shadow-sm border border-purple-100 dark:border-gray-700'}`}>🥛 שאיבה</button>
              <button onClick={() => setActiveSection(activeSection === 'diaper' ? null : 'diaper')} className={`p-4 rounded-3xl font-bold text-sm ${activeSection === 'diaper' ? 'bg-amber-400 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-amber-500 shadow-sm border border-amber-100 dark:border-gray-700'}`}>🚼 חיתול</button>
              <button onClick={() => setActiveSection(activeSection === 'solid' ? null : 'solid')} className={`p-4 rounded-3xl font-bold text-sm col-span-2 ${activeSection === 'solid' ? 'bg-emerald-500 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-emerald-600 shadow-sm border border-emerald-100 dark:border-gray-700'}`}>🥑 טעימות מוצקים</button>
              {showVitaminDButton && <button onClick={logVitaminD} className={`p-3 rounded-3xl font-bold text-sm col-span-2 ${vitDSuccess ? 'bg-teal-400 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-violet-500 shadow-sm border border-violet-100 dark:border-gray-700'}`}>💊 ויטמין D (2 טיפות)</button>}
            </div>

            {activeSection === 'breast' && (
              <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-lg border space-y-4">
                <h3 className="font-bold text-rose-500 text-sm">🤱 עדכון הנקה</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['left', 'both', 'right'].map(s => <button key={s} onClick={() => setFeedSide(s)} className={`py-3 rounded-2xl text-sm font-bold ${feedSide === s ? 'bg-rose-400 text-white' : 'bg-gray-50 dark:bg-gray-700'}`}>{s === 'left' ? 'שמאל' : s === 'right' ? 'ימין' : 'שניהם'}</button>)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">דקות:</span>
                  <input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value || 1))} className="w-20 text-center font-bold p-2 bg-gray-50 dark:bg-gray-700 rounded-xl" />
                </div>
                <button onClick={() => saveFeeding('breastfeeding')} className="w-full font-bold py-3.5 rounded-xl bg-rose-400 text-white">שמור</button>
              </div>
            )}

            {activeSection === 'bottle' && (
              <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-lg border space-y-4">
                <h3 className="font-bold text-cyan-500 text-sm">🍼 עדכון בקבוק</h3>
                <div className="grid grid-cols-2 gap-2 bg-cyan-50/40 p-1.5 rounded-xl">
                  <button onClick={() => setBottleType('formula')} className={`py-2 rounded-xl text-xs font-bold ${bottleType === 'formula' ? 'bg-cyan-400 text-white' : 'text-gray-500'}`}>תמ"ל</button>
                  <button onClick={() => setBottleType('expressed')} className={`py-2 rounded-xl text-xs font-bold ${bottleType === 'expressed' ? 'bg-cyan-400 text-white' : 'text-gray-500'}`}>שאוב</button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-gray-500">כמות (מ"ל):</span>
                  <input type="number" value={amount} onChange={e => setAmount(parseInt(e.target.value || 0))} className="w-24 text-center font-bold p-2 bg-gray-50 dark:bg-gray-700 rounded-xl" />
                </div>
                <button onClick={() => saveFeeding('bottle')} className="w-full font-bold py-3.5 rounded-xl bg-cyan-400 text-white">שמור</button>
              </div>
            )}

            {activeSection === 'diaper' && (
              <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-lg border space-y-4">
                <h3 className="font-bold text-amber-500 text-sm">🚼 עדכון חיתול</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['wet', 'dirty', 'both'].map(t => <button key={t} onClick={() => setDiaperType(t)} className={`py-3.5 rounded-2xl text-sm font-bold ${diaperType === t ? 'bg-amber-400 text-white' : 'bg-gray-50 dark:bg-gray-700'}`}>{t === 'wet' ? '💧 פיפי' : t === 'dirty' ? '💩 קקי' : '✨ שניהם'}</button>)}
                </div>
                <button onClick={saveDiaper} className="w-full font-bold py-3.5 rounded-xl bg-amber-400 text-white">שמור</button>
              </div>
            )}

            {activeSection === 'solid' && (
              <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-lg border space-y-4">
                <h3 className="font-bold text-emerald-600 text-sm">🥑 עדכון טעימות</h3>
                <div className="flex flex-wrap gap-1.5">
                  {quickSolids.map(food => (
                    <button key={food} type="button" onClick={() => setSolidFood(food)} className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${solidFood === food ? 'bg-emerald-500 text-white' : 'bg-gray-50 dark:bg-gray-700'}`}>{food}</button>
                  ))}
                </div>
                <input type="text" value={solidFood} onChange={e => setSolidFood(e.target.value)} placeholder="שם המאכל..." className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl font-bold" />
                <button onClick={saveSolid} className="w-full font-bold py-3.5 rounded-xl bg-emerald-500 text-white">שמור טעימה</button>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-gray-400">ציר זמן היום ({todaysTimeline.length})</h3>
              <div className="space-y-3">
                {todaysTimeline.map((item, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold">{item.logType === 'feeding' ? (item.type === 'breastfeeding' ? '🤱 הנקה' : '🍼 בקבוק') : item.logType === 'diaper' ? '🚼 חיתול' : item.logType === 'solid' ? '🥑 טעימה' : item.logType}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${getTagColor(item)}`}>{item.duration_minutes ? `${item.duration_minutes} דק'` : item.amount_ml ? `${item.amount_ml} מ"ל` : item.type}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{new Date(item.timestamp).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                    <button onClick={() => deleteTimelineItem(item)} className="text-xs bg-red-50 text-red-500 px-2.5 py-1.5 rounded-xl font-bold">🗑️</button>
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
              <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex justify-between items-center">
                <div>
                  <span className="text-sm font-bold">{item.logType}</span>
                  <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleDateString('he-IL')} {new Date(item.timestamp).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}</p>
                </div>
                <button onClick={() => deleteTimelineItem(item)} className="text-xs bg-red-50 text-red-500 px-2.5 py-1.5 rounded-xl font-bold">🗑️</button>
              </div>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-3 left-4 right-4 max-w-md mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-100 dark:border-gray-700 shadow-2xl rounded-3xl p-1.5 z-50 flex justify-between items-center">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-2xl flex-1 ${activeTab === 'home' ? currentTheme.activeTab : 'text-gray-400'}`}>🏠 בית</button>
        <button onClick={() => setActiveTab('timeline')} className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-2xl flex-1 ${activeTab === 'timeline' ? currentTheme.activeTab : 'text-gray-400'}`}>📋 יומן ({timeline.length})</button>
      </nav>
    </div>
  );
}
