/**
 * Forms Slice
 * Manages conversational forms and their field collections
 */

import type { ConversationalForm, FormField } from '@/types/config';
import type { SliceCreator, FormsSlice, Dependencies } from '../types';

export const createFormsSlice: SliceCreator<FormsSlice> = (set, get) => ({
  // State
  forms: {},
  activeFormId: null,

  // Actions
  createForm: (form: ConversationalForm) => {
    set((state) => {
      state.forms.forms[form.form_id] = form;
      state.config.markDirty();
    });

    get().ui.addToast({
      type: 'success',
      message: `Form "${form.title}" created successfully`,
    });

    // Re-run validation after creating form
    get().validation.validateAll();
  },

  updateForm: (formId: string, updates: Partial<ConversationalForm> | ConversationalForm) => {
    let updateSucceeded = false;

    set((state) => {
      const form = state.forms.forms[formId];

      if (!form) {
        console.error('[forms.ts] Form not found:', {
          formId,
          availableFormIds: Object.keys(state.forms.forms),
        });
        return;
      }

      // If updates contains form_id, it's a full replacement, otherwise it's a partial update
      const isFullReplacement = 'form_id' in updates;
      const newFormId = isFullReplacement ? (updates as ConversationalForm).form_id : formId;
      const formIdChanged = newFormId !== formId;

      // If form_id changed, check for duplicates
      if (formIdChanged && state.forms.forms[newFormId]) {
        get().ui.addToast({
          type: 'error',
          message: `Form ID "${newFormId}" already exists`,
        });
        return;
      }

      // Build the updated form
      const updatedForm = isFullReplacement
        ? (updates as ConversationalForm)
        : { ...form, ...updates };

      // If form_id changed, handle key remapping and cascade updates
      if (formIdChanged) {
        // Remove old key
        delete state.forms.forms[formId];

        // Add with new key
        state.forms.forms[newFormId] = updatedForm;

        // Cascade update CTAs that reference this form
        Object.entries(state.ctas.ctas).forEach(([ctaId, cta]) => {
          if (cta.formId === formId) {
            state.ctas.ctas[ctaId] = { ...cta, formId: newFormId };
          }
        });

        // Cascade update post-submission actions in all forms
        Object.values(state.forms.forms).forEach((f) => {
          if (f.post_submission?.actions) {
            const hasChanges = f.post_submission.actions.some((a) => a.formId === formId);
            if (hasChanges) {
              f.post_submission.actions = f.post_submission.actions.map((action) =>
                action.formId === formId ? { ...action, formId: newFormId } : action
              );
            }
          }
        });

        // Update activeFormId if it was the renamed form
        if (state.forms.activeFormId === formId) {
          state.forms.activeFormId = newFormId;
        }
      } else {
        // No ID change - simple update
        state.forms.forms[formId] = updatedForm;
      }

      state.config.markDirty();
      updateSucceeded = true;
    });

    if (updateSucceeded) {
      get().ui.addToast({
        type: 'success',
        message: 'Form updated successfully',
      });
    }

    // Re-run validation after updating form
    get().validation.validateAll();
  },

  deleteForm: (formId: string) => {
    const dependencies = get().forms.getFormDependencies(formId);

    // Check if form is referenced by CTAs
    if (dependencies.ctas.length > 0) {
      get().ui.addToast({
        type: 'error',
        message: `Cannot delete form. It is used by ${dependencies.ctas.length} CTA(s).`,
      });
      return;
    }

    set((state) => {
      const formTitle = state.forms.forms[formId]?.title;
      delete state.forms.forms[formId];

      // Clear active form if deleted
      if (state.forms.activeFormId === formId) {
        state.forms.activeFormId = null;
      }

      state.config.markDirty();

      if (formTitle) {
        get().ui.addToast({
          type: 'success',
          message: `Form "${formTitle}" deleted successfully`,
        });
      }
    });

    // Re-run validation after deleting form
    get().validation.validateAll();
  },

  duplicateForm: (formId: string) => {
    const form = get().forms.forms[formId];
    if (!form) {
      get().ui.addToast({
        type: 'error',
        message: 'Form not found',
      });
      return;
    }

    // Prompt user for new form ID
    const newFormId = window.prompt(
      `Enter a new Form ID for the copy of "${form.title}":`,
      `${formId}_copy`
    );

    // If user cancels or provides empty string, abort
    if (!newFormId || newFormId.trim() === '') {
      return;
    }

    const trimmedFormId = newFormId.trim();

    // Check if form ID already exists
    if (get().forms.forms[trimmedFormId]) {
      get().ui.addToast({
        type: 'error',
        message: `Form ID "${trimmedFormId}" already exists. Please choose a different ID.`,
      });
      return;
    }

    // Validate form ID format (lowercase, numbers, hyphens, underscores)
    if (!/^[a-z0-9_-]+$/.test(trimmedFormId)) {
      get().ui.addToast({
        type: 'error',
        message: 'Form ID must contain only lowercase letters, numbers, hyphens, and underscores.',
      });
      return;
    }

    // Generate timestamp for field IDs
    const timestamp = Date.now();

    // Deep clone the form
    const clonedForm: ConversationalForm = JSON.parse(JSON.stringify(form));

    // Update form ID and title
    clonedForm.form_id = trimmedFormId;
    clonedForm.title = `${form.title} (Copy)`;

    // Regenerate all field IDs to avoid conflicts
    if (clonedForm.fields && clonedForm.fields.length > 0) {
      clonedForm.fields = clonedForm.fields.map((field, index) => {
        const originalFieldId = field.id;
        const newFieldId = `${originalFieldId}_copy_${timestamp}_${index}`;

        return {
          ...field,
          id: newFieldId,
        };
      });
    }

    get().forms.createForm(clonedForm);
  },

  setActiveForm: (formId: string | null) => {
    set((state) => {
      state.forms.activeFormId = formId;
    });
  },

  // Field management
  addField: (formId: string, field: FormField) => {
    set((state) => {
      const form = state.forms.forms[formId];
      if (form) {
        state.forms.forms[formId] = {
          ...form,
          fields: [...form.fields, field],
        };
        state.config.markDirty();
      }
    });

    get().ui.addToast({
      type: 'success',
      message: 'Field added successfully',
    });

    // Re-run validation after adding field
    get().validation.validateAll();
  },

  updateField: (formId: string, fieldIndex: number, updates: Partial<FormField>) => {
    set((state) => {
      const form = state.forms.forms[formId];
      if (form && form.fields[fieldIndex]) {
        const updatedFields = [...form.fields];
        updatedFields[fieldIndex] = { ...updatedFields[fieldIndex], ...updates };
        state.forms.forms[formId] = {
          ...form,
          fields: updatedFields,
        };
        state.config.markDirty();
      }
    });

    get().ui.addToast({
      type: 'success',
      message: 'Field updated successfully',
    });

    // Re-run validation after updating field
    get().validation.validateAll();
  },

  deleteField: (formId: string, fieldIndex: number) => {
    set((state) => {
      const form = state.forms.forms[formId];
      if (form && form.fields[fieldIndex]) {
        const updatedFields = form.fields.filter((_, index) => index !== fieldIndex);
        state.forms.forms[formId] = {
          ...form,
          fields: updatedFields,
        };
        state.config.markDirty();
      }
    });

    get().ui.addToast({
      type: 'success',
      message: 'Field deleted successfully',
    });

    // Re-run validation after deleting field
    get().validation.validateAll();
  },

  reorderFields: (formId: string, fromIndex: number, toIndex: number) => {
    set((state) => {
      const form = state.forms.forms[formId];
      if (form) {
        const updatedFields = [...form.fields];
        const [movedField] = updatedFields.splice(fromIndex, 1);
        updatedFields.splice(toIndex, 0, movedField);

        state.forms.forms[formId] = {
          ...form,
          fields: updatedFields,
        };
        state.config.markDirty();
      }
    });

    get().ui.addToast({
      type: 'success',
      message: 'Fields reordered successfully',
    });

    // Re-run validation after reordering fields
    get().validation.validateAll();
  },

  // Selectors
  getForm: (formId: string) => {
    return get().forms.forms[formId];
  },

  getAllForms: () => {
    return Object.values(get().forms.forms);
  },

  getFormsByProgram: (programId: string) => {
    return Object.values(get().forms.forms).filter(
      (form) => form.program === programId
    );
  },

  getFormDependencies: (formId: string) => {
    const state = get();
    const dependencies: Dependencies = {
      programs: [],
      forms: [],
      ctas: [],
      branches: [],
    };

    // Get the program reference
    const form = state.forms.forms[formId];
    if (form && form.program) {
      dependencies.programs.push(form.program);
    }

    // Find CTAs that reference this form
    Object.entries(state.ctas.ctas).forEach(([ctaId, cta]) => {
      if (cta.action === 'start_form' && cta.formId === formId) {
        dependencies.ctas.push(ctaId);
      }
    });

    // Find post-submission actions that reference other forms
    if (form?.post_submission?.actions) {
      form.post_submission.actions.forEach((action) => {
        if (action.action === 'start_form' && action.formId) {
          dependencies.forms.push(action.formId);
        }
      });
    }

    return dependencies;
  },
});
