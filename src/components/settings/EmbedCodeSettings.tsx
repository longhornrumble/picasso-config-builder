/**
 * EmbedCodeSettings Component
 * Displays embed code and tenant identifiers for the loaded tenant
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/components/ui';
import { useConfigStore } from '@/store';
import { Copy, Check } from 'lucide-react';

export const EmbedCodeSettings: React.FC = () => {
  const baseConfig = useConfigStore((state) => state.config.baseConfig);
  const tenantId = useConfigStore((state) => state.config.tenantId);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const tenantHash = baseConfig?.tenant_hash || '';

  const embedCode = tenantHash
    ? `<script src="https://chat.myrecruiter.ai/widget.js" data-tenant="${tenantHash}" async></script>`
    : '';

  const handleCopy = async (text: string, setter: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  if (!tenantHash) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Embed Code</CardTitle>
        <CardDescription>
          Widget installation code for the client's website
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tenant identifiers */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Tenant ID
            </label>
            <div className="text-sm font-mono text-gray-900 dark:text-gray-100">
              {tenantId}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Tenant Hash
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                {tenantHash}
              </span>
              <button
                onClick={() => handleCopy(tenantHash, setCopiedHash)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Copy hash"
              >
                {copiedHash ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Embed code */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Script Tag
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleCopy(embedCode, setCopiedEmbed)}
            >
              {copiedEmbed
                ? <><Check className="w-3 h-3 mr-1" /> Copied</>
                : <><Copy className="w-3 h-3 mr-1" /> Copy</>
              }
            </Button>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-3 font-mono text-xs whitespace-pre-wrap break-all">
            {embedCode}
          </div>
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            Paste this before the closing &lt;/body&gt; tag on the client's website
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
