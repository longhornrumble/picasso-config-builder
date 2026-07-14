/**
 * MessengerSettings — the Messenger product page (Messenger Product Surface T2c).
 *
 * This is the FIRST "product" grouping under the hybrid IA: a single page that
 * bundles a product's enable flag + its behavior config + a readiness checklist.
 * It sets the pattern Forms/Scheduling inherit in a later program, so its shape
 * is deliberately generalizable:
 *
 *   product page = [enable toggle] + [config fields] + [readiness checklist of
 *   the preconditions THIS page can authoritatively determine from config,
 *   plus explicit deferral for state owned elsewhere]
 *
 * Readiness authority (D1 rule): the checklist reports the flag and escalation
 * recipient (config-authoritative) plus a display-only connection row that reads
 * the S3 `channels.*` mirror exactly as the Channels tab does. D1 forbids runtime
 * code from GATING on that mirror (DDB is the source of truth) — it does not
 * forbid CB from DISPLAYING last-known connection metadata. Connecting/
 * disconnecting stays in the Channels tab / portal; this page never mutates it.
 *
 * All edits mutate the whole messenger_behavior object in baseConfig; getMergedConfig
 * emits the complete section and Config Manager wholesale-replaces it — so the
 * always-send-whole discipline is satisfied by construction (no partial patch).
 */

import React from 'react';
import { CheckCircle2, Circle, ExternalLink } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Textarea,
} from '@/components/ui';
import { useConfigStore } from '@/store';
import type { FeatureFlags, MessengerBehaviorConfig, MessengerStrings } from '@/types/config';

// ---------------------------------------------------------------------------
// Readiness checklist
// ---------------------------------------------------------------------------

interface ReadinessItem {
  label: string;
  done: boolean;
  detail: string;
}

