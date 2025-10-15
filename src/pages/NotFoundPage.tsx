/**
 * NotFoundPage Component
 * 404 error page
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Card, CardContent, Button } from '@/components/ui';

/**
 * Not Found Page (404)
 *
 * Displayed when user navigates to invalid route
 *
 * @example
 * ```tsx
 * <NotFoundPage />
 * ```
 */
export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const suggestions = [
    { label: 'Home', path: '/', icon: <Home className="w-4 h-4" /> },
    { label: 'Programs', path: '/programs', icon: null },
    { label: 'Forms', path: '/forms', icon: null },
    { label: 'CTAs', path: '/ctas', icon: null },
    { label: 'Branches', path: '/branches', icon: null },
    { label: 'Settings', path: '/settings', icon: null },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="pt-6 text-center space-y-6">
          {/* 404 Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <Search className="w-24 h-24 text-gray-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl font-bold text-gray-200">404</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Page Not Found</h1>
            <p className="text-gray-600">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </div>

          {/* Suggested Pages */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Suggested Pages
            </h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion.path}
                  onClick={() => navigate(suggestion.path)}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {suggestion.icon}
                  {suggestion.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
