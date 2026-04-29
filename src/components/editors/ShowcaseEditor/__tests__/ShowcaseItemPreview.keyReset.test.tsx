/**
 * Regression test for the ShowcaseItemPreview key-prop reset (Phase B3 lint cleanup).
 *
 * Before: ShowcaseItemPreview reset `imageError`/`imageLoading` via a useEffect
 *   on `[item.image_url]`.
 * After: the parent (ShowcaseItemFormFields) passes `key={item.image_url}` so
 *   the component remounts on URL change, and the reset effect was deleted.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShowcaseItemPreview } from '../ShowcaseItemPreview';
import type { ShowcaseItemEntity } from '../types';

const baseItem: ShowcaseItemEntity = {
  id: 'sc1',
  type: 'program',
  enabled: true,
  name: 'Test Item',
  tagline: 'A tagline',
  description: 'A description',
  keywords: [],
  image_url: 'https://example.com/a.png',
};

describe('ShowcaseItemPreview — key-prop reset on image URL change', () => {
  it('shows the image-failed placeholder once the img onError fires', () => {
    render(<ShowcaseItemPreview key={baseItem.image_url} item={baseItem} />);
    const img = screen.getByAltText('Test Item');
    fireEvent.error(img);
    expect(screen.getByText(/Image failed to load/)).toBeInTheDocument();
  });

  it('clears the failed-load state when the parent rotates the URL key', () => {
    const { rerender } = render(
      <ShowcaseItemPreview key={baseItem.image_url} item={baseItem} />
    );

    fireEvent.error(screen.getByAltText('Test Item'));
    expect(screen.getByText(/Image failed to load/)).toBeInTheDocument();

    const next = { ...baseItem, image_url: 'https://example.com/b.png' };
    rerender(<ShowcaseItemPreview key={next.image_url} item={next} />);

    expect(screen.queryByText(/Image failed to load/)).not.toBeInTheDocument();
    expect(screen.getByAltText('Test Item')).toHaveAttribute('src', next.image_url);
  });

  it('shows the loading spinner placeholder before onLoad fires', () => {
    // imageLoading starts true; the spinner placeholder is visible and the img is
    // style display:none until onLoad fires. This verifies the initial loading state.
    render(<ShowcaseItemPreview key={baseItem.image_url} item={baseItem} />);
    expect(screen.getByText(/Loading image/i)).toBeInTheDocument();

    // Simulate successful load — loading indicator should disappear
    const img = screen.getByAltText('Test Item');
    fireEvent.load(img);
    expect(screen.queryByText(/Loading image/i)).not.toBeInTheDocument();
  });

  it('clears the loading state when the parent rotates the URL key', () => {
    // After onLoad fires, imageLoading=false. New key should reset imageLoading to true
    // so the loading placeholder reappears for the new URL.
    const { rerender } = render(
      <ShowcaseItemPreview key={baseItem.image_url} item={baseItem} />
    );
    fireEvent.load(screen.getByAltText('Test Item'));
    expect(screen.queryByText(/Loading image/i)).not.toBeInTheDocument();

    const next = { ...baseItem, image_url: 'https://example.com/b.png' };
    rerender(<ShowcaseItemPreview key={next.image_url} item={next} />);

    // Fresh instance — loading spinner should be visible again
    expect(screen.getByText(/Loading image/i)).toBeInTheDocument();
  });

  it('renders no image section and no error state when image_url is absent', () => {
    // key={value.image_url || 'no-image'} in the parent — when image_url is empty
    // the component should skip the image block entirely, not show an error.
    const noImage = { ...baseItem, image_url: undefined as unknown as string };
    render(<ShowcaseItemPreview key="no-image" item={noImage} />);

    expect(screen.queryByText(/Image failed to load/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Loading image/i)).not.toBeInTheDocument();
    // Item content still renders
    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });
});
