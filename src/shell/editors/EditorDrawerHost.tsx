/**
 * EditorDrawerHost — renders the right editor drawer for the shell's current
 * `editor` state ({kind, id|null}). Each kind reuses its existing *FormFields
 * body + validation function (field parity with the live product); the create/
 * update adapters mirror the legacy EntityEditor configs so store writes are
 * identical. Keyed by kind:id so a fresh form mounts per target.
 */

import { MousePointerClick, FileText, ListChecks, GitBranch, Zap, Sparkles } from 'lucide-react';
import { useConfigStore } from '@/store';
import type {
  CTADefinition,
  ConversationalForm,
  Program,
  ConversationBranch,
  ActionChip,
  ActionChipsConfig,
} from '@/types/config';
import type { ValidationContext } from '@/lib/crud/types';
import type { ValidationErrors } from '@/types/validation';

import { CTAFormFields } from '@/components/editors/CTAsEditor/CTAFormFields';
import { FormFormFields } from '@/components/editors/FormsEditor/FormFormFields';
import { ProgramFormFields } from '@/components/editors/ProgramsEditor/ProgramFormFields';
import { BranchFormFields } from '@/components/editors/BranchesEditor/BranchFormFields';
import { ActionChipFormFields } from '@/components/editors/ActionChipsEditor/ActionChipFormFields';
import { ShowcaseItemFormFields } from '@/components/editors/ShowcaseEditor/ShowcaseItemFormFields';
import { validateCTA, validateForm, validateProgram, validateBranch, validateActionChip } from '@/lib/validation/formValidators';
import { validateShowcaseItem } from '@/lib/validation/showcaseValidators';
import type { CTAEntity } from '@/components/editors/CTAsEditor/types';
import type { BranchEntity } from '@/components/editors/BranchesEditor/types';
import type { ActionChipEntity } from '@/components/editors/ActionChipsEditor/types';
import type { ShowcaseItemEntity } from '@/components/editors/ShowcaseEditor/types';

import { useShellStore } from '../shellStore';
import { DrawerEntityForm } from './DrawerEntityForm';

