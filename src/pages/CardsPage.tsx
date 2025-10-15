/**
 * CardsPage Component
 * Card inventory viewer page placeholder
 */

import React from 'react';
import { CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@/components/ui';
import { useConfigStore } from '@/store';

/**
 * Card Inventory Page
 *
 * Placeholder for optional card inventory viewer
 *
 * @example
 * ```tsx
 * <CardsPage />
 * ```
 */
export const CardsPage: React.FC = () => {
  const tenantId = useConfigStore((state) => state.config.tenantId);
  const cardInventory = useConfigStore((state) => state.cardInventory.cardInventory);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-indigo-600" />
            Card Inventory
          </h1>
          <p className="text-gray-600 mt-2">
            View available response cards and actions
          </p>
        </div>
      </div>

      {/* No Tenant Selected */}
      {!tenantId && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <p className="text-amber-800">
              Please select a tenant from the header to view card inventory.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Card Inventory Display */}
      {tenantId && (
        <>
          {!cardInventory ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Card Inventory
                </h3>
                <p className="text-gray-600">
                  This tenant does not have a card inventory configured.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {/* Program Cards */}
              {cardInventory.program_cards && cardInventory.program_cards.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Program Cards</CardTitle>
                    <CardDescription>
                      {cardInventory.program_cards.length} cards available
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {cardInventory.program_cards.map((card: any, idx: number) => (
                        <div
                          key={idx}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold">{card.name || `Card ${idx + 1}`}</h4>
                            <Badge variant="info">Program</Badge>
                          </div>
                          {card.description && (
                            <p className="text-sm text-gray-600">{card.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Requirements */}
              {cardInventory.requirements && cardInventory.requirements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                    <CardDescription>
                      {cardInventory.requirements.length} requirements available
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {cardInventory.requirements.map((req: any, idx: number) => (
                        <div
                          key={idx}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                        >
                          <h4 className="font-semibold">{req.display_text || `Requirement ${idx + 1}`}</h4>
                          {req.value && (
                            <p className="text-sm text-gray-600 mt-1">{req.value}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {/* Info Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">About Card Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-800">
            The card inventory contains action cards, programs, and requirements that can be
            referenced in your configuration. This is typically generated from your knowledge
            base or manually defined.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
