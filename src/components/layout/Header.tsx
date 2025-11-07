/**
 * Header Component
 * Top navigation bar with tenant selector and deploy button
 */

import React, { useState } from 'react';
import { Save, Eye, Menu } from 'lucide-react';
import { TenantSelector } from '../TenantSelector';
import { Button, Badge } from '../ui';
import { PreviewConfigModal } from '../preview/PreviewConfigModal';
import { ValidationSummary } from './ValidationSummary';
import { DeployButton } from '../deploy';
import { useConfigStore } from '@/store';
import { useSaveShortcut } from '@/hooks/useKeyboardShortcuts';

/**
 * Application Header
 *
 * Features:
 * - App title and branding
 * - Tenant selector dropdown
 * - Deploy button (visible when dirty)
 * - Save button (visible when dirty)
 * - Validation summary indicator
 * - Confirmation modal before deploy
 *
 * @example
 * ```tsx
 * <Header />
 * ```
 */
export const Header: React.FC = () => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const tenantId = useConfigStore((state) => state.config.tenantId);
  const isDirty = useConfigStore((state) => state.config.isDirty);
  const isValid = useConfigStore((state) => state.validation.isValid);
  const saveConfig = useConfigStore((state) => state.config.saveConfig);
  const loading = useConfigStore((state) => state.ui.loading);
  const toggleSidebar = useConfigStore((state) => state.ui.toggleSidebar);

  const isSaving = loading?.save || false;

  const handleSave = async () => {
    try {
      await saveConfig();
    } catch (err) {
      // Error handling is done in the store
      console.error('Save failed:', err);
    }
  };

  // Register global save shortcut (Ctrl/Cmd+S)
  useSaveShortcut(handleSave, { disabled: !isDirty || !isValid || isSaving || !tenantId });

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          {/* Left: Hamburger Menu + Logo and Title */}
          <div className="header-left-section">
            {/* Hamburger Menu Button - Mobile Only */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="hide-desktop flex-shrink-0"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </Button>

            <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-1 sm:gap-2 truncate">
              <span className="text-xl sm:text-2xl flex-shrink-0">🎨</span>
              <span className="hide-mobile">Picasso Config Builder</span>
              <span className="hide-desktop">Picasso</span>
            </h1>
            {tenantId && (
              <Badge variant="outline" className="text-xs show-tablet-up">
                {tenantId}
              </Badge>
            )}
          </div>

          {/* Right: Tenant Selector and Actions */}
          <div className="header-right-section">
            {/* Validation Summary Badge */}
            <div className="hide-mobile">
              <ValidationSummary showCounts />
            </div>

            {/* Keyboard Shortcuts Help */}
            {/* Temporarily disabled due to TrustedHTML error */}
            {/* <div className="hide-mobile">
              <KeyboardShortcutsHelp />
            </div> */}

            {/* Tenant Selector */}
            <TenantSelector />

            {/* Preview Button */}
            {tenantId && (
              <Button
                onClick={() => setShowPreviewModal(true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 sm:gap-2"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden lg:inline">Preview</span>
              </Button>
            )}

            {/* Save Button */}
            {isDirty && tenantId && (
              <Button
                onClick={handleSave}
                variant="outline"
                size="sm"
                disabled={!isValid || isSaving}
                className="flex items-center gap-1 sm:gap-2"
                title="Save changes (Ctrl/Cmd+S)"
              >
                <Save className="w-4 h-4" />
                <span className="hidden lg:inline">
                  {isSaving ? 'Saving...' : 'Save'}
                </span>
              </Button>
            )}

            {/* Deploy Button - New Component */}
            <DeployButton />
          </div>
        </div>
      </header>

      {/* Preview Config Modal */}
      <PreviewConfigModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
      />
    </>
  );
};
