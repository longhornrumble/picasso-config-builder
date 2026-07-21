/**
 * DrawerEntityForm — the editor drawer harness.
 *
 * Reuses the existing decoupled *FormFields bodies and validation functions
 * (field parity with the live product) but hosts them in the redesign's
 * right-overlay Drawer instead of the legacy centered Modal. Mirrors
 * EntityForm's proven draft/validate/submit logic; adds the unsaved-changes
 * guard (README §"Editor drawers"). Caller keys this by kind:id so a fresh
 * instance mounts per edit target (no reset effect).
 */

import React from 'react';
import type { BaseEntity, FormFieldsProps, ValidationFunction, ValidationContext } from '@/lib/crud/types';
import type { ValidationErrors } from '@/types/validation';
import { Drawer } from '../Drawer';

interface DrawerEntityFormProps<T extends BaseEntity> {
  open: boolean;
  entityName: string;
  icon?: React.ReactNode;
  width?: number;
  /** null in create mode. */
  entity: T | null;
  initialValue: T;
  existingIds: string[];
  FormFields: React.ComponentType<FormFieldsProps<T>>;
  validation: ValidationFunction<T>;
  onSubmit: (entity: T) => void;
  onClose: () => void;
}

export function DrawerEntityForm<T extends BaseEntity>({
  open,
  entityName,
  icon,
  width,
  entity,
  initialValue,
  existingIds,
  FormFields,
  validation,
  onSubmit,
  onClose,
}: DrawerEntityFormProps<T>) {
  const isEditMode = entity !== null;
  const original = React.useMemo(() => (entity ?? initialValue) as T, [entity, initialValue]);

  const validate = React.useCallback(
    (data: T): ValidationErrors => {
      const context: ValidationContext<T> = {
        isEditMode,
        existingIds,
        existingEntities: {},
        originalEntity: entity ?? undefined,
      };
      return validation(data, context);
    },
    [isEditMode, existingIds, validation, entity],
  );

  const [formData, setFormData] = React.useState<T>(original);
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [errors, setErrors] = React.useState<ValidationErrors>(() => validate(original));
  const [submitAttempted, setSubmitAttempted] = React.useState(false);
  const [confirmingDiscard, setConfirmingDiscard] = React.useState(false);

  const dirty = React.useMemo(() => JSON.stringify(formData) !== JSON.stringify(original), [formData, original]);
  const errorList = Object.entries(errors).filter(([, msg]) => !!msg);
  const isValid = errorList.length === 0;

  const handleChange = (value: T) => {
    setFormData(value);
    setErrors(validate(value));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = () => {
    const validationErrors = validate(formData);
    setErrors(validationErrors);
    setSubmitAttempted(true);
    if (Object.values(validationErrors).some((m) => !!m)) return;
    onSubmit(formData);
    onClose();
  };

  const requestClose = () => {
    if (dirty && !confirmingDiscard) {
      setConfirmingDiscard(true);
      return;
    }
    onClose();
  };

  const footer = confirmingDiscard ? (
    <div className="flex items-center justify-between gap-3">
      <span className="font-semibold" style={{ fontSize: '12px', color: '#B91C1C' }}>
        Discard unsaved changes?
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirmingDiscard(false)}
          className="rounded-full border px-3 py-1.5 font-semibold"
          style={{ borderColor: '#E2E8F0', color: '#334155', fontSize: '11.5px' }}
        >
          Keep editing
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-1.5 font-bold text-white"
          style={{ background: '#DC2626', fontSize: '11.5px' }}
        >
          Discard
        </button>
      </div>
    </div>
  ) : (
    <div>
      {submitAttempted && !isValid && (
        <div className="mb-3 rounded-tile border p-3" style={{ borderColor: '#FECACA', background: '#FEF2F2' }}>
          <div className="font-bold" style={{ fontSize: '11.5px', color: '#B91C1C' }}>Please fix the following:</div>
          <ul className="mt-1 space-y-0.5">
            {errorList.map(([field, msg]) => (
              <li key={field} style={{ fontSize: '11px', color: '#B91C1C' }}>
                <span className="font-mono">{field}</span> — {msg}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <span style={{ fontSize: '10px', color: '#94A3B8' }}>
          Saving queues this in Pending changes — nothing ships until you deploy.
        </span>
        <div className="flex flex-shrink-0 gap-2">
          <button
            type="button"
            onClick={requestClose}
            className="rounded-full border px-3 py-1.5 font-semibold"
            style={{ borderColor: '#E2E8F0', color: '#334155', fontSize: '11.5px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className="rounded-full px-4 py-1.5 font-bold text-white disabled:cursor-not-allowed"
            style={{
              background: isValid ? '#50C878' : '#CBD5E1',
              fontSize: '11.5px',
              boxShadow: isValid ? '0 4px 14px rgba(80,200,120,.3)' : 'none',
            }}
          >
            {isEditMode ? `Update ${entityName}` : `Create ${entityName}`}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <Drawer
      open={open}
      onRequestClose={requestClose}
      width={width}
      icon={icon}
      title={isEditMode ? `Edit ${entityName}` : `Create ${entityName}`}
      subtitle={isEditMode ? undefined : `Define a new ${entityName.toLowerCase()}.`}
      footer={footer}
    >
      <FormFields
        value={formData}
        onChange={handleChange}
        errors={errors}
        touched={touched}
        onBlur={handleBlur}
        isEditMode={isEditMode}
        existingIds={existingIds}
      />
    </Drawer>
  );
}
