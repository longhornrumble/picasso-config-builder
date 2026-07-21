/**
 * Side-anchored drawer (right overlay). Radix Dialog positioned against the
 * right edge with a slide-in. Hosts the editor forms. Design handoff
 * §"Editor drawers": 440px (Forms/Showcase 580px), scrim rgba(15,23,42,.35),
 * header (icon, title, subtitle, close), scrollable body, footer.
 *
 * The unsaved-changes guard is the caller's responsibility (it owns the draft);
 * pass `onRequestClose` to intercept close attempts (X / scrim / Esc).
 */

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  /** Called on any close attempt (X, scrim, Esc). Caller decides whether to close. */
  onRequestClose: () => void;
  width?: number;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Drawer({ open, onRequestClose, width = 440, icon, title, subtitle, children, footer }: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onRequestClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="cb-anim-fade fixed inset-0 z-[110]"
          style={{ background: 'rgba(15,23,42,.35)' }}
        />
        <Dialog.Content
          onEscapeKeyDown={(e) => {
            // Let the caller's guard decide; prevent Radix auto-close.
            e.preventDefault();
            onRequestClose();
          }}
          onInteractOutside={(e) => {
            e.preventDefault();
            onRequestClose();
          }}
          className="cb-scope cb-anim-drawer fixed right-0 top-0 z-[111] flex h-full flex-col bg-white"
          style={{ width: Math.min(width, typeof window !== 'undefined' ? window.innerWidth : width), maxWidth: '96vw', boxShadow: '-18px 0 48px rgba(2,6,23,.22)' }}
        >
          {/* Header */}
          <div className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: '#E2E8F0' }}>
            {icon && (
              <span
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-tile"
                style={{ background: '#E9F7EF', color: '#1C7A45' }}
              >
                {icon}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <Dialog.Title className="font-bold" style={{ fontSize: '14px', color: '#0F172A' }}>
                {title}
              </Dialog.Title>
              {subtitle && (
                <Dialog.Description className="truncate" style={{ fontSize: '11px', color: '#94A3B8' }}>
                  {subtitle}
                </Dialog.Description>
              )}
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onRequestClose}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="cb-scroll flex-1 px-5 py-4">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="border-t px-5 py-3" style={{ borderColor: '#E2E8F0' }}>
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
