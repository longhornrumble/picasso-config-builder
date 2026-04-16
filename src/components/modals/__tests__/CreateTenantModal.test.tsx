import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateTenantModal } from '../CreateTenantModal';
import { configApiClient } from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({
  configApiClient: {
    createTenant: vi.fn(),
  },
}));

describe('CreateTenantModal', () => {
  it('renders form fields when open', () => {
    render(<CreateTenantModal open={true} onClose={vi.fn()} />);

    expect(screen.getByLabelText(/tenant id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/chat title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subscription tier/i)).toBeInTheDocument();
    expect(screen.getByText(/primary color/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/welcome message/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/knowledge base id/i)).toBeInTheDocument();
  });

  it('validates tenant_id format', async () => {
    const user = userEvent.setup();
    render(<CreateTenantModal open={true} onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/organization name/i), 'Test Org');
    const tenantIdInput = screen.getByLabelText(/tenant id/i);
    await user.type(tenantIdInput, 'invalid tenant!');

    const submitButton = screen.getByRole('button', { name: /^create tenant$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/only alphanumeric characters/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      success: true,
      tenant_id: 'test-tenant',
      tenant_hash: 'abc123',
      embed_code: '<script src="..."></script>',
      config: {},
    };

    vi.mocked(configApiClient.createTenant).mockResolvedValue(mockResponse);

    render(<CreateTenantModal open={true} onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/organization name/i), 'Test Org');
    await user.type(screen.getByLabelText(/tenant id/i), 'test-tenant');
    await user.type(screen.getByLabelText(/chat title/i), 'Test Chat');

    const submitButton = screen.getByRole('button', { name: /^create tenant$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(configApiClient.createTenant).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: 'test-tenant',
          chat_title: 'Test Chat',
        })
      );
    });

    await waitFor(() => {
      // Use getAllByText since both modal title and card heading match
      const tenantCreatedElements = screen.getAllByText(/tenant created/i);
      expect(tenantCreatedElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('abc123')).toBeInTheDocument();
    });
  });

  it('displays API error messages', async () => {
    const user = userEvent.setup();
    vi.mocked(configApiClient.createTenant).mockRejectedValue(
      new Error('Tenant already exists')
    );

    render(<CreateTenantModal open={true} onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/organization name/i), 'Existing Org');
    await user.type(screen.getByLabelText(/tenant id/i), 'existing-tenant');

    const submitButton = screen.getByRole('button', { name: /^create tenant$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/tenant already exists/i)).toBeInTheDocument();
    });
  });

  it('calls onCreated callback when load button clicked', async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    const mockResponse = {
      success: true,
      tenant_id: 'new-tenant',
      tenant_hash: 'xyz789',
      embed_code: '<script src="..."></script>',
      config: {},
    };

    vi.mocked(configApiClient.createTenant).mockResolvedValue(mockResponse);

    render(<CreateTenantModal open={true} onClose={vi.fn()} onCreated={onCreated} />);

    await user.type(screen.getByLabelText(/organization name/i), 'New Org');
    await user.type(screen.getByLabelText(/tenant id/i), 'new-tenant');
    await user.click(screen.getByRole('button', { name: /^create tenant$/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /load this tenant/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /load this tenant/i }));

    expect(onCreated).toHaveBeenCalledWith('new-tenant');
  });

  it('copies embed code to clipboard', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    });

    const mockResponse = {
      success: true,
      tenant_id: 'test-tenant',
      tenant_hash: 'abc123',
      embed_code: '<script src="https://chat.myrecruiter.ai/widget.js"></script>',
      config: {},
    };

    vi.mocked(configApiClient.createTenant).mockResolvedValue(mockResponse);

    render(<CreateTenantModal open={true} onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/organization name/i), 'Test Org');
    await user.type(screen.getByLabelText(/tenant id/i), 'test-tenant');
    await user.click(screen.getByRole('button', { name: /^create tenant$/i }));

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /copy/i })[0]).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole('button', { name: /copy/i })[0]);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(mockResponse.embed_code);
      expect(screen.getByText(/copied/i)).toBeInTheDocument();
    });
  });
});
