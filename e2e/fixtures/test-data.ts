/**
 * Test Data Fixtures
 * Mock data for E2E tests
 */

/**
 * Test tenant configuration
 * Using real tenant MYR384719 from S3 bucket
 * NOTE: Tenant selector shows display names, not IDs
 */
export const TEST_TENANT = {
  id: 'MYR384719',
  name: 'Atlanta Angels',
  // Use display name for selector since dropdown shows names, not IDs
  displayName: 'Atlanta Angels',
};

/**
 * Sample program data
 */
export const SAMPLE_PROGRAMS = {
  loveBox: {
    id: 'lovebox_program',
    name: 'Love Box',
    description: 'Community support program providing essential resources',
  },
  foodBank: {
    id: 'foodbank_program',
    name: 'Food Bank',
    description: 'Emergency food assistance program',
  },
};

/**
 * Sample form data
 */
export const SAMPLE_FORMS = {
  loveBoxApplication: {
    id: 'lovebox_application',
    name: 'Love Box Application',
    description: 'Application form for Love Box program',
    programId: 'lovebox_program',
    triggerPhrases: ['apply for love box', 'love box application', 'need help'],
    fields: [
      {
        id: 'full_name',
        type: 'text',
        label: 'Full Name',
        required: true,
        validation: { minLength: 2, maxLength: 100 },
      },
      {
        id: 'email',
        type: 'email',
        label: 'Email Address',
        required: true,
        validation: { pattern: 'email' },
      },
      {
        id: 'phone',
        type: 'phone',
        label: 'Phone Number',
        required: true,
        validation: { pattern: 'phone' },
      },
      {
        id: 'household_size',
        type: 'select',
        label: 'Household Size',
        required: true,
        options: ['1', '2', '3', '4', '5+'],
      },
      {
        id: 'additional_info',
        type: 'textarea',
        label: 'Additional Information',
        required: false,
        placeholder: 'Tell us more about your situation...',
      },
    ],
  },
  contactForm: {
    id: 'contact_form',
    name: 'Contact Us',
    description: 'General contact form',
    triggerPhrases: ['contact us', 'get in touch', 'speak to someone'],
    fields: [
      {
        id: 'name',
        type: 'text',
        label: 'Name',
        required: true,
      },
      {
        id: 'email',
        type: 'email',
        label: 'Email',
        required: true,
      },
      {
        id: 'message',
        type: 'textarea',
        label: 'Message',
        required: true,
      },
    ],
  },
};

/**
 * Sample CTA data
 */
export const SAMPLE_CTAS = {
  applyLoveBox: {
    id: 'apply_lovebox',
    label: 'Apply for Love Box',
    action: 'start_form',
    formId: 'lovebox_application',
    variant: 'primary',
  },
  learnMore: {
    id: 'learn_more_lovebox',
    label: 'Learn More',
    action: 'show_info',
    variant: 'secondary',
  },
  contactUs: {
    id: 'contact_us',
    label: 'Contact Us',
    action: 'start_form',
    formId: 'contact_form',
    variant: 'outline',
  },
  viewPrograms: {
    id: 'view_programs',
    label: 'View All Programs',
    action: 'show_card',
    cardId: 'programs_list',
    variant: 'link',
  },
};

/**
 * Sample branch data
 */
export const SAMPLE_BRANCHES = {
  loveBoxDiscussion: {
    id: 'lovebox_discussion',
    name: 'Love Box Discussion',
    description: 'Conversation branch for Love Box program',
    primaryCtaId: 'apply_lovebox',
    secondaryCtaId: 'learn_more_lovebox',
    triggerPhrases: ['love box', 'need help', 'assistance'],
  },
  generalInquiry: {
    id: 'general_inquiry',
    name: 'General Inquiry',
    description: 'General questions and contact',
    primaryCtaId: 'contact_us',
    triggerPhrases: ['help', 'question', 'contact'],
  },
};

/**
 * Invalid form data for validation testing
 */
export const INVALID_FORM_DATA = {
  missingRequiredFields: {
    id: 'invalid_form_1',
    // Missing name and description
  },
  invalidEmail: {
    id: 'invalid_form_2',
    name: 'Invalid Email Form',
    fields: [
      {
        id: 'email',
        type: 'email',
        label: 'Email',
        required: true,
        validation: { pattern: 'invalid-pattern' },
      },
    ],
  },
};

/**
 * Invalid CTA data for validation testing
 */
export const INVALID_CTA_DATA = {
  missingFormId: {
    id: 'invalid_cta_1',
    label: 'Invalid CTA',
    action: 'start_form',
    // Missing formId for start_form action
  },
  invalidAction: {
    id: 'invalid_cta_2',
    label: 'Invalid CTA 2',
    action: 'invalid_action_type',
  },
};

/**
 * Mock S3 response for tenant list
 */
export const MOCK_TENANT_LIST = [
  {
    tenantId: 'TEST001',
    name: 'Test Tenant 001',
    lastModified: '2025-10-18T12:00:00Z',
    size: 5120,
  },
  {
    tenantId: 'MYR384719',
    name: 'Atlanta Angels',
    lastModified: '2025-10-18T14:00:00Z',
    size: 8192,
  },
  {
    tenantId: 'TEST002',
    name: 'Test Tenant 002',
    lastModified: '2025-10-17T10:00:00Z',
    size: 4096,
  },
];

/**
 * Mock config for TEST001
 */
export const MOCK_TEST001_CONFIG = {
  version: '1.3',
  tenantId: 'TEST001',
  programs: {},
  conversational_forms: {},
  ctas: {},
  branches: {},
  card_inventory: [],
  content_showcase: [],
  form_settings: {
    enableAutoSave: true,
    validationMode: 'onBlur',
  },
  metadata: {
    lastModified: '2025-10-18T12:00:00Z',
    modifiedBy: 'test-user',
  },
};

/**
 * Form field types for testing
 */
export const FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  PHONE: 'phone',
  NUMBER: 'number',
  SELECT: 'select',
  RADIO: 'radio',
  CHECKBOX: 'checkbox',
  TEXTAREA: 'textarea',
  DATE: 'date',
};

/**
 * CTA actions for testing
 */
export const CTA_ACTIONS = {
  START_FORM: 'start_form',
  SHOW_CARD: 'show_card',
  SHOW_INFO: 'show_info',
  EXTERNAL_LINK: 'external_link',
  TRIGGER_BRANCH: 'trigger_branch',
};

/**
 * Validation error messages
 */
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_PHONE: 'Invalid phone number',
  MIN_LENGTH: 'Minimum length not met',
  MAX_LENGTH: 'Maximum length exceeded',
  MISSING_FORM_ID: 'Form ID is required for start_form action',
  MISSING_CARD_ID: 'Card ID is required for show_card action',
  DUPLICATE_ID: 'ID already exists',
};
