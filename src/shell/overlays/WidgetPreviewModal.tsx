/**
 * Widget preview modal — a 340px card rendered from the live config values
 * (brand color, chat title, welcome message, a few CTAs). A static
 * approximation of the widget, not an embed. Design handoff §Overlays
 * "Widget preview modal".
 */

import * as Dialog from '@radix-ui/react-dialog';
import { X, ArrowRight, Send } from 'lucide-react';
import { useConfigStore } from '@/store';
import { useShellStore } from '../shellStore';

export function WidgetPreviewModal() {
  const open = useShellStore((s) => s.overlays.previewModal);
  const closeOverlay = useShellStore((s) => s.closeOverlay);
  const cfg = useConfigStore((s) => s.config.baseConfig);
  const ctas = useConfigStore((s) => s.ctas.ctas);

  const brand = cfg?.branding?.primary_color || '#50C878';
  const title = cfg?.chat_title || 'Chat';
  const welcome = cfg?.welcome_message || 'Hi there 👋 — how can we help?';
  const ctaList = Object.values(ctas).filter((c) => c.ai_available).slice(0, 4);
  const shownCtas = ctaList.length > 0 ? ctaList : Object.values(ctas).slice(0, 4);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && closeOverlay('previewModal')}>
      <Dialog.Portal>
        <Dialog.Overlay className="cb-anim-fade fixed inset-0 z-[100]" style={{ background: 'rgba(15,23,42,.45)' }} />
        <Dialog.Content
          className="cb-anim-pop fixed left-1/2 top-1/2 z-[101] w-[340px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[16px]"
          style={{ background: '#FBF8F3', borderTop: `4px solid ${brand}`, boxShadow: '0 24px 64px rgba(2,6,23,.45)' }}
        >
          <Dialog.Title className="sr-only">Widget preview</Dialog.Title>
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3.5">
            <span className="font-bold uppercase" style={{ color: brand, fontSize: '11px', letterSpacing: '.12em' }}>{title}</span>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close" className="text-[#A8A090] hover:text-[#0F172A]"><X size={15} /></button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="px-4 py-4">
            <div className="mb-1 font-semibold" style={{ fontSize: '13px', color: '#0F172A' }}>Hi there 👋</div>
            <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>{welcome}</p>

            <div className="mt-4 overflow-hidden rounded-[12px]" style={{ background: '#FDFBF8', border: '1px solid #EDE6D8' }}>
              {shownCtas.length === 0 ? (
                <div className="px-3 py-3 text-center" style={{ fontSize: '11px', color: '#A8A090' }}>No CTAs configured.</div>
              ) : (
                shownCtas.map((c, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5" style={{ borderTop: i === 0 ? 'none' : '1px solid #EDE6D8' }}>
                    <span style={{ fontSize: '12px', color: '#0F172A' }}>{c.label}</span>
                    <ArrowRight size={14} style={{ color: brand }} />
                  </div>
                ))
              )}
            </div>

            {/* Input pill */}
            <div className="mt-4 flex items-center justify-between rounded-full px-3 py-2" style={{ background: '#FFF', border: '1px solid #EDE6D8' }}>
              <span style={{ fontSize: '12px', color: '#A8A090' }}>Ask a question…</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ border: `1.5px solid ${brand}` }}>
                <Send size={12} style={{ color: brand }} />
              </span>
            </div>

            <div className="mt-3 text-center" style={{ fontSize: '9.5px', color: '#A8A090' }}>Powered by MyRecruiter</div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
