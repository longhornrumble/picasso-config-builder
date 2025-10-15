/**
 * Mock Implementation for Testing
 * Use this in tests to mock API operations
 */

import type { TenantConfig } from '@/types/config';
import type { TenantListItem, LoadConfigResponse, TenantMetadata } from '@/types/api';

// Mock data
export const mockTenantConfig: TenantConfig = {
  tenant_id: 'TEST001',
  tenant_hash: 'test123abc',
  subscription_tier: 'Standard',
  chat_title: 'Test Organization',
  tone_prompt: 'You are a helpful assistant.',
  welcome_message: 'Welcome! How can I help?',
  version: '1.3',
  generated_at: Date.now(),
  branding: {
    primary_color: '#0066cc',
    font_family: 'system-ui',
  },
  features: {
    uploads: false,
    photo_uploads: false,
    voice_input: false,
    streaming: true,
    conversational_forms: true,
    smart_cards: true,
    callout: {
      enabled: true,
      auto_dismiss: false,
    },
  },
  aws: {
    knowledge_base_id: 'ABCD123456',
    aws_region: 'us-east-1',
  },
  conversational_forms: {},
  cta_definitions: {},
  conversation_branches: {},
};

export const mockTenantList: TenantListItem[] = [
  {
    tenantId: 'TEST001',
    tenantName: 'Test Organization 1',
    lastModified: Date.now(),
    version: '1.3',
    tier: 'Standard',
  },
  {
    tenantId: 'TEST002',
    tenantName: 'Test Organization 2',
    lastModified: Date.now(),
    version: '1.3',
    tier: 'Premium',
  },
];

export const mockMetadata: TenantMetadata = {
  tenantId: 'TEST001',
  tenantName: 'Test Organization',
  lastModified: Date.now(),
  configVersion: '1.3',
  size: 15000,
  etag: 'abc123',
};

// Mock functions (use with jest.mock() in tests)
export const mockListTenants = async (): Promise<TenantListItem[]> => {
  return mockTenantList;
};

export const mockGetTenantMetadata = async (tenantId: string): Promise<TenantMetadata> => {
  return {
    ...mockMetadata,
    tenantId,
  };
};

export const mockLoadConfig = async (tenantId: string): Promise<LoadConfigResponse> => {
  return {
    config: {
      ...mockTenantConfig,
      tenant_id: tenantId,
    },
    metadata: {
      ...mockMetadata,
      tenantId,
    },
  };
};

export const mockSaveConfig = async (): Promise<void> => {
  // Mock successful save
};

export const mockDeployConfig = async (): Promise<void> => {
  // Mock successful deploy
};

export const mockDeleteConfig = async (): Promise<void> => {
  // Mock successful delete
};

export const mockCheckAPIHealth = async (): Promise<boolean> => {
  return true;
};

// Export all as default for easier importing
export default {
  listTenants: mockListTenants,
  getTenantMetadata: mockGetTenantMetadata,
  loadConfig: mockLoadConfig,
  saveConfig: mockSaveConfig,
  deployConfig: mockDeployConfig,
  deleteConfig: mockDeleteConfig,
  checkAPIHealth: mockCheckAPIHealth,
};