const ReadinessRow: React.FC<ReadinessItem> = ({ label, done, detail }) => (
  <div className="flex items-start gap-3 py-2">
    {done ? (
      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
    ) : (
      <Circle className="h-5 w-5 shrink-0 text-gray-300 dark:text-gray-600" aria-hidden="true" />
    )}
    <div>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {label}
        <span className="sr-only">{done ? ' — done' : ' — not done'}</span>
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{detail}</p>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const MessengerSettings: React.FC = () => {
  const baseConfig = useConfigStore((state) => state.config.baseConfig);

  const featureFlags: FeatureFlags = baseConfig?.feature_flags ?? {};
  const behavior: MessengerBehaviorConfig = baseConfig?.messenger_behavior ?? {};
  const strings: MessengerStrings = behavior.strings ?? {};

  const flagOn = featureFlags.MESSENGER_CHANNEL === true;
  const escalationEmail = behavior.escalation_email ?? '';
  const disclosureLine = strings.disclosure_line ?? '';
  const toneOverride = behavior.tone_override ?? '';

  // Connection state: read the S3 channels mirror the same way the Channels tab
  // does — display-only, never for gating (D1 authority rule: DDB is the runtime
  // source of truth; the mirror is last-known display metadata). Connecting/
  // disconnecting stays in the Channels tab / portal, not here.
  const channels = baseConfig?.channels;
  const messengerPage = channels?.messenger?.page_name;
  const instagramConnected = Boolean(channels?.instagram);
  const anyConnected = Boolean(channels?.messenger) || instagramConnected;

  const setFlag = (value: boolean) => {
    useConfigStore.setState((state) => {
      if (!state.config.baseConfig) return;
      if (!state.config.baseConfig.feature_flags) state.config.baseConfig.feature_flags = {};
      state.config.baseConfig.feature_flags.MESSENGER_CHANNEL = value;
      state.config.isDirty = true;
    });
  };

  // Mutate the messenger_behavior object as a whole (created lazily). getMergedConfig
  // emits the entire section; the server wholesale-replaces it.
  const updateBehavior = (patch: Partial<MessengerBehaviorConfig>) => {
    useConfigStore.setState((state) => {
      if (!state.config.baseConfig) return;
      if (!state.config.baseConfig.messenger_behavior) state.config.baseConfig.messenger_behavior = {};
      Object.assign(state.config.baseConfig.messenger_behavior, patch);
      state.config.isDirty = true;
    });
  };

  const updateString = (key: keyof MessengerStrings, value: string) => {
    useConfigStore.setState((state) => {
      if (!state.config.baseConfig) return;
      if (!state.config.baseConfig.messenger_behavior) state.config.baseConfig.messenger_behavior = {};
      if (!state.config.baseConfig.messenger_behavior.strings) {
        state.config.baseConfig.messenger_behavior.strings = {};
      }
      state.config.baseConfig.messenger_behavior.strings[key] = value;
      state.config.isDirty = true;
    });
  };

  const recipientSet = escalationEmail.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Enable */}
      <Card>
        <CardHeader>
          <CardTitle>Messenger Channel</CardTitle>
          <CardDescription>
            Facebook Messenger &amp; Instagram DM — one V5-driven channel with human escalation,
            forms, and scheduling for connected Meta pages. Turning this on gates all Messenger
            behavior for this tenant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex items-start justify-between gap-4">
            <div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Enable the Messenger channel
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Sets <code>feature_flags.MESSENGER_CHANNEL</code>. Off = the legacy path is
                byte-identical (no Messenger behavior runs).
              </p>
            </div>
            <input
              id="messenger-enable"
              type="checkbox"
              checked={flagOn}
              onChange={(e) => setFlag(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer mt-0.5"
            />
          </label>
        </CardContent>
      </Card>

      {/* Escalation */}
      <Card>
        <CardHeader>
          <CardTitle>Human escalation</CardTitle>
          <CardDescription>
            When a visitor asks to speak with a person, the bot pauses and this recipient is
            notified so staff can reply from the Business Suite inbox. The email body is
            content-free by design (no transcript).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            label="Escalation recipient email"
            type="email"
            value={escalationEmail}
            onChange={(e) => updateBehavior({ escalation_email: e.target.value })}
            placeholder="notify@myrecruiter.ai"
            helperText="Staff address notified on human-escalation. Must be a verified SES identity. When unset, the platform falls back to its ESCALATION_EMAIL default."
          />
        </CardContent>
      </Card>

      {/* Behavior */}
      <Card>
        <CardHeader>
          <CardTitle>Messenger behavior</CardTitle>
          <CardDescription>
            Optional per-tenant overrides. Leave blank to use the platform defaults.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Disclosure line"
            value={disclosureLine}
            onChange={(e) => updateString('disclosure_line', e.target.value)}
            placeholder="You're chatting with an automated assistant."
            helperText="Shown on the first turn of each session (bot-disclosure requirement)."
          />
          <Textarea
            label="Tone override"
            value={toneOverride}
            onChange={(e) => updateBehavior({ tone_override: e.target.value })}
            placeholder="Leave blank to use the tenant's standard tone prompt."
            helperText="Replaces the tone prompt for Messenger only (does not concatenate)."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Readiness */}
      <Card>
        <CardHeader>
          <CardTitle>Readiness</CardTitle>
          <CardDescription>
            What still needs to be set for Messenger to work end-to-end on this tenant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReadinessRow
            label="Channel enabled"
            done={flagOn}
            detail={flagOn ? 'MESSENGER_CHANNEL is on.' : 'Turn on the Messenger channel above.'}
          />
          <ReadinessRow
            label="Escalation recipient set"
            done={recipientSet}
            detail={
              recipientSet
                ? `Notifications go to ${escalationEmail}.`
                : 'Set an escalation recipient above (otherwise the platform default is used).'
            }
          />
          <ReadinessRow
            label="Facebook / Instagram page connected"
            done={anyConnected}
            detail={
              anyConnected
                ? `Connected${messengerPage ? `: ${messengerPage}` : ''}${instagramConnected ? ' (Instagram linked)' : ''}. Manage in the Channels tab.`
                : 'No page connected yet — connect one in the Channels tab (or, for tenants, the admin portal).'
            }
          />
          <p className="mt-2 flex items-center gap-1 text-xs text-gray-400">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            Connection is managed in the Channels tab; this reflects last-known connection metadata.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
