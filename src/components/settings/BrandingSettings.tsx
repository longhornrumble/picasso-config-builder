/**
 * BrandingSettings Component
 * Visual branding and styling configuration
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input } from '@/components/ui';
import { useConfigStore } from '@/store';
import type { BrandingConfig } from '@/types/config';

/**
 * Branding Settings Component
 *
 * Manages visual branding configuration:
 * - Color scheme (primary, secondary, accent, etc.)
 * - Typography (font family, base size)
 * - Layout (border radius, chat position)
 * - Asset URLs (logo, avatar, company logo)
 *
 * @example
 * ```tsx
 * <BrandingSettings />
 * ```
 */
export const BrandingSettings: React.FC = () => {
  const baseConfig = useConfigStore((state) => state.config.baseConfig);

  // Update branding field
  const updateBranding = (field: string, value: any) => {
    useConfigStore.setState((state) => {
      if (state.config.baseConfig) {
        if (!state.config.baseConfig.branding) {
          state.config.baseConfig.branding = {} as any;
        }
        (state.config.baseConfig.branding as any)[field] = value;
        state.config.isDirty = true;
      }
    });
  };

  const branding: Partial<BrandingConfig> = baseConfig?.branding || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding & Styling</CardTitle>
        <CardDescription>
          Customize colors, typography, and visual assets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Colors */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Primary Colors</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Primary Color
              </label>
              <input
                type="color"
                value={branding.primary_color || '#10b981'}
                onChange={(e) => updateBranding('primary_color', e.target.value)}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Secondary Color (Legacy)
              </label>
              <input
                type="color"
                value={branding.secondary_color || '#059669'}
                onChange={(e) => updateBranding('secondary_color', e.target.value)}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Accent Color (Legacy)
              </label>
              <input
                type="color"
                value={branding.accent_color || '#3b82f6'}
                onChange={(e) => updateBranding('accent_color', e.target.value)}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Background Color
              </label>
              <input
                type="color"
                value={branding.background_color || '#ffffff'}
                onChange={(e) => updateBranding('background_color', e.target.value)}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Header Colors */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Header</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Header Background
              </label>
              <input
                type="color"
                value={branding.header_background || '#10b981'}
                onChange={(e) => updateBranding('header_background', e.target.value)}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Header Text Color
              </label>
              <input
                type="color"
                value={branding.header_text_color || '#ffffff'}
                onChange={(e) => updateBranding('header_text_color', e.target.value)}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Header Subtitle Color
              </label>
              <input
                type="color"
                value={branding.header_subtitle_color || '#d1fae5'}
                onChange={(e) => updateBranding('header_subtitle_color', e.target.value)}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Chat Bubble Colors */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Chat Bubbles</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                User Bubble Color
              </label>
              <input
                type="color"
                value={branding.user_bubble_color || '#10b981'}
                onChange={(e) => updateBranding('user_bubble_color', e.target.value)}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                User Text Color
              </label>
              <input
                type="color"
                value={branding.user_text_color || '#ffffff'}
                onChange={(e) => updateBranding('user_text_color', e.target.value)}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bot Bubble Color
              </label>
              <input
                type="color"
                value={branding.bot_bubble_color || '#f3f4f6'}
                onChange={(e) => updateBranding('bot_bubble_color', e.target.value)}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bot Text Color
              </label>
              <input
                type="color"
                value={branding.bot_text_color || '#1f2937'}
                onChange={(e) => updateBranding('bot_text_color', e.target.value)}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Widget Colors */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Widget</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Widget Color
              </label>
              <input
                type="color"
                value={branding.widget_color || '#10b981'}
                onChange={(e) => updateBranding('widget_color', e.target.value)}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Widget Text Color
              </label>
              <input
                type="color"
                value={branding.widget_text_color || '#ffffff'}
                onChange={(e) => updateBranding('widget_text_color', e.target.value)}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Typography */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Typography</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Font Family"
              value={branding.font_family || 'system-ui, -apple-system, sans-serif'}
              onChange={(e) => updateBranding('font_family', e.target.value)}
              placeholder="e.g., Inter, sans-serif"
              helperText="CSS font-family value"
            />
            <Input
              label="Base Font Size (Legacy)"
              value={branding.font_size_base || '14px'}
              onChange={(e) => updateBranding('font_size_base', e.target.value)}
              placeholder="e.g., 14px, 1rem"
              helperText="Base font size — widget uses its own sizing"
            />
          </div>
        </div>

        {/* Layout */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Layout</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Border Radius (Legacy)"
              value={branding.border_radius || '12px'}
              onChange={(e) => updateBranding('border_radius', e.target.value)}
              placeholder="e.g., 12px, 0.75rem"
              helperText="Border radius — widget uses hardcoded values"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Chat Position
              </label>
              <select
                value={branding.chat_position || 'bottom-right'}
                onChange={(e) => updateBranding('chat_position', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Widget position on the page
              </p>
            </div>
          </div>
        </div>

        {/* Asset URLs */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Asset URLs</h3>
          <div className="space-y-4">
            <Input
              label="Logo URL"
              type="url"
              value={branding.logo_url || ''}
              onChange={(e) => updateBranding('logo_url', e.target.value)}
              placeholder="https://example.com/logo.png"
              helperText="URL to logo image shown in header"
            />
            <Input
              label="Avatar URL"
              type="url"
              value={branding.avatar_url || ''}
              onChange={(e) => updateBranding('avatar_url', e.target.value)}
              placeholder="https://example.com/avatar.png"
              helperText="URL to bot avatar image"
            />
            <Input
              label="Company Logo URL"
              type="url"
              value={branding.company_logo_url || ''}
              onChange={(e) => updateBranding('company_logo_url', e.target.value)}
              placeholder="https://example.com/company-logo.png"
              helperText="URL to company logo for branding"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
