/**
 * English message catalog — the only locale populated for scheduling v1
 * (impl plan sub-phase A8b: "v1 only populates `en` keys").
 *
 * Scheduling UI strings are added here as later sub-phases (C/D/E) build
 * user-facing surfaces. Sub-phase A seeds the structure only; the two keys
 * below exist to exercise the `t()` indirection and its `{param}`
 * interpolation. Keys are dot-namespaced by surface.
 */
export const en = {
  'scheduling.test_key': 'Scheduling is configured.',
  'scheduling.test_key_param': 'Booked with {name}.',
} as const;

export type MessageKey = keyof typeof en;
