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
    set((state) => {
      const form = state.forms.forms[formId];

      if (form) {
        // If updates contains form_id, it's a full replacement, otherwise it's a partial update
        const isFullReplacement = 'form_id' in updates;

        state.forms.forms[formId] = isFullReplacement
          ? (updates as ConversationalForm)
          : { ...form, ...updates };

        state.config.markDirty();
      } else {
        console.error('[forms.ts] Form not found:', {
          formId,
          availableFormIds: Object.keys(state.forms.forms),
        });
      }
    });

    get().ui.addToast({
      type: 'success',
      message: 'Form updated successfully',
    });

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

    // Generate new ID
    const newId = `${formId}_copy_${Date.now()}`;
    const newForm: ConversationalForm = {
      ...form,
      form_id: newId,
      title: `${form.title} (Copy)`,
    };

    get().forms.createForm(newForm);
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