export function EditorDrawerHost() {
  const editor = useShellStore((s) => s.editor);
  const closeEditor = useShellStore((s) => s.closeEditor);
  const select = useShellStore((s) => s.select);

  // Store data (read unconditionally; hooks can't be conditional).
  const ctas = useConfigStore((s) => s.ctas.ctas);
  const forms = useConfigStore((s) => s.forms.forms);
  const programs = useConfigStore((s) => s.programs.programs);
  const branches = useConfigStore((s) => s.branches.branches);
  const showcase = useConfigStore((s) => s.contentShowcase.content_showcase);
  const baseConfig = useConfigStore((s) => s.config.baseConfig);
  const chips = baseConfig?.action_chips?.default_chips ?? {};

  if (!editor) return null;
  const { kind, id } = editor;
  const isEdit = id !== null;
  const addToast = (msg: string) => useConfigStore.getState().ui.addToast({ type: 'success', message: msg });

  // Close then (on create) select the new entity so the inspector opens on it.
  const done = (kindSel: typeof kind, newId: string, label: string) => {
    addToast(`${label} ${isEdit ? 'updated' : 'created'} — queued in pending changes.`);
    closeEditor();
    select({ kind: kindSel, id: newId });
  };

  switch (kind) {
    case 'cta': {
      const entity = isEdit && ctas[id] ? ({ ...ctas[id], ctaId: id } as CTAEntity) : null;
      return (
        <DrawerEntityForm<CTAEntity>
          key={`cta:${id ?? 'new'}`}
          open
          entityName="CTA"
          icon={<MousePointerClick size={16} />}
          entity={entity}
          initialValue={{ ctaId: '', label: '', action: 'start_form', type: 'form_trigger', formId: '', url: '', query: '', prompt: '', target_branch: undefined, program_id: undefined, ai_available: false } as CTAEntity}
          existingIds={Object.keys(ctas)}
          FormFields={CTAFormFields}
          validation={validateCTA}
          onClose={closeEditor}
          onSubmit={(e) => {
            const { ctaId, ...d } = e;
            const cta: CTADefinition = {
              label: d.label, action: d.action, type: d.type,
              ...(d.formId && { formId: d.formId }),
              ...(d.url && { url: d.url }),
              ...(d.query && { query: d.query }),
              ...(d.prompt && { prompt: d.prompt }),
              ai_available: d.ai_available || false,
              ...(d.target_branch !== undefined && { target_branch: d.target_branch || undefined }),
              ...(d.program_id !== undefined && { program_id: d.program_id || undefined }),
            };
            if (isEdit) useConfigStore.getState().ctas.updateCTA(id, cta);
            else useConfigStore.getState().ctas.createCTA(cta, ctaId);
            done('cta', isEdit ? id : ctaId, cta.label || ctaId);
          }}
        />
      );
    }

    case 'form': {
      const entity = isEdit ? forms[id] ?? null : null;
      return (
        <DrawerEntityForm<ConversationalForm>
          key={`form:${id ?? 'new'}`}
          open
          entityName="Form"
          icon={<FileText size={16} />}
          width={580}
          entity={entity}
          initialValue={{ form_id: '', title: '', description: '', program: '', enabled: true, fields: [] } as ConversationalForm}
          existingIds={Object.keys(forms)}
          FormFields={FormFormFields}
          validation={validateFormWithProgram}
          onClose={closeEditor}
          onSubmit={(form) => {
            if (isEdit) useConfigStore.getState().forms.updateForm(id, form);
            else useConfigStore.getState().forms.createForm(form);
            done('form', isEdit ? id : form.form_id, form.title || form.form_id);
          }}
        />
      );
    }

    case 'program': {
      const entity = isEdit ? programs[id] ?? null : null;
      return (
        <DrawerEntityForm<Program>
          key={`program:${id ?? 'new'}`}
          open
          entityName="Program"
          icon={<ListChecks size={16} />}
          entity={entity}
          initialValue={{ program_id: '', program_name: '', description: '' } as Program}
          existingIds={Object.keys(programs)}
          FormFields={ProgramFormFields}
          validation={validateProgram}
          onClose={closeEditor}
          onSubmit={(program) => {
            if (isEdit) useConfigStore.getState().programs.updateProgram(id, program);
            else useConfigStore.getState().programs.createProgram(program);
            done('program', isEdit ? id : program.program_id, program.program_name || program.program_id);
          }}
        />
      );
    }

    case 'branch': {
      const entity = isEdit && branches[id] ? ({ ...branches[id], branchId: id } as BranchEntity) : null;
      const maxCtasPerResponse = baseConfig?.cta_settings?.max_ctas_per_response || 4;
      return (
        <DrawerEntityForm<BranchEntity>
          key={`branch:${id ?? 'new'}`}
          open
          entityName="Conversation Branch"
          icon={<GitBranch size={16} />}
          entity={entity}
          initialValue={{ branchId: '', available_ctas: { primary: '', secondary: [] } } as BranchEntity}
          existingIds={Object.keys(branches)}
          FormFields={BranchFormFields}
          validation={(data, ctx) => validateBranch(data, { ...ctx, maxCtasPerResponse })}
          onClose={closeEditor}
          onSubmit={(e) => {
            const { branchId, ...d } = e;
            const branch: ConversationBranch = {
              available_ctas: d.available_ctas,
              description: d.description,
              program_id: d.program_id,
            };
            if (isEdit) useConfigStore.getState().branches.updateBranch(id, branch);
            else useConfigStore.getState().branches.createBranch(branch, branchId);
            done('branch', isEdit ? id : branchId, isEdit ? id : branchId);
          }}
        />
      );
    }

    case 'chip': {
      const entity = isEdit && chips[id] ? ({ ...chips[id], chipId: id } as ActionChipEntity) : null;
      return (
        <DrawerEntityForm<ActionChipEntity>
          key={`chip:${id ?? 'new'}`}
          open
          entityName="Action Chip"
          icon={<Zap size={16} />}
          entity={entity}
          initialValue={{ chipId: '', label: '', action: 'send_query', value: '', target_branch: undefined, program_id: undefined, target_showcase_id: undefined } as ActionChipEntity}
          existingIds={Object.keys(chips)}
          FormFields={ActionChipFormFields}
          validation={validateActionChip}
          onClose={closeEditor}
          onSubmit={(e) => {
            const { chipId, ...d } = e;
            const chip: ActionChip = {
              label: d.label, action: d.action || 'send_query', value: d.value,
              ...(d.target_branch && { target_branch: d.target_branch }),
              ...(d.program_id && { program_id: d.program_id }),
              ...(d.target_showcase_id && { target_showcase_id: d.target_showcase_id }),
            };
            if (isEdit) updateChip(id, chip);
            else createChip(chip, chipId);
            done('chip', isEdit ? id : chipId, chip.label || chipId);
          }}
        />
      );
    }

    case 'showcase': {
      const entity = isEdit ? showcase.find((i) => i.id === id) ?? null : null;
      const availableCtaIds = Object.keys(ctas);
      return (
        <DrawerEntityForm<ShowcaseItemEntity>
          key={`showcase:${id ?? 'new'}`}
          open
          entityName="Showcase Item"
          icon={<Sparkles size={16} />}
          width={580}
          entity={entity}
          initialValue={{ id: '', type: 'program', enabled: true, name: '', tagline: '', description: '', keywords: [] } as ShowcaseItemEntity}
          existingIds={showcase.map((i) => i.id)}
          FormFields={ShowcaseItemFormFields}
          validation={(data, ctx) => validateShowcaseItem(data, { ...ctx, availableCtaIds })}
          onClose={closeEditor}
          onSubmit={(item) => {
            if (isEdit) useConfigStore.getState().contentShowcase.updateShowcaseItem(id, item);
            else useConfigStore.getState().contentShowcase.createShowcaseItem(item);
            done('showcase', isEdit ? id : item.id, item.name || item.id);
          }}
        />
      );
    }

    default:
      return null;
  }
}

