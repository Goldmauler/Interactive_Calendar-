'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sun, Moon, Trash2, Edit2, Check, X, Clock, Calendar, Flame, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import clsx from 'clsx';
import {
  WEEKDAYS, MONTH_NAMES, MONTH_IMAGES, getHoliday,
  isSameDay, isToday, isWeekend, isInRange, getDayCount,
  formatDate, getMonthGrid
} from '@/utils/calendarUtils';
import {
  getIndianFestival, getMonthFestivals, FESTIVAL_TYPES, fetchCalendarificFestivals
} from '@/utils/indianFestivals';
import { generateId, safeGetItem, safeSetItem } from '@/utils/storageUtils';
import styles from './CalendarApp.module.css';

// ── Helpers ─────────────────────────────────────────────────────────────────
const getMoonPhaseIndex = (date) => {
  const knownNew = new Date('2000-01-06').getTime();
  const synodicPeriod = 29.53058867;
  const daysSince = (date.getTime() - knownNew) / 86400000;
  return Math.floor(((daysSince % synodicPeriod) / synodicPeriod) * 8 + 8) % 8;
};

const MOON_PHASE_OPACITY = [0.2, 0.3, 0.45, 0.65, 0.95, 0.65, 0.45, 0.3];

const getDaysUntil = (date) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(date); d.setHours(0,0,0,0);
  return Math.round((d - today) / 86400000);
};

const EVENT_CATEGORIES = [
  { id: 'work',     label: 'Work',     color: '#6366f1' },
  { id: 'personal', label: 'Personal', color: '#ec4899' },
  { id: 'health',   label: 'Health',   color: '#22c55e' },
  { id: 'social',   label: 'Social',   color: '#f59e0b' },
];

const DEFAULT_HABITS = ['Exercise', 'Read', 'Meditate', 'Hydrate'];

