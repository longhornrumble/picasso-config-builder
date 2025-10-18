/**
 * TenantSelector Component
 * Dropdown for selecting and loading tenant configurations
 */

import React, { useState, useEffect } from 'react';
import { Building2, Check } from 'lucide-react';
import { Select } from './ui';
import { useConfigStore } from '@/store';
import { listTenants } from '@/lib/api';
import type { SelectOption } from './ui/Select';

interface TenantSelectorProps {
  className?: string;
  onTenantChange?: (tenantId: string) => void;
}

/**
 * Tenant Selector Component
 *
 * Features:
 * - Fetches available tenants from API
 * - Displays current tenant selection
 * - Loads config when tenant changes
 * - Shows loading states
 * - Error handling
 *
 * @example
 * ```tsx
 * <TenantSelector onTenantChange={(id) => console.log('Selected:', id)} />
 * ```
 */
export const TenantSelector: React.FC<TenantSelectorProps> = ({
  className,
  onTenantChange,
}) => {
  const [tenants, setTenants] = useState<SelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tenantId = useConfigStore((state) => state.config.tenantId);
  const loadConfig = useConfigStore((state) => state.config.loadConfig);
  const addToast = useConfigStore((state) => state.ui.addToast);

  // Fetch available tenants on mount
  useEffect(() => {
    const fetchTenants = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const tenantsList = await listTenants();

        // Convert tenant list to select options
        const options: SelectOption[] = tenantsList.map((tenant: any) => ({
          value: tenant.tenantId,
          label: tenant.tenantName || tenant.tenantId,
        }));

        setTenants(options);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load tenants';
        setError(errorMessage);
        if (addToast) {
          addToast({
            type: 'error',
            message: errorMessage,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenants();
  }, [addToast]);

  const handleTenantChange = async (value: string) => {
    if (!value || value === tenantId) {
      return;
    }

    try {
      await loadConfig(value);
      onTenantChange?.(value);
    } catch (err) {
      // Error handling is done in the store's loadConfig method
      console.error('Failed to load tenant config:', err);
    }
  };

  if (error) {
    return (
      <div className={`flex items-center gap-2 text-sm text-red-600 ${className || ''}`}>
        <Building2 className="w-4 h-4" />
        <span>Failed to load tenants</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Building2 className="w-4 h-4 text-gray-500" />
      <Select
        value={tenantId || ''}
        onValueChange={handleTenantChange}
        options={tenants}
        placeholder={isLoading ? 'Loading tenants...' : 'Select a tenant'}
        disabled={isLoading}
        className="min-w-[200px]"
      />
      {tenantId && (
        <Check className="w-4 h-4 text-green-600" />
      )}
    </div>
  );
};
