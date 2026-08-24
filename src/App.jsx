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

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    try {
      return typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted';
    } catch (e) {
      return false;
    }
  });

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

  const handleThemeChange = (newTheme) => {
    setThemePreset(newTheme);
    localStorage.setItem('bobo_theme', newTheme);
  };

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

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationsEnabled(perm === 'granted');
        if (perm === 'granted' && 'serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification(`בובו - ההתראות הופעלו! 👶`, {
            body: `תקבל תזכורת כ-${notifyLeadMinutes} דקות לפני כל האכלה.`,
            tag: 'bobo-welcome'
          });
        }
      } catch (e) {
        console.error('Notification error:', e);
      }
    }
  };

  const handleImportBackup = (e) => {
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
        if (data.babyName) { setBabyName(data.babyName); localStorage.setItem('bobo_name', data.babyName); }

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

        if (s.length > 0) {
          await supabaseClient.from('solids').insert(s);
          count += s.length;
        }

        if (g.length > 0) {
          await supabaseClient.from('growth_metrics').insert(g);
          count += g.length;
        }

        alert(`✅ הגיבוי שוחזר בהצלחה ו-${count} רשומות עלו ישירות ל-Supabase!`);
      } catch (err) {
        alert("❌ שגיאה בקריאת קובץ הגיבוי: " + err.message);
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

  const openEditModal = (item) => {
    setEditingItem(item);
    setEditNotes(item.notes || '');
    const date = new Date(item.timestamp);
    const tzoffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
    setEditTimestamp(localISOTime);
    
    if (item.logType === 'feeding' || item.logType === 'pumping') {
      setEditValue1(item.type === 'breastfeeding' ? item.duration_minutes : item.amount_ml); 
      setEditSelect1(item.side || 'both');
      if (item.notes && item.notes.includes('[שאוב]')) {
        setEditSelect2('expressed'); setEditNotes(item.notes.replace('[שאוב]', '').trim());
      } else if (item.notes && item.notes.includes('[תמ"ל]')) {
        setEditSelect2('formula'); setEditNotes(item.notes.replace('[תמ"ל]', '').trim());
      } else { 
        setEditSelect2('formula'); 
      }
    } else if (item.logType === 'diaper') { 
      setEditSelect1(item.type); 
    } else if (item.logType === 'solid') { 
      setEditValue1(item.food_name); setEditSelect1(item.reaction); 
    } else if (item.logType === 'growth') { 
      setEditValue1(item.value); 
    }
  };

  const saveItemEdits = () => {
    if (!editingItem) return;
    setEditSaveStatus('saving');
    const updatedTimestamp = new Date(editTimestamp).toISOString();

    if (editingItem.logType === 'feeding' || editingItem.logType === 'pumping') {
      const updated = feedings.map(f => {
        if (f.id === editingItem.id) {
          let n = editNotes;
          if (f.type === 'bottle' && !f.notes?.includes('ויטמין D')) {
            n = `[${editSelect2 === 'expressed' ? 'שאוב' : 'תמ"ל'}] ${editNotes}`.trim();
          }
          return {
            ...f,
            side: editSelect1,
            duration_minutes: f.type === 'breastfeeding' ? parseInt(editValue1 || 0) : null,
            amount_ml: f.type === 'bottle' ? parseInt(editValue1 || 0) : null,
            notes: n || null,
            created_at: updatedTimestamp,
            timestamp: updatedTimestamp
          };
        }
        return f;
      });
      setFeedings(updated);
      saveToLocal('feedings', updated);
    } else if (editingItem.logType === 'diaper') {
      const updated = diapers.map(d => d.id === editingItem.id ? { ...d, type: editSelect1, notes: editNotes || null, created_at: updatedTimestamp, timestamp: updatedTimestamp } : d);
      setDiapers(updated);
      saveToLocal('diapers', updated);
    } else if (editingItem.logType === 'solid') {
      const updated = solids.map(s => s.id === editingItem.id ? { ...s, food_name: editValue1, reaction: editSelect1, notes: editNotes || null, created_at: updatedTimestamp, timestamp: updatedTimestamp } : s);
      setSolids(updated);
      saveToLocal('solids', updated);
    } else if (editingItem.logType === 'growth') {
      const updated = growthMetrics.map(g => g.id === editingItem.id ? { ...g, value: parseFloat(editValue1 || 0), notes: editNotes || null, measured_at: updatedTimestamp, timestamp: updatedTimestamp } : g);
      setGrowthMetrics(updated);
      saveToLocal('growth_metrics', updated);
    }

    setEditSaveStatus('success');
    setTimeout(() => {
      setEditingItem(null);
      setEditSaveStatus('idle');
    }, 600);
  };

  const handleSaveName = (val) => { setBabyName(val); localStorage.setItem('bobo_name', val); };
  const handleSaveGender = (val) => { setBabyGender(val); localStorage.setItem('bobo_gender', val); };
  const handleSaveDob = (val) => { setBabyDob(val); localStorage.setItem('bobo_dob', val); };
  const updateDefaultMl = (val) => { setDefaultMl(val); localStorage.setItem('bobo_def_ml', val); };
  const updateDefBottleType = (type) => { setDefaultBottleType(type); localStorage.setItem('bobo_def_bottle_type', type); };
  const updateDefBreastDuration = (dur) => { setDefaultBreastDuration(dur); localStorage.setItem('bobo_def_breast_dur', dur); };
  const toggleVitDButton = (val) => { setShowVitaminDButton(val); localStorage.setItem('bobo_show_vit_d', val); };
  const toggleLastSideStat = (val) => { setShowLastSideStat(val); localStorage.setItem('bobo_show_last_side', val); };
  const updateFeedInterval = (val) => { setFeedIntervalHours(val); localStorage.setItem('bobo_feed_interval', val); };
  const updateNotifyLead = (val) => { setNotifyLeadMinutes(val); localStorage.setItem('bobo_notify_lead', val); };
  
  const updateTarget = (type, val) => {
    const num = parseInt(val || 1);
    if (type === 'feeds') { setTargetFeeds(num); localStorage.setItem('bobo_target_feeds', num); }
    if (type === 'diapers') { setTargetDiapers(num); localStorage.setItem('bobo_target_diapers', num); }
  };

  const exportFullBackupJSON = () => {
    const backupData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      babyName,
      babyGender,
      babyDob,
      feedings,
      diapers,
      solids,
      growthMetrics
    };
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", jsonStr);
    dlAnchor.setAttribute("download", `bobo_backup_${babyName}_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  const exportToCSV = () => {
    if (timeline.length === 0) return alert("אין נתונים לייצוא");
    let csvContent = "\uFEFFסוג פעולה,פירוט,כמות/משך,צד/החזקה,תאריך,שעה,הערות\n";
    timeline.forEach(item => {
      const type = item.logType === 'vitamin_d' ? 'ויטמין D' : item.logType === 'pumping' ? 'שאיבה' : item.logType === 'feeding' ? (item.type === 'breastfeeding' ? 'הנקה' : 'בקבוק') : item.logType === 'diaper' ? 'חיתול' : item.logType === 'solid' ? 'טעימות מוצקים' : 'גדילה';
      const subType = item.logType === 'vitamin_d' ? 'תוסף תזונה' : item.logType === 'pumping' ? 'שאיבת חלב' : item.logType === 'feeding' ? (item.type === 'breastfeeding' ? 'הנקה' : 'האכלה') : item.logType === 'diaper' ? (item.type === 'wet' ? 'פיפי' : item.type === 'dirty' ? 'קקי' : 'שניהם') : item.logType === 'solid' ? item.food_name : (item.metric_type === 'weight' ? 'משקל' : 'גובה');
      const value = item.logType === 'vitamin_d' ? '2 טיפות' : item.logType === 'pumping' ? `${item.amount_ml} מ"ל` : item.logType === 'feeding' ? (item.duration_minutes ? `${item.duration_minutes} דקות` : `${item.amount_ml} מ"ל`) : item.logType === 'diaper' ? '' : item.logType === 'solid' ? (item.reaction === 'liked' ? 'אהב' : item.reaction === 'neutral' ? 'נייטרלי' : item.reaction === 'disliked' ? 'לא אהב' : 'חשש לאלרגיה') : `${item.value} ${item.unit === 'kg' ? 'ק"ג' : 'ס"מ'}`;
      const side = item.side === 'left' ? 'שמאל' : item.side === 'right' ? 'ימין' : item.side === 'both' && item.logType !== 'vitamin_d' ? 'שניהם' : '';
      csvContent += `${type},${subType},${value},${side},${new Date(item.timestamp).toLocaleDateString('he-IL')},${new Date(item.timestamp).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})},${item.notes ? item.notes.replace(/,/g, " ") : ""}\n`;
    });
    const link = document.createElement("a"); 
    link.setAttribute("href", URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }))); 
    link.setAttribute("download", `יומן_בובו_${babyName}.csv`); 
    document.body.appendChild(link); 
    link.click(); 
    document.body.removeChild(link);
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
  const growthLogs = timeline.filter(item => item.logType === 'growth');

  const displayedTimelineLogs = mainTimelineLogs.filter(item => {
    if (timelineFilter === 'breastfeeding' && !(item.logType === 'feeding' && item.type === 'breastfeeding')) return false;
    if (timelineFilter === 'bottle' && !(item.logType === 'feeding' && item.type === 'bottle')) return false;
    if (timelineFilter === 'pumping' && item.logType !== 'pumping') return false;
    if (timelineFilter === 'diaper' && item.logType !== 'diaper') return false;
    if (timelineFilter === 'solid' && item.logType !== 'solid') return false;
    if (timelineFilter === 'vitamin_d' && item.logType !== 'vitamin_d') return false;

    if (selectedTimelineDate) {
      const itemDate = new Date(item.timestamp);
      const [sYear, sMonth, sDay] = selectedTimelineDate.split('-').map(Number);
      return itemDate.getFullYear() === sYear && (itemDate.getMonth() + 1) === sMonth && itemDate.getDate() === sDay;
    }
    return true;
  });

  const totalDurationToday = actualFeedingsToday.filter(f => f.type === 'breastfeeding').reduce((a, c) => a + (c.duration_minutes || 0), 0);
  const totalMlToday = actualFeedingsToday.filter(f => f.type === 'bottle').reduce((a, c) => a + (c.amount_ml || 0), 0);
  const lastActionWithSide = mainTimelineLogs.find(item => item.logType === 'feeding');
  const lastSide = lastActionWithSide?.side || 'both';

  const feedProgressPercent = Math.min(100, Math.round((actualFeedingsToday.length / targetFeeds) * 100));
  const diaperProgressPercent = Math.min(100, Math.round((todaysDiapers.length / targetDiapers) * 100));

  const getDailyPumpingStats = () => {
    const pumpingLogs = timeline.filter(item => item.logType === 'pumping');
    const grouped = {};
    pumpingLogs.forEach(log => {
      const date = new Date(log.timestamp);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (!grouped[dateKey]) {
        grouped[dateKey] = { dateKey, dateStr: date.toLocaleDateString('he-IL'), totalAmount: 0, count: 0, timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(), logs: [] };
      }
      grouped[dateKey].totalAmount += (log.amount_ml || 0);
      grouped[dateKey].count += 1;
      grouped[dateKey].logs.push(log);
    });
    return Object.values(grouped).sort((a, b) => b.timestamp - a.timestamp);
  };

  const getTrendsData = (daysCount = 7) => {
    const stats = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalBottle = 0, totalPumping = 0, totalBreast = 0, totalDiapers = 0;

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const daysNames = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
      const dateStr = `${daysNames[d.getDay()]} ${d.getDate()}`;
      const fullDateStr = d.toLocaleDateString('he-IL');
      
      const dayLogs = timeline.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate.getDate() === d.getDate() && logDate.getMonth() === d.getMonth() && logDate.getFullYear() === d.getFullYear();
      });
      
      const bottleMl = dayLogs.filter(l => l.logType === 'feeding' && l.type === 'bottle').reduce((sum, l) => sum + (l.amount_ml || 0), 0);
      const bottleCount = dayLogs.filter(l => l.logType === 'feeding' && l.type === 'bottle').length;
      const pumpingMl = dayLogs.filter(l => l.logType === 'pumping').reduce((sum, l) => sum + (l.amount_ml || 0), 0);
      const pumpingCount = dayLogs.filter(l => l.logType === 'pumping').length;
      const breastMins = dayLogs.filter(l => l.logType === 'feeding' && l.type === 'breastfeeding').reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
      const breastCount = dayLogs.filter(l => l.logType === 'feeding' && l.type === 'breastfeeding').length;
      const diaperWet = dayLogs.filter(l => l.logType === 'diaper' && (l.type === 'wet' || l.type === 'both')).length;
      const diaperDirty = dayLogs.filter(l => l.logType === 'diaper' && (l.type === 'dirty' || l.type === 'both')).length;
      const diaperTotal = dayLogs.filter(l => l.logType === 'diaper').length;

      totalBottle += bottleMl; totalPumping += pumpingMl; totalBreast += breastMins; totalDiapers += diaperTotal;

      stats.push({ dateStr, fullDateStr, isToday: i === 0, bottleMl, bottleCount, pumpingMl, pumpingCount, breastMins, breastCount, diaperWet, diaperDirty, diaperTotal });
    }

    return { 
      stats, 
      avgBottle: Math.round(totalBottle / daysCount), 
      avgPumping: Math.round(totalPumping / daysCount), 
      avgBreast: Math.round(totalBreast / daysCount), 
      avgDiapers: (totalDiapers / daysCount).toFixed(1) 
    };
  };

  const getWeeklyMedicalSummary = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    sevenDaysAgo.setHours(0,0,0,0);

    const recentLogs = timeline.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= sevenDaysAgo && logDate <= today;
    });

    const diapersLogs = recentLogs.filter(l => l.logType === 'diaper');
    return {
      wet: diapersLogs.filter(d => d.type === 'wet' || d.type === 'both').length,
      dirty: diapersLogs.filter(d => d.type === 'dirty' || d.type === 'both').length
    };
  };

  const renderCountdownText = () => {
    if (timeToNextFeed === null) return "לא תועדה עדיין האכלה";
    const isOverdue = timeToNextFeed <= 0;
    const absTime = Math.abs(timeToNextFeed);
    const h = Math.floor(absTime / (1000 * 60 * 60));
    const m = Math.floor((absTime % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((absTime % (1000 * 60)) / 1000);
    const formatted = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return isOverdue ? `הגיע הזמן! (-${formatted})` : formatted;
  };

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
            <p className="text-[10px] font-bold text-teal-500">● {timeline.length} רשומות ביומן</p>
          </div>
        </div>
        <button onClick={exportFullBackupJSON} className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-xl">📦 גיבוי מלא</button>
      </header>

      <main className="p-4 space-y-4 flex-1 relative">
        {activeTab === 'home' && (
          <>
            <div className="grid grid-cols-3 gap-2.5 text-white">
              <div className="bg-gradient-to-br from-rose-400 to-rose-500 p-3.5 rounded-3xl shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center"><span className="text-[11px] font-bold opacity-90">🍼 אכילות</span><span className="font-black text-sm">{actualFeedingsToday.length}/{targetFeeds}</span></div>
                  <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mt-2 mb-1.5"><div className="bg-white h-full rounded-full" style={{ width: `${feedProgressPercent}%` }}></div></div>
                </div>
                <p className="text-[10px] font-medium opacity-90 truncate">{totalDurationToday > 0 && `${totalDurationToday} דק'`} {totalMlToday > 0 && `| ${totalMlToday} מ"ל`}</p>
              </div>

              <div className="bg-gradient-to-br from-amber-400 to-amber-500 p-3.5 rounded-3xl shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center"><span className="text-[11px] font-bold opacity-90">🚼 חיתולים</span><span className="font-black text-sm">{todaysDiapers.length}/{targetDiapers}</span></div>
                  <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mt-2 mb-1.5"><div className="bg-white h-full rounded-full" style={{ width: `${diaperProgressPercent}%` }}></div></div>
                </div>
                <p className="text-[10px] font-medium opacity-90 truncate">{todaysDiapers.length} הוחלפו</p>
              </div>

              <div className="bg-gradient-to-br from-purple-400 to-purple-500 p-3.5 rounded-3xl shadow-lg flex flex-col justify-between">
                <div className="flex justify-between items-center"><span className="text-[11px] font-bold opacity-90">צד אחרון</span><span className="font-black text-xs">{lastSide === 'left' ? 'שמאל' : lastSide === 'right' ? 'ימין' : 'שניהם'}</span></div>
                <p className="text-[10px] mt-2 font-medium opacity-90 truncate">מומלץ: {lastSide === 'left' ? 'ימין' : 'שמאל'}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl flex justify-between items-center shadow-md border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl bg-rose-50 text-rose-500">⏰</div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400">האכלה הבאה בעוד:</p>
                  <p className="text-xl font-black font-mono tracking-wider">{renderCountdownText()}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button onClick={() => { setActiveSection(activeSection === 'breast' ? null : 'breast'); setFeedType('breastfeeding'); }} className={`p-4 rounded-3xl font-bold text-sm ${activeSection === 'breast' ? 'bg-rose-400 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-rose-500 border border-rose-100 dark:border-gray-700'}`}>🤱 הנקה</button>
              <button onClick={() => { setActiveSection(activeSection === 'bottle' ? null : 'bottle'); setFeedType('bottle'); }} className={`p-4 rounded-3xl font-bold text-sm ${activeSection === 'bottle' ? 'bg-cyan-400 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-cyan-500 border border-cyan-100 dark:border-gray-700'}`}>🍼 בקבוק</button>
              <button onClick={() => { setActiveSection(activeSection === 'pumping' ? null : 'pumping'); setFeedType('pumping'); }} className={`p-4 rounded-3xl font-bold text-sm ${activeSection === 'pumping' ? 'bg-purple-400 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-purple-500 border border-purple-100 dark:border-gray-700'}`}>🥛 שאיבה</button>
              <button onClick={() => setActiveSection(activeSection === 'diaper' ? null : 'diaper')} className={`p-4 rounded-3xl font-bold text-sm ${activeSection === 'diaper' ? 'bg-amber-400 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-amber-500 border border-amber-100 dark:border-gray-700'}`}>🚼 חיתול</button>
              <button onClick={() => setActiveSection(activeSection === 'solid' ? null : 'solid')} className={`p-4 rounded-3xl font-bold text-sm col-span-2 ${activeSection === 'solid' ? 'bg-emerald-500 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-emerald-600 border border-emerald-100 dark:border-gray-700'}`}>🥑 טעימות מוצקים</button>
              {showVitaminDButton && <button onClick={logVitaminD} className="p-3 rounded-3xl font-bold text-sm col-span-2 bg-white dark:bg-gray-800 text-violet-500 border border-violet-100 dark:border-gray-700">💊 ויטמין D (2 טיפות)</button>}
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

            {activeSection === 'pumping' && (
              <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-lg border space-y-4">
                <h3 className="font-bold text-purple-500 text-sm">🥛 עדכון שאיבת חלב</h3>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-gray-500">כמות (מ"ל):</span>
                  <input type="number" value={amount} onChange={e => setAmount(parseInt(e.target.value || 0))} className="w-24 text-center font-bold p-2 bg-gray-50 dark:bg-gray-700 rounded-xl" />
                </div>
                <button onClick={() => saveFeeding('pumping')} className="w-full font-bold py-3.5 rounded-xl bg-purple-400 text-white">שמור שאיבה</button>
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
                    <div className="flex gap-1.5">
                      <button onClick={() => openEditModal(item)} className="text-xs bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1.5 rounded-xl font-bold">ערוך</button>
                      <button onClick={() => deleteTimelineItem(item)} className="text-xs bg-red-50 text-red-500 px-2.5 py-1.5 rounded-xl font-bold">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold">📋 כל ההיסטוריה ({displayedTimelineLogs.length})</h2>
              <input type="date" value={selectedTimelineDate} onChange={e => setSelectedTimelineDate(e.target.value)} className="p-1.5 border rounded-xl text-xs bg-white dark:bg-gray-800" />
            </div>

            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {['all', 'breastfeeding', 'bottle', 'pumping', 'diaper', 'solid', 'vitamin_d'].map(f => (
                <button key={f} onClick={() => setTimelineFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border ${timelineFilter === f ? 'bg-rose-400 text-white' : 'bg-white dark:bg-gray-800'}`}>
                  {f === 'all' ? 'הכל' : f === 'breastfeeding' ? 'הנקה' : f === 'bottle' ? 'בקבוק' : f === 'pumping' ? 'שאיבה' : f === 'diaper' ? 'חיתול' : f === 'solid' ? 'טעימות' : 'ויטמין D'}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {displayedTimelineLogs.map((item, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{item.logType === 'feeding' ? (item.type === 'breastfeeding' ? '🤱 הנקה' : '🍼 בקבוק') : item.logType === 'diaper' ? '🚼 חיתול' : item.logType === 'solid' ? '🥑 טעימה' : item.logType}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${getTagColor(item)}`}>{item.duration_minutes ? `${item.duration_minutes} דק'` : item.amount_ml ? `${item.amount_ml} מ"ל` : item.type}</span>
                    </div>
                    <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleDateString('he-IL')} בשעה {new Date(item.timestamp).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}</p>
                    {item.notes && <p className="text-xs bg-gray-50 dark:bg-gray-700 p-1.5 rounded-lg mt-1">{item.notes}</p>}
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEditModal(item)} className="text-xs bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-lg font-bold">ערוך</button>
                    <button onClick={() => deleteTimelineItem(item)} className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded-lg font-bold">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'solids_board' && (
          <div className="space-y-4 bg-white dark:bg-gray-800 p-5 rounded-3xl border">
            <h2 className="text-base font-bold">🥑 לוח טעימות</h2>
            <div className="grid grid-cols-2 gap-2">
              {solids.map((s, idx) => (
                <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl font-bold text-xs flex justify-between">
                  <span>{s.food_name}</span>
                  <span>{s.reaction === 'liked' ? '😋' : s.reaction === 'disliked' ? '😖' : '😐'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'pumping' && (
          <div className="space-y-4 bg-white dark:bg-gray-800 p-5 rounded-3xl border">
            <h2 className="text-base font-bold">📊 סיכום שאיבות יומי</h2>
            {getDailyPumpingStats().map((stat, idx) => (
              <div key={idx} className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex justify-between items-center">
                <div><span className="font-bold">{stat.dateStr}</span><p className="text-xs text-purple-600">{stat.count} שאיבות</p></div>
                <span className="text-xl font-black text-purple-600">{stat.totalAmount} מ"ל</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'trends' && (() => {
          const { stats, avgBottle, avgPumping, avgBreast, avgDiapers } = getTrendsData(trendsDaysRange);
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-cyan-500 text-white p-3 rounded-2xl font-bold">בקבוקים<br/>{avgBottle} מ"ל</div>
                <div className="bg-purple-500 text-white p-3 rounded-2xl font-bold">שאיבות<br/>{avgPumping} מ"ל</div>
                <div className="bg-rose-500 text-white p-3 rounded-2xl font-bold">הנקה<br/>{avgBreast} דק'</div>
                <div className="bg-amber-500 text-white p-3 rounded-2xl font-bold">חיתולים<br/>{avgDiapers}</div>
              </div>
            </div>
          );
        })()}

        {activeTab === 'growth' && (
          <div className="space-y-4 bg-white dark:bg-gray-800 p-5 rounded-3xl border">
            <div onClick={() => setShowReportModal(true)} className="p-4 bg-gradient-to-r from-teal-400 to-emerald-400 text-white rounded-2xl font-bold flex justify-between items-center cursor-pointer">
              <span>📄 הפק דוח לרופא / טיפת חלב</span>
              <span>🖨️</span>
            </div>
            <h2 className="text-base font-bold">📈 גדילה ומדדים</h2>
            <div className="flex gap-2">
              <input type="number" step="0.01" value={growthValue} onChange={e => setGrowthValue(e.target.value)} placeholder="ערך" className="p-2 border rounded-xl flex-1 text-center font-bold" />
              <button onClick={saveGrowth} className="px-4 bg-teal-500 text-white rounded-xl font-bold">שמור</button>
            </div>
            <div className="space-y-2">
              {growthLogs.map((g, idx) => (
                <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl flex justify-between font-bold text-xs">
                  <span>{g.metric_type === 'weight' ? 'משקל' : 'גובה'}</span>
                  <span>{g.value} {g.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border space-y-5">
            <h2 className="text-base font-bold border-b pb-2">⚙️ הגדרות מערכת מלאות</h2>

            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-500 block">🎨 ערכת נושא:</span>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(THEME_CONFIGS).map(th => (
                  <button key={th.id} onClick={() => handleThemeChange(th.id)} className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between ${themePreset === th.id ? 'border-gray-800 bg-gray-50' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: th.colorHex }}></span>
                      <span>{th.name}</span>
                    </div>
                    {themePreset === th.id && <span>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-xl">
              <span className="text-xs font-bold">🌙 מצב לילה (Dark Mode)</span>
              <input type="checkbox" checked={isDarkMode} onChange={e => setIsDarkMode(e.target.checked)} className="w-5 h-5 accent-rose-400" />
            </div>

            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-xl">
              <span className="text-xs font-bold">🔔 התראות דחיפה לנייד</span>
              <button onClick={requestNotificationPermission} className="text-xs font-bold px-3 py-1.5 rounded-xl bg-teal-500 text-white">
                {notificationsEnabled ? 'פעיל ✓' : 'הפעל'}
              </button>
            </div>

            <div className="space-y-3 border-t pt-3 text-xs">
              <h3 className="font-bold text-gray-500">ברירות מחדל ויעדים:</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">מ"ל ברירת מחדל:</label>
                  <input type="number" value={defaultMl} onChange={e => updateDefaultMl(parseInt(e.target.value || 0))} className="w-full p-2 border rounded-xl text-center font-bold" />
                </div>
                <div>
                  <label className="block font-bold mb-1">סוג בקבוק מועדף:</label>
                  <select value={defaultBottleType} onChange={e => updateDefBottleType(e.target.value)} className="w-full p-2 border rounded-xl font-bold">
                    <option value="formula">תמ"ל</option>
                    <option value="expressed">שאוב</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">יעד ארוחות יומי:</label>
                  <input type="number" value={targetFeeds} onChange={e => updateTarget('feeds', e.target.value)} className="w-full p-2 border rounded-xl text-center font-bold" />
                </div>
                <div>
                  <label className="block font-bold mb-1">יעד חיתולים יומי:</label>
                  <input type="number" value={targetDiapers} onChange={e => updateTarget('diapers', e.target.value)} className="w-full p-2 border rounded-xl text-center font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-rose-500">מרווח האכלה (שעות):</label>
                  <input type="number" step="0.5" value={feedIntervalHours} onChange={e => updateFeedInterval(parseFloat(e.target.value || 3))} className="w-full p-2 border rounded-xl text-center font-bold" />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-teal-600">התראה מראש (בדקות):</label>
                  <input type="number" value={notifyLeadMinutes} onChange={e => updateNotifyLead(parseInt(e.target.value || 10))} className="w-full p-2 border rounded-xl text-center font-bold" />
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t pt-3 text-xs">
              <h3 className="font-bold text-gray-500">פרופיל הבייבי:</h3>
              <input type="text" value={babyName} onChange={e => handleSaveName(e.target.value)} placeholder="שם התינוק/ת" className="w-full p-2 border rounded-xl font-bold" />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleSaveGender('בן')} className={`p-2 border rounded-xl font-bold ${babyGender === 'בן' ? 'bg-cyan-400 text-white' : ''}`}>בן</button>
                <button onClick={() => handleSaveGender('בת')} className={`p-2 border rounded-xl font-bold ${babyGender === 'בת' ? 'bg-rose-400 text-white' : ''}`}>בת</button>
              </div>
              <input type="date" value={babyDob} onChange={e => handleSaveDob(e.target.value)} className="w-full p-2 border rounded-xl font-bold text-center" />
            </div>

            <div className="space-y-2 border-t pt-3">
              <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 bg-teal-500 text-white rounded-xl font-bold text-xs shadow-md">
                📥 שחזר וסנכרן מגיבוי (JSON)
              </button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportBackup} className="hidden" />

              <button onClick={exportToCSV} className="w-full py-3 bg-gradient-to-r from-teal-400 to-cyan-400 text-white rounded-xl font-bold text-xs shadow-md">
                📊 ייצא יומן לאקסל (CSV)
              </button>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-3 left-4 right-4 max-w-md mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-100 dark:border-gray-700 shadow-2xl rounded-3xl p-1.5 z-50 flex justify-between items-center">
        <button onClick={() => { setActiveTab('home'); setActiveSection(null); }} className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-2xl flex-1 ${activeTab === 'home' ? currentTheme.activeTab : 'text-gray-400'}`}>🏠 בית</button>
        <button onClick={() => setActiveTab('timeline')} className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-2xl flex-1 ${activeTab === 'timeline' ? currentTheme.activeTab : 'text-gray-400'}`}>📋 יומן</button>
        <button onClick={() => setActiveTab('solids_board')} className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-2xl flex-1 ${activeTab === 'solids_board' ? 'text-emerald-500 font-extrabold' : 'text-gray-400'}`}>🥑 טעימות</button>
        <button onClick={() => setActiveTab('pumping')} className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-2xl flex-1 ${activeTab === 'pumping' ? 'text-purple-500 font-extrabold' : 'text-gray-400'}`}>🥛 שאיבות</button>
        <button onClick={() => setActiveTab('trends')} className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-2xl flex-1 ${activeTab === 'trends' ? 'text-blue-500 font-extrabold' : 'text-gray-400'}`}>📊 מגמות</button>
        <button onClick={() => setActiveTab('growth')} className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-2xl flex-1 ${activeTab === 'growth' ? 'text-teal-500 font-extrabold' : 'text-gray-400'}`}>📈 גדילה</button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-2xl flex-1 ${activeTab === 'settings' ? currentTheme.activeTab : 'text-gray-400'}`}>⚙️ הגדרות</button>
      </nav>

      {/* Modal עריכה */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm">✏️ עריכת פעולה</h3>
            <input type="datetime-local" value={editTimestamp} onChange={e => setEditTimestamp(e.target.value)} className="w-full p-2 border rounded-xl text-xs font-mono text-center" />
            <input type="text" value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="הערות..." className="w-full p-2 border rounded-xl text-xs" />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setEditingItem(null)} className="py-2.5 bg-gray-100 rounded-xl font-bold text-xs">ביטול</button>
              <button onClick={saveItemEdits} className="py-2.5 bg-rose-400 text-white rounded-xl font-bold text-xs">שמור</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal דוח רופא להדפסה */}
      {showReportModal && (
        <div className="fixed inset-0 bg-gray-900/95 z-[100] flex flex-col p-4 overflow-y-auto">
          <div className="w-full max-w-lg mx-auto flex justify-between items-center mb-4">
            <h2 className="text-white font-bold">דוח התפתחות</h2>
            <button onClick={() => setShowReportModal(false)} className="text-white font-bold">✕</button>
          </div>
          <div className="bg-white rounded-2xl p-6 text-gray-900 space-y-4 max-w-lg mx-auto w-full">
            <h1 className="text-xl font-bold text-center">דוח מעקב - {babyName}</h1>
            <p className="text-xs text-center text-gray-500">גיל: {getBabyAge()} | הופק ב: {new Date().toLocaleDateString('he-IL')}</p>
            <div className="border p-3 rounded-xl space-y-2">
              <h3 className="font-bold text-xs">מדדי גדילה אחרונים:</h3>
              {growthLogs.slice(0, 5).map((g, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span>{new Date(g.timestamp).toLocaleDateString('he-IL')}</span>
                  <span>{g.value} {g.unit}</span>
                </div>
              ))}
            </div>
            <button onClick={() => window.print()} className="w-full py-3 bg-teal-500 text-white font-bold rounded-xl text-xs">🖨️ הדפס דוח</button>
          </div>
        </div>
      )}
    </div>
  );
}