export default function CalendarApp() {
  const [theme, setTheme] = useState('light');
  const [dateObj, setDateObj] = useState(new Date());
  const [yearMode, setYearMode] = useState(false);
  const [apiFestivals, setApiFestivals] = useState({});
  
  // Destructure for ease
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();

  // Range Selection
  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedEnd, setSelectedEnd] = useState(null);
  const [selectionMode, setSelectionMode] = useState('range'); // 'range' | 'individual'
  const [selectedDates, setSelectedDates] = useState([]); // array for individual mode

  // Notes state
  const [notes, setNotes] = useState({}); // { 'YYYY_MM': [ {id, text, startDate, endDate, timestamp} ] }
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [activeNoteId, setActiveNoteId] = useState(null);

  // Events state
  const [events, setEvents] = useState({}); // { 'Date String': [ { id, time, title, category } ] }
  const [newEventTime, setNewEventTime] = useState('10:00');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCategory, setNewEventCategory] = useState('work');
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'events' | 'habits'

  // Habit Tracker state
  const [habits, setHabits] = useState({});   // { 'YYYY-MM-DD': { 'Exercise': true, ... } }
  const [habitList, setHabitList] = useState(DEFAULT_HABITS);
  const [newHabitName, setNewHabitName] = useState('');
  
  const constraintsRef = useRef(null);

  // Animation / Interaction locking
  const [direction, setDirection] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const swipeRef = useRef(null);

  // --- Real-time Clock ---
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // --- 3D Tilt Config ---
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 });
  
  const rotateX = useTransform(springY, [0, 1], [6, -6]);
  const rotateY = useTransform(springX, [0, 1], [-6, 6]);
  const glareX = useTransform(springX, [0, 1], ['-100%', '200%']);
  const glareY = useTransform(springY, [0, 1], ['-100%', '200%']);

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }, [mouseX, mouseY]);

  // --- Theme ---
  useEffect(() => {
    const saved = safeGetItem('cal-theme', 'light');
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    safeSetItem('cal-theme', nextTheme);
  };

  useEffect(() => {
    const savedNotes = safeGetItem('cal-notes', {});
    const savedEvents = safeGetItem('cal-events', {});
    const savedHabits = safeGetItem('cal-habits', {});
    const savedHabitList = safeGetItem('cal-habit-list', DEFAULT_HABITS);
    setNotes(savedNotes);
    setEvents(savedEvents);
    setHabits(savedHabits);
    setHabitList(savedHabitList);
  }, []);

  // Live festival fetch from Calendarific (uses NEXT_PUBLIC_CALENDARIFIC_KEY)
  useEffect(() => {
    fetchCalendarificFestivals(year).then(data => {
      if (Object.keys(data).length > 0) setApiFestivals(data);
    });
  }, [year]);

  useEffect(() => {
    safeSetItem('cal-notes', notes);
  }, [notes]);

  useEffect(() => {
    safeSetItem('cal-events', events);
  }, [events]);

  useEffect(() => {
    safeSetItem('cal-habits', habits);
  }, [habits]);

  useEffect(() => {
    safeSetItem('cal-habit-list', habitList);
  }, [habitList]);

  const currentMonthKey = `${year}_${month}`;
  const currentNotes = notes[currentMonthKey] || [];

  // Festivals for this month
  const monthFestivals = useMemo(() => getMonthFestivals(year, month, apiFestivals), [year, month, apiFestivals]);

  const triggerFestivalEffect = useCallback((festival, e) => {
    const origin = e ? { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight } : { x: 0.5, y: 0.5 };
    if (festival?.name?.toLowerCase().includes('holi')) {
      // Holi Rainbow burst
      ['#FF0000','#FF6600','#FFFF00','#00FF00','#0000FF','#8B00FF','#FF1493'].forEach((color, i) =>
        setTimeout(() => confetti({ particleCount: 30, spread: 80, origin, colors: [color], gravity: 0.8 }), i * 80)
      );
    } else if (festival?.name?.toLowerCase().includes('diwali')) {
      // Diwali fireworks
      [0, 300, 600].forEach(delay =>
        setTimeout(() => confetti({
          particleCount: 120, spread: 100, origin,
          colors: ['#FFD700','#FF6B00','#FF4500','#FBBF24','#FDE68A'],
          gravity: 0.6, scalar: 1.2, shapes: ['star']
        }), delay)
      );
    } else if (festival?.special) {
      confetti({ particleCount: 60, spread: 70, origin, colors: ['#FF9933','#FFFFFF','#138808'] });
    }
  }, []);

  const handleAddEvent = () => {
    if (!newEventTitle.trim() || !selectedStart || selectedEnd) return;
    const dateKey = selectedStart.toDateString();
    const newEvent = {
      id: generateId(),
      time: newEventTime,
      title: newEventTitle.trim(),
      category: newEventCategory,
    };
    setEvents(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newEvent].sort((a,b) => a.time.localeCompare(b.time))
    }));
    setNewEventTitle('');
  };

  const toggleHabit = (dateKey, habit) => {
    setHabits(prev => ({
      ...prev,
      [dateKey]: {
        ...(prev[dateKey] || {}),
        [habit]: !(prev[dateKey] || {})[habit],
      }
    }));
  };

  const getHabitStreak = (habit) => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if ((habits[key] || {})[habit]) streak++;
      else break;
    }
    return streak;
  };

  const addNewHabit = () => {
    if (!newHabitName.trim() || habitList.includes(newHabitName.trim())) return;
    setHabitList(prev => [...prev, newHabitName.trim()]);
    setNewHabitName('');
  };

  const removeHabit = (habit) => setHabitList(prev => prev.filter(h => h !== habit));

  const handleDeleteEvent = (dateKey, id) => {
    setEvents(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).filter(ev => ev.id !== id)
    }));
  };

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const newNote = {
      id: generateId(),
      text: newNoteText.trim(),
      timestamp: Date.now(),
      startDate: selectedStart ? selectedStart.toISOString() : null,
      endDate: selectedEnd ? selectedEnd.toISOString() : null
    };
    setNotes(prev => ({
      ...prev,
      [currentMonthKey]: [...(prev[currentMonthKey] || []), newNote]
    }));
    setNewNoteText('');
  };

  const handleKeyDownNote = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleAddNote();
    }
  };

  const handleDeleteNote = (id) => {
    setNotes(prev => ({
      ...prev,
      [currentMonthKey]: (prev[currentMonthKey] || []).filter(n => n.id !== id)
    }));
  };

  const toggleCheckNote = (id) => {
    setNotes(prev => ({
      ...prev,
      [currentMonthKey]: (prev[currentMonthKey] || []).map(n => 
        n.id === id ? { ...n, done: !n.done } : n
      )
    }));
  };

  const startEditNote = (note) => {
    setEditingNoteId(note.id);
    setEditNoteText(note.text);
  };

  const saveEditNote = () => {
    if (!editNoteText.trim()) return;
    setNotes(prev => {
      const mn = prev[currentMonthKey].map(n => 
        n.id === editingNoteId ? { ...n, text: editNoteText.trim() } : n
      );
      return { ...prev, [currentMonthKey]: mn };
    });
    setEditingNoteId(null);
  };

  const [showPicker, setShowPicker] = useState(false);
  const selectDateFromPicker = (m, y) => {
    setDirection(m > month ? 1 : -1);
    const newDate = new Date(dateObj);
    newDate.setFullYear(y);
    newDate.setMonth(m);
    setDateObj(newDate);
    setShowPicker(false);
  };

  const handleYearChange = (offset) => {
    const newDate = new Date(dateObj);
    newDate.setFullYear(year + offset);
    setDateObj(newDate);
  };

  // --- Navigation & Logic ---
  const goPrevMonth = useCallback(() => {
    if (isAnimating) return;
    setDirection(-1);
    setIsAnimating(true);
    setDateObj(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, [isAnimating]);

  const goNextMonth = useCallback(() => {
    if (isAnimating) return;
    setDirection(1);
    setIsAnimating(true);
    setDateObj(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, [isAnimating]);

  const goToday = () => {
    if (isAnimating) return;
    const now = new Date();
    if (now.getMonth() === month && now.getFullYear() === year) return;
    setDirection(now > dateObj ? 1 : -1);
    setIsAnimating(true);
    setDateObj(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if focus is inside input/textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.key === 'ArrowLeft') goPrevMonth();
      if (e.key === 'ArrowRight') goNextMonth();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goPrevMonth, goNextMonth]);

  // Swipe Navigation
  let touchStartX = 0;
  const handleTouchStart = (e) => { touchStartX = e.changedTouches[0].screenX; };
  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    if (touchStartX - touchEndX > 50) goNextMonth();
    if (touchEndX - touchStartX > 50) goPrevMonth();
  };

  // Selection Logic
  const handleDateClick = (dObj, e) => {
    const d = dObj.date;
    d.setHours(0,0,0,0);
    
    // Check if this date has a note linked to it
    const dateStr = d.toDateString();
    const linkedNote = currentNotes.find(n => 
      (n.startDate && new Date(n.startDate).toDateString() === dateStr) || 
      (n.endDate && new Date(n.endDate).toDateString() === dateStr)
    );
    
    if (linkedNote) {
      setActiveNoteId(linkedNote.id);
    }

    if (selectionMode === 'individual') {
      const time = d.getTime();
      if (selectedDates.find(sd => sd.getTime() === time)) {
        setSelectedDates(prev => prev.filter(sd => sd.getTime() !== time));
      } else {
        setSelectedDates(prev => [...prev, d]);
        triggerConfetti(e);
      }
      return;
    }

    if (!selectedStart || (selectedStart && selectedEnd)) {
      setSelectedStart(d);
      setSelectedEnd(null);
    } else {
      if (d.getTime() === selectedStart.getTime()) {
        setSelectedStart(null);
      } else if (d < selectedStart) {
        // Swap
        setSelectedEnd(selectedStart);
        setSelectedStart(d);
        triggerConfetti(e);
      } else {
        setSelectedEnd(d);
        triggerConfetti(e);
      }
    }
  };

  const triggerConfetti = (e) => {
    // Attempt origin based on click, roughly
    const origin = e ? {
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight
    } : { x: 0.5, y: 0.5 };
    
    confetti({
      particleCount: 80,
      spread: 60,
      origin,
      colors: ['#0ea5e9', '#38bdf8', '#f59e0b']
    });
  };

  const gridDays = useMemo(() => getMonthGrid(year, month), [year, month]);

  // Framer Motion flip variants
  const flipVariants = {
    initial: (dir) => ({
      rotateY: dir > 0 ? 110 : -110,
      opacity: 0,
      z: 100,
      transformOrigin: dir > 0 ? 'left center' : 'right center',
    }),
    in: {
      rotateY: 0,
      opacity: 1,
      z: 0,
      transition: { duration: 0.6, type: 'spring', bounce: 0.2 },
    },
    out: (dir) => ({
      rotateY: dir > 0 ? -110 : 110,
      opacity: 0,
      z: 100,
      transformOrigin: dir > 0 ? 'right center' : 'left center',
      transition: { duration: 0.6, type: 'spring', bounce: 0.2 },
    }),
  };

  // Derive active note dates for indicator dots
  const noteDatesStr = useMemo(() => {
    const set = new Set();
    currentNotes.forEach(n => {
      if (n.startDate) set.add(new Date(n.startDate).toDateString());
      if (n.endDate) set.add(new Date(n.endDate).toDateString());
    });
    return set;
  }, [currentNotes]);

  const eventDatesStr = useMemo(() => {
    const set = new Set();
    Object.keys(events).forEach(dateKey => {
      if (events[dateKey] && events[dateKey].length > 0) {
        set.add(dateKey);
      }
    });
    return set;
  }, [events]);

  return (
    <div className={styles.container} style={{ perspective: '2000px' }}>
      <button 
        onClick={toggleTheme} 
        className={styles.themeToggle} 
        aria-label="Toggle Theme"
      >
        {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
      </button>

      <button
        onClick={() => setYearMode(y => !y)}
        className={styles.themeToggle}
        style={{ right: 'auto', left: '1.5rem' }}
        aria-label="Toggle Year Overview"
      >
        <Calendar size={24} />
      </button>

      {/* Year Overview Panel */}
      <AnimatePresence>
        {yearMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '2rem', gap: '1rem', backdropFilter: 'blur(12px)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 900, alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button onClick={() => handleYearChange(-1)} style={{ color: 'white', background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.5rem 1rem' }}><ChevronLeft size={20}/></button>
                <h2 style={{ color: 'white', fontSize: '2rem', fontFamily: 'var(--font-display)' }}>{year}</h2>
                <button onClick={() => handleYearChange(1)} style={{ color: 'white', background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.5rem 1rem' }}><ChevronRight size={20}/></button>
              </div>
              <button onClick={() => setYearMode(false)} style={{ color: 'white', background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '0.5rem 1rem' }}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', width: '100%', maxWidth: 900 }}>
              {MONTH_NAMES.map((mName, mi) => {
                const miniGrid = getMonthGrid(year, mi);
                const isCurrentMonth = mi === month;
                return (
                  <div
                    key={mName}
                    onClick={() => { selectDateFromPicker(mi, year); setYearMode(false); }}
                    style={{
                      background: isCurrentMonth ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)',
                      borderRadius: 12, padding: '0.75rem',
                      cursor: 'pointer', border: isCurrentMonth ? '1px solid rgba(99,102,241,0.8)' : '1px solid rgba(255,255,255,0.1)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ color: 'white', fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>{mName.substring(0,3)}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                      {['M','T','W','T','F','S','S'].map((d,i) => (
                        <div key={i} style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{d}</div>
                      ))}
                      {miniGrid.map((dObj, di) => {
                        const isT = isToday(dObj.date);
                        const hasEv = eventDatesStr.has(dObj.date.toDateString());
                        return (
                          <div key={di} style={{
                            fontSize: '0.55rem', textAlign: 'center', padding: '1px',
                            borderRadius: 3,
                            background: isT ? 'var(--accent-color)' : hasEv ? 'rgba(34,197,94,0.35)' : 'transparent',
                            color: dObj.isCurrentMonth ? (isT ? 'white' : 'rgba(255,255,255,0.85)') : 'rgba(255,255,255,0.2)',
                            fontWeight: isT ? 700 : 400
                          }}>
                            {dObj.date.getDate()}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className={styles.calendarCard} 
        role="application" 
        aria-label="Interactive Calendar"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      >
        {/* Dynamic glare layer */}
        <motion.div 
           style={{ left: glareX, top: glareY }}
           className="absolute w-full h-full pointer-events-none rounded-xl z-50 opacity-20 mix-blend-overlay"
           initial={false}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0%,transparent_60%)] -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%]" />
        </motion.div>
        
        {/* Wire Binding top */}
        <div className={styles.wireBinding}>
          {Array.from({length: 45}).map((_, i) => <div key={i} className={styles.coil} />)}
        </div>

        {/* --- TOP IMAGE BANNER --- */}
        <div className={styles.topImageBanner}>
          <div className={styles.heroImageHalf}>
            <Image 
              src={MONTH_IMAGES[(month - 1 + 12) % 12]} 
              alt={`Hero image for ${MONTH_NAMES[(month - 1 + 12) % 12]}`}
              fill
              className={styles.heroImage}
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className={styles.heroImageHalf}>
            <Image 
              src={MONTH_IMAGES[month]} 
              alt={`Hero image for ${MONTH_NAMES[month]}`}
              fill
              priority
              className={styles.heroImage}
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* --- BOTTOM CONTENT --- */}
        <div className={styles.bottomContent}>
          
          <div className={styles.leftColumn}>
            {/* Header Nav */}
            <div className={styles.headerNav}>
              <div className={styles.monthLabelWrap}>
                 <div className="flex items-baseline gap-4 mb-2">
                   <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                     <h2 
                       className={clsx(styles.monthLabel, "serif-font")} 
                       style={{ cursor: 'pointer', transition: 'color 0.2s', margin: 0 }}
                       onClick={() => setShowPicker(!showPicker)}
                       onMouseOver={(e) => e.target.style.color = 'var(--accent-color)'}
                       onMouseOut={(e) => e.target.style.color = 'var(--text-primary)'}
                     >
                       {MONTH_NAMES[month]}
                     </h2>
                   
                     <div className={styles.navButtonGroup}>
                       <button className={styles.iconButton} onClick={goPrevMonth} aria-label="Previous Month" style={{ width: '32px', height: '32px' }}>
                         <ChevronLeft size={16} />
                       </button>
                       <button className={styles.iconButton} onClick={goNextMonth} aria-label="Next Month" style={{ width: '32px', height: '32px' }}>
                         <ChevronRight size={16} />
                       </button>
                     </div>
                   </div>
                 </div>
                 
                 <div className={styles.yearRowWrapper}>
                   <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                     <span 
                       className={styles.yearLabel} 
                       style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                       onClick={() => setShowPicker(!showPicker)}
                       onMouseOver={(e) => e.target.style.color = 'var(--accent-color)'}
                       onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}
                     >
                       {year}
                     </span>
                   </div>
                   <span className={styles.timeLabel}>{currentTime}</span>
                 </div>
                 
                 <AnimatePresence>
                   {showPicker && (
                     <motion.div 
                       className={styles.pickerDropdown}
                       initial={{ opacity: 0, y: -10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -10 }}
                     >
                       <div className={styles.pickerGrid}>
                         {MONTH_NAMES.map((mName, i) => (
                           <button 
                             key={mName} 
                             className={clsx(styles.pickerBtn, i === month && styles.pickerBtnActive)}
                             onClick={() => selectDateFromPicker(i, year)}
                           >
                             {mName.substring(0, 3)}
                           </button>
                         ))}
                       </div>
                       <div className={styles.pickerYearRow}>
                         <button onClick={() => handleYearChange(-1)}><ChevronLeft size={16}/></button>
                         <span>{year}</span>
                         <button onClick={() => handleYearChange(1)}><ChevronRight size={16}/></button>
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>
            </div>

            <div className={styles.notesSection}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                 <div className={styles.tabsRow}>
                   <button
                     onClick={() => setActiveTab('notes')}
                     className={clsx(styles.tabButton, activeTab === 'notes' && styles.tabButtonActive)}
                   >
                     Notes
                   </button>

                   <button
                     onClick={() => setActiveTab('events')}
                     className={clsx(styles.tabButton, activeTab === 'events' && styles.tabButtonActive)}
                   >
                     Events
                   </button>

                   <button
                     onClick={() => setActiveTab('habits')}
                     className={clsx(styles.tabButton, activeTab === 'habits' && styles.tabButtonActive)}
                   >
                     Habits
                   </button>

                   <button
                     onClick={() => setActiveTab('festivals')}
                     className={clsx(styles.tabButton, activeTab === 'festivals' && styles.tabButtonActive)}
                   >
                     Festivals
                   </button>
                 </div>
                 
                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                   <button 
                     onClick={() => {
                       setSelectionMode(m => m === 'range' ? 'individual' : 'range');
                       // Optionally clear context when swapping modes
                       setSelectedStart(null);
                       setSelectedEnd(null);
                       setSelectedDates([]);
                     }}
                     className={styles.badge}
                     style={{ margin: 0, cursor: 'pointer' }}
                   >
                     {selectionMode === 'range' ? 'Mode: Range' : 'Mode: Individual'}
                   </button>
                   {((selectionMode === 'range' && (selectedStart || selectedEnd)) || (selectionMode === 'individual' && selectedDates.length > 0)) && (
                     <button 
                       onClick={() => { setSelectedStart(null); setSelectedEnd(null); setSelectedDates([]); }}
                       className={styles.badge}
                       style={{ margin: 0, cursor: 'pointer', backgroundColor: 'var(--holiday-dot)', color: 'white' }}
                       aria-label="Clear Selection"
                     >
                        Clear
                     </button>
                   )}
                 </div>
               </div>
               
               {activeTab === 'notes' ? (
                 <>
                   <div className={styles.notesList} ref={constraintsRef}>
                     {currentNotes.map(n => (
                       <motion.div 
                         key={n.id} 
                         drag
                         dragConstraints={constraintsRef}
                         dragElastic={0.2}
                         dragMomentum={false}
                         className={styles.noteItem}
                         style={{ zIndex: activeNoteId === n.id ? -1 : 1 }}
                       >
                         {editingNoteId === n.id ? (
                           <div className={styles.flexColGap2}>
                             <textarea 
                               className={styles.noteTextareaLined} 
                               value={editNoteText}
                               onChange={(e) => setEditNoteText(e.target.value)}
                               onKeyDown={(e) => {
                                 if (e.key === 'Escape') setEditingNoteId(null);
                                 if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveEditNote();
                               }}
                               autoFocus
                             />
                             <div className={styles.flexJustifyEndGap2}>
                               <button onClick={() => setEditingNoteId(null)} className={styles.iconButton}><X size={16}/></button>
                               <button onClick={saveEditNote} className={styles.iconButton}><Check size={16}/></button>
                             </div>
                           </div>
                         ) : (
                           <>
                             <div className={styles.noteText} style={{ textDecoration: n.done ? 'line-through' : 'none', opacity: n.done ? 0.6 : 1 }}>{n.text}</div>
                             <div className={styles.noteMeta}>
                               <span>
                                 {n.startDate && formatDate(new Date(n.startDate))}
                                 {n.endDate && ` - ${formatDate(new Date(n.endDate))}`}
                               </span>
                               <div className={styles.noteActions}>
                                 <button onClick={() => toggleCheckNote(n.id)} className={styles.noteActionButton} aria-label="Toggle Complete"><Check size={14} /></button>
                                 <button onClick={() => startEditNote(n)} className={styles.noteActionButton} aria-label="Edit Note"><Edit2 size={14} /></button>
                                 <button onClick={() => handleDeleteNote(n.id)} className={styles.noteActionButton} aria-label="Delete Note"><Trash2 size={14} /></button>
                               </div>
                             </div>
                           </>
                         )}
                       </motion.div>
                     ))}
                   </div>

                   <textarea 
                      className={styles.noteTextareaLined}
                      placeholder={selectedStart ? `Note for ${formatDate(selectedStart)} ${selectedEnd ? '- '+formatDate(selectedEnd) : ''}... (Ctrl+Enter to save)` : `General note for ${MONTH_NAMES[month]}...`}
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      onKeyDown={handleKeyDownNote}
                   />
                   <button 
                      onClick={handleAddNote} 
                      disabled={!newNoteText.trim()}
                      className={styles.saveNoteBtn}
                   >
                     Save Note
                   </button>
                 </>
               ) : activeTab === 'events' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
                    {!selectedStart || selectedEnd ? (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Select a single day to manage events.</p>
                      </div>
                    ) : (
                      <>
                        <div className={styles.notesList}>
                          {(events[selectedStart.toDateString()] || []).length === 0 ? (
                             <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }}>No events for this day.</p>
                          ) : (
                             (events[selectedStart.toDateString()] || []).map(ev => {
                               const cat = EVENT_CATEGORIES.find(c => c.id === ev.category) || EVENT_CATEGORIES[0];
                               const daysUntil = getDaysUntil(selectedStart);
                               return (
                                 <div key={ev.id} className={styles.noteItem} style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderLeft: `3px solid ${cat.color}` }}>
                                   <div>
                                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2px' }}>
                                       <span style={{ fontWeight: 700, color: cat.color, fontSize: '0.85rem' }}>{ev.time}</span>
                                       <span style={{ fontSize: '0.65rem', background: cat.color + '22', color: cat.color, borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>{cat.label}</span>
                                     </div>
                                     <div style={{ fontSize: '0.875rem' }}>{ev.title}</div>
                                     {daysUntil === 0 && <div style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 700, marginTop: 2 }}>Today!</div>}
                                     {daysUntil > 0 && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>in {daysUntil} day{daysUntil !== 1 ? 's' : ''}</div>}
                                     {daysUntil < 0 && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2, textDecoration: 'line-through', opacity: 0.6 }}>Past</div>}
                                   </div>
                                   <button onClick={() => handleDeleteEvent(selectedStart.toDateString(), ev.id)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', padding: 4, cursor: 'pointer', flexShrink: 0 }}><X size={14}/></button>
                                 </div>
                               );
                             })
                          )}
                        </div>
                        
                        <div className={styles.noteAddArea} style={{ marginTop: '0.5rem', gap: '0.5rem' }}>
                           <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                             {EVENT_CATEGORIES.map(cat => (
                               <button 
                                 key={cat.id}
                                 onClick={() => setNewEventCategory(cat.id)}
                                 style={{ flex: 1, padding: '0.35rem', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, border: newEventCategory === cat.id ? `2px solid ${cat.color}` : '2px solid transparent', background: newEventCategory === cat.id ? cat.color + '22' : 'var(--border-subtle)', color: cat.color, cursor: 'pointer', transition: 'all 0.15s' }}
                               >
                                 {cat.label}
                               </button>
                             ))}
                           </div>
                           <input 
                             type="time" 
                             value={newEventTime} 
                             onChange={(e) => setNewEventTime(e.target.value)} 
                             style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-calendar)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-primary)', fontFamily: 'inherit' }} 
                           />
                           <input 
                             type="text" 
                             placeholder="Event Title..." 
                             value={newEventTitle} 
                             onChange={(e) => setNewEventTitle(e.target.value)}
                             onKeyDown={(e) => { if (e.key === 'Enter') handleAddEvent(); }}
                             style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-calendar)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-primary)', fontFamily: 'inherit' }} 
                           />
                           <button onClick={handleAddEvent} disabled={!newEventTitle.trim()} className={styles.saveNoteBtn}>Add Event</button>
                        </div>
                      </>
                    )}
                  </div>
                  ) : activeTab === 'festivals' ? (
                  // FESTIVALS TAB
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      Showing {monthFestivals.length} festival{monthFestivals.length !== 1 ? 's' : ''} · {MONTH_NAMES[month].charAt(0) + MONTH_NAMES[month].slice(1).toLowerCase()} {year}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto', flex: 1 }}>
                      {monthFestivals.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }}>No major festivals this month.</p>
                      ) : monthFestivals.map((fest, fi) => {
                        const ftype = FESTIVAL_TYPES[fest.type] || FESTIVAL_TYPES.national;
                        const dUntil = getDaysUntil(fest.date);
                        const isDiwali = fest.name.toLowerCase().includes('diwali');
                        const isHoli = fest.name.toLowerCase().includes('holi');
                        return (
                          <motion.div
                            key={fi}
                            whileHover={{ scale: 1.02 }}
                            onClick={(e) => triggerFestivalEffect(fest, e)}
                            style={{
                              padding: '0.65rem 0.85rem',
                              borderRadius: 8,
                              background: ftype.bg,
                              border: `1px solid ${ftype.color}33`,
                              cursor: 'pointer',
                              position: 'relative',
                              overflow: 'hidden',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: 2 }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: ftype.color }}>
                                    {fest.type === 'muslim' ? <Moon size={13} strokeWidth={2} /> : <Sparkles size={12} strokeWidth={2} />}
                                  </span>
                                  <span style={{
                                    fontWeight: 700, fontSize: '0.82rem', color: ftype.color,
                                    ...(isDiwali ? { textShadow: `0 0 8px ${ftype.color}` } : {})
                                  }} className={isDiwali ? 'festival-diwali' : isHoli ? 'festival-holi' : ''}>
                                    {fest.name}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  {fest.date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '0.5rem' }}>
                                {dUntil === 0 && <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#16A34A', background: '#DCFCE7', borderRadius: 4, padding: '2px 6px' }}>Today!</span>}
                                {dUntil > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>in {dUntil}d</span>}
                                {dUntil < 0 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.5 }}>Past</span>}
                              </div>
                            </div>
                            <div style={{ fontSize: '0.62rem', color: ftype.color, opacity: 0.7, marginTop: '0.2rem' }}>{ftype.label}</div>
                            {fest.special && (
                              <div style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: ftype.color, animation: 'festivalPulse 2s ease-in-out infinite' }} />
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.25rem' }}>
                      Tap any festival card to celebrate.
                    </div>
                  </div>
                ) : (
                  // HABITS TAB
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '0.5rem' }}>
                    <div style={{ marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      Select a date above, then check off your daily habits.
                    </div>
                    {(() => {
                      const habitDateKey = selectedStart ? selectedStart.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                      const todayHabits = habits[habitDateKey] || {};
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {habitList.map(habit => {
                            const done = todayHabits[habit];
                            const streak = getHabitStreak(habit);
                            return (
                              <motion.div
                                key={habit}
                                onClick={() => toggleHabit(habitDateKey, habit)}
                                whileTap={{ scale: 0.97 }}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '0.65rem 1rem', borderRadius: 8, cursor: 'pointer',
                                  background: done ? 'rgba(34,197,94,0.12)' : 'var(--border-subtle)',
                                  border: done ? '1px solid rgba(34,197,94,0.4)' : '1px solid transparent',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <div style={{
                                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                    background: done ? '#22c55e' : 'var(--bg-panel)',
                                    border: '2px solid ' + (done ? '#22c55e' : 'var(--border-darker)'),
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                                  }}>
                                    {done && <Check size={12} color="white" />}
                                  </div>
                                  <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{habit}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  {streak > 0 && (
                                    <span style={{ fontSize: '0.75rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}>
                                      <Flame size={12} /> {streak}
                                    </span>
                                  )}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); removeHabit(habit); }}
                                    style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                          
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <input
                              type="text"
                              placeholder="New habit..."
                              value={newHabitName}
                              onChange={(e) => setNewHabitName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') addNewHabit(); }}
                              style={{ flex: 1, padding: '0.6rem', background: 'var(--bg-calendar)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.875rem' }}
                            />
                            <button onClick={addNewHabit} className={styles.saveNoteBtn} style={{ padding: '0.6rem 1rem', margin: 0 }}>+</button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
            </div>
          </div>

          <div 
             className={styles.rightColumn}
             onTouchStart={handleTouchStart}
             onTouchEnd={handleTouchEnd}
          >
            <div className={styles.flipContainerWrapper}>
              <AnimatePresence 
                custom={direction} 
                initial={false} 
                onExitComplete={() => setIsAnimating(false)}
              >
                <motion.div
                  key={`${year}-${month}`}
                  custom={direction}
                  variants={flipVariants}
                  initial="initial"
                  animate="in"
                  exit="out"
                  className={styles.flipInner}
                  style={{ backgroundColor: 'var(--bg-calendar)', transformStyle: 'preserve-3d' }}
                >
                  {/* Grid */}
                <div className={styles.gridSection}>
                  <div className={styles.weekdaysHeader} role="row">
                    {WEEKDAYS.map(w => <div key={w} className={styles.weekday} role="columnheader">{w}</div>)}
                  </div>

                  <motion.div 
                    className={styles.daysGrid} 
                    role="grid"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: { transition: { staggerChildren: 0.015 } }
                    }}
                  >
                    {gridDays.map((dObj, idx) => {
                      const d = dObj.date;
                      const dateStr = d.toDateString();
                      const moonPhaseIndex = getMoonPhaseIndex(d);
                      
                      const startDay = isSameDay(d, selectedStart);
                      const endDay = selectionMode === 'range' && isSameDay(d, selectedEnd);
                      const inRng = selectionMode === 'range' && isInRange(d, selectedStart, selectedEnd);
                      const isIndividualSelected = selectionMode === 'individual' && selectedDates.some(sd => sd.getTime() === d.getTime());
                      const today = isToday(d);
                      const outOfMonth = !dObj.isCurrentMonth;
                      const weekend = isWeekend(d);
                      const holiday = getHoliday(d);
                      const festival = getIndianFestival(d, apiFestivals);
                      const hasNote = noteDatesStr.has(dateStr);
                      const hasEvent = eventDatesStr.has(dateStr);

                      // Combine visual classes
                      const cellClasses = clsx(
                        styles.dayCellWrapper,
                        outOfMonth && styles.dayOutOfMonth,
                        weekend && styles.dayWeekend,
                        today && styles.dayToday,
                        (startDay || endDay || isIndividualSelected) && styles.daySelected,
                        festival && !outOfMonth && styles.dayFestival
                      );

                      // Range Background visual
                      let bStyle = {};
                      if (selectionMode === 'range') {
                        if (startDay && selectedEnd) bStyle = { left: '50%', right: 0, borderRadius: '20px 0 0 20px', width: 'auto' };
                        if (endDay && selectedStart) bStyle = { left: 0, right: '50%', borderRadius: '0 20px 20px 0', width: 'auto' };
                        if (inRng) bStyle = { left: 0, right: 0 };
                      }

                      const ariaLabel = `${formatDate(d)}${holiday ? `, holiday: ${holiday}` : ''}${today ? ', today' : ''}`;

                      return (
                        <motion.div 
                          key={dateStr} 
                          className={cellClasses}
                          variants={{
                            hidden: { opacity: 0, scale: 0.8, y: 10 },
                            visible: { opacity: 1, scale: 1, y: 0 }
                          }}
                           onClick={(e) => {
                              handleDateClick(dObj, e);
                              if (festival && festival.special) triggerFestivalEffect(festival, e);
                           }}
                          role="gridcell"
                          aria-label={ariaLabel}
                          title={holiday || undefined}
                        >
                          {(inRng || (startDay && selectedEnd && selectionMode === 'range') || (endDay && selectionMode === 'range')) && <div className={styles.dayBg} style={bStyle} />}
                          {/* Festival background tint */}
                          {festival && !outOfMonth && (
                            <div style={{
                              position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
                              background: (FESTIVAL_TYPES[festival.type] || FESTIVAL_TYPES.national).bg,
                              border: `1px solid ${(FESTIVAL_TYPES[festival.type] || FESTIVAL_TYPES.national).color}44`,
                            }} />
                          )}
                          <div className={styles.dayContent}>
                            {d.getDate()}
                            {dObj.isCurrentMonth && (
                              <span style={{ fontSize: '0.55rem', display: 'block', lineHeight: 1.1, color: festival ? (FESTIVAL_TYPES[festival.type] || FESTIVAL_TYPES.national).color : 'var(--text-muted)', userSelect: 'none' }}>
                                {festival ? <Sparkles size={8} strokeWidth={2} /> : <Moon size={8} strokeWidth={1.8} style={{ opacity: MOON_PHASE_OPACITY[moonPhaseIndex] }} />}
                              </span>
                            )}
                          </div>
                          {/* Upcoming event countdown badge */}
                          {hasEvent && dObj.isCurrentMonth && (() => {
                            const dUntil = getDaysUntil(d);
                            if (dUntil > 0 && dUntil <= 7) return (
                              <div style={{ position: 'absolute', top: 2, right: 2, fontSize: '0.55rem', background: '#22c55e', color: 'white', borderRadius: 3, padding: '0 3px', fontWeight: 700, lineHeight: '14px' }}>
                                {dUntil}d
                              </div>
                            );
                            if (dUntil === 0) return (
                              <div style={{ position: 'absolute', top: 2, right: 2, fontSize: '0.5rem', background: '#f59e0b', color: 'white', borderRadius: 3, padding: '0 3px', fontWeight: 700, lineHeight: '14px' }}>
                                NOW
                              </div>
                            );
                            return null;
                          })()}
                          <div style={{ position: 'absolute', bottom: '3px', display: 'flex', gap: '2px', left: '50%', transform: 'translateX(-50%)' }}>
                            {hasNote && <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'var(--accent-color)' }} />}
                            {hasEvent && <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#22c55e' }} />}
                            {festival && !outOfMonth && <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: (FESTIVAL_TYPES[festival.type] || FESTIVAL_TYPES.national).color }} className={festival.special ? 'festival-pulse' : ''} />}
                          </div>
                          {holiday && <div className={styles.holidayDot} />}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                  
                  {((selectionMode === 'range' && selectedStart) || (selectionMode === 'individual' && selectedDates.length > 0)) && (
                    <div className={styles.absoluteTopRight}>
                      {selectionMode === 'range' ? (selectedEnd ? `${getDayCount(selectedStart, selectedEnd)} days selected` : '1 day selected') : `${selectedDates.length} days selected`}
                    </div>
                  )}

                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {activeNoteId && (
          <motion.div 
            className={styles.focusOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveNoteId(null)}
          >
            {(() => {
              const n = currentNotes.find(x => x.id === activeNoteId);
              if (!n) return null;
              return (
                <motion.div 
                  className={styles.focusCard}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={styles.notesTitle}>
                    {n.startDate && formatDate(new Date(n.startDate))}
                    {n.endDate && ` - ${formatDate(new Date(n.endDate))}`}
                  </div>
                  <div className={styles.noteText} style={{ textDecoration: n.done ? 'line-through' : 'none', opacity: n.done ? 0.6 : 1, fontSize: '1.25rem' }}>
                    {n.text}
                  </div>
                  <button onClick={() => setActiveNoteId(null)} className={styles.saveNoteBtn}>Close Note</button>
                </motion.div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
