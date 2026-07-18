export type Certification = 'PSPO' | 'PMP';
export type ResourceCertification = Certification | 'Both';
export type ResourceType = 'doc' | 'video' | 'course';

export type Task = {
  id: string;
  text: string;
  cert: Certification;
  done: boolean;
  completedAt: string | null;
  resourceId: string | null;
};

export type StudyLog = {
  hours: number;
  note: string;
};

export type MockExam = {
  id: string;
  date: string;
  cert: Certification;
  score: number;
  domains: Record<string, number>;
};

export type ErrorLog = {
  id: string;
  date: string;
  cert: Certification;
  domain: string;
  question: string;
  root: string;
  action: string;
};

export type Resource = {
  id: string;
  name: string;
  cert: ResourceCertification;
  type: ResourceType;
  done: boolean;
  link: string;
};

export type MissionStore = {
  schemaVersion: number;
  theme: 'dark' | 'light';
  examDates: Record<Certification, string>;
  tasks: Record<string, Task[]>;
  studyLog: Record<string, StudyLog>;
  mockExams: MockExam[];
  errorLog: ErrorLog[];
  resources: Resource[];
  calFilter: 'all' | Certification;
  calViewMonth: string;
  plannerDate: string;
};

export const LS_KEY = 'missionControl_pmp_pspo_v1';
export const SCHEMA_VERSION = 2;
export const START_DATE = new Date(2026, 6, 17);
export const END_DATE = new Date(2027, 0, 15);

const PSPO_POOL = [
  'Đọc Scrum Guide - phần {n}',
  'Xem video Andrew Ramdayal - bài {n}',
  'Làm 20 câu hỏi trắc nghiệm PSPO',
  'Ôn tập Flashcards PSPO',
  'Học Scrum.org Learning Path - module {n}',
  'Xem David McLachlan - bài {n}',
  'Tổng hợp ghi chú Product Backlog Management',
  'Luyện đề mini-test PSPO (10 câu)',
];

const PMP_POOL = [
  'Đọc PMBOK 7 - chương {n}',
  'Đọc Agile Practice Guide - phần {n}',
  'Ôn ECO Domain: People',
  'Ôn ECO Domain: Process',
  'Ôn ECO Domain: Business Environment',
  'Làm 20 câu hỏi trắc nghiệm PMP',
  'Xem video PMP - bài {n}',
  'Luyện đề mini-test PMP (10 câu)',
];

type Listener = (store: MissionStore) => void;

const listeners = new Set<Listener>();
let currentUserId: string | null = null;

