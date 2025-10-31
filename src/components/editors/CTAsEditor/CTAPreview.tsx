/**
 * CTAPreview Component
 * Real-time preview of how the CTA button will appear in the chat interface
 *
 * This component uses the same CSS classes as the actual Picasso widget
 * to provide an accurate representation of the final appearance.
 *
 * Note: CTA buttons display text-only. Users can add emojis by typing them
 * directly into the label field (e.g., "🤝 Volunteer with us").
 */

import React from 'react';
import type { CTAEntity } from './types';

interface CTAPreviewProps {
  cta: CTAEntity;
}

export const CTAPreview: React.FC<CTAPreviewProps> = ({ cta }) => {
  // Don't show preview if required fields are missing
  if (!cta.label) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-8">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter a label to see preview
          </p>
        </div>
      </div>
    );
  }

  // Position-based styling - simulates backend behavior
  // Primary: form triggers and important actions
  // Secondary: informational and navigation actions
  const getStyleClass = () => {
    // Simulate position-based styling logic
    if (cta.action === 'start_form' || cta.type === 'form_trigger') {
      return 'action-chip-primary';
    }
    return 'action-chip-secondary';
  };


  return (
    <div className="rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50 p-6">
      {/* Preview Header */}
      <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-600">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          Live Preview
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          How this CTA will appear in the chat
        </p>
      </div>

      {/* Mock Chat Interface */}
      <div className="space-y-3">
        {/* Mock bot message */}
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1 space-y-2">
            <div className="inline-block bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200">
              How can I help you today?
            </div>

            {/* The actual CTA button preview */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`action-chip ${getStyleClass()} transition-all`}
                disabled
              >
                {cta.label}
              </button>
            </div>
          </div>
        </div>

        {/* Info badge showing action & type */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Action:
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            {cta.action?.replace('_', ' ') || 'none'}
          </span>

          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-2">
            Type:
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            {cta.type?.replace('_', ' ') || 'none'}
          </span>

          <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto italic">
            Position assigned by backend
          </span>
        </div>
      </div>

      {/* Position-Based Styling Preview */}
      <style>{`
        .action-chip {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: not-allowed;
          transition: all 0.2s ease;
          opacity: 0.95;
        }

        .action-chip-primary {
          background-color: rgb(59, 130, 246);
          color: white;
          border: 1px solid rgb(59, 130, 246);
        }

        .action-chip-secondary {
          background-color: white;
          color: rgb(59, 130, 246);
          border: 1px solid rgb(59, 130, 246);
        }

        /* Dark mode adjustments */
        :global(.dark) .action-chip-secondary {
          background-color: rgb(31, 41, 55);
          border-color: rgb(59, 130, 246);
        }
      `}</style>
    </div>
  );
};
