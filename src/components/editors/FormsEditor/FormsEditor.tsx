/**
 * FormsEditor Component
 * Main container for managing conversational forms using the generic CRUD framework
 *
 * This component demonstrates the framework handling complex nested data:
 * - Form metadata (form_id, title, program)
 * - Field collection (array of FormField with full CRUD)
 * - All managed through the same generic EntityEditor
 */

import React from 'react';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { EntityEditor } from '../generic/EntityEditor';
import { FormFormFields } from './FormFormFields';
import { FormCardContent } from './FormCardContent';
import { validateForm } from '@/lib/validation/formValidators';
import { useConfigStore } from '@/store';
import type { ConversationalForm } from '@/types/config';
import type { EntityDependencies } from '@/lib/crud/types';

/**
 * FormsEditor - Forms management interface using generic framework
 *
 * @example
 * ```tsx
 * <FormsEditor />
 * ```
 */
export const FormsEditor: React.FC = () => {
  // Get store slices
  const formsStore = useConfigStore((state) => state.forms);
  const getCTAsByForm = useConfigStore((state) => state.ctas.getCTAsByForm);

  // Configure the generic editor
  return (
    <EntityEditor<ConversationalForm>
      initialValue={{
        form_id: '',
        title: '',
        description: '',
        program: '',
        enabled: true,
        fields: [],
      }}
      config={{
        // Entity metadata
        metadata: {
          entityType: 'form',
          entityName: 'Form',
          entityNamePlural: 'Forms',
          description: 'Create and manage conversational forms for data collection',
        },

        // Empty state configuration
        emptyState: {
          icon: FileText,
          title: 'No Forms Defined',
          description:
            'Forms enable structured data collection through conversational interfaces. Create your first form to get started.',
          actionText: 'Create First Form',
        },

        // Store and operations
        useStore: () => ({
          entities: formsStore.forms,
          createEntity: (form) => formsStore.createForm(form),
          updateEntity: (id, form) => formsStore.updateForm(id, form),
          deleteEntity: (id) => formsStore.deleteForm(id),
          duplicateEntity: (id) => formsStore.duplicateForm(id),
          getDependencies: (id): EntityDependencies => {
            // Check if any CTAs reference this form
            const dependentCTAs = getCTAsByForm(id);

            const dependencies: EntityDependencies = {
              canDelete: dependentCTAs.length === 0,
              dependentEntities: [],
            };

            if (dependentCTAs.length > 0) {
              dependencies.dependentEntities.push({
                type: 'CTAs',
                ids: dependentCTAs.map((c) => c.id),
                names: dependentCTAs.map((c) => c.cta.label),
              });
            }

            return dependencies;
          },
        }),

        // Validation
        validation: validateForm,

        // ID and name extraction
        getId: (form) => form.form_id,
        getName: (form) => form.title,

        // Domain-specific components
        FormFields: FormFormFields,
        CardContent: FormCardContent,

        // Footer actions for Forms
        footerActions: (formData, onChange) => (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const newField = {
                id: `field_${Date.now()}`,
                type: 'text' as const,
                label: '',
                prompt: '',
                required: false,
              };
              onChange({
                ...formData,
                fields: [...formData.fields, newField],
              });
            }}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Field
          </Button>
        ),
      }}
    />
  );
};
