/**
 * Shell data selectors — reads the existing config store (`useConfigStore`)
 * and derives the summary values the redesigned shell chrome needs
 * (tenant identity, entity counts, health signals). No new data source.
 */

import { useConfigStore } from '@/store';

export interface TenantSummary {
  loaded: boolean;
  tenantId: string | null;
  name: string;
  tier: string;
  version: string;
  active: boolean;
  messengerOn: boolean;
  brandColor: string;
}

export function useTenantSummary(): TenantSummary {
  return useConfigStore((s) => {
    const cfg = s.config.baseConfig;
    return {
      loaded: !!cfg && !!s.config.tenantId,
      tenantId: s.config.tenantId,
      name: cfg?.chat_title || s.config.tenantId || 'No tenant',
      tier: cfg?.subscription_tier || 'Standard',
      version: cfg?.version || '—',
      active: cfg?.active ?? false,
      messengerOn: !!cfg?.feature_flags?.MESSENGER_CHANNEL,
      brandColor: cfg?.branding?.primary_color || '#50C878',
    };
  });
}

export interface EntityCounts {
  programs: number;
  forms: number;
  ctas: number;
  branches: number;
  chips: number;
  showcase: number;
  /** total nodes across pipeline-relevant entity types */
  nodes: number;
}

export function useEntityCounts(): EntityCounts {
  return useConfigStore((s) => {
    const programs = Object.keys(s.programs.programs).length;
    const forms = Object.keys(s.forms.forms).length;
    const ctas = Object.keys(s.ctas.ctas).length;
    const branches = Object.keys(s.branches.branches).length;
    const chips = Object.keys(s.config.baseConfig?.action_chips?.default_chips ?? {}).length;
    const showcase = s.contentShowcase.content_showcase.length;
    return {
      programs,
      forms,
      ctas,
      branches,
      chips,
      showcase,
      nodes: programs + forms + ctas + branches + chips + showcase,
    };
  });
}
