/**
 * PendingChangesPage — deep-link handling
 *
 * Security policy: deep links from Slack/email/etc. use the tenant HASH only
 * (?h=HASH), never the raw tenant ID. The page resolves hash → tenantId by
 * calling listTenants() and finding a match.
 *
 * Covers:
 *   - ?h=HASH matches a listed tenant with matching tenantId → no loadConfig
 *     call (already selected)
 *   - ?h=HASH matches a listed tenant with different tenantId → loadConfig fires
 *   - ?h=HASH doesn't match any tenant → error banner
 *   - listTenants() fails → error banner
 *   - ?proposal=ID with matching proposal → card has id attribute + highlight
 *   - No deep-link params → page renders normally, no listTenants call
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Mocks — store, API client, listTenants
// ---------------------------------------------------------------------------

const mockLoadConfig = vi.fn();

let storeState: { config: { tenantId: string | null; loadConfig: typeof mockLoadConfig } } = {
  config: { tenantId: 'CURRENT_TENANT', loadConfig: mockLoadConfig },
};

vi.mock('@/store', () => ({
  useConfigStore: (selector: (s: typeof storeState) => unknown) => selector(storeState),
}));

const mockListProposals = vi.fn();
vi.mock('@/lib/api/client', () => ({
  configApiClient: {
    listProposals: (...args: unknown[]) => mockListProposals(...args),
  },
}));

const mockListTenants = vi.fn();
vi.mock('@/lib/api', () => ({
  listTenants: (...args: unknown[]) => mockListTenants(...args),
}));

// Shared proposal fixture so scroll/highlight assertions can target its id.
const proposalFixture = {
  proposalId: 'MYR384719-20260501-abcd',
  tenantId: 'MYR384719',
  createdAt: '2026-05-01T12:00:00Z',
  status: 'pending' as const,
  siteUrl: 'https://www.atlantaangels.org',
  summary: { additions: 2, edits: 1, retirements: 0 },
  items: [],
};

const tenantListFixture = [
  { tenantId: 'CURRENT_TENANT', tenant_hash: 'cu12345abcde', company_name: 'Current Co.' },
  { tenantId: 'OTHER_TENANT', tenant_hash: 'ot67890fghij', company_name: 'Other Co.' },
];

import { PendingChangesPage } from '../PendingChangesPage';

function renderWithRouter(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <PendingChangesPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockLoadConfig.mockReset();
  mockLoadConfig.mockResolvedValue(undefined);
  mockListProposals.mockReset();
  mockListProposals.mockResolvedValue([]);
  mockListTenants.mockReset();
  mockListTenants.mockResolvedValue(tenantListFixture);
  storeState = {
    config: { tenantId: 'CURRENT_TENANT', loadConfig: mockLoadConfig },
  };
});

describe('PendingChangesPage — deep-link handling (hash-based, per security policy)', () => {
  it('no deep-link params → no listTenants call, no loadConfig call', async () => {
    renderWithRouter('/pending-changes');
    await waitFor(() => expect(mockListProposals).toHaveBeenCalled());
    expect(mockListTenants).not.toHaveBeenCalled();
    expect(mockLoadConfig).not.toHaveBeenCalled();
  });

  it('?h=HASH resolves to current tenant → listTenants called, but no loadConfig', async () => {
    renderWithRouter('/pending-changes?h=cu12345abcde');
    await waitFor(() => expect(mockListTenants).toHaveBeenCalled());
    // Give React a tick for the .then branch to run — it decides NOT to loadConfig.
    await new Promise((r) => setTimeout(r, 10));
    expect(mockLoadConfig).not.toHaveBeenCalled();
  });

  it('?h=HASH resolves to a different tenant → loadConfig fires with the resolved ID', async () => {
    renderWithRouter('/pending-changes?h=ot67890fghij');
    await waitFor(() => {
      expect(mockLoadConfig).toHaveBeenCalledTimes(1);
      expect(mockLoadConfig).toHaveBeenCalledWith('OTHER_TENANT');
    });
  });

  it('?h=HASH with no matching tenant → error banner shown, no loadConfig', async () => {
    renderWithRouter('/pending-changes?h=unknownhashvalue');
    await waitFor(() => {
      expect(screen.getByText(/unknown tenant hash/i)).toBeTruthy();
    });
    expect(mockLoadConfig).not.toHaveBeenCalled();
  });

  it('listTenants() itself fails → error banner surfaces the message', async () => {
    mockListTenants.mockRejectedValueOnce(new Error('Network down'));
    renderWithRouter('/pending-changes?h=cu12345abcde');
    await waitFor(() => {
      expect(screen.getByText(/Network down/)).toBeTruthy();
    });
  });

  it('?proposal=ID + matching card → card has id attribute + highlighted ring', async () => {
    mockListProposals.mockResolvedValueOnce([proposalFixture]);
    const { container } = renderWithRouter(
      `/pending-changes?proposal=${proposalFixture.proposalId}`,
    );
    await waitFor(() => {
      const card = container.querySelector(`#${CSS.escape(proposalFixture.proposalId)}`);
      expect(card).toBeTruthy();
      expect(card?.className).toContain('ring-2');
      expect(card?.className).toContain('border-teal-500');
    });
  });

  it('?proposal=ID with no matching card → card absent, no error, no highlight', async () => {
    mockListProposals.mockResolvedValueOnce([proposalFixture]);
    const { container } = renderWithRouter('/pending-changes?proposal=NONEXISTENT-PROPOSAL-ID');
    await waitFor(() => expect(mockListProposals).toHaveBeenCalled());
    const card = container.querySelector(`#${CSS.escape(proposalFixture.proposalId)}`);
    expect(card).toBeTruthy();
    expect(card?.className).not.toContain('ring-2');
  });
});