function storageKey() {
  return currentUserId ? `${LS_KEY}_user_${currentUserId}` : LS_KEY;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function fmtISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISO(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function completedAtForDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toISOString();
}

export function makeTask(
  text: string,
  cert: Certification,
  done = false,
  resourceId: string | null = null,
): Task {
  return {
    id: uid(),
    text,
    cert,
    done,
    completedAt: done ? new Date().toISOString() : null,
    resourceId,
  };
}

export function defaultStore(): MissionStore {
  return {
    schemaVersion: SCHEMA_VERSION,
    theme: 'dark',
    examDates: { PSPO: fmtISO(new Date(2026, 8, 15)), PMP: fmtISO(new Date(2027, 0, 15)) },
    tasks: {},
    studyLog: {},
    mockExams: [],
    errorLog: [],
    resources: [],
    calFilter: 'all',
    calViewMonth: fmtISO(START_DATE),
    plannerDate: fmtISO(START_DATE),
  };
}

function seedDefaultTasks(store: MissionStore) {
  const pspoExam = parseISO(store.examDates.PSPO);
  let d = new Date(START_DATE);
  let dayIdx = 0;
  while (d <= END_DATE) {
    const iso = fmtISO(d);
    const dayTasks: Task[] = [];
    if (dayIdx === 0) {
      dayTasks.push(makeTask('Scrum Guide Chapter 1', 'PSPO'));
      dayTasks.push(makeTask('AR Section 4', 'PMP'));
      dayTasks.push(makeTask('20 Scrum Questions', 'PSPO'));
      dayTasks.push(makeTask('Review Flashcards', 'PSPO'));
    } else if (d <= pspoExam) {
      for (let i = 0; i < 3; i++) {
        const t = PSPO_POOL[(dayIdx * 3 + i) % PSPO_POOL.length].replace(
          '{n}',
          String(Math.ceil((dayIdx + i + 1) / 3)),
        );
        dayTasks.push(makeTask(t, 'PSPO'));
      }
      if (d.getDay() === 0 || d.getDay() === 6) {
        const t = PMP_POOL[dayIdx % PMP_POOL.length].replace(
          '{n}',
          String(Math.ceil((dayIdx + 1) / 4)),
        );
        dayTasks.push(makeTask(t, 'PMP'));
      }
    } else if (d.getTime() === pspoExam.getTime()) {
      dayTasks.push(makeTask('🎯 PSPO EXAM DAY — Good luck!', 'PSPO'));
    } else {
      for (let i = 0; i < 3; i++) {
        const t = PMP_POOL[(dayIdx * 3 + i) % PMP_POOL.length].replace(
          '{n}',
          String(Math.ceil((dayIdx + i + 1) / 3)),
        );
        dayTasks.push(makeTask(t, 'PMP'));
      }
    }
    store.tasks[iso] = dayTasks;
    d = addDays(d, 1);
    dayIdx++;
  }

  const pmpIso = fmtISO(parseISO(store.examDates.PMP));
  if (store.tasks[pmpIso]) {
    store.tasks[pmpIso].push(makeTask('🎯 PMP EXAM DAY — Good luck!', 'PMP'));
  }
}

function seedDefaultResources(store: MissionStore) {
  store.resources = [
    { id: uid(), name: 'Scrum Guide (2020)', cert: 'PSPO', type: 'doc', done: false, link: 'https://scrumguides.org' },
    { id: uid(), name: 'PMBOK Guide 7th Edition', cert: 'PMP', type: 'doc', done: false, link: '' },
    { id: uid(), name: 'Agile Practice Guide', cert: 'PMP', type: 'doc', done: false, link: '' },
    { id: uid(), name: 'ECO - Exam Content Outline', cert: 'PMP', type: 'doc', done: false, link: '' },
    { id: uid(), name: 'Andrew Ramdayal - PMP Course', cert: 'PMP', type: 'video', done: false, link: '' },
    { id: uid(), name: 'David McLachlan - PSPO/Agile', cert: 'PSPO', type: 'video', done: false, link: '' },
    { id: uid(), name: 'Scrum.org Learning Path', cert: 'PSPO', type: 'course', done: false, link: 'https://www.scrum.org/learning-series' },
  ];
}

function normalizeStore(input: Partial<MissionStore>): MissionStore {
  const base = defaultStore();
  return {
    ...base,
    ...input,
    schemaVersion: input.schemaVersion ?? 1,
    examDates: { ...base.examDates, ...(input.examDates ?? {}) },
    tasks: input.tasks ?? {},
    studyLog: input.studyLog ?? {},
    mockExams: input.mockExams ?? [],
    errorLog: input.errorLog ?? [],
    resources: input.resources ?? [],
  };
}

export function migrateStore(input: Partial<MissionStore>): MissionStore {
  const store = normalizeStore(input);

  if (store.schemaVersion < 2) {
    for (const [iso, tasks] of Object.entries(store.tasks)) {
      tasks.forEach((task) => {
        if (!Object.prototype.hasOwnProperty.call(task, 'completedAt')) {
          task.completedAt = task.done ? completedAtForDate(iso) : null;
        }
        task.resourceId = task.resourceId ?? null;
      });
    }
    store.schemaVersion = 2;
  }

  if (Object.keys(store.tasks).length === 0) seedDefaultTasks(store);
  if (!store.resources || store.resources.length === 0) seedDefaultResources(store);

  store.schemaVersion = SCHEMA_VERSION;
  return store;
}

export function loadMissionStore(): MissionStore {
  if (typeof window === 'undefined') return defaultStore();

  const key = storageKey();
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    const seeded = defaultStore();
    seedDefaultTasks(seeded);
    seedDefaultResources(seeded);
    saveMissionStore(seeded);
    return seeded;
  }

  try {
    const migrated = migrateStore(JSON.parse(raw));
    saveMissionStore(migrated);
    return migrated;
  } catch (error) {
    const backupKey = `${key}_backup_${Date.now()}`;
    window.localStorage.setItem(backupKey, raw);
    const seeded = defaultStore();
    seedDefaultTasks(seeded);
    seedDefaultResources(seeded);
    saveMissionStore(seeded);
    console.warn(`Mission Control store parse failed. Backed up corrupt data to ${backupKey}.`, error);
    return seeded;
  }
}

export function saveMissionStore(store: MissionStore) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey(), JSON.stringify({ ...store, schemaVersion: SCHEMA_VERSION }));
  notify(store);
}

export function clearMissionStore() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(storageKey());
}

export function updateMissionStore(mutator: (store: MissionStore) => void, store: MissionStore) {
  mutator(store);
  saveMissionStore(store);
  return store;
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notify(store: MissionStore) {
  listeners.forEach((listener) => listener(store));
}

export function setStoreUser(userId: string | null) {
  currentUserId = userId;
}

export function getStoreUser() {
  return currentUserId;
}
