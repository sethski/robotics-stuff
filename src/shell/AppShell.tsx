import type { ReactNode } from 'react';
import { useDesign } from '../state/DesignContext';
import type { AppMode } from '../design/types';
import styles from './AppShell.module.css';

const MODES: Array<{ id: AppMode; label: string }> = [
  { id: 'build', label: 'Build' },
  { id: 'code', label: 'Code' },
  { id: 'race', label: 'Race' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { mode, setMode } = useDesign();

  return (
    <div className={styles.shell}>
      <nav className={styles.tabBar} aria-label="App mode">
        {MODES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={mode === id ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            aria-current={mode === id ? 'page' : undefined}
            onClick={() => setMode(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <main className={styles.body}>{children}</main>
    </div>
  );
}
