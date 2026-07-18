import { describe, expect, it } from 'vitest';
import { migrateStore } from './store';

describe('migrateStore', () => {
  it('adds completedAt for completed legacy tasks', () => {
    const legacyStore = {
      schemaVersion: 1,
      theme: 'dark',
      examDates: { PSPO: '2026-09-15', PMP: '2027-01-15' },
      tasks: {
        '2026-07-18': [
          { id: 'done-task', text: 'Done', cert: 'PSPO', done: true, resourceId: null },
          { id: 'todo-task', text: 'Todo', cert: 'PMP', done: false, resourceId: null },
        ],
      },
      studyLog: {},
      mockExams: [],
      errorLog: [],
      resources: [],
      calFilter: 'all',
      calViewMonth: '2026-07-17',
      plannerDate: '2026-07-17',
    };
    const store = migrateStore(legacyStore as unknown as Parameters<typeof migrateStore>[0]);

    expect(store.schemaVersion).toBe(2);
    expect(store.tasks['2026-07-18'][0].completedAt).toContain('2026-07-18');
    expect(store.tasks['2026-07-18'][1].completedAt).toBeNull();
    expect(store.resources.length).toBeGreaterThan(0);
  });
});
