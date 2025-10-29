/**
 * Types Index - Central export for all type definitions
 *
 * This barrel file exports all types from the various type modules
 * for convenient importing throughout the application.
 */

// Config types
export type {
  // Programs
  Program,
  // Forms
  FormFieldType,
  FormFieldOption,
  FormField,
  PostSubmissionActionType,
  PostSubmissionAction,
  FulfillmentMethod,
  Fulfillment,
  PostSubmissionConfig,
  ConversationalForm,
  // CTAs
  CTAActionType,
  CTAType,
  CTAStyle,
  CTADefinition,
  CTASettings,
  // Branches
  BranchAvailableCTAs,
  ConversationBranch,
  // Configuration Sections
  BrandingConfig,
  CalloutConfig,
  FeaturesConfig,
  QuickHelpConfig,
  ActionChip,
  ActionChipsConfig,
  WidgetBehaviorConfig,
  AWSConfig,
  // Full Config
  SubscriptionTier,
  TenantConfig,
} from './config';

// Validation types
export type {
  EntityType,
  ValidationSeverity,
  ValidationError,
  ValidationWarning,
  ValidationIssue,
  ValidationResult,
  FieldValidationError,
  FieldValidationResult,
  DependencyReference,
  Dependencies,
  DependencyGraph,
  ValidationRuleType,
  ValidationRule,
  ValidationContext,
  ValidationSummary,
} from './validation';

// API types
export type {
  TenantMetadata,
  TenantListItem,
  LoadTenantsRequest,
  LoadTenantsResponse,
  LoadConfigRequest,
  LoadConfigResponse,
  SaveConfigRequest,
  SaveConfigResponse,
  DeployConfigRequest,
  DeployConfigResponse,
  BackupListItem,
  ListBackupsRequest,
  ListBackupsResponse,
  RestoreBackupRequest,
  RestoreBackupResponse,
  APIErrorCode,
  APIError,
  ErrorResponse,
  S3ClientConfig,
  OperationStatus,
  OperationState,
} from './api';

// UI types
export type {
  ProgramListItem,
  FormListItem,
  CTAListItem,
  BranchListItem,
  ToastType,
  Toast,
  ModalType,
  ModalState,
  FormState,
  EditorView,
  EditorViewState,
  NavigationSection,
  NavigationItem,
  ValidationPanelState,
  DeploymentSummary,
  FilterState,
  SidebarState,
  UnsavedChanges,
  KeyboardShortcut,
  LoadingState,
  ContextMenuItem,
  ContextMenuState,
} from './ui';
