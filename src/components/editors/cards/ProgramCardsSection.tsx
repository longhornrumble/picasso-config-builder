/**
 * ProgramCardsSection Component
 * CRUD interface for managing program cards
 */

import React from 'react';
import { Input, Textarea, Button, Badge } from '@/components/ui';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import type { ProgramCard } from '@/types/config';

export interface ProgramCardsSectionProps {
  value: ProgramCard[];
  onChange: (value: ProgramCard[]) => void;
}

export const ProgramCardsSection: React.FC<ProgramCardsSectionProps> = ({
  value,
  onChange,
}) => {
  const handleAddProgramCard = () => {
    const newCard: ProgramCard = {
      name: '',
      description: '',
      commitment: '',
      url: '',
    };
    onChange([...value, newCard]);
  };

  const handleUpdateProgramCard = (
    index: number,
    updates: Partial<ProgramCard>
  ) => {
    const updated = [...value];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const handleRemoveProgramCard = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Program Cards
        </h2>
        <Button
          type="button"
          onClick={handleAddProgramCard}
          size="sm"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Program Card
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">
            No program cards defined. Click "Add Program Card" to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {value.map((card, index) => (
            <div
              key={index}
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-700"
            >
              <div className="flex items-center justify-between">
                <Badge variant="outline">Program {index + 1}</Badge>
                <button
                  type="button"
                  onClick={() => handleRemoveProgramCard(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <Input
                label="Name"
                value={card.name}
                onChange={(e) =>
                  handleUpdateProgramCard(index, { name: e.target.value })
                }
                placeholder="e.g., Volunteer Tutoring Program"
                required
              />

              <div className="w-full">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description <span className="text-red-600">*</span>
                </label>
                <Textarea
                  value={card.description}
                  onChange={(e) =>
                    handleUpdateProgramCard(index, {
                      description: e.target.value,
                    })
                  }
                  placeholder="Brief description of the program..."
                  rows={3}
                />
              </div>

              <Input
                label="Commitment"
                value={card.commitment}
                onChange={(e) =>
                  handleUpdateProgramCard(index, {
                    commitment: e.target.value,
                  })
                }
                placeholder="e.g., 4 hours/week"
                required
              />

              <div className="w-full">
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <ExternalLink className="w-4 h-4" />
                  Program URL <span className="text-red-600">*</span>
                </label>
                <Input
                  value={card.url}
                  onChange={(e) =>
                    handleUpdateProgramCard(index, { url: e.target.value })
                  }
                  placeholder="https://example.com/programs/tutoring"
                  type="url"
                  required
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Create program cards to showcase available opportunities to users.
      </p>
    </div>
  );
};
