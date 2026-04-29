/**
 * Regression test for the ValidationPanel auto-expand rewrite (Phase B3 lint cleanup).
 *
 * Before: useEffect with `if (totalErrors > 0 && !isExpanded) setIsExpanded(true)` plus
 *   a missing-`isExpanded` exhaustive-deps warning.
 * After: a `prevTotalErrorsRef` (initialized to 0) drives auto-expand only on the
 *   0 → positive transition, so reopening after a manual collapse no longer flips
 *   it back open every time the count changes between positive values.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ValidationPanel } from '../ValidationPanel';
import { useConfigStore } from '@/store';

const renderPanel = () => render(<MemoryRouter><ValidationPanel /></MemoryRouter>);

const setStoreValidation = (
  errors: Record<string, Array<{ field: string; message: string; severity: 'error' | 'warning' }>>,
  warnings: Record<string, Array<{ field: string; message: string; severity: 'error' | 'warning' }>> = {}
) => {
  act(() => {
    useConfigStore.setState((state) => {
      state.validation.errors = errors;
      state.validation.warnings = warnings;
      state.validation.isValid = Object.keys(errors).length === 0;
      state.validation.lastValidated = new Date().toISOString();
    });
  });
};

const errorEntry = (id: string, message: string) => ({
  [id]: [{ field: 'someField', message, severity: 'error' as const }],
});

const warningEntry = (id: string, message: string) => ({
  [id]: [{ field: 'someField', message, severity: 'warning' as const }],
});

describe('ValidationPanel — auto-expand on 0 → positive transition', () => {
  beforeEach(() => {
    act(() => {
      useConfigStore.setState((state) => {
        state.validation.errors = {};
        state.validation.warnings = {};
        state.validation.isValid = true;
        state.validation.lastValidated = null;
      });
    });
  });

  it('auto-expands when totalErrors goes 0 → positive after mount', () => {
    setStoreValidation({});
    renderPanel();

    expect(screen.queryByText(/^transition test error$/)).not.toBeInTheDocument();

    setStoreValidation(errorEntry('foo', 'transition test error'));

    expect(screen.getByText(/transition test error/)).toBeInTheDocument();
  });

  it('auto-expands on first render when errors are already present (mounts with positive count)', () => {
    setStoreValidation(errorEntry('foo', 'mounted with this error'));
    renderPanel();

    expect(screen.getByText(/mounted with this error/)).toBeInTheDocument();
  });

  it('does NOT re-expand after a manual collapse when count changes positive → positive', () => {
    setStoreValidation(errorEntry('foo', 'initial error'));
    renderPanel();

    expect(screen.getByText(/initial error/)).toBeInTheDocument();

    const closeButton = screen.getByTitle('Close panel');
    fireEvent.click(closeButton);
    expect(screen.queryByText(/initial error/)).not.toBeInTheDocument();

    setStoreValidation({
      ...errorEntry('foo', 'initial error'),
      ...errorEntry('bar', 'second error'),
    });

    expect(screen.queryByText(/initial error/)).not.toBeInTheDocument();
    expect(screen.queryByText(/second error/)).not.toBeInTheDocument();
  });

  it('does NOT auto-expand when only warnings are present (totalErrors stays 0)', () => {
    // Auto-expand is keyed on totalErrors, not totalWarnings.
    // A warnings-only state must not trigger the 0→positive path.
    setStoreValidation({}, warningEntry('foo', 'warnings only warning'));
    renderPanel();

    // Panel should be collapsed — warning message not in expanded content.
    // Use queryByText to avoid a throw when the element is absent.
    expect(screen.queryByText(/warnings only warning/i)).not.toBeInTheDocument();
  });

  it('re-expands on a fresh 0→positive transition after errors clear back to zero', () => {
    // When errors go positive → 0, prevTotalErrorsRef resets to 0 in the effect.
    // A subsequent 0→positive transition therefore re-triggers auto-expand.
    // This is intentional UX: a new set of errors after a clean slate should notify the user.
    setStoreValidation(errorEntry('foo', 'first wave'));
    renderPanel();
    expect(screen.getByText(/first wave/)).toBeInTheDocument();

    // Collapse manually
    fireEvent.click(screen.getByTitle('Close panel'));
    expect(screen.queryByText(/first wave/)).not.toBeInTheDocument();

    // Errors clear — ref updates to 0 in the effect
    setStoreValidation({});

    // A new wave of errors arrives: prevRef is now 0 → this IS a 0→positive transition
    // and the panel should auto-expand again (new errors after a clean state)
    setStoreValidation(errorEntry('bar', 'second wave'));
    expect(screen.getByText(/second wave/)).toBeInTheDocument();
  });

  it('returns null (renders nothing) when lastValidated is null', () => {
    // The guard at the top of ValidationPanel prevents rendering before any validation run.
    // This ensures the panel does not flash on initial load.
    act(() => {
      useConfigStore.setState((state) => {
        state.validation.errors = {};
        state.validation.warnings = {};
        state.validation.isValid = true;
        state.validation.lastValidated = null;
      });
    });
    const { container } = renderPanel();
    expect(container.firstChild).toBeNull();
  });
});
