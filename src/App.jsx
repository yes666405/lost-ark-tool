import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Users, Calendar, Trash2, User, Sword, Shield, Settings, ChevronDown, ChevronRight, ChevronUp, ChevronLeft, Clock, X, Edit, Save, UserPlus, CheckCircle, AlertCircle, Filter, Layout, Copy, Loader2, CalendarDays, Download, Upload, Gamepad2, MoreHorizontal, FileJson, AlertTriangle, FolderPlus, Folder, MoreVertical, Tag, Circle, Triangle, Square, Star, Repeat, CalendarPlus, CalendarCheck, Check, Ban, HelpCircle, ArrowUp, ArrowDown, LogIn, ArrowRightLeft, Search, Edit2, UserCheck, PieChart, BarChart, Image as ImageIcon, Sun, Moon, Palette, Coins, LogOut, RefreshCw } from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDoc, writeBatch } from 'firebase/firestore';

// -----------------------------------------------------------------------------
// Firebase Configuration & Initialization
// -----------------------------------------------------------------------------

const firebaseConfig = {
  apiKey: "AIzaSyDNieWQ1KKzeP67z4CMUwJCt1SAP98WQ_8",
  authDomain: "lost-ark-plan.firebaseapp.com",
  projectId: "lost-ark-plan",
  storageBucket: "lost-ark-plan.firebasestorage.app",
  messagingSenderId: "208117887542",
  appId: "1:208117887542:web:d15d9ef6779ceacff41e97"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "my-lost-ark-guild-room-1"; // 您專屬的資料庫房間ID
let initError = null; 

// -----------------------------------------------------------------------------
// Constants & Utilities
// -----------------------------------------------------------------------------


const APP_VERSION = 'v1.7.4'; 

const generateId = () => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (e) {}
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const hexToRgba = (hex, alpha = 1) => {
  let c;
  if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
      c= hex.substring(1).split('');
      if(c.length== 3){
          c= [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c= '0x'+c.join('');
      return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
  }
  return hex; // Fallback
}

const JOB_CLASSES = [
  { name: '毀滅者', role: 'DPS' },
  { name: '督軍', role: 'DPS' },
  { name: '狂戰士', role: 'DPS' },
  { name: '聖騎士', role: 'Support' },
  { name: '屠殺者', role: 'DPS' },
  { name: '格鬥大師', role: 'DPS' },
  { name: '拳霸', role: 'DPS' },
  { name: '氣功師', role: 'DPS' },
  { name: '鬥士', role: 'DPS' },
  { name: '槍術士', role: 'DPS' },
  { name: '拳剎', role: 'DPS' },
  { name: '惡魔獵手', role: 'DPS' },
  { name: '槍砲大師', role: 'DPS' },
  { name: '鷹眼', role: 'DPS' },
  { name: '神槍手', role: 'DPS' },
  { name: '偵查士', role: 'DPS' },
  { name: '卡牌魔術師', role: 'DPS' },
  { name: '吟遊詩人', role: 'Support' },
  { name: '女巫', role: 'DPS' },
  { name: '召喚師', role: 'DPS' },
  { name: '刀鋒', role: 'DPS' },
  { name: '半魔人', role: 'DPS' },
  { name: '噬魂者', role: 'DPS' },
  { name: '影殺者', role: 'DPS' },
  { name: '畫師', role: 'Support' },
  { name: '氣象術士', role: 'DPS' },
  { name: '幻獸師', role: 'DPS' },
];

const EVENT_SHAPES = [
    { id: 'circle', icon: Circle, label: '圓形' },
    { id: 'triangle', icon: Triangle, label: '三角形' },
    { id: 'square', icon: Square, label: '方形' },
    { id: 'star', icon: Star, label: '星形' },
];

const EVENT_COLORS = [
    { id: 'red', class: 'text-red-500', bg: 'bg-red-500', label: '紅' },
    { id: 'orange', class: 'text-orange-500', bg: 'bg-orange-500', label: '橘' },
    { id: 'yellow', class: 'text-yellow-400', bg: 'bg-yellow-400', label: '黃' },
    { id: 'green', class: 'text-green-500', bg: 'bg-green-500', label: '綠' },
    { id: 'blue', class: 'text-blue-500', bg: 'bg-blue-500', label: '藍' },
    { id: 'purple', class: 'text-purple-500', bg: 'bg-purple-500', label: '紫' },
    { id: 'pink', class: 'text-pink-500', bg: 'bg-pink-500', label: '粉' },
];

const getStatus = (team, isDark) => {
  const baseBg = isDark ? 'bg-opacity-30' : 'bg-opacity-20';
  
  if (team.isCompleted) return { label: '已完成', color: 'text-green-500', bg: `bg-green-600 ${baseBg} border-green-500/50`, type: 'completed' };
  
  if (!team.time) return { label: '未定', color: isDark ? 'text-slate-400' : 'text-slate-500', bg: isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-200 border-slate-300', type: 'tbd' };

  const teamTime = new Date(team.time).getTime();
  const now = Date.now();
  const diff = teamTime - now;
  const diffMinutes = Math.floor(diff / (1000 * 60));

  if (diffMinutes < -30) {
    return { label: '已超時', color: 'text-red-500', bg: `bg-red-600 ${baseBg} border-red-500/50`, type: 'overdue' };
  }
  
  if (diffMinutes < 0) {
    return { label: '進行中', color: 'text-yellow-500', bg: `bg-yellow-600 ${baseBg} border-yellow-500/50`, type: 'active' };
  }

  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  
  let timeLabel = '';
  if (hours > 24) {
    timeLabel = `${Math.floor(hours / 24)}天後`;
  } else if (hours > 0) {
    timeLabel = `${hours}小時${mins}分後`;
  } else {
    timeLabel = `${mins}分後`;
  }

  return { label: `等待中 (${timeLabel})`, color: 'text-blue-500', bg: `bg-blue-600 ${baseBg} border-blue-500/50`, type: 'waiting' };
};

const formatDateTime = (isoString) => {
  if (!isoString) return '未定';
  const date = new Date(isoString);
  return date.toLocaleString('zh-TW', { 
    month: 'numeric', 
    day: 'numeric', 
    weekday: 'short', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const formatDateOnly = (dateString) => {
  const date = new Date(dateString);
  const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  return `${date.getMonth() + 1}/${date.getDate()} ${weekdays[date.getDay()]}`;
};

const formatTimeOnly = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
};

// -----------------------------------------------------------------------------
// Components
// -----------------------------------------------------------------------------

const Modal = ({ isOpen, onClose, title, children, size = 'md', isDarkMode }) => {
  if (!isOpen) return null;
  const maxWidth = size === 'lg' ? 'max-w-4xl' : (size === 'xl' ? 'max-w-6xl' : (size === 'sm' ? 'max-w-sm' : 'max-w-md'));
  const t = isDarkMode ? {
      bg: 'bg-[#1e293b]',
      border: 'border-slate-700',
      text: 'text-slate-100',
      headerBg: 'bg-[#1e293b] border-slate-700'
  } : {
      bg: 'bg-white',
      border: 'border-slate-200',
      text: 'text-slate-900',
      headerBg: 'bg-white border-slate-100'
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" 
      style={{ zIndex: 99999 }} 
    >
      <div className={`${t.bg} border ${t.border} rounded-lg shadow-2xl w-full ${maxWidth} overflow-hidden flex flex-col max-h-[90vh]`}>
        <div className={`flex justify-between items-center p-4 border-b ${t.headerBg} shrink-0`}>
          <h3 className={`text-lg font-bold ${t.text}`}>{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-0 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

const ClassIcon = ({ job, role, icons, className = "w-6 h-6", showTooltip = true }) => {
    const iconUrl = icons?.[job];
    const isSupport = role === 'Support';
    
    // Colors for fallback SVG version
    const roleColor = isSupport ? 'text-green-500 border-green-500/30 bg-green-500/10' : 'text-red-500 border-red-500/30 bg-red-500/10';
    
    // Border colors for uploaded image version (Modified: Thicker and solid color)
    const imgBorderColor = isSupport ? 'border-green-500' : 'border-red-500';

    const fallback = (
        <div className={`flex items-center justify-center rounded border ${roleColor} ${className}`} title={showTooltip ? job : ''}>
            {isSupport ? <Shield size="60%" /> : <Sword size="60%" />}
        </div>
    );

    if (iconUrl) {
        return (
            <img 
                src={iconUrl} 
                alt={job} 
                className={`${className} object-contain rounded bg-slate-900/20 border-2 ${imgBorderColor}`} 
                title={showTooltip ? job : ''}
                onError={(e) => { e.target.style.display='none'; }}
            />
        );
    }
    return fallback;
};

export default function App() {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
      const saved = localStorage.getItem('la_app_theme');
      return saved !== 'light'; // Default to dark if not set or set to anything else
  });

  const toggleTheme = () => {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      localStorage.setItem('la_app_theme', newMode ? 'dark' : 'light');
  };

  // Theme Classes Object
  const T = useMemo(() => isDarkMode ? {
      mode: 'dark',
      bgMain: 'bg-[#0f172a]', // Slate 950 for deep contrast
      textMain: 'text-slate-300',
      textBold: 'text-white',
      textDim: 'text-slate-400',
      card: 'bg-[#1e293b] border-slate-700', // Slate 800
      cardHover: 'hover:border-slate-500',
      nav: 'bg-[#1e293b] border-slate-700 shadow-md shadow-black/20',
      input: 'bg-[#0f172a] border-slate-700 text-white placeholder:text-slate-600',
      slot: 'bg-[#334155]/40 border-slate-700 hover:bg-[#334155]/60 hover:border-slate-500',
      slotEmpty: 'bg-slate-800/30 border-slate-700 border-dashed hover:bg-slate-800/50',
      buttonSecondary: 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700',
      select: 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700',
      divider: 'border-slate-700',
      separator: 'bg-slate-700',
      modalBg: 'bg-[#1e293b]',
      subtleBg: 'bg-[#0f172a]/30 border border-slate-700/30',
      groupActive: 'bg-blue-600 text-white shadow-md shadow-blue-900/20',
      groupInactive: 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
      hover: 'hover:bg-slate-700/50'
  } : {
      mode: 'light',
      bgMain: 'bg-[#f1f5f9]', // Slate 100 - Distinct from white
      textMain: 'text-slate-700',
      textBold: 'text-slate-900',
      textDim: 'text-slate-500',
      card: 'bg-white border-slate-200 shadow-sm',
      cardHover: 'hover:border-blue-300',
      nav: 'bg-white border-slate-200 shadow-sm',
      input: 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400',
      slot: 'bg-slate-50 border-slate-200 hover:bg-white hover:border-blue-300 shadow-sm',
      slotEmpty: 'bg-slate-50 border-slate-300 border-dashed hover:bg-slate-100',
      buttonSecondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm',
      select: 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50',
      divider: 'border-slate-200',
      separator: 'bg-slate-200',
      modalBg: 'bg-white',
      subtleBg: 'bg-slate-50 border border-slate-100',
      groupActive: 'bg-blue-600 text-white shadow-md shadow-blue-500/20',
      groupInactive: 'text-slate-600 hover:bg-slate-200 hover:text-slate-900',
      hover: 'hover:bg-slate-100'
  }, [isDarkMode]);

  if (initError) {
    return (
      <div className={`min-h-screen ${T.bgMain} flex items-center justify-center p-4`}>
        <div className={`${T.card} p-6 max-w-md text-center shadow-2xl rounded-xl border-l-4 border-red-500`}>
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className={`text-xl font-bold ${T.textBold} mb-2`}>發生錯誤 (Error 1040/Config)</h2>
          <p className={`${T.textDim} mb-4`}>無法讀取資料庫設定。</p>
          <div className="text-sm bg-black/10 p-3 rounded text-left font-mono text-red-500 overflow-x-auto">{initError}</div>
        </div>
      </div>
    );
  }

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('teams');
  
  const [players, setPlayers] = useState([]); 
  const [teams, setTeams] = useState([]);
  const [groups, setGroups] = useState([]); 
  const [customEvents, setCustomEvents] = useState([]); 
  const [classIcons, setClassIcons] = useState({}); 
  const [customClasses, setCustomClasses] = useState([]); // <-- 新增：用來儲存自訂職業
  const [classTags, setClassTags] = useState({}); // <-- 新增：儲存各職業的標籤
  const [localTags, setLocalTags] = useState({}); // <-- 新增：標籤編輯用暫存狀態
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  const [selectedGroupId, setSelectedGroupId] = useState('ALL'); 
  const [rosterFilterId, setRosterFilterId] = useState(() => localStorage.getItem('la_roster_filter_id') || 'ALL');
  const [rosterIlvlFilter, setRosterIlvlFilter] = useState(''); 
  const [rosterRoleFilter, setRosterRoleFilter] = useState('ALL'); 
  const [teamCompletionFilter, setTeamCompletionFilter] = useState('ALL'); 
  const [isStatsOpen, setIsStatsOpen] = useState(false); 
  // MODIFIED: Default to true (Image Mode), unless explicitly set to 'false' in localStorage
  const [showRosterImages, setShowRosterImages] = useState(() => {
      const saved = localStorage.getItem('la_roster_show_images');
      return saved !== 'false'; 
  });

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isCharModalOpen, setIsCharModalOpen] = useState(false);
  const [isSlotSelectModalOpen, setIsSlotSelectModalOpen] = useState(false);
  const [isDataSettingsOpen, setIsDataSettingsOpen] = useState(false);
  const [isIconSettingsOpen, setIsIconSettingsOpen] = useState(false);
  const [managingPlayer, setManagingPlayer] = useState(null); 
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false); 
  const [isEventModalOpen, setIsEventModalOpen] = useState(false); 
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false); 
  const [isJoinTeamModalOpen, setIsJoinTeamModalOpen] = useState(false); 
  const [isExternalRunModalOpen, setIsExternalRunModalOpen] = useState(false); 

  const [importConfirm, setImportConfirm] = useState({ isOpen: false, data: null, message: '' });

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true); // NEW: Sidebar expansion state

  const [draggedItem, setDraggedItem] = useState(null); 
  const [draggedRosterItem, setDraggedRosterItem] = useState(null);
  
  const [quickTimeTeam, setQuickTimeTeam] = useState(null);
  const [quickTimeValue, setQuickTimeValue] = useState('');
  const [quickTimeCalendarViewDate, setQuickTimeCalendarViewDate] = useState(new Date());

  const [joiningCharacter, setJoiningCharacter] = useState(null); 
  const [prefilledMemberId, setPrefilledMemberId] = useState(null); 
  const [viewingTeamId, setViewingTeamId] = useState(null); 
  const [returnToTeamId, setReturnToTeamId] = useState(null); 

  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, id: null, parentId: null, title: '', message: '' });
  // NEW: Action Confirm State for Assignments/Swaps
  const [actionConfirm, setActionConfirm] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  
  const [editingTeamId, setEditingTeamId] = useState(null); 
  const [targetPlayerId, setTargetPlayerId] = useState(null);
  const [editingCharId, setEditingCharId] = useState(null); 
  const [editingPlayerId, setEditingPlayerId] = useState(null); 
  
  const [selectedTeamId, setSelectedTeamId] = useState(null); 
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);
  const [slotSelectorFilter, setSlotSelectorFilter] = useState('ALL');
  const [slotRoleFilter, setSlotRoleFilter] = useState('ALL'); 
  const [slotHighIlvlFilter, setSlotHighIlvlFilter] = useState(false); // <-- 新增：高裝等篩選
  const [slotTagFilter, setSlotTagFilter] = useState('ALL'); // <-- 新增：標籤篩選

  const [quickEditIlvlCharId, setQuickEditIlvlCharId] = useState(null); // <-- 新增：快速編輯裝等ID
  const [quickEditIlvlValue, setQuickEditIlvlValue] = useState(''); // <-- 新增：快速編輯裝等值

  const [editingGroup, setEditingGroup] = useState(null); 
  const [editingExternalRunData, setEditingExternalRunData] = useState(null); 

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null); 
  // REMOVED: const [timelineViewMode, setTimelineViewMode] = useState('schedule'); 

  const [teamCalendarViewDate, setTeamCalendarViewDate] = useState(new Date());

  const [availabilityPlayer, setAvailabilityPlayer] = useState(null);
  const [availabilityData, setAvailabilityData] = useState({}); 

  // MODIFIED: Added gold and difficulty to teamFormData
  const [teamFormData, setTeamFormData] = useState({ name: '', time: '', size: 8, minIlvl: 0, groupId: '', gold: 0, difficulty: '' });
  // MODIFIED: Added bgColor to playerFormData
  const [playerFormData, setPlayerFormData] = useState({ name: '', color: '#ffffff', bgColor: '' });
  const [charFormData, setCharFormData] = useState({ name: '', job: '半魔人', ilvl: '1680' });
  // MODIFIED: Replaced single 'gold' and 'difficulty' with dual gold settings
  const [groupFormData, setGroupFormData] = useState({ name: '', image: '', color: '#3b82f6', goldNormal: 0, goldHard: 0 }); 
  
  const [eventFormData, setEventFormData] = useState({ name: '', shape: 'circle', color: 'red', type: 'specific', dates: [], startDate: '', period: 14 });
  const [tempEventDate, setTempEventDate] = useState('');

  const [newClassName, setNewClassName] = useState(''); // <-- 新增：自訂職業表單狀態
  const [newClassRole, setNewClassRole] = useState('DPS'); // <-- 新增：自訂職業表單狀態

  // NEW: State for Character Batch Management
  const [isCharManageModalOpen, setIsCharManageModalOpen] = useState(false);
  const [charManageTarget, setCharManageTarget] = useState(null);
  const [charManageOptions, setCharManageOptions] = useState({ removeExternal: false, removeTeams: false });

  // NEW: State for Player Batch Management
  const [isPlayerBatchModalOpen, setIsPlayerBatchModalOpen] = useState(false);
  const [playerBatchTarget, setPlayerBatchTarget] = useState(null);
  const [playerBatchOptions, setPlayerBatchOptions] = useState({ removeExternal: false, resetExternal: false });

  const fileInputRef = useRef(null);
  const batchIconInputRef = useRef(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth Error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubPlayers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'players'), (snapshot) => {
      const loadedPlayers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlayers(loadedPlayers.sort((a, b) => a.name.localeCompare(b.name)));
    });
    const unsubTeams = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'teams'), (snapshot) => {
      const loadedTeams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeams(loadedTeams.sort((a, b) => {
         const orderA = a.customOrder !== undefined ? a.customOrder : 9999;
         const orderB = b.customOrder !== undefined ? b.customOrder : 9999;
         if (orderA !== orderB) return orderA - orderB;
         if (!a.time) return 1;
         if (!b.time) return -1;
         return new Date(a.time) - new Date(b.time);
      }));
      setLoading(false);
    });
    const unsubGroups = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings_groups', 'list'), (docSnap) => {
        setGroups(docSnap.exists() ? docSnap.data().list || [] : []);
    });
    const unsubEvents = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings_calendar', 'events'), (docSnap) => {
        setCustomEvents(docSnap.exists() ? docSnap.data().list || [] : []);
    });
    const unsubIcons = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings_icons', 'class_icons'), (docSnap) => {
        setClassIcons(docSnap.exists() ? docSnap.data().icons || {} : {});
    });
    // 新增：監聽 Firebase 上的自訂職業資料
    const unsubClasses = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings_classes', 'custom'), (docSnap) => {
        setCustomClasses(docSnap.exists() ? docSnap.data().list || [] : []);
    });
    // 新增：監聽職業標籤設定
    const unsubTags = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings_classes', 'tags'), (docSnap) => {
        setClassTags(docSnap.exists() ? docSnap.data().tags || {} : {});
    });

    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => { unsubPlayers(); unsubTeams(); unsubGroups(); unsubEvents(); unsubIcons(); unsubClasses(); unsubTags(); clearInterval(interval); };
  }, [user]);

  // 新增：同步遠端標籤至本地編輯狀態
  useEffect(() => { setLocalTags(classTags); }, [classTags]);
  
  useEffect(() => { localStorage.setItem('la_roster_filter_id', rosterFilterId); }, [rosterFilterId]);
  
  // 新增：將預設職業與自訂職業合併為完整的職業清單
  const ALL_CLASSES = useMemo(() => [...JOB_CLASSES, ...customClasses], [customClasses]);
  
  // 新增：彙整所有存在的標籤提供給下拉選單
  const availableTags = useMemo(() => {
      const tags = new Set();
      Object.values(classTags).forEach(tagStr => {
          if (tagStr) {
              tagStr.split(',').forEach(t => {
                  const trimmed = t.trim();
                  if (trimmed) tags.add(trimmed);
              });
          }
      });
      return Array.from(tags).sort();
  }, [classTags]);

  const toggleRosterImages = () => {
      const newValue = !showRosterImages;
      setShowRosterImages(newValue);
      localStorage.setItem('la_roster_show_images', newValue);
  };

  const viewingTeam = useMemo(() => teams.find(t => t.id === viewingTeamId), [teams, viewingTeamId]);

  const getCharById = (charId) => {
    for (const player of players) {
      const char = player.characters.find(c => c.id === charId);
      // MODIFIED: Return ownerBgColor
      if (char) return { ...char, ownerName: player.name, ownerId: player.id, ownerColor: player.color, ownerBgColor: player.bgColor };
    }
    return null;
  };
  const getTeamsForChar = (charId) => teams.filter(t => t.members.includes(charId));
  const getTeamById = (teamId) => teams.find(t => t.id === teamId);
  const compactMembers = (members) => {
      const filled = members.filter(m => m !== null);
      const emptyCount = members.length - filled.length;
      return [...filled, ...Array(emptyCount).fill(null)];
  };
  const getCalendarDays = (currentDate) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    const startDayOfWeek = firstDay.getDay(); 
    for (let i = 0; i < startDayOfWeek; i++) { days.push({ type: 'padding', key: `pad-prev-${i}` }); }
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(year, month, i);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        days.push({ type: 'day', date: date, dateStr: dateStr, dayNum: i, key: dateStr });
    }
    return days;
  };
  const getTeamsByDate = (dateStr) => {
      return teams.filter(t => {
          if (!t.time) return false;
          const tDate = new Date(t.time);
          const tDateStr = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}-${String(tDate.getDate()).padStart(2, '0')}`;
          return tDateStr === dateStr;
      }).sort((a, b) => new Date(a.time) - new Date(b.time));
  };
  const getEventsForDate = (dateStr) => {
      if (!dateStr) return [];
      const targetDate = new Date(dateStr);
      targetDate.setHours(0,0,0,0);
      return customEvents.filter(ev => {
          if (ev.type === 'specific') return ev.dates && ev.dates.includes(dateStr);
          else if (ev.type === 'periodic') {
              if (!ev.startDate || !ev.period) return false;
              const start = new Date(ev.startDate); start.setHours(0,0,0,0);
              const diffTime = targetDate.getTime() - start.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays >= 0 && diffDays % Number(ev.period) === 0;
          }
          return false;
      });
  };
  const getAvailabilityForDate = (dateStr) => {
      const free = []; const busy = [];
      players.forEach(p => { const status = p.availability?.[dateStr]; if (status === 'free') free.push(p); if (status === 'busy') busy.push(p); });
      return { free, busy };
  };
  const nextMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  const prevMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  const goToToday = () => setCalendarDate(new Date());

  const handleIconUpload = async (e, jobName) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 50 * 1024) { 
          alert("圖檔過大！為了資料庫效能，請使用 50KB 以下的小圖示。");
          return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
          const base64 = event.target.result;
          const newIcons = { ...classIcons, [jobName]: base64 };
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings_icons', 'class_icons'), { icons: newIcons });
      };
      reader.readAsDataURL(file);
  };

  const handleBatchIconUpload = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      let newIcons = { ...classIcons };
      let matchCount = 0;
      let errorMessages = [];

      const readPromises = files.map(file => {
          return new Promise((resolve) => {
              // 取得去除副檔名的檔案名稱
              const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
              
              // 檢查是否有對應的職業名稱
              const isMatch = ALL_CLASSES.some(c => c.name === fileName);

              if (!isMatch) {
                  resolve(null);
                  return;
              }

              if (file.size > 50 * 1024) {
                  errorMessages.push(`「${fileName}」超過 50KB，已跳過。`);
                  resolve(null);
                  return;
              }

              const reader = new FileReader();
              reader.onload = (event) => {
                  newIcons[fileName] = event.target.result;
                  matchCount++;
                  resolve(true);
              };
              reader.readAsDataURL(file);
          });
      });

      await Promise.all(readPromises);

      if (matchCount > 0) {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings_icons', 'class_icons'), { icons: newIcons });
      }

      let finalMsg = `批量上傳完成！\n成功配對並更新了 ${matchCount} 個圖示。`;
      if (errorMessages.length > 0) {
          finalMsg += `\n\n注意：\n` + errorMessages.join('\n');
      } else if (matchCount === 0) {
           finalMsg += `\n請確保圖片檔名（不含副檔名）與職業名稱完全相同。`;
      }
      alert(finalMsg);
      e.target.value = null; // 重置 input 狀態
  };

  const handleGroupImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 200 * 1024) { 
        alert("圖檔過大！為了資料庫效能，請使用 200KB 以下的圖片。");
        return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
        setGroupFormData({ ...groupFormData, image: event.target.result });
    };
    reader.readAsDataURL(file);
  };

  const handleIconUrlUpdate = async (jobName, url) => {
      const newIcons = { ...classIcons, [jobName]: url };
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings_icons', 'class_icons'), { icons: newIcons });
  };

  const handleTagUpdate = async (jobName, tagString) => {
      const newTags = { ...classTags, [jobName]: tagString };
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings_classes', 'tags'), { tags: newTags }, { merge: true });
  };

  // 新增：處理新增自訂職業
  const handleAddCustomClass = async () => {
      if (!user || !newClassName.trim()) return;
      const name = newClassName.trim();
      if (ALL_CLASSES.some(c => c.name === name)) {
          alert("此職業已經存在！");
          return;
      }
      const newList = [...customClasses, { name, role: newClassRole }];
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings_classes', 'custom'), { list: newList });
      setNewClassName('');
      setNewClassRole('DPS');
  };

  // 新增：處理刪除自訂職業
  const handleDeleteCustomClass = async (className) => {
      if (!user) return;
      if (!window.confirm(`確定要刪除自訂職業「${className}」嗎？\n這不會刪除玩家已建立的該職業角色，但將從選單中移除。`)) return;
      const newList = customClasses.filter(c => c.name !== className);
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings_classes', 'custom'), { list: newList });
      // 清理可能關聯的圖示
      const newIcons = { ...classIcons };
      if (newIcons[className]) {
          delete newIcons[className];
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings_icons', 'class_icons'), { icons: newIcons });
      }
  };

  const handleDragStart = (e, teamId, index, memberId) => { setDraggedItem({ teamId, index, memberId }); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = async (e, targetTeamId, targetIndex) => { 
      e.preventDefault();
      if (!draggedItem || !user) return;
      const { teamId: sourceTeamId, index: sourceIndex, memberId: sourceMemberId } = draggedItem;
      const targetTeam = teams.find(t => t.id === targetTeamId);
      const sourceTeam = teams.find(t => t.id === sourceTeamId);
      if (!targetTeam || !sourceTeam) return;
      const padMembers = (members, size) => {
          const m = [...members];
          while (m.length < size) m.push(null);
          return m;
      };
      if (sourceTeamId === targetTeamId) {
          const newMembers = padMembers(sourceTeam.members, sourceTeam.size);
          newMembers.splice(sourceIndex, 1);
          newMembers.splice(targetIndex, 0, sourceMemberId);
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teams', sourceTeamId), { ...sourceTeam, members: compactMembers(newMembers) });
      } else {
          const sourceMembers = padMembers(sourceTeam.members, sourceTeam.size);
          const targetMembers = padMembers(targetTeam.members, targetTeam.size);
          const targetMemberId = targetMembers[targetIndex];
          targetMembers[targetIndex] = sourceMemberId;
          sourceMembers[sourceIndex] = targetMemberId;
          const batch = writeBatch(db);
          batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'teams', sourceTeamId), { ...sourceTeam, members: sourceMembers });
          batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'teams', targetTeamId), { ...targetTeam, members: targetMembers });
          await batch.commit();
      }
      setDraggedItem(null);
  };
  const handleRosterDragStart = (e, playerId, index) => { setDraggedRosterItem({ playerId, index }); e.dataTransfer.effectAllowed = 'move'; };
  const handleRosterDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleRosterDrop = async (e, targetPlayerId, targetIndex) => { 
    e.preventDefault();
    if (!draggedRosterItem || !user) return;
    const { playerId: sourcePlayerId, index: sourceIndex } = draggedRosterItem;
    if (sourcePlayerId !== targetPlayerId || sourceIndex === targetIndex) { setDraggedRosterItem(null); return; }
    const player = players.find(p => p.id === sourcePlayerId);
    if (player) {
        const newCharacters = [...player.characters];
        const [reorderedItem] = newCharacters.splice(sourceIndex, 1);
        newCharacters.splice(targetIndex, 0, reorderedItem);
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', sourcePlayerId), { ...player, characters: newCharacters });
    }
    setDraggedRosterItem(null);
  };
  const handleMoveTeam = async (teamId, direction) => { 
      const currentIndex = teams.findIndex(t => t.id === teamId);
      if (currentIndex === -1) return;
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= teams.length) return;
      const batch = writeBatch(db);
      const newOrderedTeams = [...teams];
      [newOrderedTeams[currentIndex], newOrderedTeams[targetIndex]] = [newOrderedTeams[targetIndex], newOrderedTeams[currentIndex]];
      newOrderedTeams.forEach((t, index) => { batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'teams', t.id), { customOrder: index }); });
      await batch.commit();
  };
  const openJoinTeamModal = (character) => { setJoiningCharacter(character); setIsJoinTeamModalOpen(true); };
  const handleJoinTeam = async (teamId) => { 
      if (!user || !joiningCharacter) return;
      const team = teams.find(t => t.id === teamId);
      if (!team) return;
      const fullMembers = [...team.members];
      while(fullMembers.length < team.size) fullMembers.push(null);
      const emptyIndex = fullMembers.indexOf(null);
      if (emptyIndex === -1) { alert('該隊伍已滿員！'); return; }
      fullMembers[emptyIndex] = joiningCharacter.id;
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teams', teamId), { ...team, members: fullMembers });
      setIsJoinTeamModalOpen(false);
      setJoiningCharacter(null);
      alert(`已將 ${joiningCharacter.name} 加入 ${team.name}`);
  };
  const handleCreateTeamWithChar = () => {
      if (!joiningCharacter) return;
      setIsJoinTeamModalOpen(false);
      setEditingTeamId(null);
      setTeamFormData({ name: `${joiningCharacter.name} 的隊伍`, time: '', size: 8, minIlvl: 1600, groupId: '' });
      setPrefilledMemberId(joiningCharacter.id);
      setTeamCalendarViewDate(new Date());
      setIsTeamModalOpen(true);
      setActiveTab('teams');
  };
  const handleAddEventDate = () => { if (!tempEventDate) return; if (!eventFormData.dates.includes(tempEventDate)) { setEventFormData({ ...eventFormData, dates: [...eventFormData.dates, tempEventDate].sort() }); } setTempEventDate(''); };
  const handleRemoveEventDate = (d) => { setEventFormData({ ...eventFormData, dates: eventFormData.dates.filter(x => x !== d) }); };
  const handleSaveEvent = async () => { if (!user || !eventFormData.name) return; const newEvents = [...customEvents, { id: generateId(), ...eventFormData }]; await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings_calendar', 'events'), { list: newEvents }); setEventFormData({ name: '', shape: 'circle', color: 'red', type: 'specific', dates: [], startDate: '', period: 14 }); };
  const requestDeleteEvent = (id) => setDeleteConfirm({ isOpen: true, type: 'EVENT', id: id, title: '刪除事件確認', message: '確定要刪除此事件設定嗎？' });
  
  const handleSaveGroup = async () => { 
    if (!user || !groupFormData.name.trim()) return; 
    const newGroups = [...groups]; 
    const newGroupData = { 
        name: groupFormData.name, 
        image: groupFormData.image || null,
        color: groupFormData.color || '#3b82f6',
        // MODIFIED: Save separate gold values for Normal/Hard
        goldNormal: Number(groupFormData.goldNormal) || 0,
        goldHard: Number(groupFormData.goldHard) || 0
        // REMOVED: difficulty default setting
    };

    if (editingGroup) { 
        const idx = newGroups.findIndex(g => g.id === editingGroup.id); 
        if (idx !== -1) newGroups[idx] = { ...editingGroup, ...newGroupData }; 
    } else { 
        newGroups.push({ id: generateId(), ...newGroupData }); 
    } 
    
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings_groups', 'list'), { list: newGroups }); 
    setGroupFormData({ name: '', image: '', color: '#3b82f6', goldNormal: 0, goldHard: 0 }); 
    setEditingGroup(null); 
    setIsGroupModalOpen(false); 
  };
  
  const requestDeleteGroup = (g) => setDeleteConfirm({ isOpen: true, type: 'GROUP', id: g.id, title: '刪除分組確認', message: `確定要刪除分組「${g.name}」嗎？` });
  const openAvailabilityModal = (p) => { setAvailabilityPlayer(p); setAvailabilityData(p.availability || {}); setIsAvailabilityModalOpen(true); };
  const toggleAvailabilityDate = (d) => { const c = availabilityData[d]; let n = !c ? 'free' : (c === 'free' ? 'busy' : null); const nd = { ...availabilityData }; if (n) nd[d] = n; else delete nd[d]; setAvailabilityData(nd); };
  const handleSaveAvailability = async () => { if (!user || !availabilityPlayer) return; await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', availabilityPlayer.id), { ...availabilityPlayer, availability: availabilityData }); setIsAvailabilityModalOpen(false); setAvailabilityPlayer(null); };
  const handleCreateTeamFromDate = (dStr) => { 
      const d = new Date(dStr); 
      d.setHours(20, 0, 0, 0); 
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const f = `${year}-${month}-${day}T20:00`; 
      setEditingTeamId(null); 
      setTeamFormData({ name: '', time: f, size: 8, minIlvl: 1600, groupId: '' }); 
      setTeamCalendarViewDate(d); 
      setSelectedCalendarDate(null); 
      setIsTeamModalOpen(true); 
  };
  const requestDeleteTeam = (t) => setDeleteConfirm({ isOpen: true, type: 'TEAM', id: t.id, title: '刪除隊伍確認', message: `確定要刪除隊伍「${t.name}」嗎？` });
  const requestDeleteAllTeams = () => {
      setIsDataSettingsOpen(false);
      setDeleteConfirm({ isOpen: true, type: 'ALL_TEAMS', id: null, title: '⚠️ 清空所有隊伍確認', message: '確定要刪除「所有」預排隊伍嗎？\n此操作無法復原！(不影響玩家名單與分組)' });
  };
  const requestDeletePlayer = (p) => setDeleteConfirm({ isOpen: true, type: 'PLAYER', id: p.id, title: '刪除玩家確認', message: `確定要刪除玩家「${p.name}」嗎？` });
  const requestDeleteCharacter = (p, c) => setDeleteConfirm({ isOpen: true, type: 'CHARACTER', id: c.id, parentId: p.id, title: '刪除角色確認', message: `確定要刪除角色「${c.name}」嗎？` });
  const executeDelete = async () => { 
      if (!user) return;
      const { type, id, parentId } = deleteConfirm;
      try {
          if (type === 'TEAM') {
              await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teams', id));
          }
          else if (type === 'ALL_TEAMS') {
              const batch = writeBatch(db);
              teams.forEach(t => {
                  batch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'teams', t.id));
              });
              await batch.commit();
          }
          else if (type === 'PLAYER') { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', id)); }
          else if (type === 'CHARACTER') { const p = players.find(x => x.id === parentId); if(p) { const nc = p.characters.filter(x => x.id !== id); await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', parentId), { ...p, characters: nc }); } }
          else if (type === 'GROUP') { const ng = groups.filter(x => x.id !== id); await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings_groups', 'list'), { list: ng }); }
          else if (type === 'EVENT') { const ne = customEvents.filter(x => x.id !== id); await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings_calendar', 'events'), { list: ne }); }
      } catch (e) { console.error(e); } finally { setDeleteConfirm({ isOpen: false, type: null, id: null, parentId: null, title: '', message: '' }); }
  };
  const handleSavePlayer = async () => {
      try {
        const name = playerFormData.name.trim();
        if(!name) {
            alert("請輸入玩家名稱");
            return;
        }
        if (!user) { alert("連線中，請稍候..."); return; }

        if (editingPlayerId) {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', editingPlayerId), { name: name, color: playerFormData.color || null, bgColor: playerFormData.bgColor || null }, { merge: true });
        } else {
            const newId = generateId();
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', newId), { name: name, color: playerFormData.color || null, bgColor: playerFormData.bgColor || null, characters: [] });
            
            // FIX: Reset ALL filters so the new (empty) player appears immediately
            setRosterFilterId('ALL');
            setRosterRoleFilter('ALL');
            setRosterIlvlFilter('');
        }
        
        setPlayerFormData({ name: '', color: '#ffffff', bgColor: '' });
        setIsPlayerModalOpen(false);
        setEditingPlayerId(null);
      } catch (e) { 
          console.error(e);
          alert("儲存失敗: " + e.message); 
      }
  };
  const openAddPlayerModal = () => {
      setEditingPlayerId(null);
      setPlayerFormData({ name: '', color: '#ffffff', bgColor: '' }); // Default placeholder
      setIsPlayerModalOpen(true);
  };
  const openEditPlayerModal = (player) => {
      setEditingPlayerId(player.id);
      setPlayerFormData({ name: player.name, color: player.color || '#ffffff', bgColor: player.bgColor || '' });
      setIsPlayerModalOpen(true);
  };
  const openAddCharModal = (pid) => { setTargetPlayerId(pid); setEditingCharId(null); setCharFormData({ name: '', job: '半魔人', ilvl: '1680' }); setIsCharModalOpen(true); };
  const openEditCharModal = (pid, c) => { setTargetPlayerId(pid); setEditingCharId(c.id); setCharFormData({ name: c.name, job: c.job, ilvl: c.ilvl }); setIsCharModalOpen(true); };
  const handleSaveCharacter = async () => {
    if (!user) return;
    const role = ALL_CLASSES.find(j => j.name === charFormData.job)?.role || 'DPS';
    const player = players.find(p => p.id === targetPlayerId);
    if (!player) return;
    let finalCharName = charFormData.name.trim();
    if (!finalCharName) finalCharName = `${player.name} - ${charFormData.job}`;
    let updatedCharacters = [...player.characters];
    if (editingCharId) updatedCharacters = updatedCharacters.map(c => c.id === editingCharId ? { ...c, ...charFormData, name: finalCharName, role } : c);
    else updatedCharacters.push({ id: generateId(), ...charFormData, name: finalCharName, role });
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', targetPlayerId), { ...player, characters: updatedCharacters });
    setIsCharModalOpen(false);
  };
  const handleExportAllData = () => {
    const backupData = { players, teams, groups, customEvents, version: APP_VERSION, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `lost_ark_backup_full_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link); setIsDataSettingsOpen(false);
  };
  const handleImportClick = () => fileInputRef.current?.click();
  const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          let message = '';
          if (data.players || data.teams) message = `偵測到完整系統備份 (v${data.version || '?'})。\n包含 ${data.players?.length || 0} 位玩家、${data.teams?.length || 0} 個隊伍。\n確定要還原嗎？(將覆蓋現有資料)`;
          else if (Array.isArray(data)) message = `偵測到舊版玩家名單備份 (共 ${data.length} 位玩家)。\n確定要匯入嗎？(將覆蓋現有相同ID的玩家資料)`;
          else { alert('檔案格式不支援或已損毀。'); return; }
          setImportConfirm({ isOpen: true, data: data, message: message });
        } catch (err) { alert('匯入失敗'); } finally { setIsDataSettingsOpen(false); }
      };
      reader.readAsText(file); e.target.value = null;
  };
  const executeImport = async () => {
      if (!user || !importConfirm.data) return;
      const data = importConfirm.data;
      try {
          const batch = writeBatch(db);
          if (data.players) data.players.forEach(p => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'players', p.id), p));
          else if (Array.isArray(data)) data.forEach(p => { if(p.id) batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'players', p.id), p); });
          if (data.teams) data.teams.forEach(t => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'teams', t.id), t));
          if (data.groups) batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'settings_groups', 'list'), { list: data.groups });
          if (data.customEvents) batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'settings_calendar', 'events'), { list: data.customEvents });
          await batch.commit(); alert('備份還原成功！');
      } catch (err) { alert('還原過程發生錯誤'); } finally { setImportConfirm({ isOpen: false, data: null, message: '' }); }
  };
  const handleExportPlayer = () => { if (!managingPlayer) return; const blob = new Blob([JSON.stringify(managingPlayer, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `la_player_${managingPlayer.name}.json`; document.body.appendChild(link); link.click(); document.body.removeChild(link); setManagingPlayer(null); };

  const openAddTeamModal = () => { 
      setEditingTeamId(null); 
      setReturnToTeamId(null); 
      let defaultGroup = '';
      let defaultGold = 0;
      let defaultDiff = '';

      if (selectedGroupId !== 'ALL' && selectedGroupId !== 'UNCATEGORIZED') {
          defaultGroup = selectedGroupId;
          const g = groups.find(x => x.id === defaultGroup);
          // MODIFIED: Default to Hard gold if available, or Normal, and set difficulty accordingly
          if (g) {
              if (g.goldHard > 0) {
                  defaultGold = g.goldHard;
                  defaultDiff = 'hard';
              } else {
                  defaultGold = g.goldNormal || 0;
                  defaultDiff = 'normal';
              }
          }
      }
      setTeamFormData({ name: '', time: '', size: 8, minIlvl: 1600, groupId: defaultGroup, gold: defaultGold, difficulty: defaultDiff }); 
      setTeamCalendarViewDate(new Date()); 
      setIsTeamModalOpen(true); 
  };
  const openEditTeamModal = (team, returnId = null) => { 
      setEditingTeamId(team.id); 
      setReturnToTeamId(returnId); 
      // MODIFIED: Load team settings. Fallback logic for gold needs to check difficulty.
      const group = groups.find(g => g.id === team.groupId);
      let loadedGold = team.gold;
      if (loadedGold === undefined && group) {
          loadedGold = team.difficulty === 'hard' ? group.goldHard : (group.goldNormal || 0);
      }

      setTeamFormData({ 
          name: team.name, 
          time: team.time, 
          size: team.size, 
          minIlvl: team.minIlvl || 0, 
          groupId: team.groupId || '',
          gold: loadedGold || 0,
          difficulty: team.difficulty || ''
      }); 
      setTeamCalendarViewDate(team.time ? new Date(team.time) : new Date()); 
      setIsTeamModalOpen(true); 
  };
  const openQuickTimeModal = (team) => { setQuickTimeTeam(team); setQuickTimeValue(team.time || ''); setQuickTimeCalendarViewDate(team.time ? new Date(team.time) : new Date()); };
  const setQuickTimeDate = (d) => { let t = '20:00'; if (quickTimeValue && quickTimeValue.includes('T')) t = quickTimeValue.split('T')[1]; setQuickTimeValue(`${d}T${t}`); };
  const setQuickTimeTime = (t) => { let d = new Date().toISOString().split('T')[0]; if (quickTimeValue && quickTimeValue.includes('T')) d = quickTimeValue.split('T')[0]; setQuickTimeValue(`${d}T${t}`); };
  const handleSaveQuickTime = async () => { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teams', quickTimeTeam.id), { ...quickTimeTeam, time: quickTimeValue }); setQuickTimeTeam(null); };

  const handleSaveTeam = async () => {
    try {
        if (!user) throw new Error("未登入或連線中");
        const size = Number(teamFormData.size);
        const minIlvl = Number(teamFormData.minIlvl);
        let membersToUse = Array(size).fill(null);
        let currentIsCompleted = false; 

        if (editingTeamId) {
            const existing = teams.find(t => t.id === editingTeamId);
            if(existing) {
                 let newMems = [...existing.members];
                 if(size > newMems.length) newMems = [...newMems, ...Array(size - newMems.length).fill(null)];
                 else if(size < newMems.length) newMems = newMems.slice(0, size);
                 membersToUse = newMems;
                 currentIsCompleted = existing.isCompleted; 
            }
        } else {
            if (prefilledMemberId) {
                membersToUse[0] = prefilledMemberId;
                setPrefilledMemberId(null);
            }
        }
        
        // MODIFIED: Save gold and difficulty to the team document
        const teamData = { 
            name: teamFormData.name || '未命名隊伍', 
            time: teamFormData.time, 
            size, 
            minIlvl, 
            groupId: teamFormData.groupId, 
            gold: Number(teamFormData.gold) || 0,
            difficulty: teamFormData.difficulty || '',
            members: membersToUse, 
            customOrder: editingTeamId ? (teams.find(t => t.id === editingTeamId)?.customOrder ?? 9999) : 9999, 
            isCompleted: currentIsCompleted 
        };
        const docId = editingTeamId || generateId();
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teams', docId), teamData, { merge: true });
        setIsTeamModalOpen(false);

        if (returnToTeamId) {
            setViewingTeamId(returnToTeamId);
            setReturnToTeamId(null);
        }
    } catch(e) {
        alert("儲存隊伍失敗：" + e.message);
    }
  };

  const handleDuplicateTeam = async (source) => { 
      if(!user || !source) return; 
      const newId = generateId(); 
      
      let newName = '未命名隊伍';
      if (source.name) {
          // 利用 Regex 捕捉名稱的基礎部分，與最後尾綴的 (數字)
          const match = source.name.match(/^(.*?)(?:\s*\((\d+)\))?$/);
          const baseName = match ? match[1].trim() : source.name;
          let maxNum = 0;
          
          // 檢查目前所有的隊伍，找出這個基礎名稱的最大數字序號
          teams.forEach(t => {
              if (!t.name) return;
              const tMatch = t.name.match(/^(.*?)(?:\s*\((\d+)\))?$/);
              if (tMatch && tMatch[1].trim() === baseName) {
                  const num = tMatch[2] ? parseInt(tMatch[2], 10) : 0;
                  if (num > maxNum) maxNum = num;
              }
          });
          
          // 新名稱就是基礎名稱 + 最大的數字加 1
          newName = `${baseName} (${maxNum + 1})`;
      }

      const newTeamData = { 
          name: newName, 
          time: source.time || '', 
          size: source.size, 
          minIlvl: source.minIlvl || 0, 
          groupId: source.groupId || '', 
          gold: source.gold || 0, 
          difficulty: source.difficulty || '', 
          isCompleted: false, 
          members: Array(source.size).fill(null), 
          customOrder: 9999 
      }; 

      const batch = writeBatch(db);
      const sourceIndex = teams.findIndex(t => t.id === source.id);

      // 如果有找到來源隊伍，就把它安插在來源隊伍正後方，並重新計算所有隊伍的排序
      if (sourceIndex !== -1) {
          const newOrderedTeams = [...teams];
          // 在 sourceIndex 的下一格插入新隊伍
          newOrderedTeams.splice(sourceIndex + 1, 0, { id: newId, ...newTeamData });

          newOrderedTeams.forEach((t, index) => {
              const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'teams', t.id);
              if (t.id === newId) {
                  // 新隊伍寫入完整資料與排序
                  batch.set(docRef, { ...newTeamData, customOrder: index });
              } else {
                  // 原有隊伍只更新排序
                  batch.update(docRef, { customOrder: index });
              }
          });
      } else {
          // 萬一沒找到來源 (極少見例外情況)，則當作普通新增
          batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'teams', newId), newTeamData);
      }

      await batch.commit(); 
  };
  
  const openSlotSelector = (teamId, idx) => { 
      setSelectedTeamId(teamId); 
      setSelectedSlotIndex(idx); 
      setSlotSelectorFilter('ALL'); 
      setSlotRoleFilter('ALL'); 
      setSlotHighIlvlFilter(false); // 重置高裝等篩選
      setSlotTagFilter('ALL'); // 重置標籤篩選
      setIsSlotSelectModalOpen(true); 
  };
  
  const handleAssignMember = async (charId) => {
      // Helper function to execute the actual database update
      const executeAssignment = async (charId, conflictTeam, conflictRun) => {
          try {
              const targetTeam = teams.find(t => t.id === selectedTeamId);
              if (!targetTeam) return;
              
              const batch = writeBatch(db);

              // Prepare target team array & Get content to swap out
              const targetMembers = [...targetTeam.members];
              while(targetMembers.length <= selectedSlotIndex) targetMembers.push(null);
              const contentAtTarget = targetMembers[selectedSlotIndex]; // This will move to the old team

              // 1. Resolve Conflicts (Swap with old location)
              if (conflictTeam) {
                  const newConflictMembers = [...conflictTeam.members];
                  const idx = newConflictMembers.indexOf(charId);
                  
                  // SWAP: Put current target content into the old team's slot
                  if (idx !== -1) {
                      newConflictMembers[idx] = contentAtTarget;
                  }
                  
                  batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'teams', conflictTeam.id), { members: newConflictMembers });
              }

              if (conflictRun) {
                  // Need to find player again to get latest data reference
                  const p = players.find(player => player.characters.some(c => c.id === charId));
                  if (p) {
                      const c = p.characters.find(x => x.id === charId);
                      const newRuns = (c.externalRuns || []).filter(r => r.id !== conflictRun.id);
                      const updatedChars = p.characters.map(char => char.id === charId ? { ...char, externalRuns: newRuns } : char);
                      batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'players', p.id), { characters: updatedChars });
                  }
              }

              // 2. Assign to new team
              targetMembers[selectedSlotIndex] = charId;
              
              batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'teams', selectedTeamId), { members: targetMembers });
              
              await batch.commit();
              setIsSlotSelectModalOpen(false);
              setActionConfirm({ isOpen: false, title: '', message: '', onConfirm: null }); // Close confirm modal if open

          } catch (error) {
              console.error("Assign Member Error:", error);
              alert(`加入成員失敗: ${error.message}`);
          }
      };

      // Main Logic
      try {
        if (charId === 'PUG') {
            const t = teams.find(x => x.id === selectedTeamId); 
            if (!t) return;
            const m = [...t.members]; 
            while(m.length <= selectedSlotIndex) m.push(null); 
            m[selectedSlotIndex] = 'PUG'; 
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teams', selectedTeamId), { ...t, members: m }); 
            setIsSlotSelectModalOpen(false);
            return;
        }

        const targetTeam = teams.find(t => t.id === selectedTeamId);
        if (!targetTeam) throw new Error("找不到目標隊伍");

        // Check if character is already in THIS team (Swap Position)
        const existingCharIndex = targetTeam.members.indexOf(charId);
        if (existingCharIndex !== -1) {
            // Case 1: Swap Position
            if (existingCharIndex === selectedSlotIndex) {
                setIsSlotSelectModalOpen(false);
                return;
            }

            const m = [...targetTeam.members];
            while(m.length <= Math.max(selectedSlotIndex, existingCharIndex)) m.push(null);
            
            // Perform Swap
            const contentAtTarget = m[selectedSlotIndex];
            m[selectedSlotIndex] = m[existingCharIndex];
            m[existingCharIndex] = contentAtTarget;

            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teams', selectedTeamId), { ...targetTeam, members: m });
            setIsSlotSelectModalOpen(false);
            return;
        }

        const targetGroupId = targetTeam.groupId;
        
        // 1. Check for Conflicts (Same Group ID)
        if (targetGroupId) {
            // A. Team Conflict
            const conflictTeam = teams.find(t => 
                t.id !== selectedTeamId && 
                t.groupId === targetGroupId && 
                t.members.includes(charId)
            );

            if (conflictTeam) {
                setActionConfirm({
                    isOpen: true,
                    title: '分組衝突確認',
                    message: `此角色已排入隊伍「${conflictTeam.name}」(相同分組)。\n確定要將其與目前欄位進行隊伍交換嗎？`,
                    onConfirm: () => executeAssignment(charId, conflictTeam, null)
                });
                return; // Wait for user confirmation
            }

            // B. External Run Conflict
            // Find player/char to check runs
            let player, char;
            for (const p of players) {
                const c = p.characters.find(x => x.id === charId);
                if (c) { player = p; char = c; break; }
            }

            if (char) {
                const conflictRun = (char.externalRuns || []).find(r => r.groupId === targetGroupId);
                if (conflictRun) {
                    setActionConfirm({
                        isOpen: true,
                        title: '分組衝突確認',
                        message: `此角色已有自行通關紀錄「${conflictRun.name}」(相同分組)。\n確定要刪除該紀錄並加入目前隊伍嗎？`,
                        onConfirm: () => executeAssignment(charId, null, conflictRun)
                    });
                    return; // Wait for user confirmation
                }
            }
        }

        // No conflicts, execute directly
        executeAssignment(charId, null, null);

      } catch (error) {
          console.error("Pre-Assign Check Error:", error);
          alert(`操作失敗: ${error.message}`);
      }
  };

  const handleRemoveMember = async (teamId, idx) => { 
      const t = teams.find(x => x.id === teamId); 
      const m = [...t.members]; 
      while(m.length <= idx) m.push(null); 
      m[idx] = null; 
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teams', teamId), { ...t, members: m }); 
  };

  // 新增：快速儲存裝等
  const handleQuickSaveIlvl = async (playerId, charId, newIlvl) => {
      if (!user) return;
      const player = players.find(p => p.id === playerId);
      if (!player) return;
      const updatedChars = player.characters.map(c =>
          c.id === charId ? { ...c, ilvl: newIlvl || '0' } : c
      );
      try {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', playerId), { ...player, characters: updatedChars });
          setQuickEditIlvlCharId(null);
      } catch (error) {
          console.error("Save Ilvl Error:", error);
          alert(`儲存裝等失敗: ${error.message}`);
      }
  };

  // ADDED: Missing function to toggle team completion status
  const toggleTeamCompletion = async (teamId) => {
    if (!user) return;
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teams', teamId), { ...team, isCompleted: !team.isCompleted });
    } catch (err) {
        console.error("Toggle Completion Error:", err);
        alert("操作失敗: " + err.message);
    }
  };
  
  const setTeamDate = (d) => { let t = '20:00'; if(teamFormData.time && teamFormData.time.includes('T')) t = teamFormData.time.split('T')[1]; setTeamFormData({...teamFormData, time: `${d}T${t}`}); };
  const setTeamTime = (t) => { let d = new Date().toISOString().split('T')[0]; if(teamFormData.time && teamFormData.time.includes('T')) d = teamFormData.time.split('T')[0]; setTeamFormData({...teamFormData, time: `${d}T${t}`}); };

  const handleCreateExternalRun = () => {
    if (!joiningCharacter) return;
    setEditingExternalRunData({ 
        isNew: true,
        playerId: joiningCharacter.ownerId, 
        charId: joiningCharacter.id, 
        name: '', 
        groupId: '' 
    });
    setIsJoinTeamModalOpen(false);
    setIsExternalRunModalOpen(true);
  };

  const handleSaveExternalRun = async () => {
    if (!user || !editingExternalRunData) return;
    const { isNew, playerId, charId, runId, name, groupId } = editingExternalRunData;
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    // Use group name if name is empty
    const finalName = name.trim() || (groupId ? groups.find(g => g.id === groupId)?.name : '自行通關');

    let updatedChars;
    if (isNew) {
         const newRun = { 
            id: generateId(), 
            name: finalName, 
            groupId: groupId || '',
            isCompleted: false 
        };
        updatedChars = player.characters.map(c => {
            if (c.id === charId) {
                return { ...c, externalRuns: [...(c.externalRuns || []), newRun] };
            }
            return c;
        });
    } else {
        updatedChars = player.characters.map(c => {
            if (c.id === charId) {
                const newRuns = (c.externalRuns || []).map(r => 
                    r.id === runId ? { ...r, name: finalName, groupId: groupId || '' } : r
                );
                return { ...c, externalRuns: newRuns };
            }
            return c;
        });
    }

    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', playerId), { ...player, characters: updatedChars });
    setIsExternalRunModalOpen(false);
    setEditingExternalRunData(null);
  };

  const handleDeleteExternalRun = async () => {
    if (!user || !editingExternalRunData) return;
    const { playerId, charId, runId } = editingExternalRunData;
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const updatedChars = player.characters.map(c => {
        if (c.id === charId) {
            const newRuns = (c.externalRuns || []).filter(r => r.id !== runId);
            return { ...c, externalRuns: newRuns };
        }
        return c;
    });

    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', playerId), { ...player, characters: updatedChars });
    setIsExternalRunModalOpen(false);
    setEditingExternalRunData(null);
  };

  const toggleExternalRunCompletion = async (playerId, charId, runId) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const updatedChars = player.characters.map(c => {
        if (c.id === charId) {
            const newRuns = (c.externalRuns || []).map(r => 
                r.id === runId ? { ...r, isCompleted: !r.isCompleted } : r
            );
            return { ...c, externalRuns: newRuns };
        }
        return c;
    });

    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', playerId), { ...player, characters: updatedChars });
  };

  const openExternalRunModal = (player, char, run) => {
      setEditingExternalRunData({ 
          playerId: player.id, 
          charId: char.id, 
          runId: run.id, 
          name: run.name, 
          groupId: run.groupId || '' 
      });
      setIsExternalRunModalOpen(true);
  };

  // NEW: Functions for Batch Operations
  
  const openCharManageModal = (player, character) => {
      setCharManageTarget({ player, character });
      setCharManageOptions({ removeExternal: false, removeTeams: false });
      setIsCharManageModalOpen(true);
  };

  const handleCharBatchAction = async () => {
      if (!user || !charManageTarget) return;
      const { player, character } = charManageTarget;
      const { removeExternal, removeTeams } = charManageOptions;
      
      try {
          const batch = writeBatch(db);
          
          // 1. Remove External Runs
          if (removeExternal) {
              const updatedChars = player.characters.map(c => 
                  c.id === character.id ? { ...c, externalRuns: [] } : c
              );
              batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'players', player.id), { characters: updatedChars });
          }

          // 2. Remove from Teams
          if (removeTeams) {
              const assignedTeams = getTeamsForChar(character.id);
              assignedTeams.forEach(t => {
                  const newMembers = t.members.map(m => m === character.id ? null : m);
                  batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'teams', t.id), { members: newMembers });
              });
          }

          await batch.commit();
          setIsCharManageModalOpen(false);
          alert('操作執行完畢');
      } catch (e) {
          console.error("Char Batch Error", e);
          alert("操作失敗: " + e.message);
      }
  };

  const openPlayerBatchModal = (player) => {
      setPlayerBatchTarget(player);
      setPlayerBatchOptions({ removeExternal: false, resetExternal: false });
      setIsPlayerBatchModalOpen(true);
  };

  const handlePlayerBatchAction = async () => {
      if (!user || !playerBatchTarget) return;
      const { removeExternal, resetExternal } = playerBatchOptions;
      
      try {
          let updatedCharacters = [...playerBatchTarget.characters];

          // 1. Remove All External Runs
          if (removeExternal) {
              updatedCharacters = updatedCharacters.map(c => ({ ...c, externalRuns: [] }));
          } 
          // 2. Reset Completion Status (if not removing)
          else if (resetExternal) {
              updatedCharacters = updatedCharacters.map(c => ({
                  ...c,
                  externalRuns: (c.externalRuns || []).map(r => ({ ...r, isCompleted: false }))
              }));
          }

          if (removeExternal || resetExternal) {
              await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', playerBatchTarget.id), { ...playerBatchTarget, characters: updatedCharacters });
              alert('操作執行完畢');
          }
          
          setIsPlayerBatchModalOpen(false);
      } catch (e) {
          console.error("Player Batch Error", e);
          alert("操作失敗: " + e.message);
      }
  };

  const filteredPlayers = players.filter(p => {
      if (rosterFilterId !== 'ALL' && p.id !== rosterFilterId) return false;
      
      // FIX: Special handling for players with 0 characters
      // If a player has no characters, they should be visible UNLESS strict character filters are applied
      if (!p.characters || p.characters.length === 0) {
          // If we are filtering for specific roles or high ilvl, hide empty players to keep view clean
          // But if filters are default (ALL / empty), show them so users can add characters
          if (rosterRoleFilter !== 'ALL' || rosterIlvlFilter) return false;
          return true;
      }

      const hasQualifyingChar = p.characters.some(c => {
          const meetIlvl = !rosterIlvlFilter || Number(c.ilvl) >= Number(rosterIlvlFilter);
          const meetRole = rosterRoleFilter === 'ALL' || c.role === rosterRoleFilter;
          return meetIlvl && meetRole;
      });

      if (!hasQualifyingChar) return false;

      return true;
  });

  const visibleCharacters = useMemo(() => {
    let chars = [];
    filteredPlayers.forEach(p => {
        p.characters.forEach(c => {
            const meetIlvl = !rosterIlvlFilter || Number(c.ilvl) >= Number(rosterIlvlFilter);
            const meetRole = rosterRoleFilter === 'ALL' || c.role === rosterRoleFilter;
            if (meetIlvl && meetRole) {
                chars.push(c);
            }
        });
    });
    return chars;
  }, [filteredPlayers, rosterIlvlFilter, rosterRoleFilter]);

  const stats = useMemo(() => {
    const total = visibleCharacters.length;
    const dps = visibleCharacters.filter(c => c.role !== 'Support').length;
    const support = visibleCharacters.filter(c => c.role === 'Support').length;
    const avgIlvl = total > 0 ? (visibleCharacters.reduce((acc, c) => acc + Number(c.ilvl || 0), 0) / total).toFixed(1) : 0;
    
    const range1690 = visibleCharacters.filter(c => Number(c.ilvl) >= 1690).length;
    const range1680 = visibleCharacters.filter(c => Number(c.ilvl) >= 1680 && Number(c.ilvl) < 1690).length;
    const range1660 = visibleCharacters.filter(c => Number(c.ilvl) >= 1660 && Number(c.ilvl) < 1680).length;
    const range1640 = visibleCharacters.filter(c => Number(c.ilvl) >= 1640 && Number(c.ilvl) < 1660).length;
    const range1620 = visibleCharacters.filter(c => Number(c.ilvl) >= 1620 && Number(c.ilvl) < 1640).length;
    const rangeBelow1620 = visibleCharacters.filter(c => Number(c.ilvl) < 1620).length;

    return { total, dps, support, avgIlvl, range1690, range1680, range1660, range1640, range1620, rangeBelow1620 };
  }, [visibleCharacters]);

  useEffect(() => {
      if (rosterFilterId !== 'ALL' && !players.find(p => p.id === rosterFilterId)) {
          setRosterFilterId('ALL');
      }
  }, [players, rosterFilterId]);

  if (loading) {
    return (
      <div className={`min-h-screen ${T.bgMain} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-500" size={48} />
          <p className={T.textDim}>正在連接雲端資料庫...</p>
        </div>
      </div>
    );
  }

  const calendarDays = getCalendarDays(calendarDate);
  const filteredTeams = teams.filter(team => {
      let matchesGroup = true;
      if (selectedGroupId === 'ALL') matchesGroup = true;
      else if (selectedGroupId === 'UNCATEGORIZED') matchesGroup = !team.groupId || !groups.some(g => g.id === team.groupId);
      else matchesGroup = team.groupId === selectedGroupId;

      let matchesPlayer = true;
      if (rosterFilterId !== 'ALL') {
          const selectedPlayer = players.find(p => p.id === rosterFilterId);
          if (selectedPlayer) {
              const playerCharIds = selectedPlayer.characters.map(c => c.id);
              matchesPlayer = team.members.some(memberId => playerCharIds.includes(memberId));
          } else {
              matchesPlayer = false; 
          }
      }

      let matchesCompletion = true;
      if (teamCompletionFilter === 'COMPLETED' && !team.isCompleted) matchesCompletion = false;
      if (teamCompletionFilter === 'INCOMPLETE' && team.isCompleted) matchesCompletion = false;

      return matchesGroup && matchesPlayer && matchesCompletion;
  });

  return (
    <div className={`min-h-screen ${T.bgMain} ${T.textMain} font-sans selection:bg-blue-500 selection:text-white pb-20 overflow-x-hidden transition-colors duration-300`}>
      {/* Navigation */}
      <nav className={`${T.nav} border-b sticky top-0 z-30 transition-colors`}>
        <div className="w-full max-w-[1920px] mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-600 border border-slate-600 flex items-center justify-center shadow-sm overflow-hidden">
                 <Sword size={18} className="text-white transform rotate-45" />
              </div>
              <div className="flex items-baseline gap-2">
                  <span className={`font-bold text-xl tracking-wide ${T.textBold} hidden sm:inline`}>一年以後專用排本區</span>
                  <span className={`font-bold text-base tracking-wide ${T.textBold} sm:hidden`}>一年以後專用排本區</span>
                  <span className={`text-xs ${T.textDim} font-mono border border-slate-400/20 px-1.5 py-0.5 rounded ${T.subtleBg}`}>{APP_VERSION}</span>
              </div>
            </div>
            <div className="flex space-x-2 items-center">
              <div className="flex space-x-1">
                <button onClick={() => setActiveTab('teams')} className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'teams' ? 'bg-blue-600/10 text-blue-500' : `${T.textDim} hover:${T.textMain} hover:bg-slate-500/10`}`}>隊伍預排</button>
                <button onClick={() => setActiveTab('timeline')} className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'timeline' ? 'bg-purple-600/10 text-purple-500' : `${T.textDim} hover:${T.textMain} hover:bg-slate-500/10`}`}>行程表</button>
                <button onClick={() => setActiveTab('roster')} className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'roster' ? 'bg-green-600/10 text-green-500' : `${T.textDim} hover:${T.textMain} hover:bg-slate-500/10`}`}>玩家名單</button>
              </div>
              <button 
                  onClick={toggleTheme} 
                  className={`p-2 rounded-lg transition-colors ${T.buttonSecondary} ml-2`}
                  title={isDarkMode ? "切換至明亮模式" : "切換至黑暗模式"}
              >
                  {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-600" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="w-full max-w-[1920px] mx-auto px-4 py-8">
        
        {/* === TEAMS TAB === */}
        {activeTab === 'teams' && (
          // MODIFIED: Removed h-[calc(100vh-140px)] to allow full page scroll
          // Added items-start for sticky sidebar alignment
          <div className="flex flex-col md:flex-row gap-6 items-start">
            
            {/* MODIFIED: Sidebar is now sticky on desktop with dynamic width */}
            <aside className={`flex-shrink-0 flex flex-col gap-2 md:sticky md:top-24 md:h-[calc(100vh-6rem)] z-10 transition-all duration-300 ${isSidebarExpanded ? 'w-full md:w-64' : 'w-full md:w-16'}`}>
                <div className={`${T.card} p-2 rounded-lg border shadow-lg overflow-x-auto md:overflow-y-auto flex md:flex-col gap-1.5 scrollbar-hide h-full relative`}>
                    
                    {/* NEW: Sidebar Toggle Button (Desktop Only) */}
                    <button 
                        onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} 
                        className={`hidden md:flex items-center justify-center p-1.5 mb-1 rounded hover:bg-slate-500/10 ${T.textDim} hover:${T.textMain} transition-colors self-end w-full`}
                        title={isSidebarExpanded ? "收起側邊欄" : "展開側邊欄"}
                    >
                        {isSidebarExpanded ? <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold w-full"><ChevronLeft size={16} /> <span>收起選單</span></div> : <ChevronRight size={20} />}
                    </button>

                    <button onClick={() => setSelectedGroupId('ALL')} className={`px-3 py-2.5 rounded-md text-sm font-bold text-left flex items-center ${isSidebarExpanded ? 'justify-between' : 'justify-center'} whitespace-nowrap transition-colors ${selectedGroupId === 'ALL' ? T.groupActive : T.groupInactive}`} title="全部隊伍">
                        <div className="flex items-center gap-2">
                            <Layout size={18} />
                            {isSidebarExpanded && <span>全部隊伍</span>}
                        </div>
                        {isSidebarExpanded && <span className={`bg-black/20 px-1.5 rounded text-xs ml-2 opacity-70`}>{teams.length}</span>}
                    </button>
                    
                    <button onClick={() => setSelectedGroupId('UNCATEGORIZED')} className={`px-3 py-2.5 rounded-md text-sm font-medium text-left flex items-center ${isSidebarExpanded ? 'justify-between' : 'justify-center'} whitespace-nowrap transition-colors ${selectedGroupId === 'UNCATEGORIZED' ? T.groupActive : T.groupInactive}`} title="未分類">
                        <div className="flex items-center gap-2">
                            <Folder size={18} />
                            {isSidebarExpanded && <span>未分類</span>}
                        </div>
                        {isSidebarExpanded && <span className={`bg-black/20 px-1.5 rounded text-xs ml-2 opacity-70`}>{teams.filter(t => !t.groupId || !groups.some(g => g.id === t.groupId)).length}</span>}
                    </button>
                    
                    <div className={`h-px ${T.separator} my-1 hidden md:block`}></div>
                    
                    {groups.map(group => (
                        <div key={group.id} className="relative group/item">
                            <button 
                                onClick={() => setSelectedGroupId(group.id)} 
                                // MODIFIED: Load goldNormal/Hard when editing
                                onContextMenu={(e) => {e.preventDefault(); setEditingGroup(group); setGroupFormData({name: group.name, image: group.image || '', color: group.color || '#3b82f6', goldNormal: group.goldNormal || 0, goldHard: group.goldHard || 0}); setIsGroupModalOpen(true);}} 
                                className={`w-full px-3 py-2.5 rounded-md text-sm font-medium text-left flex items-center ${isSidebarExpanded ? 'justify-between' : 'justify-center'} whitespace-nowrap transition-colors ${selectedGroupId === group.id ? T.groupActive : T.groupInactive} relative overflow-hidden`}
                                title={group.name}
                            >
                                {/* Group BG Image for Sidebar */}
                                {group.image && (
                                    <div className="absolute inset-0 bg-cover opacity-30 z-0" style={{ backgroundImage: `url(${group.image})`, backgroundPosition: 'top center' }} />
                                )}
                                <div className="flex items-center gap-2 truncate z-10">
                                    <Tag size={14} style={{ color: !group.image && selectedGroupId !== group.id ? group.color : undefined }} />
                                    {isSidebarExpanded && <span className="truncate">{group.name}</span>}
                                </div>
                                
                                {isSidebarExpanded && (
                                    <div className="flex items-center gap-2 z-10">
                                        {/* MODIFIED: Removed Difficulty Badge in Sidebar (Group has no default diff now) */}
                                        {/* Show Max Gold or Range? Showing Hard gold if exists, else Normal */}
                                        {(group.goldHard > 0 || group.goldNormal > 0) && (
                                            <span className="text-[10px] bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-1 rounded border border-yellow-500/30 font-mono flex items-center gap-1">
                                                <Coins size={10} />
                                                {Math.max(group.goldHard || 0, group.goldNormal || 0).toLocaleString()}
                                            </span>
                                        )}
                                        <span className={`bg-black/20 px-1.5 rounded text-xs opacity-70`}>{teams.filter(t => t.groupId === group.id).length}</span>
                                        <div onClick={(e) => { e.stopPropagation(); setEditingGroup(group); setGroupFormData({name: group.name, image: group.image || '', color: group.color || '#3b82f6', goldNormal: group.goldNormal || 0, goldHard: group.goldHard || 0}); setIsGroupModalOpen(true); }} className="p-1 text-slate-500 hover:text-white hover:bg-slate-600 rounded opacity-0 group-hover/item:opacity-100 transition-opacity" title="編輯/刪除分組">
                                            <Edit2 size={12} />
                                        </div>
                                    </div>
                                )}
                            </button>
                            {/* Mobile only edit button */}
                            <button onClick={(e) => {e.stopPropagation(); setEditingGroup(group); setGroupFormData({name: group.name, image: group.image || '', color: group.color || '#3b82f6', goldNormal: group.goldNormal || 0, goldHard: group.goldHard || 0}); setIsGroupModalOpen(true);}} className="md:hidden absolute right-1 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-white"><MoreVertical size={14} /></button>
                        </div>
                    ))}
                    <button 
                        onClick={() => {setEditingGroup(null); setGroupFormData({name: '', image: '', color: '#3b82f6', goldNormal: 0, goldHard: 0}); setIsGroupModalOpen(true);}} 
                        className={`px-3 py-2.5 rounded-md text-sm text-slate-500 hover:text-blue-500 hover:bg-slate-500/10 flex items-center ${isSidebarExpanded ? 'gap-2 justify-start' : 'justify-center'} transition-colors border border-dashed ${isDarkMode ? 'border-slate-700' : 'border-slate-300'} mt-1`}
                        title="新增分組"
                    >
                        <Plus size={14} /> 
                        {isSidebarExpanded && "新增分組"}
                    </button>
                </div>
            </aside>

            {/* MODIFIED: Main content area now flows naturally without height restrictions */}
            <div className="flex-1 space-y-6 min-w-0">
                <div className="flex justify-between items-center shrink-0">
                    <h2 className={`text-xl sm:text-2xl font-bold ${T.textBold} flex items-center gap-2`}><Calendar className="text-blue-500" />預排列表</h2>
                    <div className="flex gap-2">
                        <div className="relative">
                            <select 
                                className={`${T.select} rounded-lg pl-8 pr-8 py-2 text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer transition-colors`}
                                value={teamCompletionFilter}
                                onChange={(e) => setTeamCompletionFilter(e.target.value)}
                            >
                                <option value="ALL">全部狀態</option>
                                <option value="INCOMPLETE">未完成</option>
                                <option value="COMPLETED">已完成</option>
                            </select>
                            <CheckCircle className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                        </div>

                        <div className="relative">
                            <select 
                                className={`${T.select} rounded-lg pl-8 pr-8 py-2 text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer transition-colors`}
                                value={rosterFilterId}
                                onChange={(e) => setRosterFilterId(e.target.value)}
                            >
                                <option value="ALL">顯示全部玩家</option>
                                {players.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                        </div>

                        <button onClick={() => setIsDataSettingsOpen(true)} className={`flex items-center gap-2 ${T.buttonSecondary} px-3 py-2 rounded-lg transition-colors text-sm`}><Settings size={18} /><span className="hidden sm:inline">資料管理</span></button>
                        <button onClick={openAddTeamModal} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg shadow-blue-900/20 transition-all active:scale-95 font-medium text-sm sm:text-base"><Plus size={18} />新增隊伍</button>
                    </div>
                </div>

                {filteredTeams.length === 0 && (<div className={`text-center py-20 ${T.subtleBg} rounded-xl border border-dashed ${isDarkMode ? 'border-slate-700' : 'border-slate-300'}`}><Users size={48} className="mx-auto text-slate-400 mb-4" /><p className={`${T.textDim} text-lg`}>目前此分組沒有隊伍 (或篩選條件無結果)</p></div>)}

                {/* MODIFIED: Dynamic grid columns based on isSidebarExpanded state */}
                <div className={`grid gap-6 pb-20 transition-all duration-300 ${isSidebarExpanded ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'}`}>
                {filteredTeams.map((team) => {
                    const status = getStatus(team, isDarkMode);
                    const group = groups.find(g => g.id === team.groupId);

                    return (
                    <div key={team.id} className={`${T.card} rounded-xl border shadow-xl flex flex-col h-auto relative group/card transition-colors`}>
                        
                        <div 
                            className={`p-3 border-b ${T.divider} flex flex-col relative overflow-hidden`}
                            style={group?.image ? { 
                                backgroundImage: `url(${group.image})`, 
                                backgroundSize: 'cover', 
                                backgroundPosition: 'top center'
                            } : {}}
                        >
                           {/* Dark Overlay for Readability if Image exists */}
                           {group?.image && <div className="absolute inset-0 bg-black/70 z-0"></div>}

                           <div className="flex flex-col gap-1 absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/card:opacity-100 transition-opacity z-20">
                                <button onClick={() => handleMoveTeam(team.id, 'up')} className={`p-1 rounded hover:text-blue-400 ${group?.image ? 'text-slate-300 hover:bg-white/10' : `${T.textDim} hover:bg-slate-500/10`}`}><ArrowUp size={14}/></button>
                                <button onClick={() => handleMoveTeam(team.id, 'down')} className={`p-1 rounded hover:text-blue-400 ${group?.image ? 'text-slate-300 hover:bg-white/10' : `${T.textDim} hover:bg-slate-500/10`}`}><ArrowDown size={14}/></button>
                           </div>

                           {/* MOVED OUT LAYER: Row 1 - Group Tag + Size + Min Ilvl */}
                           <div className="relative z-10 flex flex-wrap items-center gap-2 mb-1.5 pl-6">
                                {group && (<span className={`text-xs font-bold px-1.5 py-0.5 rounded w-fit flex items-center gap-1 border`} style={{ backgroundColor: group.image ? '#3b82f6' : hexToRgba(group.color || '#3b82f6', 0.1), color: group.image ? 'white' : (group.color || '#3b82f6'), borderColor: group.image ? '#60a5fa' : hexToRgba(group.color || '#3b82f6', 0.3) }}>
                                    <Tag size={12} /> {group.name}
                                    {/* MODIFIED: Display Difficulty Badge based on Team setting only */}
                                    {team.difficulty === 'hard' && <span className="ml-1 bg-red-600 text-white text-[10px] px-1 rounded shadow-sm border border-red-400">困難</span>}
                                    {team.difficulty === 'normal' && <span className="ml-1 bg-green-600 text-white text-[10px] px-1 rounded shadow-sm border border-green-400">普通</span>}
                                </span>)}

                                {/* REMOVED GOLD FROM HERE */}

                                {/* Size Badge */}
                                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded whitespace-nowrap text-[10px] border ${group?.image ? 'bg-black/40 border-white/20 text-slate-200' : `${T.subtleBg} ${T.textDim} ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}`}>
                                    <Users size={10} /> {team.size}人
                                </span>

                                {/* Min Ilvl Badge */}
                                {team.minIlvl > 0 && (
                                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded whitespace-nowrap text-[10px] border ${group?.image ? 'bg-black/40 border-white/20 text-orange-300' : `${T.subtleBg} text-orange-600 dark:text-orange-400 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}`}>
                                        <Shield size={10} /> {team.minIlvl}+
                                    </span>
                                )}
                           </div>

                           {/* Row 2: Team Name + Actions */}
                           <div className="relative z-10 flex justify-between items-start pl-6">
                               <div className="flex-1 min-w-0 mr-2">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <h3 className={`text-xl font-bold truncate leading-tight ${group?.image ? 'text-white drop-shadow-md' : T.textBold}`}>{team.name}</h3>
                                        <button onClick={() => openEditTeamModal(team)} className={`p-1 rounded transition-all shrink-0 ${group?.image ? 'text-slate-300 hover:text-white hover:bg-white/20' : 'text-slate-500 hover:text-blue-500 hover:bg-slate-500/10'}`}><Settings size={16} /></button>
                                        <span className={`text-xs px-1.5 py-0.5 rounded border flex items-center gap-1 whitespace-nowrap ${status.bg} ${status.color}`}>{status.label}</span>
                                    </div>

                                    {/* SWAPPED: Gold Income (Now Above Time) */}
                                    {/* MODIFIED: Check Team Gold first, then Group Gold based on Team Difficulty */}
                                    {(() => {
                                        let displayGold = team.gold;
                                        if (displayGold === undefined || displayGold === 0) {
                                            if (group) {
                                                displayGold = team.difficulty === 'hard' ? group.goldHard : (group.goldNormal || 0);
                                            }
                                        }
                                        
                                        if (displayGold > 0) {
                                            return (
                                                <div className="flex items-center mb-1">
                                                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded whitespace-nowrap text-sm font-bold border shadow-sm ${group?.image ? 'bg-black/60 border-yellow-500/50 text-yellow-300' : 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-400 dark:border-yellow-600'}`}>
                                                        <Coins size={14} className={group?.image ? 'text-yellow-300' : 'text-yellow-600 dark:text-yellow-400'} /> 
                                                        {displayGold.toLocaleString()}
                                                    </span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {/* SWAPPED: Time (Now Below Gold) */}
                                    <div className={`${group?.image ? 'text-slate-300' : T.textDim} mb-1`}>
                                        <button onClick={() => openQuickTimeModal(team)} className={`flex items-center gap-1 px-2 py-0.5 rounded whitespace-nowrap transition-colors text-xs ${group?.image ? 'bg-black/30 hover:bg-black/50 hover:text-blue-300' : `${T.subtleBg} hover:bg-blue-500/10 hover:text-blue-500 border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}`}>
                                            <Clock size={12} /> {formatDateTime(team.time)}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1 shrink-0">
                                    <div className="flex gap-1">
                                        <button onClick={() => handleDuplicateTeam(team)} className={`p-1.5 rounded transition-colors ${group?.image ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-500/10'}`}><Copy size={16} /></button>
                                        <button onClick={() => requestDeleteTeam(team)} className={`p-1.5 rounded transition-colors ${group?.image ? 'text-slate-300 hover:text-red-400 hover:bg-white/10' : 'text-slate-400 hover:text-red-500 hover:bg-slate-500/10'}`}><Trash2 size={16} /></button>
                                    </div>
                                    <button onClick={() => toggleTeamCompletion(team.id)} className={`p-1.5 rounded transition-colors flex items-center justify-center ${team.isCompleted ? 'bg-green-600 text-white' : (group?.image ? 'bg-black/40 text-slate-300 hover:bg-black/60' : `${T.subtleBg} ${T.textDim} hover:bg-slate-500/20`)}`}><CheckCircle size={16} /></button>
                               </div>
                           </div>
                        </div>

                        <div className="p-2 space-y-1">
                        {Array.from({ length: team.size }).map((_, idx) => {
                            const memberId = team.members[idx] || null;
                            const charData = memberId === 'PUG' ? { name: '-', job: '未知', ilvl: '-', role: 'PUG', ownerName: '野人 / 路人', ownerColor: null } : (memberId ? getCharById(memberId) : null);
                            
                            let isSlotHighlighted = false;
                            if (rosterFilterId !== 'ALL' && memberId && memberId !== 'PUG') {
                                 const selectedPlayer = players.find(p => p.id === rosterFilterId);
                                 if (selectedPlayer) {
                                     isSlotHighlighted = selectedPlayer.characters.some(c => c.id === memberId);
                                 }
                            }

                            return (
                            <div 
                                key={idx} 
                                draggable="true" 
                                onDragStart={(e) => handleDragStart(e, team.id, idx, memberId)} 
                                onDragOver={handleDragOver} 
                                onDrop={(e) => handleDrop(e, team.id, idx)} 
                                className={`group relative flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer select-none ${charData ? T.slot : T.slotEmpty} ${draggedItem?.memberId === memberId && draggedItem?.memberId !== null ? 'opacity-50 border-blue-500 border-dashed' : ''} ${isSlotHighlighted ? 'ring-2 ring-yellow-400 z-10' : ''}`} 
                                onClick={() => openSlotSelector(team.id, idx)} 
                            >
                                <div className="flex items-center gap-1.5 w-full min-w-0 relative">
                                    <span className={`text-slate-400 font-mono text-base w-5 shrink-0 text-center`}>{idx + 1}</span>
                                    {charData ? (
                                        <div className="flex-1 min-w-0 flex items-center justify-start gap-1.5">
                                            {/* ORDER: Icon -> Item Level -> Job -> OwnerName */}
                                            
                                            {/* 1. Class Icon */}
                                            <ClassIcon job={charData.job} role={charData.role} icons={classIcons} className="w-8 h-8 shrink-0" />

                                            {/* 2. Item Level (Enlarged) */}
                                            <div className="font-mono text-cyan-500 text-lg font-bold w-12 shrink-0 text-center leading-none">{charData.ilvl}</div>
                                            
                                            {/* 3. Class Name (Enlarged) */}
                                            <span className={`text-sm font-bold ${T.textDim} w-16 truncate shrink-0 text-center`}>{charData.job}</span>

                                            {/* 4. Player Name (Enlarged) */}
                                            <div className="flex flex-col min-w-0 flex-1">
                                                {/* MODIFIED: Added background color support for player name */}
                                                <span 
                                                    className={`font-bold text-[17px] truncate tracking-wide px-1.5 py-0.5 rounded ${!charData.ownerColor ? T.textBold : ''}`}
                                                    style={{ 
                                                        color: charData.ownerColor ? charData.ownerColor : undefined,
                                                        backgroundColor: charData.ownerBgColor ? charData.ownerBgColor : undefined
                                                    }}
                                                >
                                                    {charData.ownerName}
                                                </span>
                                            </div>
                                            
                                            {/* Delete Button - Absolute positioned */}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleRemoveMember(team.id, idx); }} 
                                                className={`absolute right-0 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 ${T.textDim} hover:text-red-500 hover:bg-slate-500/20 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm rounded transition-all shadow-sm z-10`}
                                                title="移除成員"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (<div className={`${T.textDim} flex items-center gap-2 py-1`}><Plus size={16} /> <span className="text-base">空位</span></div>)}
                                </div>
                            </div>
                            );
                        })}
                        </div>
                    </div>
                    );
                })}
                </div>
            </div>
          </div>
        )}

        {/* === TIMELINE TAB === */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <div className={`flex flex-col sm:flex-row justify-between items-center ${T.card} p-4 rounded-xl border shadow-lg gap-4 sm:gap-0`}>
               <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                   <h2 className={`text-xl sm:text-2xl font-bold ${T.textBold} flex items-center gap-2`}><CalendarDays className="text-purple-500" />行程表</h2>
                   <div className="relative">
                        <select 
                            className={`${T.select} rounded-lg pl-8 pr-8 py-2 text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer transition-colors`}
                            value={rosterFilterId}
                            onChange={(e) => setRosterFilterId(e.target.value)}
                        >
                            <option value="ALL">顯示全部</option>
                            {players.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                   </div>

                   {/* REMOVED: View Mode Toggle Buttons */}
                   <button onClick={() => setIsEventModalOpen(true)} className={`text-xs flex items-center gap-1 ${T.buttonSecondary} px-3 py-1.5 rounded transition-colors`}><CalendarPlus size={14} /> 事件設定</button>
                   <button onClick={() => setIsDataSettingsOpen(true)} className={`text-xs flex items-center gap-1 ${T.buttonSecondary} px-3 py-1.5 rounded transition-colors`}><Settings size={14} />資料管理</button>
               </div>
              <div className="flex items-center gap-4">
                  <button onClick={prevMonth} className={`p-2 ${T.hover} rounded-full transition-colors`}><ChevronLeft size={24} className={T.textDim} /></button>
                  <div className={`text-lg font-bold ${T.textBold} min-w-[120px] text-center`}>{calendarDate.getFullYear()}年 {calendarDate.getMonth() + 1}月</div>
                  <button onClick={nextMonth} className={`p-2 ${T.hover} rounded-full transition-colors`}><ChevronRight size={24} className={T.textDim} /></button>
                  <button onClick={goToToday} className={`ml-2 text-xs ${T.buttonSecondary} px-3 py-1.5 rounded transition-colors`}>今天</button>
              </div>
            </div>
            <div className={`${T.card} border rounded-xl shadow-xl overflow-hidden`}>
                <div className={`grid grid-cols-7 ${T.subtleBg} border-b ${T.divider}`}>{['日', '一', '二', '三', '四', '五', '六'].map((day, i) => (<div key={day} className={`p-2 text-center text-sm font-bold ${i === 0 || i === 6 ? 'text-red-400' : T.textMain}`}>{day}</div>))}</div>
                <div className={`grid grid-cols-7 ${T.bgMain}`}>
                    {calendarDays.map((cell) => {
                        if (cell.type === 'padding') return <div key={cell.key} className={`min-h-[100px] border-b border-r ${T.divider} p-1 sm:p-2 cursor-pointer transition-colors relative`}></div>;
                        const dayTeams = getTeamsByDate(cell.dateStr);
                        const dayEvents = getEventsForDate(cell.dateStr);
                        const availabilitySummary = getAvailabilityForDate(cell.dateStr);
                        const isToday = new Date().toDateString() === cell.date.toDateString();
                        const isSelected = selectedCalendarDate === cell.dateStr;
                        return (
                            <div key={cell.key} onClick={(e) => { e.stopPropagation(); setSelectedCalendarDate(cell.dateStr); }} className={`min-h-[100px] border-b border-r ${T.divider} p-1 sm:p-2 cursor-pointer transition-colors relative ${isToday ? 'bg-blue-500/10' : 'hover:bg-slate-500/10'} ${isSelected ? 'bg-slate-500/20 ring-2 ring-inset ring-purple-500' : ''}`}>
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex flex-wrap gap-1 w-full mr-1 items-center">
                                        {dayEvents.map(ev => {const ShapeIcon = EVENT_SHAPES.find(s => s.id === ev.shape)?.icon || Circle; const colorClass = EVENT_COLORS.find(c => c.id === ev.color)?.class || 'text-slate-500'; return (<div key={ev.id} title={ev.name} className={`${colorClass}`}><ShapeIcon size={12} fill="currentColor" /></div>);})}
                                        
                                        {/* NEW: Availability Indicators in Header */}
                                        {availabilitySummary.free.length > 0 && (
                                            <div className="flex items-center justify-center px-1 rounded bg-green-500/20 text-green-600 border border-green-500/30 text-[10px] font-bold h-4 min-w-[16px]" title={`希望: ${availabilitySummary.free.length}人`}>
                                                {availabilitySummary.free.length}
                                            </div>
                                        )}
                                        {availabilitySummary.busy.length > 0 && (
                                            <div className="flex items-center justify-center px-1 rounded bg-red-500/20 text-red-600 border border-red-500/30 text-[10px] font-bold h-4 min-w-[16px]" title={`沒空: ${availabilitySummary.busy.length}人`}>
                                                {availabilitySummary.busy.length}
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-sm w-6 h-6 flex items-center justify-center rounded-full shrink-0 ${isToday ? 'bg-blue-600 text-white font-bold' : T.textDim}`}>{cell.dayNum}</span>
                                </div>
                                <div className="space-y-1">
                                    {/* ALWAYS SHOW SCHEDULE (Merged View) */}
                                    {dayTeams.map(team => { 
                                        const status = getStatus(team, isDarkMode); 
                                        const isCompleted = team.isCompleted; 
                                        let isHighlighted = false;
                                        if (rosterFilterId !== 'ALL') {
                                            const selectedPlayer = players.find(p => p.id === rosterFilterId);
                                            if (selectedPlayer) {
                                                const playerCharIds = selectedPlayer.characters.map(c => c.id);
                                                isHighlighted = team.members.some(memberId => playerCharIds.includes(memberId));
                                            }
                                        }

                                        return (
                                            <div 
                                                key={team.id} 
                                                className={`text-[10px] sm:text-xs px-1.5 py-1 rounded truncate border flex items-center gap-1 
                                                    ${isCompleted ? `${T.subtleBg} ${T.divider} text-slate-400 line-through` : (status.label === '已超時' ? 'bg-red-500/20 border-red-500/30 text-red-500' : `${T.subtleBg} ${T.divider} ${T.textMain}`)}
                                                    ${isHighlighted ? 'ring-2 ring-yellow-400 z-10' : ''}
                                                `} 
                                                title={`${formatTimeOnly(team.time)} ${team.name}`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.color.replace('text-', 'bg-')}`}></span>
                                                <span className="font-mono opacity-80">{formatTimeOnly(team.time)}</span>
                                                <span className="truncate">{team.name}</span>
                                            </div>
                                        ); 
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
          </div>
        )}

        {activeTab === 'roster' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
               <h2 className={`text-xl sm:text-2xl font-bold ${T.textBold} flex items-center gap-2`}><User className="text-green-500" />玩家名單</h2>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                        <button onClick={() => setIsStatsOpen(!isStatsOpen)} className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium transition-colors border ${isStatsOpen ? 'bg-purple-600 text-white border-purple-500' : `${T.buttonSecondary}`}`}><BarChart size={14} /> 統計數據</button>
                        
                        {/* NEW: Roster Image Toggle Button */}
                        <button onClick={toggleRosterImages} className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium transition-colors border ${showRosterImages ? 'bg-cyan-600 text-white border-cyan-500' : `${T.buttonSecondary}`}`} title="切換隊伍標籤的背景顯示模式">
                            {showRosterImages ? <ImageIcon size={14} /> : <Layout size={14} />} 
                            {showRosterImages ? '圖片模式' : '色塊模式'}
                        </button>

                        <div className={`flex ${T.card} p-1 shrink-0`}>
                            <button onClick={() => setRosterRoleFilter('ALL')} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${rosterRoleFilter === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : `${T.textDim} hover:${T.textMain}`}`}>全部</button>
                            <button onClick={() => setRosterRoleFilter('DPS')} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${rosterRoleFilter === 'DPS' ? 'bg-red-600 text-white shadow-sm' : `${T.textDim} hover:${T.textMain}`}`}>輸出</button>
                            <button onClick={() => setRosterRoleFilter('Support')} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${rosterRoleFilter === 'Support' ? 'bg-green-600 text-white shadow-sm' : `${T.textDim} hover:${T.textMain}`}`}>輔助</button>
                        </div>
                        <div className={`relative flex items-center ${T.card} px-3 shrink-0`}>
                             <Shield size={14} className="text-slate-400 mr-2" />
                             <input type="number" placeholder="最低裝等" className={`bg-transparent border-none ${T.textMain} text-sm focus:outline-none w-20 py-1.5 appearance-none placeholder:text-slate-500`} value={rosterIlvlFilter} onChange={(e) => setRosterIlvlFilter(e.target.value)} />
                        </div>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Filter size={16} /></div>
                            <select className={`${T.select} rounded-lg pl-9 pr-8 py-1.5 text-sm focus:outline-none focus:border-blue-500 w-48 md:w-64 appearance-none cursor-pointer h-full`} value={rosterFilterId} onChange={(e) => setRosterFilterId(e.target.value)}>
                                <option value="ALL">顯示全部玩家</option>
                                {players.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}</select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                        </div>
                  </div>
                  <button onClick={() => setIsDataSettingsOpen(true)} className={`flex items-center gap-2 ${T.buttonSecondary} px-3 py-2 rounded-lg transition-colors text-sm`}><Settings size={18} /><span className="hidden sm:inline">資料管理</span></button>
                  <button onClick={openAddPlayerModal} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg shadow-green-900/20 transition-all active:scale-95 font-medium text-sm sm:text-base"><UserPlus size={18} />新增玩家</button>
              </div>
            </div>

            {isStatsOpen && (
                <div className={`${T.card} p-4 shadow-lg animate-in fade-in slide-in-from-top-4 rounded-xl`}>
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                            <h3 className={`font-bold ${T.textDim} text-sm uppercase tracking-wider border-b ${T.divider} pb-2`}>基本統計</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className={`${T.subtleBg} p-3 rounded-lg border ${T.divider}`}><div className={`${T.textDim} text-xs mb-1`}>符合條件角色</div><div className={`text-2xl font-bold ${T.textBold}`}>{stats.total}</div></div>
                                <div className={`${T.subtleBg} p-3 rounded-lg border ${T.divider}`}><div className={`${T.textDim} text-xs mb-1`}>平均裝等</div><div className="text-2xl font-bold text-blue-500">{stats.avgIlvl}</div></div>
                                <div className={`${T.subtleBg} p-3 rounded-lg border ${T.divider}`}><div className={`${T.textDim} text-xs mb-1`}>輸出 (DPS)</div><div className="text-2xl font-bold text-red-500">{stats.dps} <span className="text-sm text-slate-500 font-normal">({stats.total > 0 ? Math.round(stats.dps/stats.total*100) : 0}%)</span></div></div>
                                <div className={`${T.subtleBg} p-3 rounded-lg border ${T.divider}`}><div className={`${T.textDim} text-xs mb-1`}>輔助 (Support)</div><div className="text-2xl font-bold text-green-500">{stats.support} <span className="text-sm text-slate-500 font-normal">({stats.total > 0 ? Math.round(stats.support/stats.total*100) : 0}%)</span></div></div>
                            </div>
                        </div>
                        <div className="flex-1 space-y-4">
                            <h3 className={`font-bold ${T.textDim} text-sm uppercase tracking-wider border-b ${T.divider} pb-2`}>裝等分佈</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                <div className={`${T.subtleBg} p-2 rounded text-center border ${T.divider}`}><div className="text-amber-500 text-xs font-bold mb-1">1690+</div><div className={`text-lg font-bold ${T.textBold}`}>{stats.range1690}</div></div>
                                <div className={`${T.subtleBg} p-2 rounded text-center border ${T.divider}`}><div className="text-purple-500 text-xs font-bold mb-1">1680+</div><div className={`text-lg font-bold ${T.textBold}`}>{stats.range1680}</div></div>
                                <div className={`${T.subtleBg} p-2 rounded text-center border ${T.divider}`}><div className="text-blue-500 text-xs font-bold mb-1">1660+</div><div className={`text-lg font-bold ${T.textBold}`}>{stats.range1660}</div></div>
                                <div className={`${T.subtleBg} p-2 rounded text-center border ${T.divider}`}><div className="text-cyan-500 text-xs font-bold mb-1">1640+</div><div className={`text-lg font-bold ${T.textBold}`}>{stats.range1640}</div></div>
                                <div className={`${T.subtleBg} p-2 rounded text-center border ${T.divider}`}><div className={`${T.textDim} text-xs font-bold mb-1`}>1620+</div><div className={`text-lg font-bold ${T.textBold}`}>{stats.range1620}</div></div>
                                <div className={`${T.subtleBg} p-2 rounded text-center border ${T.divider}`}><div className={`${T.textDim} text-xs font-bold mb-1`}>&lt; 1620</div><div className={`text-lg font-bold ${T.textBold}`}>{stats.rangeBelow1620}</div></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {filteredPlayers.length === 0 && (<div className={`text-center py-20 ${T.subtleBg} rounded-xl border border-dashed ${isDarkMode ? 'border-slate-700' : 'border-slate-300'}`}><Settings size={48} className="mx-auto text-slate-500 mb-4" /><p className={`${T.textDim} text-lg`}>沒有符合條件的玩家資料</p></div>)}
            <div className="space-y-6">
              {filteredPlayers.map((player) => (
                <div key={player.id} className={`${T.card} rounded-xl border overflow-hidden group transition-colors`}>
                  <div className={`${T.subtleBg} px-4 py-3 border-b ${T.divider} flex justify-between items-center relative`}>
                    {/* MODIFIED: Player Name Header with optional background color */}
                    <h3 className={`font-bold text-lg flex items-center gap-2`}>
                        <div className="w-2 h-6 rounded-full" style={{ backgroundColor: player.color || '#22c55e' }}></div>
                        <span 
                            className={`px-2 py-0.5 rounded ${!player.color ? T.textBold : ''}`}
                            style={{ 
                                color: player.color || undefined,
                                backgroundColor: player.bgColor || undefined
                            }}
                        >
                            {player.name}
                        </span>
                        <span className={`text-sm font-normal ${T.textDim}`}>({player.characters.length} 角色)</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openAvailabilityModal(player)} className={`${T.textDim} hover:text-green-500 px-2 py-1.5 rounded flex items-center gap-1 transition-colors mr-1`} title={`設定 ${player.name} 的空閒時間`}><CalendarCheck size={18} /></button>
                      <button onClick={() => openEditPlayerModal(player)} className={`${T.textDim} hover:${T.textMain} px-2 py-1.5 rounded flex items-center gap-1 transition-colors`} title={`編輯 ${player.name} 名稱`}><Edit2 size={16} /></button>
                      {/* NEW: Player Batch Manage Button */}
                      <button onClick={() => openPlayerBatchModal(player)} className={`${T.textDim} hover:text-blue-500 px-2 py-1.5 rounded flex items-center gap-1 transition-colors`} title={`批量管理 ${player.name} 的資料`}><RefreshCw size={16} /></button>
                      
                      <button onClick={() => setManagingPlayer(player)} className={`${T.textDim} hover:${T.textMain} px-2 py-1.5 rounded flex items-center gap-1 transition-colors`} title={`管理 ${player.name} 的資料`}><Settings size={16} /></button>
                      <button onClick={() => openAddCharModal(player.id)} className={`text-xs ${T.buttonSecondary} px-3 py-1.5 rounded transition-colors flex items-center gap-1`}><Plus size={14} /> 新增角色</button>
                      <button onClick={() => requestDeletePlayer(player)} className={`p-1.5 ${T.textDim} hover:text-red-500 hover:bg-slate-500/10 rounded`}><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {player.characters
                            .filter(c => !rosterIlvlFilter || Number(c.ilvl) >= Number(rosterIlvlFilter))
                            .filter(c => rosterRoleFilter === 'ALL' || c.role === rosterRoleFilter)
                            .map((char) => {
                                const charTeams = getTeamsForChar(char.id);
                                const externalRuns = char.externalRuns || []; 
                          
                                return (
                                    <div 
                                        key={char.id} 
                                        className={`${T.bgMain} p-3 rounded border ${T.divider} hover:border-slate-400 dark:hover:border-slate-500 transition-colors group/char relative flex flex-col h-full ${draggedRosterItem?.index === player.characters.indexOf(char) && draggedRosterItem?.playerId === player.id ? 'opacity-50 border-dashed border-blue-500' : ''}`}
                                        onDragOver={handleRosterDragOver} 
                                        onDrop={(e) => handleRosterDrop(e, player.id, player.characters.indexOf(char))}
                                    >
                                    <div 
                                        className={`flex justify-between items-start mb-2 cursor-grab active:cursor-grabbing hover:${T.subtleBg} rounded -m-1 p-1 transition-colors`}
                                        draggable="true" 
                                        onDragStart={(e) => handleRosterDragStart(e, player.id, player.characters.indexOf(char))}
                                    >
                                        <div className="flex items-center gap-2">
                                            {/* NEW: Class Icon in Roster Card */}
                                            <ClassIcon job={char.job} role={char.role} icons={classIcons} className="w-8 h-8" />
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${char.role === 'Support' ? 'border-green-500/30 text-green-500 bg-green-500/10' : 'border-red-500/30 text-red-500 bg-red-500/10'}`}>{char.role === 'Support' ? '輔助' : '輸出'}</span>
                                        </div>
                                        {/* MODIFIED: Added z-20 to ensure buttons appear above the gold badge on hover */}
                                        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover/char:opacity-100 transition-opacity absolute right-2 top-2 bg-slate-900/80 p-1 rounded backdrop-blur-sm shadow-sm z-20">
                                        {/* NEW: Remove/Clear Teams Button */}
                                        <button onClick={() => openCharManageModal(player, char)} className="text-slate-300 hover:text-amber-400 p-1" title="清理隊伍/紀錄"><LogOut size={14} /></button>
                                        <button onClick={() => openEditCharModal(player.id, char)} className="text-slate-300 hover:text-blue-400 p-1"><Edit size={14} /></button>
                                        <button onClick={() => requestDeleteCharacter(player, char)} className="text-slate-300 hover:text-red-400 p-1"><X size={14} /></button>
                                        </div>
                                    </div>
                                    <h4 className={`font-bold ${T.textBold} truncate pr-6 pointer-events-none`}>{char.name}</h4>
                                    <div className={`text-sm ${T.textDim} flex justify-between mt-1 mb-3 pointer-events-none`}><span>{char.job}</span><span className="text-blue-500 font-mono">{char.ilvl}</span></div>
                                    <div className={`mt-auto pt-2 border-t ${T.divider}`}>
                                        <button 
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => { e.stopPropagation(); openJoinTeamModal({...char, ownerId: player.id}); }} 
                                            className={`w-full text-xs ${T.buttonSecondary} py-1.5 rounded transition-colors flex items-center justify-center gap-1`}
                                        >
                                            <LogIn size={12} /> 加入隊伍 / 開組
                                        </button>
                                    </div>

                                    {/* Gold Calculation */}
                                    {(() => {
                                        const goldExcluded = char.goldExcluded || [];
                                        const allRaids = [
                                            ...charTeams.map(t => { 
                                                const grp = groups.find(g => g.id === t.groupId);
                                                // MODIFIED: Use Team Gold/Diff -> Group Gold/Diff
                                                let gVal = t.gold;
                                                if (gVal === undefined || gVal === 0) {
                                                    if (grp) gVal = t.difficulty === 'hard' ? grp.goldHard : (grp.goldNormal || 0);
                                                }
                                                return { id: t.id, isCompleted: t.isCompleted, gold: gVal || 0, name: t.name }; 
                                            }),
                                            ...externalRuns.map(r => {
                                                const grp = groups.find(g => g.id === r.groupId);
                                                // External runs logic: Check name or add explicit difficulty field later. 
                                                // For now, assume Normal gold unless we add difficulty to external runs too.
                                                // Or maybe check if name contains "困"? Simple heuristic for now:
                                                let gVal = 0;
                                                if (grp) {
                                                    // Simple detection for external runs
                                                    const isHard = r.name.includes('困') || r.name.includes('Hard');
                                                    gVal = isHard ? grp.goldHard : grp.goldNormal;
                                                }
                                                return { id: r.id, isCompleted: r.isCompleted, gold: gVal || 0, name: grp?.name || r.name };
                                            })
                                        ];

                                        // 1. Calculate Potential (Denominator) - Top 3 highest gold raids assigned
                                        const totalPotential = allRaids
                                            .map(r => r.gold)
                                            .sort((a, b) => b - a)
                                            .slice(0, 3)
                                            .reduce((sum, g) => sum + g, 0);

                                        // 2. Calculate Actual (Numerator) - Completed AND Not Excluded
                                        const totalEarned = allRaids
                                            .filter(r => r.isCompleted && !goldExcluded.includes(r.id))
                                            .reduce((sum, r) => sum + r.gold, 0);

                                        if (totalPotential > 0) {
                                            return (
                                                // MODIFIED: Increased size, padding, and readability. Added z-10.
                                                <div className="absolute top-2 right-2 flex items-center bg-black/80 rounded-md px-2.5 py-1.5 backdrop-blur-md pointer-events-none border border-white/10 shadow-lg z-10">
                                                    <Coins size={14} className="text-yellow-400 mr-1.5" />
                                                    <span className="text-sm font-bold text-yellow-300 font-mono tracking-wide drop-shadow-sm">
                                                        {totalEarned.toLocaleString()} <span className="text-slate-500 mx-0.5">/</span> {totalPotential.toLocaleString()}
                                                    </span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                    
                                    <div className="mt-2 space-y-1">
                                        {charTeams.length > 0 ? (
                                            charTeams.map(t => {
                                            const status = getStatus(t, isDarkMode);
                                            const group = groups.find(g => g.id === t.groupId);
                                            const useImage = showRosterImages && group?.image;
                                            const groupColor = group?.color || '#3b82f6';
                                            const useGroupColor = !useImage && !t.isCompleted && status.type !== 'overdue';
                                            // MODIFIED: Use Team Gold
                                            let gold = t.gold;
                                            if (gold === undefined || gold === 0) {
                                                if (group) gold = t.difficulty === 'hard' ? group.goldHard : (group.goldNormal || 0);
                                            }
                                            gold = gold || 0;

                                            return (
                                                <div 
                                                key={t.id} 
                                                onClick={(e) => { e.stopPropagation(); setViewingTeamId(t.id); }} 
                                                className={`w-full flex items-center justify-between text-xs p-2 rounded mt-1 transition-all group/pill cursor-pointer border relative overflow-hidden
                                                    ${t.isCompleted ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20' : (useGroupColor ? '' : `${T.subtleBg} ${T.divider} hover:bg-slate-500/10`)}
                                                `}
                                                style={useImage ? { 
                                                    backgroundImage: `url(${group.image})`, 
                                                    backgroundSize: 'cover', 
                                                    backgroundPosition: 'top center',
                                                    color: 'white',
                                                    textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                                                } : (useGroupColor ? {
                                                    backgroundColor: hexToRgba(groupColor, isDarkMode ? 0.15 : 0.1),
                                                    borderColor: hexToRgba(groupColor, 0.3)
                                                } : {})}
                                                >
                                                {/* Overlay for Roster Team Pill if Image exists */}
                                                {useImage && <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.9) 40%, transparent 100%)' }}></div>}
                                                
                                                <div className="flex-1 min-w-0 mr-2 z-10 flex flex-col gap-0.5">
                                                    {/* Row 1: Team Name */}
                                                    <span className={`font-medium truncate w-full ${useImage ? 'text-white' : (t.isCompleted ? 'text-green-600 dark:text-green-400' : (useGroupColor ? '' : `${T.textMain}`))}`} style={useGroupColor && !t.isCompleted ? {color: groupColor} : {}}>{t.name}</span>
                                                    
                                                    {/* Row 2: Time */}
                                                    <div className={`text-[10px] ${useImage ? 'text-slate-300' : (t.isCompleted ? 'text-green-600/70 dark:text-green-400/70' : T.textDim)}`}>{formatDateTime(t.time)}</div>

                                                    {/* Row 3: Gold Income OR Status */}
                                                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                                        {t.isCompleted ? (
                                                            <>
                                                                <span className={`text-[10px] font-bold px-1 rounded ${useImage ? 'bg-green-600 text-white border border-green-400' : 'text-green-500 border border-green-500/50 bg-green-500/10'}`}>已完成</span>
                                                                {gold > 0 && (
                                                                    <span className={`text-[10px] font-bold px-1 rounded flex items-center gap-0.5 ${useImage ? 'text-yellow-300 bg-black/40 border border-yellow-500/30' : 'text-amber-600 bg-amber-100 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700'}`}>
                                                                        <Coins size={10} /> +{gold.toLocaleString()}
                                                                    </span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            // Not completed: Show Gold if available, otherwise fallback to Status
                                                            gold > 0 ? (
                                                                <span className={`text-[10px] font-bold px-1 rounded flex items-center gap-0.5 ${useImage ? 'text-yellow-300 bg-black/40 border border-yellow-500/30' : 'text-amber-600 bg-amber-100 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700'}`}>
                                                                    <Coins size={10} /> {gold.toLocaleString()}
                                                                </span>
                                                            ) : (
                                                                <span className={`text-[10px] whitespace-nowrap px-1 rounded ${useImage ? 'bg-black/40 border border-white/30 text-white' : `${status.bg} ${status.color}`}`}>{status.label}</span>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); toggleTeamCompletion(t.id); }} className={`p-1.5 rounded-full transition-colors z-10 ${t.isCompleted ? 'bg-green-500 text-white shadow-sm hover:bg-green-400' : (useImage ? 'bg-white/20 text-white hover:bg-white/40' : `${T.bgMain} ${T.textDim} hover:text-white hover:bg-slate-400`)}`}><Check size={14} strokeWidth={3} /></button>
                                                </div>
                                            );
                                            })
                                        ) : null}
                                        {externalRuns.map(run => {
                                            const group = groups.find(g => g.id === run.groupId);
                                            const useImage = showRosterImages && group?.image;
                                            const groupColor = group?.color || '#3b82f6';
                                            const useGroupColor = !useImage && !run.isCompleted;
                                            // MODIFIED: Heuristic for External Run Gold
                                            let gold = 0;
                                            if (group) {
                                                const isHard = run.name.includes('困') || run.name.includes('Hard');
                                                gold = isHard ? group.goldHard : group.goldNormal;
                                            }
                                            gold = gold || 0;

                                            return (
                                            <div key={run.id} onClick={(e) => { e.stopPropagation(); openExternalRunModal(player, char, run); }} className={`w-full flex items-center justify-between text-xs p-2 rounded mt-1 transition-all group/pill cursor-pointer border relative overflow-hidden ${run.isCompleted ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20' : (useGroupColor ? '' : `${T.subtleBg} ${T.divider} hover:bg-slate-500/10`)}`}
                                                style={useImage ? { 
                                                    backgroundImage: `url(${group.image})`, 
                                                    backgroundSize: 'cover', 
                                                    backgroundPosition: 'top center',
                                                    color: 'white',
                                                    textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                                                } : (useGroupColor ? {
                                                    backgroundColor: hexToRgba(groupColor, isDarkMode ? 0.15 : 0.1),
                                                    borderColor: hexToRgba(groupColor, 0.3)
                                                } : {})}
                                            >
                                                {useImage && <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.9) 40%, transparent 100%)' }}></div>}
                                                <div className="flex-1 min-w-0 mr-2 flex justify-between items-center z-10 relative">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        {/* Tag pill if group exists */}
                                                        {group && (
                                                           <span className={`shrink-0 text-[10px] px-1 rounded border font-bold truncate max-w-[80px] flex items-center gap-1 ${useImage ? 'bg-blue-500 text-white border-blue-400' : (useGroupColor ? '' : 'bg-blue-500/10 text-blue-500 border-blue-500/30')}`} style={useGroupColor ? {backgroundColor: groupColor, color: 'white', borderColor: groupColor } : {}}>
                                                               {group.name}
                                                               {/* MODIFIED: External run tags don't have explicit difficulty field yet, hiding badge to avoid confusion or need simple check */}
                                                           </span>
                                                        )}
                                                        <span className={`font-medium truncate ${useImage ? 'text-white' : (run.isCompleted ? 'text-green-600 dark:text-green-400' : T.textMain)}`}>{run.name}</span>
                                                    </div>
                                                    
                                                    {/* MODIFIED: Show Gold for External Runs too if available */}
                                                    <div className="flex items-center gap-1">
                                                        {gold > 0 && (
                                                            <span className={`text-[10px] px-1 rounded border ml-1 shrink-0 flex items-center gap-1 ${useImage ? 'text-yellow-300 border-yellow-500/30 bg-black/40' : 'text-amber-500 border-amber-500/30 bg-amber-500/10'}`}>
                                                                <Coins size={10} /> {gold.toLocaleString()}
                                                            </span>
                                                        )}
                                                        <span className={`text-[10px] px-1 rounded border ml-1 shrink-0 ${run.isCompleted ? (useImage ? 'bg-green-600 text-white border-green-400' : 'text-green-500 border-green-500/50') : (useImage ? 'bg-black/40 text-slate-300 border-white/30' : `${T.textDim} ${T.divider}`)}`}>{run.isCompleted ? '已完成' : '自行通關'}</span>
                                                    </div>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); toggleExternalRunCompletion(player.id, char.id, run.id); }} className={`p-1.5 rounded-full transition-colors z-10 relative ${run.isCompleted ? 'bg-green-500 text-white shadow-sm hover:bg-green-400' : (useImage ? 'bg-white/20 text-white hover:bg-white/40' : `${T.bgMain} ${T.textDim} hover:bg-slate-400`)}`}><Check size={14} strokeWidth={3} /></button>
                                            </div>
                                        )})}
                                        {charTeams.length === 0 && externalRuns.length === 0 && (<div className={`text-xs ${T.textDim} italic py-1 text-center pointer-events-none`}>未排入隊伍</div>)}
                                    </div>
                                    </div>
                                );
                        })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* --- MODALS --- */}
      
      {/* NEW: Character Batch Manage Modal */}
      <Modal isOpen={isCharManageModalOpen} onClose={() => setIsCharManageModalOpen(false)} title={`管理 ${charManageTarget?.character?.name} 的隊伍狀態`} size="sm" isDarkMode={isDarkMode}>
          <div className="p-4 space-y-4">
              <div className={`p-3 rounded border ${T.divider} ${T.subtleBg} text-sm ${T.textDim}`}>
                  請勾選您要執行的清理動作。此操作無法復原。
              </div>
              <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer hover:border-amber-500 transition-colors ${charManageOptions.removeExternal ? 'bg-amber-500/10 border-amber-500' : `${T.bgMain} ${T.divider}`}`}>
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-600 text-amber-600 focus:ring-amber-500" checked={charManageOptions.removeExternal} onChange={e => setCharManageOptions({...charManageOptions, removeExternal: e.target.checked})} />
                      <div>
                          <div className={`font-medium ${T.textMain}`}>移除所有自行通關紀錄</div>
                          <div className={`text-xs ${T.textDim}`}>刪除此角色的所有「自行通關 (External Runs)」項目</div>
                      </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer hover:border-amber-500 transition-colors ${charManageOptions.removeTeams ? 'bg-amber-500/10 border-amber-500' : `${T.bgMain} ${T.divider}`}`}>
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-600 text-amber-600 focus:ring-amber-500" checked={charManageOptions.removeTeams} onChange={e => setCharManageOptions({...charManageOptions, removeTeams: e.target.checked})} />
                      <div>
                          <div className={`font-medium ${T.textMain}`}>退出所有預排隊伍</div>
                          <div className={`text-xs ${T.textDim}`}>將此角色從所有已加入的隊伍中移除 (變為空位)</div>
                      </div>
                  </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setIsCharManageModalOpen(false)} className={`px-4 py-2 rounded ${T.buttonSecondary} transition-colors`}>取消</button>
                  <button onClick={handleCharBatchAction} className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20 transition-colors flex items-center gap-2" disabled={!charManageOptions.removeExternal && !charManageOptions.removeTeams}><CheckCircle size={16} /> 執行清理</button>
              </div>
          </div>
      </Modal>

      {/* NEW: Player Batch Manage Modal */}
      <Modal isOpen={isPlayerBatchModalOpen} onClose={() => setIsPlayerBatchModalOpen(false)} title={`批量管理 ${playerBatchTarget?.name}`} size="sm" isDarkMode={isDarkMode}>
          <div className="p-4 space-y-4">
              <div className={`p-3 rounded border ${T.divider} ${T.subtleBg} text-sm ${T.textDim}`}>
                  此操作將套用於 <span className={T.textBold}>{playerBatchTarget?.name}</span> 的 <span className="text-amber-500 font-bold">所有角色</span>。請謹慎操作。
              </div>
              <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer hover:border-red-500 transition-colors ${playerBatchOptions.removeExternal ? 'bg-red-500/10 border-red-500' : `${T.bgMain} ${T.divider}`}`}>
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-600 text-red-600 focus:ring-red-500" checked={playerBatchOptions.removeExternal} onChange={e => setPlayerBatchOptions({ removeExternal: e.target.checked, resetExternal: false })} />
                      <div>
                          <div className={`font-medium ${T.textMain}`}>移除所有自行通關紀錄</div>
                          <div className={`text-xs ${T.textDim}`}>刪除該玩家所有角色的所有自行通關項目</div>
                      </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer hover:border-blue-500 transition-colors ${playerBatchOptions.resetExternal ? 'bg-blue-500/10 border-blue-500' : `${T.bgMain} ${T.divider}`} ${playerBatchOptions.removeExternal ? 'opacity-50 pointer-events-none' : ''}`}>
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-600 text-blue-600 focus:ring-blue-500" checked={playerBatchOptions.resetExternal} onChange={e => setPlayerBatchOptions({ removeExternal: false, resetExternal: e.target.checked })} disabled={playerBatchOptions.removeExternal} />
                      <div>
                          <div className={`font-medium ${T.textMain}`}>重置自行通關完成狀態</div>
                          <div className={`text-xs ${T.textDim}`}>將所有自行通關項目標記為「未完成」(適用於週常重置)</div>
                      </div>
                  </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setIsPlayerBatchModalOpen(false)} className={`px-4 py-2 rounded ${T.buttonSecondary} transition-colors`}>取消</button>
                  <button onClick={handlePlayerBatchAction} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-colors flex items-center gap-2" disabled={!playerBatchOptions.removeExternal && !playerBatchOptions.resetExternal}><CheckCircle size={16} /> 確認執行</button>
              </div>
          </div>
      </Modal>
      
      {/* Group Add/Edit Modal */}
      <Modal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} title={editingGroup ? "編輯分組" : "新增分組"} isDarkMode={isDarkMode}>
        <div className="p-4 space-y-4">
            <div>
                <label className={`block text-sm ${T.textDim} mb-1`}>分組名稱</label>
                <input type="text" className={`w-full ${T.input} rounded px-3 py-2 focus:outline-none focus:border-blue-500`} placeholder="例如: 困牛, 普夢, 周常..." value={groupFormData.name} onChange={e => setGroupFormData({...groupFormData, name: e.target.value})} autoFocus />
            </div>
            
            {/* NEW: Dual Gold Income Input (Normal & Hard) */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={`block text-sm ${T.textDim} mb-1`}>普通難度金幣</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 font-bold text-xs"><Coins size={14} /></span>
                        <input type="number" className={`w-full ${T.input} rounded pl-8 pr-3 py-2 focus:outline-none focus:border-blue-500`} placeholder="0" value={groupFormData.goldNormal} onChange={e => setGroupFormData({...groupFormData, goldNormal: e.target.value})} />
                    </div>
                </div>
                <div>
                    <label className={`block text-sm ${T.textDim} mb-1`}>困難難度金幣</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 font-bold text-xs"><Coins size={14} /></span>
                        <input type="number" className={`w-full ${T.input} rounded pl-8 pr-3 py-2 focus:outline-none focus:border-blue-500`} placeholder="0" value={groupFormData.goldHard} onChange={e => setGroupFormData({...groupFormData, goldHard: e.target.value})} />
                    </div>
                </div>
            </div>
            <p className="text-xs text-slate-500 -mt-2">設定此分組在不同難度下的預設金幣。</p>

            {/* Color Selection */}
            <div>
              <label className={`block text-sm ${T.textDim} mb-1`}>分組代表色 (標籤/底色)</label>
              <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-500 shadow-sm">
                    <input type="color" className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer" value={groupFormData.color || '#3b82f6'} onChange={e => setGroupFormData({...groupFormData, color: e.target.value})} />
                  </div>
                  <div className={`text-xs ${T.textDim}`}>點擊選擇顏色。此顏色將用於色塊模式的背景與標籤顯示。</div>
                  {groupFormData.color !== '#3b82f6' && (
                      <button onClick={() => setGroupFormData({...groupFormData, color: '#3b82f6'})} className={`text-xs ${T.buttonSecondary} px-2 py-1 rounded`}>重置預設藍</button>
                  )}
              </div>
            </div>

            <div>
                <label className={`block text-sm ${T.textDim} mb-1`}>背景圖片 (網址或上傳)</label>
                <input type="text" className={`w-full ${T.input} rounded px-3 py-2 focus:outline-none focus:border-blue-500 mb-2`} placeholder="請輸入圖片網址 (https://...)" value={groupFormData.image} onChange={e => setGroupFormData({...groupFormData, image: e.target.value})} />
                
                <div className="flex gap-2 items-center">
                    <label className={`flex-1 ${T.buttonSecondary} py-2 rounded cursor-pointer text-center text-sm border ${T.divider} transition-colors hover:border-blue-500`}>
                        <ImageIcon size={16} className="inline mr-2" />
                        上傳圖片 (建議200KB以下)
                        <input type="file" className="hidden" accept="image/*" onChange={handleGroupImageUpload} />
                    </label>
                    {groupFormData.image && (
                         <div className="w-10 h-10 rounded border overflow-hidden bg-slate-800">
                             <img src={groupFormData.image} alt="Preview" className="w-full h-full object-cover" />
                         </div>
                    )}
                </div>
                <p className="text-xs text-slate-500 mt-1">設定圖片後，圖片模式下將優先顯示圖片，忽略顏色設定。</p>
            </div>
            <div className="flex gap-3 pt-2">{editingGroup && (<button onClick={() => { setIsGroupModalOpen(false); requestDeleteGroup(editingGroup); }} className="flex-1 bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/30 py-2 rounded transition-colors">刪除</button>)}<button onClick={handleSaveGroup} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-medium transition-colors">{editingGroup ? "儲存" : "新增"}</button></div>
        </div>
      </Modal>

      {/* Team Detail View Modal */}
      <Modal isOpen={!!viewingTeamId} onClose={() => setViewingTeamId(null)} title="隊伍詳情" size="md" isDarkMode={isDarkMode}>
        {viewingTeam && (() => {
           const status = getStatus(viewingTeam, isDarkMode);
           const group = groups.find(g => g.id === viewingTeam.groupId);
           
           return (
             <div className="p-4 space-y-4">
                <div 
                    className={`${T.subtleBg} p-4 rounded-lg border ${T.divider} relative overflow-hidden`}
                    style={group?.image ? { backgroundImage: `url(${group.image})`, backgroundSize: 'cover', backgroundPosition: 'top center' } : {}}
                >
                   {group?.image && <div className="absolute inset-0 bg-black/70 z-0"></div>}
                   
                   <button onClick={() => { setViewingTeamId(null); openEditTeamModal(viewingTeam, viewingTeam.id); }} className={`absolute right-3 top-3 w-9 h-9 flex items-center justify-center z-20 ${group?.image ? 'bg-black/40 text-white hover:bg-black/60 border-white/20' : `${T.bgMain} hover:bg-blue-600 hover:text-white ${T.textDim} border ${T.divider}`} rounded-lg transition-colors border shadow-sm cursor-pointer`} title="編輯隊伍"><Edit2 size={18} /></button>
                   
                   <div className="flex justify-between items-start mb-2 pr-12 relative z-10">
                       <div>
                           {group && (<span className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit mb-1 flex items-center gap-1 border`} style={{ backgroundColor: group.image ? '#3b82f6' : hexToRgba(group.color || '#3b82f6', 0.1), color: group.image ? 'white' : (group.color || '#3b82f6'), borderColor: group.image ? '#60a5fa' : hexToRgba(group.color || '#3b82f6', 0.3) }}>
                               <Tag size={10} /> {group.name}
                               {/* MODIFIED: Display Difficulty Badge in Team Detail Modal (Team Priority) */}
                               {viewingTeam.difficulty === 'hard' && <span className="ml-1 bg-red-600 text-white text-[9px] px-1 rounded shadow-sm border border-red-400">困難</span>}
                               {viewingTeam.difficulty === 'normal' && <span className="ml-1 bg-green-600 text-white text-[9px] px-1 rounded shadow-sm border border-green-400">普通</span>}
                           </span>)}
                           <h2 className={`text-xl font-bold mb-1 ${group?.image ? 'text-white' : T.textBold}`}>{viewingTeam.name}</h2>
                       </div>
                   </div>
                   <div className={`flex flex-wrap items-center gap-4 text-sm relative z-10 ${group?.image ? 'text-slate-200' : T.textDim}`}>
                       <span className={`text-xs px-2 py-1 rounded border flex items-center gap-1 whitespace-nowrap ${group?.image ? 'bg-black/40 border-white/30 text-white' : `${status.bg} ${status.color}`}`}>{status.label}</span>
                       <span className="flex items-center gap-1.5"><Clock size={16} className={group?.image ? 'text-blue-300' : 'text-blue-500'}/> {formatDateTime(viewingTeam.time)}</span>
                       {/* NEW: Gold Display in Detail Modal (Team Priority) */}
                       {(() => {
                           let tGold = viewingTeam.gold;
                           if (tGold === undefined || tGold === 0) {
                               if (group) tGold = viewingTeam.difficulty === 'hard' ? group.goldHard : (group.goldNormal || 0);
                           }
                           if (tGold > 0) return <span className="flex items-center gap-1.5"><Coins size={16} className={group?.image ? 'text-yellow-300' : 'text-yellow-500'}/> {tGold.toLocaleString()} G</span>;
                           return null;
                       })()}
                       <span className="flex items-center gap-1.5"><Users size={16}/> {viewingTeam.size}人</span>
                       {viewingTeam.minIlvl > 0 && <span className="flex items-center gap-1.5"><Shield size={16} className={group?.image ? 'text-orange-400' : 'text-orange-500'}/> {viewingTeam.minIlvl}+</span>}
                   </div>
                </div>
                <div>
                   <h4 className={`text-sm font-bold ${T.textDim} mb-2 px-1 flex justify-between items-center`}><span>成員名單</span><span className={`text-[10px] font-normal ${T.textDim}`}>點擊欄位替換成員</span></h4>
                   <div className="space-y-2">
                       {Array.from({ length: viewingTeam.size }).map((_, idx) => {
                           const memberId = viewingTeam.members[idx];
                           const charData = memberId === 'PUG' ? { name: '-', job: '未知', role: 'PUG', ownerName: '路人', ownerColor: null } : (memberId ? getCharById(memberId) : null);
                           
                           return (
                               <div key={idx} onClick={() => openSlotSelector(viewingTeam.id, idx)} className={`group relative flex items-center gap-3 px-3 py-2 rounded ${T.bgMain} border ${T.divider} hover:${T.subtleBg} cursor-pointer transition-colors`}>
                                   <span className={`font-mono text-xs ${T.textDim} w-4 text-center`}>{idx + 1}</span>
                                   {charData ? (<>
                                           {/* ORDER: Item Level -> Icon -> Job -> OwnerName */}
                                           {/* 1. Item Level */}
                                           {charData.ilvl && <span className="font-mono text-sm text-blue-500 font-bold w-10 text-right shrink-0">{charData.ilvl}</span>}

                                           {/* 2. Class Icon */}
                                           <ClassIcon job={charData.job} role={charData.role} icons={classIcons} className="w-10 h-10" />

                                           {/* 3. Job Name & 4. Player Name */}
                                           <div className="flex-1 min-w-0">
                                               <div className="flex items-center gap-2">
                                                   {/* Job Name Tag */}
                                                   <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${charData.role === 'Support' ? 'border-green-800 text-green-500 bg-green-500/10' : (charData.role === 'PUG' ? 'border-slate-500 text-slate-500 bg-slate-500/10' : 'border-red-800 text-red-500 bg-red-500/10')}`}>{charData.job}</span>
                                                   {/* Player Name */}
                                                   {/* MODIFIED: Player Name with optional background color */}
                                                   <span 
                                                       className={`text-base font-bold truncate px-1 py-0.5 rounded ${!charData.ownerColor ? T.textBold : ''}`}
                                                       style={{ 
                                                           color: charData.ownerColor ? charData.ownerColor : undefined,
                                                           backgroundColor: charData.ownerBgColor ? charData.ownerBgColor : undefined
                                                       }}
                                                   >{charData.ownerName}</span>
                                               </div>
                                               {/* Character Name (Secondary) */}
                                               <div className={`text-xs ${T.textDim} truncate mt-0.5`}>{charData.name !== '-' && charData.name !== `${charData.ownerName} - ${charData.job}` ? `(${charData.name})` : ''}</div>
                                           </div>
                                            <button onClick={(e) => { e.stopPropagation(); handleRemoveMember(viewingTeam.id, idx); }} className={`absolute right-2 p-1.5 ${T.textDim} hover:text-red-500 hover:bg-slate-500/10 rounded opacity-0 group-hover:opacity-100 transition-opacity`}><X size={16} /></button>
                                       </>) : (<span className={`text-sm ${T.textDim} flex items-center gap-2`}><Plus size={14} /> 點擊加入成員</span>)}
                               </div>
                           );
                       })}
                   </div>
                </div>
                <div className={`pt-2 border-t ${T.divider} mt-2 flex gap-3`}>
                    <button onClick={() => toggleTeamCompletion(viewingTeam.id)} className={`flex-1 py-2.5 rounded transition-colors font-medium flex items-center justify-center gap-2 ${viewingTeam.isCompleted ? `${T.buttonSecondary}` : 'bg-green-600 text-white hover:bg-green-500'}`}>{viewingTeam.isCompleted ? <><X size={18} /> 取消完成</> : <><CheckCircle size={18} /> 標記為完成</>}</button>
                    <button onClick={() => setViewingTeamId(null)} className={`flex-1 py-2.5 rounded ${T.bgMain} ${T.textDim} hover:bg-slate-500/10 transition-colors font-medium border ${T.divider}`}>關閉</button>
                </div>
             </div>
           );
        })()}
      </Modal>

      {/* Day Detail Modal */}
      <Modal isOpen={!!selectedCalendarDate} onClose={() => setSelectedCalendarDate(null)} title={selectedCalendarDate ? `${formatDateOnly(selectedCalendarDate)} 行程詳情` : ''} size="lg" isDarkMode={isDarkMode}>
        <div className="p-4 space-y-4">
            {selectedCalendarDate && (
                <button onClick={() => handleCreateTeamFromDate(selectedCalendarDate)} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg mb-4 transition-transform active:scale-95"><Plus size={20} />在此日新增隊伍</button>
            )}
            {selectedCalendarDate && getEventsForDate(selectedCalendarDate).length > 0 && (
                <div className="mb-4 space-y-2"><h5 className={`text-sm font-bold ${T.textDim}`}>當日事件</h5><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{getEventsForDate(selectedCalendarDate).map(ev => { const ShapeIcon = EVENT_SHAPES.find(s => s.id === ev.shape)?.icon || Circle; const colorClass = EVENT_COLORS.find(c => c.id === ev.color)?.class || 'text-slate-500'; const bgClass = EVENT_COLORS.find(c => c.id === ev.color)?.bg.replace('bg-', 'bg-opacity-20 bg-') || 'bg-slate-500'; return (<div key={ev.id} className={`flex items-center gap-2 p-2 rounded border border-slate-700 ${bgClass.replace('bg-', 'bg-opacity-10 bg-')}`}><div className={`${colorClass}`}><ShapeIcon size={16} fill="currentColor" /></div><span className={`text-sm ${T.textMain}`}>{ev.name}</span></div>); })}</div></div>
            )}
            {selectedCalendarDate && (<div className="mb-4"><h5 className={`text-sm font-bold ${T.textDim} mb-2`}>成員狀態</h5><div className="grid grid-cols-2 gap-4"><div className={`${T.subtleBg} p-3 rounded border border-green-500/30`}><div className="text-green-500 font-bold mb-2 flex items-center gap-2"><Check size={16}/> 希望 ({getAvailabilityForDate(selectedCalendarDate).free.length}人)</div><div className="flex flex-wrap gap-1">{getAvailabilityForDate(selectedCalendarDate).free.map(p => (<span key={p.id} className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded" style={{color: p.color || undefined}}>{p.name}</span>))}{getAvailabilityForDate(selectedCalendarDate).free.length === 0 && <span className={`text-xs ${T.textDim}`}>-</span>}</div></div><div className={`${T.subtleBg} p-3 rounded border border-red-500/30`}><div className="text-red-500 font-bold mb-2 flex items-center gap-2"><Ban size={16}/> 沒空 ({getAvailabilityForDate(selectedCalendarDate).busy.length}人)</div><div className="flex flex-wrap gap-1">{getAvailabilityForDate(selectedCalendarDate).busy.map(p => (<span key={p.id} className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded" style={{color: p.color || undefined}}>{p.name}</span>))}{getAvailabilityForDate(selectedCalendarDate).busy.length === 0 && <span className={`text-xs ${T.textDim}`}>-</span>}</div></div></div></div>)}
            <h5 className={`text-sm font-bold ${T.textDim} mb-2`}>當日隊伍</h5>
            {selectedCalendarDate && getTeamsByDate(selectedCalendarDate).length === 0 && (<p className={`${T.textDim} text-center py-4 ${T.subtleBg} rounded border border-dashed ${isDarkMode ? 'border-slate-700' : 'border-slate-300'}`}>沒有已排定的隊伍</p>)}
            {selectedCalendarDate && getTeamsByDate(selectedCalendarDate).map(team => {
                const status = getStatus(team, isDarkMode);
                return (<div key={team.id} className={`${T.subtleBg} border ${T.divider} rounded-lg p-4`}><div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b ${T.divider} pb-3`}><div className="flex items-center gap-3"><div className="font-mono text-xl font-bold text-blue-500">{formatTimeOnly(team.time)}</div><div><h4 className={`font-bold text-lg ${T.textBold}`}>{team.name}</h4><div className={`text-xs ${T.textDim} flex items-center gap-2`}><span>{team.size}人團</span><span className={`px-1.5 py-0.5 rounded border text-[10px] ${status.bg} ${status.color}`}>{status.label}</span>{team.minIlvl > 0 && <span className="text-orange-500">{team.minIlvl}+</span>}</div></div></div><div className="flex gap-2"><button onClick={() => toggleTeamCompletion(team.id)} className={`px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-1 ${team.isCompleted ? 'bg-green-600 text-white hover:bg-green-500' : `${T.buttonSecondary}`}`}><CheckCircle size={16}/>{team.isCompleted ? '已完成' : '標記完成'}</button><button onClick={() => { setSelectedCalendarDate(null); openEditTeamModal(team); }} className={`px-3 py-1.5 ${T.buttonSecondary} text-sm rounded transition-colors`}>編輯 / 管理</button></div></div><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">{team.members.map((memberId, idx) => { const charData = memberId === 'PUG' ? { name: '-', job: '未知', role: 'PUG', ownerName: '路人', ownerColor: null } : (memberId ? getCharById(memberId) : null); 
                let isSlotHighlighted = false;
                if (rosterFilterId !== 'ALL' && memberId && memberId !== 'PUG') {
                     const selectedPlayer = players.find(p => p.id === rosterFilterId);
                     if (selectedPlayer) {
                         isSlotHighlighted = selectedPlayer.characters.some(c => c.id === memberId);
                     }
                }
                if (!charData) { return (<div key={idx} className={`flex items-center gap-2 ${T.textDim} text-xs py-1.5 px-2 rounded border ${isDarkMode ? 'border-slate-700 bg-slate-900/30' : 'border-slate-300 bg-slate-100'} border-dashed`}><div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>空缺</div>) } return (<div key={idx} className={`flex items-center gap-2 ${T.bgMain} rounded px-2 py-1.5 border ${T.divider} ${isSlotHighlighted ? 'ring-2 ring-yellow-400 z-10' : ''}`}><div className={`w-1.5 h-1.5 rounded-full shrink-0 ${charData.role === 'Support' ? 'bg-green-500' : (charData.role === 'PUG' ? 'bg-slate-500' : 'bg-red-500')}`}></div><div className="min-w-0 flex-1"><div className={`text-xs font-bold ${T.textMain} truncate`} style={{color: charData.ownerColor || undefined}}>{charData.ownerName}</div><div className={`text-[10px] ${T.textDim} truncate flex justify-between`}><span>{charData.job}</span>{charData.ilvl && <span className="text-blue-500/80">{charData.ilvl}</span>}</div></div></div>); })}</div></div>);
            })}
        </div>
      </Modal>

      {/* Slot Selector Modal */}
      <Modal isOpen={isSlotSelectModalOpen} onClose={() => setIsSlotSelectModalOpen(false)} title="選擇成員" size="lg" isDarkMode={isDarkMode}>
        <div className="flex h-[450px]">
           <div className={`w-1/3 border-r ${T.divider} ${T.subtleBg} p-2 overflow-y-auto`}>
               <div className={`text-xs font-bold ${T.textDim} uppercase px-2 mb-2 flex items-center gap-1`}><Filter size={12} /> 篩選玩家</div>
               <button onClick={() => setSlotSelectorFilter('ALL')} className={`w-full text-left px-3 py-2 rounded text-sm mb-1 transition-colors ${slotSelectorFilter === 'ALL' ? 'bg-blue-600 text-white' : `${T.textMain} hover:${T.bgMain}`}`}>全部玩家</button>
               <div className={`h-px ${T.separator} my-2 mx-1`}></div>
               {(() => {
                   const currentTeam = getTeamById(selectedTeamId);
                   const minIlvl = currentTeam?.minIlvl || 0;
                   const highIlvlThreshold = Number(minIlvl) + 10;
                   const currentGroupId = currentTeam?.groupId;

                   // 計算玩家的排序權重 (0: 最頂端, 1: 中上, 2: 中間, 3: 最底端)
                   const checkPlayerPriority = (p) => {
                       // 優先級 3 (最底端)：已經有角色在該隊伍中的玩家
                       const hasCharInTeam = p.characters.some(c => currentTeam?.members.includes(c.id));
                       if (hasCharInTeam) return 3;

                       let hasCleanMatch = false;
                       let hasConflictMatch = false;

                       p.characters.forEach(char => {
                           // 1. 基本條件篩選
                           if (slotRoleFilter !== 'ALL' && char.role !== slotRoleFilter) return;
                           if (slotHighIlvlFilter && Number(char.ilvl) < highIlvlThreshold) return;
                           if (slotTagFilter !== 'ALL') {
                               const cTags = classTags[char.job] || '';
                               const cTagsArr = cTags.split(',').map(t => t.trim()).filter(t => t);
                               if (!cTagsArr.includes(slotTagFilter)) return;
                           }
                           if (Number(char.ilvl) < minIlvl) return;
                           
                           // 2. 衝突檢查 (分組衝突)
                           let isConflict = false;
                           if (currentGroupId) {
                               const otherTeams = getTeamsForChar(char.id).filter(t => t.id !== selectedTeamId);
                               const conflictTeam = otherTeams.find(t => t.groupId === currentGroupId);
                               if (conflictTeam) {
                                   isConflict = true;
                               } else {
                                   const conflictRun = (char.externalRuns || []).find(r => r.groupId === currentGroupId);
                                   if (conflictRun) {
                                       isConflict = true;
                                   }
                               }
                           }

                           if (isConflict) {
                               hasConflictMatch = true;
                           } else {
                               hasCleanMatch = true;
                           }
                       });

                       if (hasCleanMatch) return 0; // 最頂端：有完全符合且無衝突的角色
                       if (hasConflictMatch) return 1; // 中上：有符合的角色，但存在同分組衝突
                       return 2; // 中間：沒有符合條件的角色
                   };

                   const sortedPlayers = [...players].sort((a, b) => {
                       const weightA = checkPlayerPriority(a);
                       const weightB = checkPlayerPriority(b);
                       if (weightA !== weightB) return weightA - weightB; // 權重小的排前面
                       return a.name.localeCompare(b.name); // 同權重依字母排序
                   });
                   
                   return sortedPlayers.map(p => { 
                       const weight = checkPlayerPriority(p);
                       const hasCharInTeam = weight === 3;
                       const isCleanMatch = weight === 0;
                       const isConflictMatch = weight === 1;
                       const isSelected = slotSelectorFilter === p.id;
                       
                       return (
                           <button key={p.id} onClick={() => setSlotSelectorFilter(p.id)} className={`w-full text-left px-3 py-2 rounded text-sm mb-1 transition-colors flex justify-between items-center ${isSelected ? 'bg-blue-600 text-white' : `${T.textMain} hover:${T.bgMain}`}`}>
                               <div className="flex items-center gap-1.5 overflow-hidden">
                                   <span 
                                       className={`truncate px-1.5 py-0.5 rounded ${!p.color && !isSelected ? T.textBold : ''} ${hasCharInTeam && !isSelected ? 'opacity-50' : ''}`} 
                                       style={{ 
                                           color: (!isSelected && p.color) ? p.color : undefined,
                                           backgroundColor: (!isSelected && p.bgColor) ? p.bgColor : undefined
                                       }}
                                   >
                                       {p.name}
                                   </span>
                                   {/* 完全無衝突的綠色亮點 */}
                                   {isCleanMatch && !isSelected && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 shadow-[0_0_4px_#22c55e]" title="有完全符合條件且無衝突的可出戰角色" />}
                                   {/* 有衝突的橘色亮點 */}
                                   {isConflictMatch && !isSelected && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 shadow-[0_0_4px_#ea4335]" title="有符合條件的角色 (但已存在同分組的隊伍或紀錄)" />}
                               </div>
                               {hasCharInTeam && (<span className={`text-[10px] shrink-0 ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-200'} px-1 rounded text-green-500 whitespace-nowrap`}>(已入隊)</span>)}
                           </button>
                       ); 
                   });
               })()}
           </div>
           <div className={`w-2/3 p-3 overflow-y-auto ${T.bgMain}`}>
               <div className={`flex flex-col gap-2 mb-4 ${T.subtleBg} p-2 rounded border ${T.divider}`}>
                   <div className="flex gap-2">
                       <button onClick={() => setSlotRoleFilter('ALL')} className={`flex-1 py-1.5 text-xs rounded transition-colors ${slotRoleFilter === 'ALL' ? 'bg-blue-600 text-white' : `${T.textDim} hover:${T.textMain} border border-slate-500/30`}`}>全部角色</button>
                       <button onClick={() => setSlotRoleFilter('DPS')} className={`flex-1 py-1.5 text-xs rounded transition-colors ${slotRoleFilter === 'DPS' ? 'bg-red-600 text-white' : `${T.textDim} hover:${T.textMain} border border-slate-500/30`}`}>輸出 (DPS)</button>
                       <button onClick={() => setSlotRoleFilter('Support')} className={`flex-1 py-1.5 text-xs rounded transition-colors ${slotRoleFilter === 'Support' ? 'bg-green-600 text-white' : `${T.textDim} hover:${T.textMain} border border-slate-500/30`}`}>輔助 (SUP)</button>
                   </div>
                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-1">
                       <label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${slotHighIlvlFilter ? 'text-orange-500' : T.textDim}`}>
                           <input type="checkbox" className={`w-4 h-4 rounded border-slate-500`} checked={slotHighIlvlFilter} onChange={(e) => setSlotHighIlvlFilter(e.target.checked)} />
                           高裝等 (+10)
                       </label>
                       {availableTags.length > 0 && (
                           <div className="relative flex-1 w-full sm:w-auto">
                               <select className={`w-full ${T.select} rounded pl-3 pr-8 py-1.5 text-sm focus:outline-none appearance-none border ${T.divider}`} value={slotTagFilter} onChange={(e) => setSlotTagFilter(e.target.value)}>
                                   <option value="ALL">全部標籤 (不限)</option>
                                   {availableTags.map(t => <option key={t} value={t}>{t}</option>)}
                               </select>
                               <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                           </div>
                       )}
                   </div>
               </div>
               <button onClick={() => handleAssignMember('PUG')} className={`w-full text-left p-3 rounded ${T.subtleBg} hover:bg-slate-500/10 border ${T.divider} flex justify-between items-center group mb-4`}><div className={`font-medium ${T.textMain}`}>野人 / 招募版路人</div><div className={`text-xs ${T.textDim} group-hover:${T.textMain}`}>Placeholder</div></button>
               {players.length === 0 && <p className={`text-center ${T.textDim} py-4`}>無資料</p>}
               
               {/* MODIFIED: Flattened list sorted by availability -> ilvl */}
               {(() => {
                   const currentTeam = getTeamById(selectedTeamId);
                   const minIlvl = currentTeam?.minIlvl || 0;
                   const highIlvlThreshold = Number(minIlvl) + 10;
                   const currentGroupId = currentTeam?.groupId; 

                   // 1. Gather ALL characters from target players (All or Specific)
                   const targetPlayers = slotSelectorFilter === 'ALL' 
                        ? players 
                        : players.filter(p => p.id === slotSelectorFilter);

                   let allProcessedChars = [];

                   targetPlayers.forEach(player => {
                       // MODIFIED: Check if this player already has ANY character in this team (blocks other chars), BUT exclude the current slot
                       // This allows selecting other characters of the same player for the SAME slot (swapping characters)
                       const charInTeam = player.characters.find(c => currentTeam?.members.some((m, i) => m === c.id && i !== selectedSlotIndex)); 
                       
                       player.characters.forEach(char => {
                           // Filter by Role
                           if (slotRoleFilter !== 'ALL' && char.role !== slotRoleFilter) return;

                           // Filter by High Ilvl
                           if (slotHighIlvlFilter && Number(char.ilvl) < highIlvlThreshold) return;

                           // Filter by Tag
                           if (slotTagFilter !== 'ALL') {
                               const cTags = classTags[char.job] || '';
                               const cTagsArr = cTags.split(',').map(t => t.trim()).filter(t => t);
                               if (!cTagsArr.includes(slotTagFilter)) return;
                           }

                           const isIlvlOk = Number(char.ilvl) >= minIlvl; 
                           const isThisCharInTeam = currentTeam?.members.includes(char.id); 
                           
                           let disabledReason = ''; 
                           let conflictReason = ''; 
                           let isSwap = false; 

                           // Priority 3: Swap (Already in this team) - Checked first to override disabled checks
                           if (isThisCharInTeam) { 
                               isSwap = true; 
                           } 
                           // Priority 4: Disabled (Player conflict - Another char from same player is in team)
                           else if (charInTeam) { 
                               disabledReason = '玩家已在隊伍中'; 
                           } 
                           // Priority 4: Disabled (Ilvl)
                           else if (!isIlvlOk) { 
                               disabledReason = `裝等不足 (${minIlvl})`; 
                           } 
                           
                           // Priority 2: Conflict (Same Group ID in other team)
                           // Only check if not disabled and not swap (Weight 1 candidates checked for Weight 2 status)
                           if (!disabledReason && !isSwap && currentGroupId) {
                               const otherTeams = getTeamsForChar(char.id).filter(t => t.id !== selectedTeamId);
                               const conflictTeam = otherTeams.find(t => t.groupId === currentGroupId);
                               if (conflictTeam) {
                                   conflictReason = `衝突: ${conflictTeam.name}`;
                               } else {
                                   // Check external runs
                                   const conflictRun = (char.externalRuns || []).find(r => r.groupId === currentGroupId);
                                   if (conflictRun) {
                                        conflictReason = `衝突: ${conflictRun.name} (自行通關)`;
                                   }
                               }
                           }

                           allProcessedChars.push({ 
                               ...char, 
                               disabledReason,
                               conflictReason,
                               isSwap,
                               isDisabled: !!disabledReason,
                               isConflict: !!conflictReason,
                               isIlvlOk,
                               ownerId: player.id, // <-- 新增這行：將玩家ID綁定給角色，儲存裝等時才找得到人
                               ownerName: player.name, 
                               ownerColor: player.color,
                               // MODIFIED: Pass background color
                               ownerBgColor: player.bgColor
                           });
                       });
                   });

                   // 2. Sort the flattened list
                   // Weight 1: Available (Clean)
                   // Weight 2: Conflict (Replaceable)
                   // Weight 3: Swap (Internal)
                   // Weight 4: Disabled
                   allProcessedChars.sort((a, b) => {
                       const getWeight = (char) => {
                           if (char.isDisabled) return 4;
                           if (char.isSwap) return 3;
                           if (char.isConflict) return 2;
                           return 1;
                       };

                       const weightA = getWeight(a);
                       const weightB = getWeight(b);

                       if (weightA !== weightB) return weightA - weightB;
                       
                       const ilvlDiff = Number(b.ilvl) - Number(a.ilvl);
                       if (ilvlDiff !== 0) return ilvlDiff;
                       return a.ownerName.localeCompare(b.ownerName);
                   });

                    if (allProcessedChars.length === 0 && players.length > 0) return <p className={`text-center ${T.textDim} py-4`}>無符合篩選條件的角色</p>;

                    return (
                        <div className="space-y-2">
                           {allProcessedChars.map(char => {
                               // Styles based on status
                               let buttonClass = `${T.card} hover:${T.cardHover} hover:shadow-md`;
                               let statusText = null;

                               if (char.isDisabled) {
                                   buttonClass = `opacity-40 grayscale ${T.subtleBg}`; // 將 cursor-not-allowed 移除，以便內部可點擊
                                   statusText = <span className="text-red-500 font-bold ml-2">[{char.disabledReason}]</span>;
                               } else if (char.isConflict) {
                                   // Weight 2: Conflict
                                   buttonClass = `bg-amber-500/10 border-amber-500/50 hover:bg-amber-500/20 hover:border-amber-500 shadow-sm`;
                                   statusText = <span className="text-amber-500 font-bold ml-2">[{char.conflictReason} - 點擊交換]</span>;
                               } else if (char.isSwap) {
                                   // Weight 3: Swap
                                   buttonClass = `bg-blue-500/5 border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500 shadow-none opacity-90`;
                                   statusText = <span className="text-blue-500 font-bold ml-2 md:ml-auto md:order-last flex items-center gap-1 text-xs"><ArrowRightLeft size={12}/> 交換位置</span>;
                               }

                               return (
                               <div key={char.id} onClick={() => !char.isDisabled && handleAssignMember(char.id)} className={`w-full text-left p-2.5 rounded border flex justify-between items-center transition-all ${char.isDisabled ? 'cursor-default' : 'cursor-pointer'} ${buttonClass}`}>
                                   <div className="flex-1 min-w-0">
                                       <div className="flex items-center gap-2">
                                           <ClassIcon job={char.job} role={char.role} icons={classIcons} className="w-5 h-5" showTooltip={false} />
                                           
                                           {/* 快速編輯裝等區塊 */}
                                           {quickEditIlvlCharId === char.id ? (
                                               <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                   <input
                                                       type="number"
                                                       autoFocus
                                                       className={`w-14 px-1 py-0.5 text-xs rounded border ${isDarkMode ? 'bg-slate-700 text-white border-blue-500' : 'bg-white text-slate-900 border-blue-500'} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                                       value={quickEditIlvlValue}
                                                       onChange={e => setQuickEditIlvlValue(e.target.value)}
                                                   />
                                                   <button 
                                                       onClick={(e) => { e.stopPropagation(); handleQuickSaveIlvl(char.ownerId, char.id, quickEditIlvlValue); }}
                                                       className="p-1 rounded bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white transition-colors shadow-sm"
                                                       title="確認修改"
                                                   >
                                                       <Check size={12} strokeWidth={3} />
                                                   </button>
                                                   <button 
                                                       onClick={(e) => { e.stopPropagation(); setQuickEditIlvlCharId(null); }}
                                                       className={`p-1 rounded transition-colors shadow-sm ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                                                       title="取消"
                                                   >
                                                       <X size={12} strokeWidth={3} />
                                                   </button>
                                               </div>
                                           ) : (
                                               <div
                                                   className={`flex items-center gap-1.5 px-1 -ml-1 rounded hover:bg-slate-500/20 cursor-pointer transition-colors`}
                                                   onClick={(e) => {
                                                       e.stopPropagation();
                                                       setQuickEditIlvlCharId(char.id);
                                                       setQuickEditIlvlValue(char.ilvl);
                                                   }}
                                                   title="修改裝等"
                                               >
                                                   <span className={`font-mono ${char.isIlvlOk ? 'text-blue-500' : 'text-red-500'}`}>Lv. {char.ilvl}</span>
                                                   <div className="text-slate-400 hover:text-blue-500 bg-slate-500/10 p-0.5 rounded transition-colors"><Edit2 size={10} /></div>
                                               </div>
                                           )}

                                           <span className={`text-[10px] px-1.5 py-0.5 rounded border ${char.role === 'Support' ? 'border-green-500/50 bg-green-500/10 text-green-500' : 'border-red-500/50 bg-red-500/10 text-red-500'}`}>{char.job}</span>
                                           {/* MODIFIED: Slot Selector Player Name with optional background color */}
                                           <span 
                                               className={`font-medium px-1 py-0.5 rounded ${char.isDisabled ? T.textDim : (char.isConflict ? 'text-amber-500' : (char.isSwap ? 'text-blue-500' : T.textMain))}`} 
                                               style={{
                                                   color: (!char.isDisabled && !char.isConflict && !char.isSwap && char.ownerColor) ? char.ownerColor : undefined,
                                                   backgroundColor: (!char.isDisabled && !char.isConflict && !char.isSwap && char.ownerBgColor) ? char.ownerBgColor : undefined
                                               }}
                                           >{char.ownerName}</span>
                                       </div>
                                       <div className={`flex flex-wrap items-center gap-2 text-xs mt-1.5 pl-7`}>
                                           <span className={char.isConflict ? 'text-amber-600/80' : (char.isSwap ? 'text-blue-500/80' : T.textDim)}>{char.name}</span>
                                           {statusText}
                                       </div>
                                       {!char.isConflict && !char.isSwap && getTeamsForChar(char.id).filter(t => t.id !== selectedTeamId).length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2 pl-7">
                                                {getTeamsForChar(char.id).filter(t => t.id !== selectedTeamId).map(t => (
                                                    <span key={t.id} className="text-sm bg-blue-500/20 text-blue-500 border border-blue-500/30 px-1.5 rounded truncate max-w-[120px]">已排: {t.name}</span>
                                                ))}
                                            </div>
                                       )}
                                   </div>
                                   {char.isConflict && <div className="text-amber-500 mr-2"><ArrowRightLeft size={18} /></div>}
                               </div>
                               );
                           })}
                        </div>
                    );
               })()}
           </div>
        </div>
      </Modal>
      
      {/* NEW: Action Confirmation Modal (Replaces browser confirm) */}
      <Modal isOpen={actionConfirm.isOpen} onClose={() => setActionConfirm({ ...actionConfirm, isOpen: false })} title={actionConfirm.title} isDarkMode={isDarkMode}>
        <div className="p-4 space-y-4">
            <div className="bg-amber-500/10 p-3 rounded border border-amber-500/30 flex gap-3 items-start">
                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                <p className={`text-sm ${T.textMain} whitespace-pre-line`}>{actionConfirm.message}</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setActionConfirm({ ...actionConfirm, isOpen: false })} className={`px-4 py-2 rounded ${T.buttonSecondary} transition-colors`}>取消</button>
                <button 
                    onClick={() => {
                        if (actionConfirm.onConfirm) actionConfirm.onConfirm();
                    }} 
                    className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20 transition-colors flex items-center gap-2"
                >
                    <CheckCircle size={16} /> 確認執行
                </button>
            </div>
        </div>
      </Modal>

      {/* Import Confirmation Modal */}
      <Modal isOpen={importConfirm.isOpen} onClose={() => setImportConfirm({ ...importConfirm, isOpen: false })} title="確認匯入資料" isDarkMode={isDarkMode}>
        <div className="p-4 space-y-4">
            <div className="bg-yellow-500/10 p-3 rounded border border-yellow-500/30 flex gap-3 items-start"><AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={20} /><p className={`text-sm ${T.textMain} whitespace-pre-line`}>{importConfirm.message}</p></div>
            <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setImportConfirm({ ...importConfirm, isOpen: false })} className={`px-4 py-2 rounded ${T.buttonSecondary} transition-colors`}>取消</button>
                <button onClick={executeImport} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-colors flex items-center gap-2"><Upload size={16} />確認匯入</button>
            </div>
        </div>
      </Modal>

      {/* Player Availability Modal */}
      <Modal isOpen={isAvailabilityModalOpen} onClose={() => setIsAvailabilityModalOpen(false)} title={availabilityPlayer ? `${availabilityPlayer.name} 的空閒時間` : ''} size="md" isDarkMode={isDarkMode}>
          <div className="p-4 space-y-4">
              <div className={`flex justify-between items-center mb-2`}><div className={`text-sm ${T.textDim}`}>點擊日期切換狀態：</div><div className="flex gap-3 text-xs"><div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded"></div> 希望</div><div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded"></div> 沒空</div><div className={`flex items-center gap-1`}><div className={`w-3 h-3 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'} rounded`}></div> 未定</div></div></div>
              <div className={`${T.bgMain} p-2 rounded border ${T.divider}`}>
                   <div className="flex justify-between items-center mb-2 px-2"><button onClick={prevMonth} className={`p-1 hover:${T.textMain} ${T.textDim}`}><ChevronLeft size={20}/></button><span className={`font-bold ${T.textBold}`}>{calendarDate.getFullYear()}年 {calendarDate.getMonth() + 1}月</span><button onClick={nextMonth} className={`p-1 hover:${T.textMain} ${T.textDim}`}><ChevronRight size={20}/></button></div>
                   <div className="grid grid-cols-7 text-center mb-1">{['日', '一', '二', '三', '四', '五', '六'].map(d => <div key={d} className={`text-xs ${T.textDim} py-1`}>{d}</div>)}</div>
                   <div className="grid grid-cols-7 gap-1">{getCalendarDays(calendarDate).map(cell => { if (cell.type === 'padding') return <div key={cell.key} className="h-10"></div>; const status = availabilityData[cell.dateStr]; let bgClass = isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'; let textClass = T.textDim; if (status === 'free') { bgClass = 'bg-green-500/20 border border-green-500/50'; textClass = 'text-green-500 font-bold'; } else if (status === 'busy') { bgClass = 'bg-red-500/20 border border-red-500/50'; textClass = 'text-red-500 font-bold'; } return (<button key={cell.key} onClick={() => toggleAvailabilityDate(cell.dateStr)} className={`h-10 rounded flex flex-col items-center justify-center transition-all ${bgClass}`}><span className={`text-sm ${textClass}`}>{cell.dayNum}</span></button>) })}</div>
              </div>
              <div className="flex justify-end pt-2"><button onClick={handleSaveAvailability} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-medium transition-colors">儲存設定</button></div>
          </div>
      </Modal>

      {/* Calendar Events Manager Modal */}
      <Modal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} title="行事曆事件設定" size="lg" isDarkMode={isDarkMode}>
          <div className="p-4 flex gap-6 h-[500px]">
              <div className={`w-1/2 space-y-4 border-r ${T.divider} pr-4 overflow-y-auto`}>
                  <h4 className={`font-bold ${T.textBold} mb-2`}>新增/編輯事件</h4>
                  <div><label className={`block text-sm ${T.textDim} mb-1`}>事件名稱</label><input type="text" className={`w-full ${T.input} rounded px-3 py-2 focus:outline-none focus:border-purple-500`} placeholder="例如: 更新日, 休假日..." value={eventFormData.name} onChange={e => setEventFormData({...eventFormData, name: e.target.value})} /></div>
                  <div className="flex gap-4">
                      <div className="flex-1"><label className={`block text-sm ${T.textDim} mb-1`}>形狀</label><div className="flex gap-2">{EVENT_SHAPES.map(s => (<button key={s.id} onClick={() => setEventFormData({...eventFormData, shape: s.id})} className={`p-2 rounded border transition-colors ${eventFormData.shape === s.id ? 'bg-purple-600 border-purple-500 text-white' : `${T.buttonSecondary}`}`} title={s.label}><s.icon size={16} fill="currentColor" /></button>))}</div></div>
                      <div className="flex-1"><label className={`block text-sm ${T.textDim} mb-1`}>顏色</label><div className="flex gap-1 flex-wrap">{EVENT_COLORS.map(c => (<button key={c.id} onClick={() => setEventFormData({...eventFormData, color: c.id})} className={`w-6 h-6 rounded-full border-2 transition-all ${c.bg} ${eventFormData.color === c.id ? 'border-white scale-110 shadow' : 'border-transparent opacity-70 hover:opacity-100'}`} title={c.label} />))}</div></div>
                  </div>
                  <div>
                      <label className={`block text-sm ${T.textDim} mb-1`}>日期模式</label>
                      <div className="flex gap-2 mb-2">
                          <button onClick={() => setEventFormData({...eventFormData, type: 'specific'})} className={`flex-1 py-1.5 rounded text-sm border ${eventFormData.type === 'specific' ? 'bg-purple-600 border-purple-500 text-white' : `${T.buttonSecondary}`}`}>指定日期 (多選)</button>
                          <button onClick={() => setEventFormData({...eventFormData, type: 'periodic'})} className={`flex-1 py-1.5 rounded text-sm border ${eventFormData.type === 'periodic' ? 'bg-purple-600 border-purple-500 text-white' : `${T.buttonSecondary}`}`}>週期性</button>
                      </div>
                      {eventFormData.type === 'specific' ? (<div className="space-y-2"><div className="flex gap-2"><input type="date" className={`flex-1 ${T.input} rounded px-3 py-1.5 [color-scheme:dark]`} value={tempEventDate} onChange={e => setTempEventDate(e.target.value)} /><button onClick={handleAddEventDate} className="bg-slate-500 hover:bg-slate-600 px-3 rounded text-white"><Plus size={16}/></button></div><div className={`flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 ${T.subtleBg} rounded`}>{eventFormData.dates.map(d => (<span key={d} className="bg-slate-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">{d} <button onClick={() => handleRemoveEventDate(d)} className="hover:text-red-300"><X size={12} /></button></span>))}{eventFormData.dates.length === 0 && <span className={`${T.textDim} text-xs`}>尚未選擇日期</span>}</div></div>) : (<div className="space-y-3"><div><label className={`text-xs ${T.textDim} block mb-1`}>起始日期</label><input type="date" className={`w-full ${T.input} rounded px-3 py-1.5 [color-scheme:dark]`} value={eventFormData.startDate} onChange={e => setEventFormData({...eventFormData, startDate: e.target.value})} /></div><div><label className={`text-xs ${T.textDim} block mb-1`}>週期 (天)</label><div className="flex items-center gap-2"><input type="number" className={`w-20 ${T.input} rounded px-2 py-1.5`} value={eventFormData.period} onChange={e => setEventFormData({...eventFormData, period: e.target.value})} /><span className={`text-sm ${T.textDim}`}>天一次</span></div></div></div>)}
                  </div>
                  <button onClick={handleSaveEvent} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-medium mt-4">儲存事件</button>
              </div>
              <div className="w-1/2 overflow-y-auto space-y-2">
                  <h4 className={`font-bold ${T.textBold} mb-2 sticky top-0 ${T.modalBg} py-1`}>已設定事件</h4>
                  {customEvents.length === 0 && <p className={`${T.textDim} text-sm text-center py-4`}>無自訂事件</p>}
                  {customEvents.map(ev => {
                      const ShapeIcon = EVENT_SHAPES.find(s => s.id === ev.shape)?.icon || Circle;
                      const colorClass = EVENT_COLORS.find(c => c.id === ev.color)?.class || 'text-slate-500';
                      return (<div key={ev.id} className={`${T.subtleBg} p-3 rounded border ${T.divider} flex justify-between items-center group`}><div className="flex items-center gap-3"><div className={`p-1.5 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'} rounded ${colorClass}`}><ShapeIcon size={16} fill="currentColor" /></div><div><div className={`font-bold ${T.textMain} text-sm`}>{ev.name}</div><div className={`text-xs ${T.textDim}`}>{ev.type === 'specific' ? `${ev.dates?.length || 0} 個日期` : `每 ${ev.period} 天 (自 ${ev.startDate})`}</div></div></div><button onClick={() => requestDeleteEvent(ev.id)} className={`${T.textDim} hover:text-red-500 p-1`}><Trash2 size={16} /></button></div>);
                  })}
              </div>
          </div>
      </Modal>

      {/* Quick Time Edit Modal */}
      <Modal isOpen={!!quickTimeTeam} onClose={() => setQuickTimeTeam(null)} title="快速修改時間" isDarkMode={isDarkMode}>
        <div className="p-4 space-y-4">
            <p className={`text-sm ${T.textDim} mb-2`}>正在修改 <span className={`${T.textBold}`}>{quickTimeTeam?.name}</span> 的出團時間：</p>
            <div className={`${T.bgMain} border ${T.divider} rounded p-3`}>
                <div className={`flex justify-between items-center mb-4 border-b ${T.divider} pb-3`}><div className="flex items-center gap-2"><Clock size={16} className="text-blue-500" /><span className={`${T.textBold} text-sm`}>{quickTimeCalendarViewDate.getFullYear()}/{quickTimeCalendarViewDate.getMonth() + 1}/{quickTimeCalendarViewDate.getDate()}</span></div><input type="time" className={`${T.input} rounded px-2 py-1 text-sm [color-scheme:dark] focus:border-blue-500 outline-none`} value={quickTimeValue ? quickTimeValue.split('T')[1] : ''} onChange={e => setQuickTimeTime(e.target.value)} /></div>
                <div>
                      <div className="flex justify-between items-center mb-2 px-2"><button onClick={() => setQuickTimeCalendarViewDate(new Date(quickTimeCalendarViewDate.getFullYear(), quickTimeCalendarViewDate.getMonth() - 1, 1))} className={`p-1 hover:${T.textMain} ${T.textDim}`}><ChevronLeft size={16}/></button><span className={`text-sm font-bold ${T.textMain}`}>{quickTimeCalendarViewDate.getFullYear()}年 {quickTimeCalendarViewDate.getMonth() + 1}月</span><button onClick={() => setQuickTimeCalendarViewDate(new Date(quickTimeCalendarViewDate.getFullYear(), quickTimeCalendarViewDate.getMonth() + 1, 1))} className={`p-1 hover:${T.textMain} ${T.textDim}`}><ChevronRight size={16}/></button></div>
                    <div className="grid grid-cols-7 text-center mb-1">{['日', '一', '二', '三', '四', '五', '六'].map(d => <div key={d} className={`text-[10px] ${T.textDim} py-1`}>{d}</div>)}</div>
                    <div className="grid grid-cols-7 gap-1">{getCalendarDays(quickTimeCalendarViewDate).map(cell => { if (cell.type === 'padding') return <div key={cell.key} className="h-8"></div>; let isSelected = false; if (quickTimeValue) { const selectedDate = quickTimeValue.split('T')[0]; isSelected = selectedDate === cell.dateStr; } return (<button key={cell.key} onClick={() => setQuickTimeDate(cell.dateStr)} className={`h-8 rounded flex items-center justify-center text-sm transition-all ${isSelected ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-400' : `${T.buttonSecondary}`}`}>{cell.dayNum}</button>) })}</div>
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2"><button onClick={() => setQuickTimeTeam(null)} className={`px-4 py-2 rounded ${T.buttonSecondary} transition-colors`}>取消</button><button onClick={handleSaveQuickTime} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors">儲存時間</button></div>
        </div>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal isOpen={deleteConfirm.isOpen} onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })} title={deleteConfirm.title} isDarkMode={isDarkMode}>
        <div className="p-4 space-y-4">
            <div className="bg-red-500/10 p-3 rounded border border-red-500/30 flex gap-3 items-start"><AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} /><p className={`text-sm ${T.textMain} whitespace-pre-line`}>{deleteConfirm.message}</p></div>
            <div className="flex justify-end gap-3 pt-2"><button onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })} className={`px-4 py-2 rounded ${T.buttonSecondary} transition-colors`}>取消</button><button onClick={executeDelete} className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 transition-colors flex items-center gap-2"><Trash2 size={16} />確認刪除</button></div>
        </div>
      </Modal>

      {/* Player Data Management Modal */}
      <Modal isOpen={!!managingPlayer} onClose={() => setManagingPlayer(null)} title={managingPlayer ? `玩家設定: ${managingPlayer.name}` : ''} isDarkMode={isDarkMode}>
        <div className="p-4 space-y-6">
            <div className={`${T.subtleBg} p-4 rounded border ${T.divider}`}>
                <h4 className={`font-bold ${T.textBold} mb-2 flex items-center gap-2`}><Download size={18} />匯出個人資料</h4>
                <p className={`text-sm ${T.textDim} mb-4`}>將此玩家與其所有角色的資料下載為 .json 檔案。可用於備份或分享給該玩家自行保管。</p>
                <button onClick={handleExportPlayer} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-medium flex items-center justify-center gap-2 transition-colors"><Download size={18} />下載備份</button>
            </div>
        </div>
      </Modal>

      {/* Data Management Modal */}
      <Modal isOpen={isDataSettingsOpen} onClose={() => setIsDataSettingsOpen(false)} title="資料管理" size="lg" isDarkMode={isDarkMode}>
        <div className="p-4 space-y-6">
            <div className="bg-blue-500/10 p-3 rounded border border-blue-500/30 text-sm text-blue-500 flex gap-2"><AlertCircle className="shrink-0 text-blue-500" size={18} /><p>這裡是資料的備份與還原中心。建議定期備份，以免資料遺失。您也可以匯出個別玩家資料給公會成員。</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`border ${T.divider} rounded-lg p-4 ${T.subtleBg}`}>
                    <h4 className={`font-bold ${T.textBold} mb-2 flex items-center gap-2`}><Download size={18} />完整備份</h4>
                    <p className={`text-xs ${T.textDim} mb-3`}>下載所有資料 (.json)。</p>
                    <button onClick={handleExportAllData} className={`w-full ${T.buttonSecondary} py-2 rounded flex items-center justify-center gap-2 transition-colors`}><FileJson size={16} />下載備份</button>
                </div>
                <div className={`border ${T.divider} rounded-lg p-4 ${T.subtleBg}`}>
                    <h4 className={`font-bold ${T.textBold} mb-2 flex items-center gap-2`}><Upload size={18} />資料還原</h4>
                    <p className={`text-xs ${T.textDim} mb-3`}>匯入 .json 檔案 (注意：ID重複會覆蓋)。</p>
                    <button onClick={handleImportClick} className={`w-full ${T.buttonSecondary} py-2 rounded flex items-center justify-center gap-2 transition-colors`}><Upload size={16} />選擇檔案</button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                </div>
                
                {/* Class Icons Settings Button in Data Management */}
                <div className={`border border-purple-500/30 rounded-lg p-4 ${T.subtleBg}`}>
                    <h4 className="font-bold text-purple-500 mb-2 flex items-center gap-2"><ImageIcon size={18} />職業圖示設定</h4>
                    <p className={`text-xs ${T.textDim} mb-3`}>自訂各個職業的顯示圖示 (上傳圖片)。所有人都會看到這些變更。</p>
                    <button onClick={() => { setIsDataSettingsOpen(false); setIsIconSettingsOpen(true); }} className="w-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 border border-purple-500/30 py-2 rounded flex items-center justify-center gap-2 transition-colors">設定圖示</button>
                </div>

                {/* NEW: Clear All Teams Button */}
                <div className={`border border-red-500/30 rounded-lg p-4 ${T.subtleBg}`}>
                    <h4 className="font-bold text-red-500 mb-2 flex items-center gap-2"><Trash2 size={18} />清空所有隊伍</h4>
                    <p className={`text-xs ${T.textDim} mb-3`}>一鍵刪除目前所有的預排隊伍 (不影響玩家與分組設定)。此操作無法復原。</p>
                    <button onClick={requestDeleteAllTeams} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 py-2 rounded flex items-center justify-center gap-2 transition-colors"><Trash2 size={16} /> 全部刪除</button>
                </div>
            </div>
        </div>
      </Modal>

      {/* Class Icon Settings Modal */}
  <Modal isOpen={isIconSettingsOpen} onClose={() => setIsIconSettingsOpen(false)} title="職業圖示設定" size="xl" isDarkMode={isDarkMode}>
      <div className="p-4 h-[70vh] flex flex-col">
          <div className={`${T.subtleBg} p-3 rounded border ${T.divider} mb-4 text-sm ${T.textDim} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
              <div>
                  <p>在此為每個職業設定圖示。支援單獨上傳，或使用 <strong className={T.textMain}>批量上傳</strong> (圖片檔名需與職業名稱相同)。</p>
                  <p className="text-yellow-500 text-xs mt-1">注意：圖片將儲存在資料庫中，請使用 50KB 以下的圖片以免影響讀取速度。</p>
              </div>
              <button onClick={() => batchIconInputRef.current?.click()} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm shrink-0 whitespace-nowrap">
                  <Upload size={16} /> 批量自動配對上傳
              </button>
              <input type="file" ref={batchIconInputRef} onChange={handleBatchIconUpload} accept="image/*" multiple className="hidden" />
          </div>

          <div className={`${T.card} p-3 rounded-lg border ${T.divider} mb-4 flex flex-col sm:flex-row gap-3 items-end`}>
              <div className="flex-1 w-full">
                  <label className={`block text-xs ${T.textDim} mb-1`}>新增自訂職業名稱</label>
                  <input type="text" className={`w-full ${T.input} rounded px-3 py-1.5 focus:outline-none focus:border-blue-500`} placeholder="例如: 女武神" value={newClassName} onChange={e => setNewClassName(e.target.value)} />
              </div>
              <div className="w-full sm:w-32">
                  <label className={`block text-xs ${T.textDim} mb-1`}>定位</label>
                  <div className="relative">
                      <select className={`w-full ${T.input} rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 appearance-none`} value={newClassRole} onChange={e => setNewClassRole(e.target.value)}>
                          <option value="DPS">輸出 (DPS)</option>
                          <option value="Support">輔助 (SUP)</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                  </div>
              </div>
              <button onClick={handleAddCustomClass} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1 h-[34px]">
                  <Plus size={16} /> 新增職業
              </button>
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-2">
              {ALL_CLASSES.map(job => {
                  const isCustom = customClasses.some(c => c.name === job.name);
                  return (
                  <div key={job.name} className={`${T.card} rounded-lg p-3 flex flex-col gap-3 relative`}>
                      {isCustom && (
                          <button onClick={() => handleDeleteCustomClass(job.name)} className="absolute top-2 right-2 text-slate-500 hover:text-red-500 bg-slate-500/10 hover:bg-red-500/10 p-1.5 rounded transition-colors" title="刪除自訂職業">
                              <Trash2 size={14} />
                          </button>
                      )}
                      <div className="flex items-center gap-3 pr-6">
                          {/* Preview */}
                          <div className={`w-10 h-10 shrink-0 ${T.bgMain} rounded-lg flex items-center justify-center border ${T.divider} overflow-hidden`}>
                              <ClassIcon job={job.name} role={job.role} icons={classIcons} className="w-full h-full" showTooltip={false} />
                          </div>
                          <div className="min-w-0">
                              <div className={`font-bold ${T.textBold} text-sm truncate`} title={job.name}>{job.name}</div>
                              <div className={`text-[10px] px-1.5 rounded inline-block border ${job.role === 'Support' ? 'border-green-500/50 text-green-500 bg-green-500/10' : 'border-red-500/50 text-red-500 bg-red-500/10'}`}>{job.role}</div>
                          </div>
                      </div>
                      
                      <div className="mt-1">
                          <input 
                              type="text" 
                              className={`w-full ${T.input} rounded px-2 py-1 text-xs border ${T.divider} focus:outline-none focus:border-purple-500`} 
                              placeholder="自訂標籤 (用逗號分隔, 例: 背擊)" 
                              value={localTags[job.name] !== undefined ? localTags[job.name] : (classTags[job.name] || '')} 
                              onChange={(e) => setLocalTags({...localTags, [job.name]: e.target.value})}
                              onBlur={(e) => handleTagUpdate(job.name, e.target.value)} 
                          />
                      </div>
                      
                      <div className="flex gap-2 text-xs mt-auto">
                          {/* File Upload Button */}
                          <label className={`flex-1 ${T.buttonSecondary} py-1.5 rounded cursor-pointer text-center border ${T.divider} transition-colors`}>
                              上傳圖片
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleIconUpload(e, job.name)} />
                          </label>
                          {/* Clear Button */}
                          {classIcons[job.name] && (
                              <button onClick={() => handleIconUrlUpdate(job.name, null)} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-2 rounded flex items-center justify-center" title="清除圖示"><Trash2 size={14}/></button>
                          )}
                      </div>
                  </div>
              )})}
          </div>
          <div className={`pt-4 border-t ${T.divider} flex justify-end shrink-0`}>
              <button onClick={() => setIsIconSettingsOpen(false)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-medium">完成</button>
          </div>
      </div>
  </Modal>

      {/* Join Team Selection Modal */}
      <Modal isOpen={isJoinTeamModalOpen} onClose={() => setIsJoinTeamModalOpen(false)} title={`為 ${joiningCharacter?.name} 選擇操作`} isDarkMode={isDarkMode}>
         <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
             <button onClick={handleCreateTeamWithChar} className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg font-bold flex items-center justify-center gap-2 mb-2"><Plus size={18}/> 建立新隊伍並加入</button>
             <button onClick={handleCreateExternalRun} className={`w-full ${isDarkMode ? 'bg-neutral-700 hover:bg-neutral-600' : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800'} text-white p-3 rounded-lg font-bold flex items-center justify-center gap-2 mb-4 border border-neutral-600`}><UserCheck size={18}/> 新增自行通關 (野團/外部)</button>
             <div className={`text-xs font-bold ${T.textDim} uppercase`}>加入現有隊伍 (點擊加入)</div>
             <div className="space-y-2">{teams.filter(t => !t.members.includes(joiningCharacter?.id)).map(team => { const emptySlots = team.members.filter(m => m === null).length; if (emptySlots === 0) return null; return (<button key={team.id} onClick={() => handleJoinTeam(team.id)} className={`w-full text-left ${T.bgMain} hover:${T.subtleBg} border ${T.divider} p-3 rounded flex justify-between items-center group`}><div><div className={`${T.textBold}`}>{team.name}</div><div className={`text-xs ${T.textDim}`}>{formatDateTime(team.time)}</div></div><div className={`text-xs ${T.card} ${T.textDim} px-2 py-1 rounded`}>剩餘 {emptySlots} 空位</div></button>) })}</div>
         </div>
      </Modal>

      {/* External Run Edit Modal */}
      <Modal isOpen={isExternalRunModalOpen} onClose={() => setIsExternalRunModalOpen(false)} title={editingExternalRunData?.isNew ? "新增自行通關項目" : "編輯自行通關紀錄"} size="sm" isDarkMode={isDarkMode}>
          <div className="p-4 space-y-4">
              <div>
                  <label className={`block text-sm ${T.textDim} mb-1`}>選擇副本/分組 (標籤)</label>
                  <div className="relative">
                      <select 
                        className={`w-full ${T.input} rounded px-3 py-2 focus:outline-none focus:border-blue-500 appearance-none`}
                        value={editingExternalRunData?.groupId || ''}
                        onChange={e => setEditingExternalRunData({...editingExternalRunData, groupId: e.target.value})}
                      >
                          <option value="">(無標籤)</option>
                          {groups.map(g => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3 text-slate-500 pointer-events-none" size={16} />
                  </div>
              </div>
              <div>
                  <label className={`block text-sm ${T.textDim} mb-1`}>顯示名稱 / 備註</label>
                  <input type="text" className={`w-full ${T.input} rounded px-3 py-2 focus:outline-none focus:border-blue-500`} placeholder={editingExternalRunData?.groupId ? (groups.find(g => g.id === editingExternalRunData.groupId)?.name || "自訂名稱") : "例如: 困牛 1-2, 野團..."} value={editingExternalRunData?.name || ''} onChange={e => setEditingExternalRunData({...editingExternalRunData, name: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                  {!editingExternalRunData?.isNew && (
                      <button onClick={handleDeleteExternalRun} className="flex-1 bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/30 py-2 rounded transition-colors flex items-center justify-center gap-2"><Trash2 size={16}/> 刪除</button>
                  )}
                  <button onClick={handleSaveExternalRun} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-medium transition-colors flex items-center justify-center gap-2"><Save size={16}/> {editingExternalRunData?.isNew ? "新增" : "儲存"}</button>
              </div>
          </div>
      </Modal>

      {/* Add/Edit Team Modal (優化橫向排版) */}
      <Modal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} title={editingTeamId ? "編輯預排隊伍" : "新增預排隊伍"} size="lg" isDarkMode={isDarkMode}>
        <div className="p-4 flex flex-col h-full max-h-[85vh]">
          <div className="flex flex-col md:flex-row gap-6 overflow-y-auto pb-2 pr-1 custom-scrollbar">
            
            {/* 左側：基本設定 */}
            <div className="flex-1 space-y-4">
              <div><label className={`block text-sm ${T.textDim} mb-1`}>副本名稱 / 標題</label><input type="text" className={`w-full ${T.input} rounded px-3 py-2 focus:outline-none focus:border-blue-500`} placeholder="例如: 困牛 G1-G2" value={teamFormData.name} onChange={e => setTeamFormData({...teamFormData, name: e.target.value})} /></div>
              <div>
                  <label className={`block text-sm ${T.textDim} mb-1`}>所屬分組</label>
                  <div className="relative">
                      <select 
                        className={`w-full ${T.input} rounded px-3 py-2 focus:outline-none focus:border-blue-500 appearance-none`} 
                        value={teamFormData.groupId} 
                        onChange={e => {
                            const newGroupId = e.target.value;
                            const group = groups.find(g => g.id === newGroupId);
                            let newGold = 0;
                            if (group) {
                                if (teamFormData.difficulty === 'hard') newGold = group.goldHard || 0;
                                else if (teamFormData.difficulty === 'normal') newGold = group.goldNormal || 0;
                            }
                            setTeamFormData({
                                ...teamFormData, 
                                groupId: newGroupId,
                                gold: newGold,
                            });
                        }}
                      >
                          <option value="">(未分類)</option>
                          {groups.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3 text-slate-500 pointer-events-none" size={16} />
                  </div>
              </div>
              
              <div className="flex gap-4">
                  <div className="flex-1">
                      <label className={`block text-sm ${T.textDim} mb-1`}>難度</label>
                      <div className="flex gap-1">
                          <button onClick={() => {
                              const g = groups.find(x => x.id === teamFormData.groupId);
                              setTeamFormData({...teamFormData, difficulty: 'hard', gold: g ? (g.goldHard || 0) : teamFormData.gold});
                          }} className={`flex-1 py-2 rounded border text-xs transition-colors ${teamFormData.difficulty === 'hard' ? 'bg-red-600 border-red-500 text-white' : `${T.buttonSecondary} opacity-70 hover:opacity-100`}`}>困難</button>
                          
                          <button onClick={() => {
                              const g = groups.find(x => x.id === teamFormData.groupId);
                              setTeamFormData({...teamFormData, difficulty: 'normal', gold: g ? (g.goldNormal || 0) : teamFormData.gold});
                          }} className={`flex-1 py-2 rounded border text-xs transition-colors ${teamFormData.difficulty === 'normal' ? 'bg-green-600 border-green-500 text-white' : `${T.buttonSecondary} opacity-70 hover:opacity-100`}`}>普通</button>
                          
                          <button onClick={() => setTeamFormData({...teamFormData, difficulty: ''})} className={`w-8 py-2 rounded border text-xs transition-colors ${!teamFormData.difficulty ? 'bg-slate-500 border-slate-500 text-white' : `${T.buttonSecondary}`}`} title="無/繼承">無</button>
                      </div>
                  </div>
                  <div className="flex-1">
                      <label className={`block text-sm ${T.textDim} mb-1`}>金幣</label>
                      <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-yellow-500 text-xs"><Coins size={14} /></span>
                          <input type="number" className={`w-full ${T.input} rounded pl-8 pr-2 py-2 focus:outline-none focus:border-blue-500 text-sm`} placeholder="0" value={teamFormData.gold} onChange={e => setTeamFormData({...teamFormData, gold: e.target.value})} />
                      </div>
                  </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1"><label className={`block text-sm ${T.textDim} mb-1`}>最低裝等要求</label><input type="number" className={`w-full ${T.input} rounded px-3 py-2 focus:outline-none focus:border-blue-500`} placeholder="1600" value={teamFormData.minIlvl} onChange={e => setTeamFormData({...teamFormData, minIlvl: e.target.value})} /></div>
                 <div className="flex-1"><label className={`block text-sm ${T.textDim} mb-1`}>隊伍人數</label><div className="flex gap-1"><button className={`flex-1 py-2 rounded border transition-colors ${Number(teamFormData.size) === 4 ? 'bg-blue-600 border-blue-500 text-white' : `${T.buttonSecondary}`}`} onClick={() => setTeamFormData({...teamFormData, size: 4})}>4人</button><button className={`flex-1 py-2 rounded border transition-colors ${Number(teamFormData.size) === 8 ? 'bg-blue-600 border-blue-500 text-white' : `${T.buttonSecondary}`}`} onClick={() => setTeamFormData({...teamFormData, size: 8})}>8人</button></div></div>
              </div>
            </div>

            {/* 右側：時間設定 */}
            <div className="flex-1 flex flex-col">
              <label className={`block text-sm ${T.textDim} mb-2`}>出團時間</label>
              <div className={`${T.bgMain} border ${T.divider} rounded p-3 flex-1 flex flex-col`}>
                  <div className={`flex justify-between items-center mb-4 border-b ${T.divider} pb-3`}><div className="flex items-center gap-2"><Clock size={16} className="text-blue-500" /><span className={`${T.textBold} text-sm`}>{teamCalendarViewDate.getFullYear()}/{teamCalendarViewDate.getMonth() + 1}/{teamCalendarViewDate.getDate()}</span></div><input type="time" className={`${T.input} rounded px-2 py-1 text-sm [color-scheme:dark] focus:border-blue-500 outline-none`} value={teamFormData.time ? teamFormData.time.split('T')[1] : ''} onChange={e => setTeamTime(e.target.value)} /></div>
                  <div className="flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-2 px-2"><button onClick={() => setTeamCalendarViewDate(new Date(teamCalendarViewDate.getFullYear(), teamCalendarViewDate.getMonth() - 1, 1))} className={`p-1 hover:${T.textMain} ${T.textDim}`}><ChevronLeft size={16}/></button><span className={`text-sm font-bold ${T.textDim}`}>{teamCalendarViewDate.getFullYear()}年 {teamCalendarViewDate.getMonth() + 1}月</span><button onClick={() => setTeamCalendarViewDate(new Date(teamCalendarViewDate.getFullYear(), teamCalendarViewDate.getMonth() + 1, 1))} className={`p-1 hover:${T.textMain} ${T.textDim}`}><ChevronRight size={16}/></button></div>
                      <div className="grid grid-cols-7 text-center mb-1">{['日', '一', '二', '三', '四', '五', '六'].map(d => <div key={d} className={`text-[10px] ${T.textDim} py-1`}>{d}</div>)}</div>
                      <div className="grid grid-cols-7 gap-1 flex-1">{getCalendarDays(teamCalendarViewDate).map(cell => { if (cell.type === 'padding') return <div key={cell.key} className="min-h-[2rem]"></div>; let isSelected = false; if (teamFormData.time) { const selectedDate = teamFormData.time.split('T')[0]; isSelected = selectedDate === cell.dateStr; } return (<button key={cell.key} onClick={() => setTeamDate(cell.dateStr)} className={`min-h-[2rem] rounded flex items-center justify-center text-sm transition-all ${isSelected ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-400' : `${T.buttonSecondary}`}`}>{cell.dayNum}</button>) })}</div>
                  </div>
              </div>
              {editingTeamId && (<p className="text-xs text-yellow-500 mt-3 flex items-center gap-1"><AlertTriangle size={14}/> 注意：減少人數將會移除多餘的隊員。</p>)}
            </div>

          </div>

          <div className={`pt-4 border-t ${T.divider} mt-2 shrink-0`}>
            <button onClick={handleSaveTeam} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-bold flex justify-center items-center gap-2 shadow-lg transition-transform active:scale-95"><Save size={18} />{editingTeamId ? "儲存變更" : "建立隊伍"}</button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Player Modal */}
      <Modal isOpen={isPlayerModalOpen} onClose={() => setIsPlayerModalOpen(false)} title={editingPlayerId ? "編輯玩家" : "新增玩家 (帳號/暱稱)"} isDarkMode={isDarkMode}>
        <div className="p-4 space-y-4">
          <div><label className={`block text-sm ${T.textDim} mb-1`}>玩家名稱</label><input type="text" className={`w-full ${T.input} rounded px-3 py-2 focus:outline-none focus:border-green-500`} placeholder="例如: 小明, 家豪, 淑芬..." value={playerFormData.name} onChange={e => setPlayerFormData({...playerFormData, name: e.target.value})} autoFocus /></div>
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className={`block text-sm ${T.textDim} mb-1`}>文字顏色</label>
                  <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-500">
                        <input type="color" className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer" value={playerFormData.color || '#ffffff'} onChange={e => setPlayerFormData({...playerFormData, color: e.target.value})} />
                      </div>
                      {playerFormData.color && playerFormData.color !== '#ffffff' && (
                          <button onClick={() => setPlayerFormData({...playerFormData, color: '#ffffff'})} className={`text-xs ${T.buttonSecondary} px-2 py-1 rounded`}>重置</button>
                      )}
                  </div>
              </div>
              <div>
                  <label className={`block text-sm ${T.textDim} mb-1`}>背景顏色 (可選)</label>
                  <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-500">
                        {/* Using transparent placeholder if empty, but input color needs value */}
                        <input type="color" className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer" value={playerFormData.bgColor || '#000000'} onChange={e => setPlayerFormData({...playerFormData, bgColor: e.target.value})} />
                      </div>
                      {playerFormData.bgColor && (
                          <button onClick={() => setPlayerFormData({...playerFormData, bgColor: ''})} className={`text-xs ${T.buttonSecondary} px-2 py-1 rounded`}>清除</button>
                      )}
                  </div>
              </div>
          </div>
          <p className={`text-xs ${T.textDim}`}>預覽: <span className="px-2 py-0.5 rounded font-bold" style={{ color: playerFormData.color, backgroundColor: playerFormData.bgColor }}>{playerFormData.name || '玩家名稱'}</span></p>
          <button onClick={handleSavePlayer} className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded font-medium mt-2">{editingPlayerId ? "儲存變更" : "新增"}</button>
        </div>
      </Modal>

      {/* Add/Edit Character Modal */}
  <Modal isOpen={isCharModalOpen} onClose={() => setIsCharModalOpen(false)} title={editingCharId ? "編輯角色" : "新增角色"} isDarkMode={isDarkMode}>
    <div className="space-y-4 p-4">
      <div><label className={`block text-sm ${T.textDim} mb-1`}>角色名稱 (可選)</label><input type="text" className={`w-full ${T.input} rounded px-3 py-2 focus:outline-none focus:border-green-500`} placeholder="若留空，將預設為「玩家暱稱 - 職業」" value={charFormData.name} onChange={e => setCharFormData({...charFormData, name: e.target.value})} /></div>
      <div><label className={`block text-sm ${T.textDim} mb-1`}>職業</label><div className="relative"><select className={`w-full ${T.input} rounded px-3 py-2 focus:outline-none focus:border-green-500 appearance-none`} value={charFormData.job} onChange={e => setCharFormData({...charFormData, job: e.target.value})}>{ALL_CLASSES.map(j => (<option key={j.name} value={j.name}>{j.name}</option>))}</select><ChevronDown className="absolute right-3 top-3 text-slate-500 pointer-events-none" size={16} /></div></div>
      <div><label className={`block text-sm ${T.textDim} mb-1`}>裝等 (Item Level)</label><input type="number" className={`w-full ${T.input} rounded px-3 py-2 focus:outline-none focus:border-green-500`} value={charFormData.ilvl} onChange={e => setCharFormData({...charFormData, ilvl: e.target.value})} /></div>
      <button onClick={handleSaveCharacter} className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded font-medium mt-2 flex items-center justify-center gap-2"><Save size={18} />{editingCharId ? "儲存變更" : "新增角色"}</button>
    </div>
  </Modal>

      {/* NEW: Character Batch Manage Modal */}
      <Modal isOpen={isCharManageModalOpen} onClose={() => setIsCharManageModalOpen(false)} title={`管理 ${charManageTarget?.character?.name} 的隊伍狀態`} size="sm" isDarkMode={isDarkMode}>
          <div className="p-4 space-y-4">
              <div className={`p-3 rounded border ${T.divider} ${T.subtleBg} text-sm ${T.textDim}`}>
                  請勾選您要執行的清理動作。此操作無法復原。
              </div>
              <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer hover:border-amber-500 transition-colors ${charManageOptions.removeExternal ? 'bg-amber-500/10 border-amber-500' : `${T.bgMain} ${T.divider}`}`}>
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-600 text-amber-600 focus:ring-amber-500" checked={charManageOptions.removeExternal} onChange={e => setCharManageOptions({...charManageOptions, removeExternal: e.target.checked})} />
                      <div>
                          <div className={`font-medium ${T.textMain}`}>移除所有自行通關紀錄</div>
                          <div className={`text-xs ${T.textDim}`}>刪除此角色的所有「自行通關 (External Runs)」項目</div>
                      </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer hover:border-amber-500 transition-colors ${charManageOptions.removeTeams ? 'bg-amber-500/10 border-amber-500' : `${T.bgMain} ${T.divider}`}`}>
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-600 text-amber-600 focus:ring-amber-500" checked={charManageOptions.removeTeams} onChange={e => setCharManageOptions({...charManageOptions, removeTeams: e.target.checked})} />
                      <div>
                          <div className={`font-medium ${T.textMain}`}>退出所有預排隊伍</div>
                          <div className={`text-xs ${T.textDim}`}>將此角色從所有已加入的隊伍中移除 (變為空位)</div>
                      </div>
                  </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setIsCharManageModalOpen(false)} className={`px-4 py-2 rounded ${T.buttonSecondary} transition-colors`}>取消</button>
                  <button onClick={handleCharBatchAction} className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20 transition-colors flex items-center gap-2" disabled={!charManageOptions.removeExternal && !charManageOptions.removeTeams}><CheckCircle size={16} /> 執行清理</button>
              </div>
          </div>
      </Modal>

      {/* NEW: Player Batch Manage Modal */}
      <Modal isOpen={isPlayerBatchModalOpen} onClose={() => setIsPlayerBatchModalOpen(false)} title={`批量管理 ${playerBatchTarget?.name}`} size="sm" isDarkMode={isDarkMode}>
          <div className="p-4 space-y-4">
              <div className={`p-3 rounded border ${T.divider} ${T.subtleBg} text-sm ${T.textDim}`}>
                  此操作將套用於 <span className={T.textBold}>{playerBatchTarget?.name}</span> 的 <span className="text-amber-500 font-bold">所有角色</span>。請謹慎操作。
              </div>
              <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer hover:border-red-500 transition-colors ${playerBatchOptions.removeExternal ? 'bg-red-500/10 border-red-500' : `${T.bgMain} ${T.divider}`}`}>
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-600 text-red-600 focus:ring-red-500" checked={playerBatchOptions.removeExternal} onChange={e => setPlayerBatchOptions({ removeExternal: e.target.checked, resetExternal: false })} />
                      <div>
                          <div className={`font-medium ${T.textMain}`}>移除所有自行通關紀錄</div>
                          <div className={`text-xs ${T.textDim}`}>刪除該玩家所有角色的所有自行通關項目</div>
                      </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer hover:border-blue-500 transition-colors ${playerBatchOptions.resetExternal ? 'bg-blue-500/10 border-blue-500' : `${T.bgMain} ${T.divider}`} ${playerBatchOptions.removeExternal ? 'opacity-50 pointer-events-none' : ''}`}>
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-600 text-blue-600 focus:ring-blue-500" checked={playerBatchOptions.resetExternal} onChange={e => setPlayerBatchOptions({ removeExternal: false, resetExternal: e.target.checked })} disabled={playerBatchOptions.removeExternal} />
                      <div>
                          <div className={`font-medium ${T.textMain}`}>重置自行通關完成狀態</div>
                          <div className={`text-xs ${T.textDim}`}>將所有自行通關項目標記為「未完成」(適用於週常重置)</div>
                      </div>
                  </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setIsPlayerBatchModalOpen(false)} className={`px-4 py-2 rounded ${T.buttonSecondary} transition-colors`}>取消</button>
                  <button onClick={handlePlayerBatchAction} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-colors flex items-center gap-2" disabled={!playerBatchOptions.removeExternal && !playerBatchOptions.resetExternal}><CheckCircle size={16} /> 確認執行</button>
              </div>
          </div>
      </Modal>

    </div>
  );
}