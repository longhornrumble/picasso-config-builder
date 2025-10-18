/**
 * CTAPreview Component
 * Real-time preview of how the CTA button will appear in the chat interface
 *
 * This component uses the same CSS classes as the actual Picasso widget
 * to provide an accurate representation of the final appearance.
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

  // Map style to CSS class modifiers
  const getStyleClass = () => {
    switch (cta.style) {
      case 'primary':
        return 'action-chip-primary';
      case 'secondary':
        return 'action-chip-secondary';
      case 'info':
        return 'action-chip-info';
      default:
        return 'action-chip-primary';
    }
  };

  // Get icon based on action type
  const getActionIcon = () => {
    switch (cta.action) {
      case 'start_form':
        return (
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" />
          </svg>
        );
      case 'external_link':
        return (
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
          </svg>
        );
      case 'send_query':
        return (
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
        );
      case 'show_info':
        return (
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
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
                className={`action-chip ${getStyleClass()} inline-flex items-center gap-2 transition-all`}
                disabled
              >
                {getActionIcon()}
                <span className="font-medium">{cta.label}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Info badge showing style */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Style:
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            cta.style === 'primary'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : cta.style === 'secondary'
              ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
          }`}>
            {cta.style || 'primary'}
          </span>

          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-2">
            Action:
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            {cta.action?.replace('_', ' ') || 'none'}
          </span>
        </div>
      </div>

      {/* CSS Variables Note */}
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

        .action-chip-info {
          background-color: rgb(139, 92, 246);
          color: white;
          border: 1px solid rgb(139, 92, 246);
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
