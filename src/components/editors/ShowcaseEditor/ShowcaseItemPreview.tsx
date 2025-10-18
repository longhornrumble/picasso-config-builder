/**
 * ShowcaseItemPreview Component
 * Real-time preview of how the showcase card will appear in the chat interface
 *
 * This component uses the same CSS classes from theme.css as the actual Picasso widget
 * to provide an accurate representation of the final appearance.
 */

import React from 'react';
import type { ShowcaseItemEntity } from './types';

interface ShowcaseItemPreviewProps {
  item: ShowcaseItemEntity;
}

export const ShowcaseItemPreview: React.FC<ShowcaseItemPreviewProps> = ({ item }) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);

  // Reset image states when URL changes
  React.useEffect(() => {
    if (item.image_url) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [item.image_url]);

  // Don't show preview if required fields are missing
  if (!item.name || !item.tagline || !item.description) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-8">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Fill in name, tagline, and description to see preview
          </p>
        </div>
      </div>
    );
  }

  // Get action icon based on type
  const getActionIcon = () => {
    if (!item.action) return null;

    switch (item.action.type) {
      case 'url':
        return (
          <svg className="showcase-card-action-icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
          </svg>
        );
      case 'prompt':
        return (
          <svg className="showcase-card-action-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        );
      case 'cta':
        return (
          <svg className="showcase-card-action-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
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
          How this showcase card will appear in the chat
        </p>
      </div>

      {/* The actual showcase card preview using theme.css classes */}
      <div className="showcase-card">
        {/* Header section with image */}
        {item.image_url && (
          <div className="showcase-card-header">
            {imageError ? (
              <div className="showcase-card-image-placeholder">
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Image failed to load
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {item.image_url.length > 40
                    ? item.image_url.substring(0, 40) + '...'
                    : item.image_url}
                </p>
              </div>
            ) : (
              <>
                {imageLoading && (
                  <div className="showcase-card-image-placeholder">
                    <svg className="w-8 h-8 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Loading image...
                    </p>
                  </div>
                )}
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="showcase-card-image"
                  style={{ display: imageLoading ? 'none' : 'block' }}
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageError(true);
                    setImageLoading(false);
                  }}
                />
              </>
            )}
          </div>
        )}

        {/* Content section */}
        <div className="showcase-card-content">
          <h3 className="showcase-card-title">{item.name}</h3>

          <p className="showcase-card-tagline">{item.tagline}</p>

          <p className="showcase-card-description">{item.description}</p>

          {/* Stats/commitment */}
          {item.stats && (
            <div className="showcase-card-stats">
              <svg className="showcase-card-stats-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="showcase-card-stats-text">{item.stats}</span>
            </div>
          )}

          {/* Testimonial */}
          {item.testimonial && (
            <div className="showcase-card-testimonial">
              <svg className="showcase-card-testimonial-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              <p className="showcase-card-testimonial-text">{item.testimonial}</p>
            </div>
          )}

          {/* Highlights - Two Column Layout */}
          {item.highlights && item.highlights.length > 0 && (
            <ul className="showcase-card-highlights">
              {item.highlights.map((highlight, idx) => (
                <li key={idx} className="showcase-card-highlight-item">
                  <svg className="showcase-card-highlight-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="showcase-card-highlight-text">{highlight}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Action button */}
        {item.action && item.action.label && (
          <div className="showcase-card-footer">
            <button
              type="button"
              className="showcase-card-action"
              disabled
            >
              <span className="showcase-card-action-text">{item.action.label}</span>
              {getActionIcon()}
            </button>
          </div>
        )}
      </div>

      {/* Info badges */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Type:</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          {item.type || 'program'}
        </span>

        {item.action && (
          <>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-2">
              Action:
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {item.action.type === 'prompt' ? 'Ask Bedrock' :
               item.action.type === 'url' ? 'External Link' :
               item.action.type === 'cta' ? 'Trigger CTA' : 'None'}
            </span>
          </>
        )}

        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-2">
          Enabled:
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          item.enabled
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {item.enabled ? 'Yes' : 'No'}
        </span>
      </div>

      {/* Import showcase card styles from theme.css */}
      <style>{`
        /* Showcase card styles - compact for inline chat display */
        .showcase-card {
          background-color: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 10px;
          padding: 12px;
          margin: 8px 0;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
          transition: all 0.2s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          max-width: 420px;
        }

        .showcase-card-header {
          margin-bottom: 8px;
        }

        .showcase-card-image {
          width: 100%;
          height: auto;
          max-height: 140px;
          object-fit: cover;
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .showcase-card-image-placeholder {
          width: 100%;
          min-height: 100px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: #f3f4f6;
          border: 2px dashed #d1d5db;
          border-radius: 6px;
          margin-bottom: 8px;
          padding: 16px;
          text-align: center;
        }

        .showcase-card-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .showcase-card-title {
          margin: 0 0 3px 0;
          font-size: 16px;
          font-weight: 600;
          line-height: 1.3;
          color: #1a1a1a;
        }

        .showcase-card-tagline {
          margin: 0 0 6px 0;
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
        }

        .showcase-card-description {
          margin: 0 0 8px 0;
          font-size: 13px;
          line-height: 1.4;
          color: #4a4a4a;
        }

        .showcase-card-stats {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin: 4px 0;
          padding: 3px 8px;
          background-color: rgba(107, 114, 128, 0.08);
          border-radius: 4px;
          font-size: 12px;
          color: #6b7280;
        }

        .showcase-card-stats-icon {
          width: 14px;
          height: 14px;
          color: #6b7280;
          flex-shrink: 0;
        }

        .showcase-card-stats-text {
          font-size: 12px;
          color: #6b7280;
        }

        .showcase-card-testimonial {
          display: flex;
          gap: 6px;
          padding: 8px;
          background-color: rgba(59, 130, 246, 0.05);
          border-left: 2px solid rgba(59, 130, 246, 0.3);
          border-radius: 3px;
          margin: 6px 0;
        }

        .showcase-card-testimonial-icon {
          width: 14px;
          height: 14px;
          color: #3b82f6;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .showcase-card-testimonial-text {
          font-size: 12px;
          line-height: 1.4;
          color: #4a4a4a;
          margin: 0;
          font-style: italic;
        }

        .showcase-card-highlights {
          list-style: none;
          padding: 0;
          margin: 6px 0;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 4px 8px;
        }

        .showcase-card-highlight-item {
          display: flex;
          align-items: flex-start;
          gap: 6px;
        }

        .showcase-card-highlight-icon {
          width: 14px;
          height: 14px;
          color: #10b981;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .showcase-card-highlight-text {
          font-size: 12px;
          line-height: 1.4;
          color: #4a4a4a;
        }

        .showcase-card-footer {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }

        .showcase-card-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 6px 12px;
          background: rgb(59, 130, 246);
          color: white;
          border: 1px solid rgb(59, 130, 246);
          border-radius: 5px;
          font-size: 13px;
          font-weight: 500;
          cursor: not-allowed;
          transition: all 0.2s ease;
          opacity: 0.95;
        }

        .showcase-card-action-icon {
          width: 14px;
          height: 14px;
        }

        .showcase-card-action-text {
          font-weight: 500;
        }

        /* Dark mode */
        :global(.dark) .showcase-card {
          background-color: #1f2937;
          border-color: rgba(255, 255, 255, 0.1);
        }

        :global(.dark) .showcase-card-title {
          color: #f3f4f6;
        }

        :global(.dark) .showcase-card-tagline,
        :global(.dark) .showcase-card-stats-text {
          color: #9ca3af;
        }

        :global(.dark) .showcase-card-description,
        :global(.dark) .showcase-card-highlight-text,
        :global(.dark) .showcase-card-testimonial-text {
          color: #d1d5db;
        }

        :global(.dark) .showcase-card-testimonial {
          background-color: rgba(59, 130, 246, 0.1);
        }

        :global(.dark) .showcase-card-image-placeholder {
          background-color: #374151;
          border-color: #4b5563;
        }
      `}</style>
    </div>
  );
};
