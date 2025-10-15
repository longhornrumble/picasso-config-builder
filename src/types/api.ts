/**
 * API Types for Picasso Config Builder
 *
 * These types define the structure of API requests and responses
 * for S3 operations and configuration management.
 */

import type { TenantConfig } from './config';
import type { ValidationResult } from './validation';

// ============================================================================
// TENANT METADATA
// ============================================================================

export interface TenantMetadata {
  tenantId: string;
  tenantName: string;
  lastModified: number;
  configVersion: string;
  size?: number;
  etag?: string;
}

export interface TenantListItem {
  tenantId: string;
  tenantName: string;
  lastModified: number;
  version: string;
  tier: string;
}

// ============================================================================
// LOAD OPERATIONS
// ============================================================================

export interface LoadTenantsRequest {
  prefix?: string;
  maxResults?: number;
}

export interface LoadTenantsResponse {
  tenants: TenantListItem[];
  hasMore: boolean;
  nextToken?: string;
}

export interface LoadConfigRequest {
  tenantId: string;
  version?: string; // Optional: load specific version
}

export interface LoadConfigResponse {
  config: TenantConfig;
  metadata: TenantMetadata;
}

// ============================================================================
// SAVE OPERATIONS
// ============================================================================

export interface SaveConfigRequest {
  tenantId: string;
  config: TenantConfig;
  validation?: ValidationResult;
  createBackup?: boolean;
}

export interface SaveConfigResponse {
  success: boolean;
  version: string;
  timestamp: number;
  backupKey?: string;
  etag?: string;
}

// ============================================================================
// DEPLOY OPERATIONS
// ============================================================================

export interface DeployConfigRequest {
  tenantId: string;
  config: TenantConfig;
  validation: ValidationResult;
  skipValidation?: boolean; // Dangerous, for emergency use only
}

export interface DeployConfigResponse {
  success: boolean;
  version: string;
  timestamp: number;
  deployedKey: string;
  backupKey?: string;
  validationSummary: {
    totalErrors: number;
    totalWarnings: number;
  };
}

// ============================================================================
// BACKUP OPERATIONS
// ============================================================================

export interface BackupListItem {
  key: string;
  timestamp: number;
  version: string;
  size: number;
}

export interface ListBackupsRequest {
  tenantId: string;
  maxResults?: number;
}

export interface ListBackupsResponse {
  backups: BackupListItem[];
}

export interface RestoreBackupRequest {
  tenantId: string;
  backupKey: string;
}

export interface RestoreBackupResponse {
  success: boolean;
  config: TenantConfig;
  metadata: TenantMetadata;
}

// ============================================================================
// ERROR RESPONSES
// ============================================================================

export type APIErrorCode =
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'VALIDATION_FAILED'
  | 'S3_ERROR'
  | 'PARSE_ERROR'
  | 'UNKNOWN_ERROR';

export interface APIError {
  code: APIErrorCode;
  message: string;
  details?: Record<string, unknown>;
  timestamp: number;
}

export interface ErrorResponse {
  error: APIError;
}

// ============================================================================
// S3 CLIENT CONFIGURATION
// ============================================================================

export interface S3ClientConfig {
  region: string;
  bucket: string;
  prefix?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

// ============================================================================
// OPERATION STATUS
// ============================================================================

export type OperationStatus = 'idle' | 'loading' | 'saving' | 'deploying' | 'success' | 'error';

export interface OperationState {
  status: OperationStatus;
  error?: APIError;
  progress?: number; // 0-100 for operations that support progress
}
