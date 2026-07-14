/**
 * MessengerWelcomeSettings — welcome-surfaces editors for the Messenger product
 * page (Messenger Product Surface T3d).
 *
 * Edits `messenger_behavior.welcome` (ice breakers + persistent menu — contract
 * C2 `MessengerWelcomeConfig`). Mirrors MessengerSettings' whole-object mutation
 * pattern: `messenger_behavior` (and `.welcome`) are lazily created, the whole
 * object is mutated, and `isDirty` is set — getMergedConfig emits the complete
 * section and Config Manager wholesale-replaces it, so no partial patch is ever
 * sent.
 *
 * Push behavior (truthful-state note): editing here only updates the tenant
 * config. The live Facebook/Instagram profile is updated on DEPLOY — the deploy
 * flow auto-calls Meta_OAuth_Handler's repush-welcome endpoint when welcome
 * surfaces are configured and a page is connected (see store/slices/config.ts +
 * lib/api/metaWelcome.ts). The in-card notice states this; the manual fallback
 * is scripts/repush_welcome_surfaces.py. Never imply an edit alone pushes.
 */

import React, { useState } from 'react';
import { Plus, Trash2, AlertCircle, Info } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Button,
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/components/ui';
import { useConfigStore } from '@/store';
import type { MessengerWelcomeConfig, MessengerIceBreaker, MessengerMenuItem } from '@/types/config';

const MAX_ICE_BREAKERS = 4;

