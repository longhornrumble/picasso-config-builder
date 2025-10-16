/**
 * Preview Config Modal
 * Shows the full merged configuration that will be saved to S3
 */

import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
  ModalFooter,
} from '@/components/ui';
import { Button } from '@/components/ui';
import { useConfigStore } from '@/store';
import { Copy, Check, Download } from 'lucide-react';

interface PreviewConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PreviewConfigModal({ open, onOpenChange }: PreviewConfigModalProps) {
  const [copied, setCopied] = useState(false);
  const getMergedConfig = useConfigStore((state) => state.config.getMergedConfig);
  const tenantId = useConfigStore((state) => state.config.tenantId);

  const mergedConfig = getMergedConfig();
  const configJson = mergedConfig ? JSON.stringify(mergedConfig, null, 2) : '{}';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(configJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tenantId}-config-preview.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <ModalHeader>
          <ModalTitle>Preview Configuration</ModalTitle>
          <ModalDescription>
            This is the complete configuration that will be saved to S3 for tenant{' '}
            <span className="font-mono font-semibold">{tenantId}</span>
          </ModalDescription>
        </ModalHeader>

        <div className="flex-1 overflow-auto bg-gray-900 rounded-md p-4 my-4">
          <pre className="text-sm text-gray-100 font-mono">
            <code>{configJson}</code>
          </pre>
        </div>

        <ModalFooter className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {mergedConfig ? (
              <>
                {Object.keys(mergedConfig.programs || {}).length} programs,{' '}
                {Object.keys(mergedConfig.conversational_forms || {}).length} forms,{' '}
                {Object.keys(mergedConfig.cta_definitions || {}).length} CTAs,{' '}
                {Object.keys(mergedConfig.conversation_branches || {}).length} branches
              </>
            ) : (
              'No config loaded'
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
