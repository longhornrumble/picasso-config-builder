/**
 * CTACategoriesSettings Component
 * Manages tenant-level CTA category definitions for V4 AI action selection
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button } from '@/components/ui';
import { useConfigStore } from '@/store';
import { Plus, Trash2, Tags } from 'lucide-react';

const DEFAULT_CATEGORIES: Record<string, string> = {
  learn: 'User is exploring or asking questions. Surface these when the conversation is informational.',
  apply: 'User wants to participate — volunteer, mentor, or join a program. Surface when they express intent to get involved.',
  request: 'User is seeking services or help for themselves or someone they care for. Surface when they express a need.',
  give: 'User wants to contribute — donate money, items, or time. Surface when they ask about supporting or helping.',
  connect: 'User needs a specific resource — a link, download, or contact. Surface when they ask for something concrete.',
};

export const CTACategoriesSettings: React.FC = () => {
  const baseConfig = useConfigStore((state) => state.config.baseConfig);
  const [newKey, setNewKey] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');

  const categories = baseConfig?.cta_categories || {};

  const updateCategory = (key: string, description: string) => {
    useConfigStore.setState((state) => {
      if (state.config.baseConfig) {
        if (!state.config.baseConfig.cta_categories) {
          state.config.baseConfig.cta_categories = {};
        }
        state.config.baseConfig.cta_categories[key] = description;
        state.config.isDirty = true;
      }
    });
  };

  const deleteCategory = (key: string) => {
    useConfigStore.setState((state) => {
      if (state.config.baseConfig?.cta_categories) {
        delete state.config.baseConfig.cta_categories[key];
        state.config.isDirty = true;
      }
    });
  };

  const handleAdd = () => {
    const trimmedKey = newKey.trim().toLowerCase().replace(/\s+/g, '_');
    if (!trimmedKey || !newDescription.trim()) return;
    if (categories[trimmedKey]) return;

    updateCategory(trimmedKey, newDescription.trim());
    setNewKey('');
    setNewDescription('');
  };

  const handleStartEdit = (key: string) => {
    setEditingKey(key);
    setEditDescription(categories[key]);
  };

  const handleSaveEdit = () => {
    if (editingKey && editDescription.trim()) {
      updateCategory(editingKey, editDescription.trim());
      setEditingKey(null);
      setEditDescription('');
    }
  };

  const handleLoadDefaults = () => {
    Object.entries(DEFAULT_CATEGORIES).forEach(([key, desc]) => {
      if (!categories[key]) {
        updateCategory(key, desc);
      }
    });
  };

  const categoryEntries = Object.entries(categories);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tags className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          CTA Categories (V4)
        </CardTitle>
        <CardDescription>
          Define categories that help the AI decide when to surface CTAs. Each category has an ID and a description the AI reads during action selection.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing categories */}
        {categoryEntries.length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No categories defined yet.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handleLoadDefaults}
            >
              Load Default Categories
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {categoryEntries.map(([key, description]) => (
              <div
                key={key}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
              >
                {editingKey === key ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {key}
                      </span>
                    </div>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      rows={2}
                      maxLength={200}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveEdit}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingKey(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {key}
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        {description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEdit(key)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => deleteCategory(key)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add new category */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Add Category
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              placeholder="e.g., learn"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              helperText="Category ID (lowercase, no spaces)"
            />
            <div className="sm:col-span-2">
              <Input
                placeholder="Description for the AI..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                helperText="When should the AI surface CTAs in this category?"
              />
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!newKey.trim() || !newDescription.trim() || !!categories[newKey.trim().toLowerCase().replace(/\s+/g, '_')]}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Category
          </Button>
        </div>

        {/* Load defaults button (when some categories exist but not all defaults) */}
        {categoryEntries.length > 0 && Object.keys(DEFAULT_CATEGORIES).some(k => !categories[k]) && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadDefaults}
            >
              Load Missing Default Categories
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
