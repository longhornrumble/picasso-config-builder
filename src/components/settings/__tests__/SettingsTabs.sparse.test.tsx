/**
 * Settings tabs — sparse-shape render sweep (Schema Discipline).
 *
 * Externally-authored configs (M2M write path, persona packs) carry sparse
 * shapes: sections present but missing nested fields, or absent entirely.
 * BedrockInstructionsSettings crashed on exactly this (cb#103). This sweep
 * pins the whole family: every settings tab must render against (a) a config
 * where every section is present but EMPTY, and (b) a config with no sections
 * at all. A new tab added to this directory should be added to TABS.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { useConfigStore } from '@/store';
import type { TenantConfig } from '@/types/config';

import { AWSSettings } from '../AWSSettings';
import { BedrockInstructionsSettings } from '../BedrockInstructionsSettings';
import { BrandingSettings } from '../BrandingSettings';
import { CTASettings } from '../CTASettings';
import { EmbedCodeSettings } from '../EmbedCodeSettings';
import { FeatureFlagsSettings } from '../FeatureFlagsSettings';
import { FeaturesSettings } from '../FeaturesSettings';
import { MessengerSettings } from '../MessengerSettings';
import { MessengerWelcomeSettings } from '../MessengerWelcomeSettings';
import { NotificationSettings } from '../NotificationSettings';
import { QuickHelpSettings } from '../QuickHelpSettings';
import { TenantIdentitySettings } from '../TenantIdentitySettings';
import { WidgetBehaviorSettings } from '../WidgetBehaviorSettings';

const TABS: Array<[string, React.FC]> = [
  ['AWSSettings', AWSSettings],
  ['BedrockInstructionsSettings', BedrockInstructionsSettings],
  ['BrandingSettings', BrandingSettings],
  ['CTASettings', CTASettings],
  ['EmbedCodeSettings', EmbedCodeSettings],
  ['FeatureFlagsSettings', FeatureFlagsSettings],
  ['FeaturesSettings', FeaturesSettings],
  ['MessengerSettings', MessengerSettings],
  ['MessengerWelcomeSettings', MessengerWelcomeSettings],
  ['NotificationSettings', NotificationSettings],
  ['QuickHelpSettings', QuickHelpSettings],
  ['TenantIdentitySettings', TenantIdentitySettings],
  ['WidgetBehaviorSettings', WidgetBehaviorSettings],
];

// Every section present but EMPTY — the sparse worst case for nested reads.
const SPARSE_SECTIONS = {
  tenant_id: 'SPARSE_TENANT',
  tenant_hash: 'abc123',
  version: '1.0',
  generated_at: Date.now(),
  branding: {},
  features: {},
  aws: {},
  quick_help: {},
  action_chips: { enabled: true }, // no default_chips — live sparse pattern
  widget_behavior: {},
  cta_settings: {},
  bedrock_instructions: {},
  feature_flags: {},
  notification_settings: {},
  messenger_behavior: {},
} as unknown as TenantConfig;

// No sections at all — metadata only.
const NO_SECTIONS = {
  tenant_id: 'BARE_TENANT',
  tenant_hash: 'def456',
  version: '1.0',
  generated_at: Date.now(),
} as unknown as TenantConfig;

const setBaseConfig = (config: TenantConfig) => {
  useConfigStore.setState((state) => {
    state.config.tenantId = config.tenant_id;
    state.config.baseConfig = config;
  });
};

beforeEach(() => {
  cleanup();
});

describe.each(TABS)('%s — sparse-shape render', (_name, Tab) => {
  it('renders with every section present but empty', () => {
    setBaseConfig(SPARSE_SECTIONS);
    expect(() => render(<Tab />)).not.toThrow();
  });

  it('renders with no sections at all', () => {
    setBaseConfig(NO_SECTIONS);
    expect(() => render(<Tab />)).not.toThrow();
  });
});
