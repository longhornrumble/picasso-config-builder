/**
 * Generic command palette (⌘K / ⌘/ pattern). Top-anchored 600px dialog with a
 * search input, filtered rows, arrow-key navigation, and Enter-to-select.
 * Shared by the tenant switcher and global search. Design handoff §Overlays.
 *
 * The interactive body lives in PaletteInner, which Radix mounts fresh on each
 * open (Portal unmounts when closed) — so query/highlight state resets naturally
 * without a reset effect. The active row is clamped at render time.
 */

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Search } from 'lucide-react';

export interface PaletteItem {
  id: string;
  /** Free-text used for filtering (name + key + id, etc.). */
  haystack: string;
  render: React.ReactNode;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  placeholder: string;
  items: PaletteItem[];
  onSelect: (id: string) => void;
  /** Footer keycap hints (right-aligned). */
  footer?: React.ReactNode;
  emptyLabel?: string;
}

export function CommandPalette(props: CommandPaletteProps) {
  const { open, onClose } = props;
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="cb-anim-fade fixed inset-0 z-[100]"
          style={{ background: 'rgba(15,23,42,.35)' }}
        />
        <Dialog.Content
          className="cb-scope cb-anim-pop fixed left-1/2 top-[14vh] z-[101] w-[600px] max-w-[92vw] -translate-x-1/2 overflow-hidden rounded-card bg-white"
          style={{ boxShadow: '0 20px 48px rgba(2,6,23,.18)' }}
        >
          <Dialog.Title className="sr-only">{props.placeholder}</Dialog.Title>
          <PaletteInner {...props} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PaletteInner({ onClose, placeholder, items, onSelect, footer, emptyLabel = 'No results' }: CommandPaletteProps) {
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(0);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.haystack.toLowerCase().includes(q));
  }, [items, query]);

  // Clamp at render time so a shrinking list never points past the end.
  const activeIdx = filtered.length ? Math.min(active, filtered.length - 1) : 0;

  const choose = (id: string) => {
    onSelect(id);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(Math.min(activeIdx + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(Math.max(activeIdx - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filtered[activeIdx];
      if (item) choose(item.id);
    }
  };

  return (
    <div onKeyDown={onKeyDown}>
      {/* Search */}
      <div className="flex items-center gap-2 border-b px-4" style={{ borderColor: '#E2E8F0' }}>
        <Search size={16} className="text-slate-400" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent py-3.5 outline-none"
          style={{ fontSize: '13.5px', color: '#0F172A' }}
        />
      </div>

      {/* Results */}
      <div className="cb-scroll max-h-[52vh] py-1.5">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center" style={{ fontSize: '12px', color: '#94A3B8' }}>
            {emptyLabel}
          </div>
        ) : (
          filtered.map((it, i) => (
            <button
              key={it.id}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(it.id)}
              className="flex w-full items-center gap-3 px-4 py-2 text-left"
              style={{ background: i === activeIdx ? '#F7FDFA' : 'transparent' }}
            >
              {it.render}
            </button>
          ))
        )}
      </div>

      {footer && (
        <div
          className="flex items-center justify-end gap-3 border-t px-4 py-2"
          style={{ borderColor: '#E2E8F0', fontSize: '10.5px', color: '#94A3B8' }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
