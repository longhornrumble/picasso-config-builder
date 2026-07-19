/**
 * BrandingSettings Component
 * Hairline brand configuration — the tenant-variable inputs, nothing else.
 *
 * Hairline (the widget's baked design) takes exactly two brand inputs per
 * tenant: primary_color and font_family. Everything else colored is either a
 * fixed design constant (surface, the ink text scale) or DERIVED from
 * primary_color at runtime by the widget's tenantTheme() engine — accent
 * (saturation-capped), accent-deep (auto-darkened to WCAG AA), tints (bubble
 * fills), and the hairline border ramp. Per-field color pickers would sit
 * outside that ramp and could break the contrast guarantee the math provides,
 * so this tab deliberately does not offer them (Chris ruling, 2026-07-19).
 * Legacy branding fields on existing tenants live in the config file directly.
 *
 * secondary_color is accepted by the engine but dormant (decision D10) — it
 * gets a UI here if/when the derivation consumes it.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Select } from '@/components/ui';
import { useConfigStore } from '@/store';
import type { BrandingConfig } from '@/types/config';

/**
 * The widget's self-hosted font menu. Source of truth: Picasso/src/theme/
 * tenantTheme.js FONT_STACKS + Picasso/src/styles/fonts.css (which documents
 * the add-a-font recipe: drop woff2 files in public/fonts/<name>/, add
 * @font-face blocks, add a FONT_STACKS entry). Grow this list in lockstep
 * when a client font is added to the widget.
 */
const FONT_OPTIONS = [
  { value: 'plus-jakarta-sans', label: 'Plus Jakarta Sans (default)' },
  { value: 'inter', label: 'Inter' },
  { value: 'lato', label: 'Lato' },
  { value: 'arial', label: 'Arial (system)' },
];

export const BrandingSettings: React.FC = () => {
  const baseConfig = useConfigStore((state) => state.config.baseConfig);

  const updateBranding = (field: string, value: unknown) => {
    useConfigStore.setState((state) => {
      if (state.config.baseConfig) {
        if (!state.config.baseConfig.branding) {
          state.config.baseConfig.branding = {} as BrandingConfig;
        }
        (state.config.baseConfig.branding as Record<string, unknown>)[field] = value;
        state.config.isDirty = true;
      }
    });
  };

  const branding: Partial<BrandingConfig> = baseConfig?.branding || {};

  // A stored legacy free-text value ("Inter, sans-serif") matches no font key
  // and renders as the default in the Hairline widget. Show it unselected so
  // re-saving picks a real key.
  const fontValue = FONT_OPTIONS.some((o) => o.value === branding.font_family)
    ? (branding.font_family as string)
    : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand</CardTitle>
        <CardDescription>
          The two tenant-variable inputs of the Hairline design. Every other
          color — bubbles, borders, labels — is derived from the brand color
          automatically, with text contrast guaranteed by the widget.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Brand Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Brand Color
          </label>
          <input
            type="color"
            value={branding.primary_color || '#a08a4a'}
            onChange={(e) => updateBranding('primary_color', e.target.value)}
            className="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            The client&apos;s primary brand color. The widget derives its full
            palette from this one value: accent tones, bubble tints, and the
            hairline borders. Dark accents are auto-adjusted to meet WCAG AA
            contrast.
          </p>
        </div>

        {/* Font Family */}
        <Select
          label="Font Family"
          value={fontValue}
          onValueChange={(value) => updateBranding('font_family', value)}
          options={FONT_OPTIONS}
          placeholder="Select a font"
          helperText="Fonts are self-hosted by the widget. A client font not listed here is a small widget change (see fonts.css) — add it there first. Legacy free-text values render as Plus Jakarta Sans until re-saved."
        />

        {/* Layout */}
        <Select
          label="Chat Position"
          value={branding.chat_position || 'bottom-right'}
          onValueChange={(value) => updateBranding('chat_position', value)}
          options={[
            { value: 'bottom-right', label: 'Bottom Right' },
            { value: 'bottom-left', label: 'Bottom Left' },
          ]}
          helperText="Widget placement on the page. Note: the current Hairline shell pins the panel bottom-right (W6.1); honoring this field again is a pending widget-host change."
        />
      </CardContent>
    </Card>
  );
};