// ── Form validation with program-existence check (mirrors FormsEditor) ───────
function validateFormWithProgram(
  data: ConversationalForm,
  context: ValidationContext<ConversationalForm>,
): ValidationErrors {
  const errors = validateForm(data, context);
  if (data.program && !errors.program) {
    const currentPrograms = useConfigStore.getState().programs.programs;
    const exists =
      !!currentPrograms[data.program] ||
      Object.values(currentPrograms).some((p) => p.program_id === data.program);
    if (!exists) errors.program = `Program "${data.program}" does not exist. Select a valid program.`;
  }
  return errors;
}

// ── Action-chip mutators (chips have no store slice; mutate baseConfig) ───────
function createChip(chip: ActionChip, chipId: string): void {
  useConfigStore.setState((state) => {
    if (!state.config.baseConfig) return;
    if (!state.config.baseConfig.action_chips) {
      state.config.baseConfig.action_chips = { default_chips: {} } as ActionChipsConfig;
    }
    if (!state.config.baseConfig.action_chips.default_chips) {
      state.config.baseConfig.action_chips.default_chips = {};
    }
    state.config.baseConfig.action_chips.default_chips[chipId] = chip;
    state.config.isDirty = true;
  });
}

function updateChip(chipId: string, updates: Partial<ActionChip>): void {
  useConfigStore.setState((state) => {
    const chips = state.config.baseConfig?.action_chips?.default_chips;
    if (!chips || !chips[chipId]) return;
    chips[chipId] = { ...chips[chipId], ...updates };
    state.config.isDirty = true;
  });
}
