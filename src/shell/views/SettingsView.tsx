/**
 * Settings view — the legacy tabs + newer surfaces collapsed into one
 * scrollable page with a grouped, scroll-spy index. Reuses the existing
 * settings cards verbatim (each is a prop-less, store-connected component).
 * The AWS card + its nav item render only for super admins.
 * Design handoff §5 Settings.
 */

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  TenantIdentitySettings,
  BrandingSettings,
  WidgetBehaviorSettings,
  CTASettings,
  QuickHelpSettings,
  FeaturesSettings,
  BedrockInstructionsSettings,
  FeatureFlagsSettings,
  MessengerSettings,
  MessengerWelcomeSettings,
  NotificationSettings,
  AWSSettings,
} from '@/components/settings';
import { EmbedCodeSettings } from '@/components/settings/EmbedCodeSettings';
import { useTenantSummary } from '../useShellData';
import { EmptyTenantState } from './EmptyTenantState';

interface SectionDef {
  id: string;
  label: string;
  group: string;
  render: React.ReactNode;
  superAdminOnly?: boolean;
}

const SECTIONS: SectionDef[] = [
  { id: 'tenant-identity', label: 'Tenant identity', group: 'Identity & brand', render: <TenantIdentitySettings /> },
  { id: 'brand', label: 'Brand', group: 'Identity & brand', render: <BrandingSettings /> },
  { id: 'widget-behavior', label: 'Widget behavior', group: 'Behavior', render: <WidgetBehaviorSettings /> },
  { id: 'cta-behavior', label: 'CTA behavior', group: 'Behavior', render: <CTASettings /> },
  { id: 'quick-help', label: 'Quick help', group: 'Behavior', render: <QuickHelpSettings /> },
  { id: 'features', label: 'Features', group: 'Behavior', render: <FeaturesSettings /> },
  {
    id: 'ai-personality',
    label: 'AI personality',
    group: 'Behavior',
    render: (
      <div className="flex flex-col gap-4">
        <BedrockInstructionsSettings />
        <FeatureFlagsSettings />
      </div>
    ),
  },
  {
    id: 'messenger',
    label: 'Messenger',
    group: 'Channels',
    render: (
      <div className="flex flex-col gap-4">
        <MessengerSettings />
        <MessengerWelcomeSettings />
      </div>
    ),
  },
  { id: 'embed', label: 'Embed code', group: 'Admin', render: <EmbedCodeSettings /> },
  { id: 'notifications', label: 'Notifications', group: 'Admin', render: <NotificationSettings /> },
  { id: 'aws', label: 'AWS', group: 'Admin', render: <AWSSettings />, superAdminOnly: true },
];

export function SettingsView() {
  const tenant = useTenantSummary();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const sections = React.useMemo(
    () => SECTIONS.filter((s) => !s.superAdminOnly || isSuperAdmin),
    [isSuperAdmin],
  );

  const [active, setActive] = React.useState<string>(sections[0]?.id ?? '');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const sectionRefs = React.useRef<Record<string, HTMLElement | null>>({});

  // Scroll-spy: mark the section nearest the top of the scroll container active.
  React.useEffect(() => {
    const root = containerRef.current?.closest('.cb-scroll') ?? null;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActive(visible[0].target.id);
        }
      },
      { root, rootMargin: '0px 0px -70% 0px', threshold: 0 },
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  if (!tenant.loaded) return <EmptyTenantState />;

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Preserve group order as first-seen in SECTIONS.
  const groups: string[] = [];
  sections.forEach((s) => { if (!groups.includes(s.group)) groups.push(s.group); });

  return (
    <div ref={containerRef} className="mx-auto flex w-full max-w-[1000px] gap-6">
      {/* Sticky scroll-spy index */}
      <nav className="sticky top-0 hidden h-fit w-[150px] flex-shrink-0 flex-col gap-3 md:flex">
        {groups.map((group) => (
          <div key={group}>
            <div className="mb-1 uppercase" style={{ fontSize: '9.5px', color: '#94A3B8', letterSpacing: '.08em' }}>{group}</div>
            <div className="flex flex-col">
              {sections.filter((s) => s.group === group).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollTo(s.id)}
                  className="rounded-md px-2 py-1 text-left font-medium transition-colors"
                  style={{
                    fontSize: '12px',
                    background: active === s.id ? '#EEF2F6' : 'transparent',
                    color: active === s.id ? '#0F172A' : '#64748B',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Sections */}
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {sections.map((s) => (
          <section
            key={s.id}
            id={s.id}
            ref={(el) => { sectionRefs.current[s.id] = el; }}
            style={{ scrollMarginTop: '12px' }}
          >
            {s.render}
          </section>
        ))}
      </div>
    </div>
  );
}