export const MessengerWelcomeSettings: React.FC = () => {
  const baseConfig = useConfigStore((state) => state.config.baseConfig);

  const welcome: MessengerWelcomeConfig = baseConfig?.messenger_behavior?.welcome ?? {};
  const iceBreakers = welcome.ice_breakers ?? [];
  const menuItems = welcome.persistent_menu ?? [];

  const [newQuestion, setNewQuestion] = useState('');
  const [newPayload, setNewPayload] = useState('');
  const [newMenuTitle, setNewMenuTitle] = useState('');
  const [newMenuPayload, setNewMenuPayload] = useState('');
  const [newMenuUrl, setNewMenuUrl] = useState('');

  // Mutate messenger_behavior.welcome as a whole (lazily created). getMergedConfig
  // emits the entire messenger_behavior section; the server wholesale-replaces it.
  const updateWelcome = (patch: Partial<MessengerWelcomeConfig>) => {
    useConfigStore.setState((state) => {
      if (!state.config.baseConfig) return;
      if (!state.config.baseConfig.messenger_behavior) state.config.baseConfig.messenger_behavior = {};
      if (!state.config.baseConfig.messenger_behavior.welcome) {
        state.config.baseConfig.messenger_behavior.welcome = {};
      }
      Object.assign(state.config.baseConfig.messenger_behavior.welcome, patch);
      state.config.isDirty = true;
    });
  };

  // --- Ice breakers ---------------------------------------------------------

  const setIceBreakers = (next: MessengerIceBreaker[]) => updateWelcome({ ice_breakers: next });

  const addIceBreaker = () => {
    if (!newQuestion.trim() || !newPayload.trim()) return;
    if (iceBreakers.length >= MAX_ICE_BREAKERS) return;
    setIceBreakers([...iceBreakers, { question: newQuestion.trim(), payload: newPayload.trim() }]);
    setNewQuestion('');
    setNewPayload('');
  };

  const updateIceBreaker = (index: number, patch: Partial<MessengerIceBreaker>) => {
    setIceBreakers(iceBreakers.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeIceBreaker = (index: number) => {
    setIceBreakers(iceBreakers.filter((_, i) => i !== index));
  };

  // --- Persistent menu --------------------------------------------------------

  const setMenuItems = (next: MessengerMenuItem[]) => updateWelcome({ persistent_menu: next });

  const addMenuItem = () => {
    if (!newMenuTitle.trim()) return;
    if (!newMenuPayload.trim() && !newMenuUrl.trim()) return;
    const item: MessengerMenuItem = { title: newMenuTitle.trim() };
    if (newMenuPayload.trim()) item.payload = newMenuPayload.trim();
    if (newMenuUrl.trim()) item.url = newMenuUrl.trim();
    setMenuItems([...menuItems, item]);
    setNewMenuTitle('');
    setNewMenuPayload('');
    setNewMenuUrl('');
  };

  const updateMenuItem = (index: number, patch: Partial<MessengerMenuItem>) => {
    setMenuItems(menuItems.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const iceBreakersAtCap = iceBreakers.length >= MAX_ICE_BREAKERS;

  return (
    <div className="space-y-6">
      {/* How-it-works note — welcome surfaces auto-push to Meta on Deploy */}
      <Alert variant="info">
        <Info className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>These push to Facebook &amp; Instagram when you Deploy</AlertTitle>
        <AlertDescription>
          When you <strong>Deploy</strong>, Config Builder pushes these ice breakers and the
          persistent menu to the live Facebook / Instagram profile automatically — as long as the
          page is connected (see the Channels tab). Editing here without deploying does not update
          Meta, and nothing is pushed until a page is connected. (The manual fallback is still{' '}
          <code>Meta_OAuth_Handler/scripts/repush_welcome_surfaces.py</code>.)
        </AlertDescription>
      </Alert>

      {/* Ice breakers */}
      <Card>
        <CardHeader>
          <CardTitle>Ice breakers</CardTitle>
          <CardDescription>
            Suggested first questions shown to a visitor before they send a message. Up to{' '}
            {MAX_ICE_BREAKERS}, per Meta&apos;s platform limit (capability map C5).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {iceBreakers.length > 0 && (
            <div className="space-y-2 mb-3">
              {iceBreakers.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      aria-label={`Ice breaker ${index + 1} question`}
                      value={item.question}
                      onChange={(e) => updateIceBreaker(index, { question: e.target.value })}
                      placeholder="Question shown to the visitor"
                    />
                    <Input
                      aria-label={`Ice breaker ${index + 1} payload`}
                      value={item.payload}
                      onChange={(e) => updateIceBreaker(index, { payload: e.target.value })}
                      placeholder="C3 payload namespace, e.g. PIC1:…"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeIceBreaker(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 flex-shrink-0"
                    aria-label={`Remove ice breaker ${index + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                label="Question"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="e.g., How do I volunteer?"
                disabled={iceBreakersAtCap}
              />
              <Input
                label="Payload"
                value={newPayload}
                onChange={(e) => setNewPayload(e.target.value)}
                placeholder="e.g., PIC1:VOLUNTEER_INFO"
                helperText="C3 payload namespace, e.g. PIC1:…"
                disabled={iceBreakersAtCap}
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {iceBreakers.length} / {MAX_ICE_BREAKERS} ice breakers
              </span>
              <Button
                onClick={addIceBreaker}
                disabled={!newQuestion.trim() || !newPayload.trim() || iceBreakersAtCap}
                size="sm"
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add ice breaker
              </Button>
            </div>
          </div>

          {iceBreakersAtCap && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 mt-2">
              <AlertCircle className="w-4 h-4" />
              Maximum of {MAX_ICE_BREAKERS} ice breakers reached (Meta platform limit).
            </div>
          )}
        </CardContent>
      </Card>

      {/* Persistent menu */}
      <Card>
        <CardHeader>
          <CardTitle>Persistent menu</CardTitle>
          <CardDescription>
            Always-visible menu options in the Messenger conversation. Each item needs either a
            payload (handled by the bot) or a URL (opens externally).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {menuItems.length > 0 && (
            <div className="space-y-2 mb-3">
              {menuItems.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input
                      aria-label={`Menu item ${index + 1} title`}
                      value={item.title}
                      onChange={(e) => updateMenuItem(index, { title: e.target.value })}
                      placeholder="Menu label"
                    />
                    <Input
                      aria-label={`Menu item ${index + 1} payload`}
                      value={item.payload ?? ''}
                      onChange={(e) => updateMenuItem(index, { payload: e.target.value || undefined })}
                      placeholder="Payload (bot-handled)"
                    />
                    <Input
                      aria-label={`Menu item ${index + 1} url`}
                      value={item.url ?? ''}
                      onChange={(e) => updateMenuItem(index, { url: e.target.value || undefined })}
                      placeholder="URL (opens externally)"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMenuItem(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 flex-shrink-0"
                    aria-label={`Remove menu item ${index + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                label="Title"
                value={newMenuTitle}
                onChange={(e) => setNewMenuTitle(e.target.value)}
                placeholder="e.g., Our programs"
              />
              <Input
                label="Payload (optional)"
                value={newMenuPayload}
                onChange={(e) => setNewMenuPayload(e.target.value)}
                placeholder="e.g., PIC1:PROGRAMS"
                helperText="Use payload OR url"
              />
              <Input
                label="URL (optional)"
                value={newMenuUrl}
                onChange={(e) => setNewMenuUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
              <Button
                onClick={addMenuItem}
                disabled={!newMenuTitle.trim() || (!newMenuPayload.trim() && !newMenuUrl.trim())}
                size="sm"
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add menu item
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
