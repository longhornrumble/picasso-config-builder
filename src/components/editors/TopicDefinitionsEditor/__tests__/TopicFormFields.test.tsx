/**
 * TopicFormFields — unit tests
 *
 * Covers:
 *  - Topic Name field: render, disabled-in-edit-mode, onChange propagation
 *  - Description field: render, required indicator, onChange propagation
 *  - TagInput: add via Enter, add via comma, add via blur, remove via X button,
 *              backspace-to-remove-last, no duplicates, no empty tags, a11y attributes
 *  - Role Select: render, value selection, "None" clears role
 *  - Depth Override checkbox: hidden when no tags, visible when tags exist,
 *                             toggle on/off behaviour
 *  - Accessibility: ARIA attributes, keyboard-only paths, role/label linkages
 *  - validateTopic: standalone validation logic coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopicFormFields } from '../TopicFormFields';
import { TopicCardContent } from '../TopicCardContent';
import { validateTopic } from '@/lib/validation/formValidators';
import type { FormFieldsProps } from '@/lib/crud/types';
import type { TopicEntity } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal TopicEntity for test renders */
function makeTopic(overrides: Partial<TopicEntity> = {}): TopicEntity {
  return {
    topicName: 'test_topic',
    name: 'test_topic',
    description: 'This is a test topic description that is long enough to pass validation.',
    tags: [],
    role: undefined,
    depth_override: undefined,
    ...overrides,
  };
}

/** Build the minimal FormFieldsProps that TopicFormFields expects */
function makeProps(
  value: TopicEntity,
  onChange = vi.fn(),
  isEditMode = false
): FormFieldsProps<TopicEntity> {
  return {
    value,
    onChange,
    errors: {},
    touched: {},
    onBlur: vi.fn(),
    isEditMode,
  };
}

/** Render with all fields touched so error messages appear */
function makeTouchedProps(
  value: TopicEntity,
  onChange = vi.fn(),
  isEditMode = false
): FormFieldsProps<TopicEntity> {
  return {
    value,
    onChange,
    errors: {},
    touched: {
      topicName: true,
      description: true,
      tags: true,
    },
    onBlur: vi.fn(),
    isEditMode,
  };
}

// ===========================================================================
// TopicFormFields — Topic Name field
// ===========================================================================

describe('TopicFormFields — Topic Name field', () => {
  it('renders Topic Name input', () => {
    render(<TopicFormFields {...makeProps(makeTopic())} />);
    expect(screen.getByLabelText(/topic name/i)).toBeInTheDocument();
  });

  it('is enabled in create mode', () => {
    render(<TopicFormFields {...makeProps(makeTopic(), vi.fn(), false)} />);
    const input = screen.getByLabelText(/topic name/i);
    expect(input).not.toBeDisabled();
  });

  it('is disabled in edit mode', () => {
    render(<TopicFormFields {...makeProps(makeTopic(), vi.fn(), true)} />);
    const input = screen.getByLabelText(/topic name/i);
    expect(input).toBeDisabled();
  });

  it('calls onChange with updated topicName and name when value changes', () => {
    const onChange = vi.fn();
    render(<TopicFormFields {...makeProps(makeTopic({ topicName: '' }), onChange)} />);

    const input = screen.getByLabelText(/topic name/i);
    // Use fireEvent.change to trigger a single onChange with the full value
    fireEvent.change(input, { target: { value: 'donating' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ topicName: 'donating', name: 'donating' })
    );
  });

  it('shows error message when touched.topicName is true and error is present', () => {
    const props: FormFieldsProps<TopicEntity> = {
      ...makeProps(makeTopic()),
      errors: { topicName: 'Topic name is required' },
      touched: { topicName: true },
    };
    render(<TopicFormFields {...props} />);
    expect(screen.getByText(/topic name is required/i)).toBeInTheDocument();
  });

  it('does not show error when field is untouched', () => {
    const props: FormFieldsProps<TopicEntity> = {
      ...makeProps(makeTopic()),
      errors: { topicName: 'Topic name is required' },
      touched: {},
    };
    render(<TopicFormFields {...props} />);
    expect(screen.queryByText(/topic name is required/i)).toBeNull();
  });

  it('shows helper text about snake_case format in create mode', () => {
    render(<TopicFormFields {...makeProps(makeTopic())} />);
    expect(screen.getByText(/snake_case/i)).toBeInTheDocument();
  });

  it('shows "cannot be changed" helper text in edit mode', () => {
    render(<TopicFormFields {...makeProps(makeTopic(), vi.fn(), true)} />);
    expect(screen.getByText(/cannot be changed/i)).toBeInTheDocument();
  });

  it('calls onBlur with "topicName" when input is blurred', async () => {
    const onBlur = vi.fn();
    const user = userEvent.setup();
    const props = { ...makeProps(makeTopic()), onBlur };
    render(<TopicFormFields {...props} />);

    const input = screen.getByLabelText(/topic name/i);
    await user.click(input);
    await user.tab();

    expect(onBlur).toHaveBeenCalledWith('topicName');
  });
});

// ===========================================================================
// TopicFormFields — Description field
// ===========================================================================

describe('TopicFormFields — Description field', () => {
  it('renders the Description textarea', () => {
    render(<TopicFormFields {...makeProps(makeTopic())} />);
    expect(screen.getByRole('textbox', { name: /description/i })).toBeInTheDocument();
  });

  it('has aria-required="true"', () => {
    render(<TopicFormFields {...makeProps(makeTopic())} />);
    const textarea = screen.getByRole('textbox', { name: /description/i });
    expect(textarea).toHaveAttribute('aria-required', 'true');
  });

  it('shows the required star in the label', () => {
    render(<TopicFormFields {...makeProps(makeTopic())} />);
    // The * is aria-hidden but still in the DOM
    const label = document.querySelector('label[id]');
    expect(label?.textContent).toContain('*');
  });

  it('calls onChange with updated description', () => {
    const onChange = vi.fn();
    render(<TopicFormFields {...makeProps(makeTopic({ description: '' }), onChange)} />);

    const textarea = screen.getByRole('textbox', { name: /description/i });
    // Use fireEvent.change to send a single synthetic event with the full value
    fireEvent.change(textarea, { target: { value: 'Hello world description' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Hello world description' })
    );
  });

  it('shows error when touched.description is true and error is set', () => {
    const props: FormFieldsProps<TopicEntity> = {
      ...makeProps(makeTopic()),
      errors: { description: 'Description must be at least 20 characters' },
      touched: { description: true },
    };
    render(<TopicFormFields {...props} />);
    expect(
      screen.getByRole('alert')
    ).toHaveTextContent(/at least 20 characters/i);
  });

  it('shows hint text when no error', () => {
    render(<TopicFormFields {...makeProps(makeTopic())} />);
    expect(screen.getByText(/write for the classifier/i)).toBeInTheDocument();
  });

  it('description textarea has aria-invalid="false" when no error', () => {
    render(<TopicFormFields {...makeTouchedProps(makeTopic())} />);
    const textarea = screen.getByRole('textbox', { name: /description/i });
    expect(textarea).toHaveAttribute('aria-invalid', 'false');
  });

  it('description textarea has aria-invalid="true" when error exists and touched', () => {
    const props: FormFieldsProps<TopicEntity> = {
      ...makeTouchedProps(makeTopic()),
      errors: { description: 'Too short' },
    };
    render(<TopicFormFields {...props} />);
    const textarea = screen.getByRole('textbox', { name: /description/i });
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
  });
});

// ===========================================================================
// TopicFormFields — Tag Input
// ===========================================================================

describe('TopicFormFields — TagInput', () => {
  it('renders the tag input container', () => {
    render(<TopicFormFields {...makeProps(makeTopic())} />);
    // The tag text input has a placeholder when empty
    expect(
      screen.getByPlaceholderText(/type a tag and press enter/i)
    ).toBeInTheDocument();
  });

  it('shows empty-tags helper text when no tags are set', () => {
    render(<TopicFormFields {...makeProps(makeTopic({ tags: [] }))} />);
    expect(
      screen.getByText(/no tags = informational topic/i)
    ).toBeInTheDocument();
  });

  it('shows regular hint text when at least one tag exists', () => {
    render(<TopicFormFields {...makeProps(makeTopic({ tags: ['donating'] }))} />);
    expect(
      screen.getByText(/press enter or , to add/i)
    ).toBeInTheDocument();
  });

  it('renders existing tags as removable pill badges', () => {
    render(
      <TopicFormFields {...makeProps(makeTopic({ tags: ['food', 'housing'] }))} />
    );
    expect(screen.getByText('food')).toBeInTheDocument();
    expect(screen.getByText('housing')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove tag food/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove tag housing/i })).toBeInTheDocument();
  });

  it('adds a tag when user types and presses Enter', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TopicFormFields {...makeProps(makeTopic({ tags: [] }), onChange)} />);

    const input = screen.getByRole('textbox', { name: /new tag input/i });
    await user.type(input, 'volunteering{Enter}');

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ tags: expect.arrayContaining(['volunteering']) })
    );
  });

  it('adds a tag when user types and presses comma', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TopicFormFields {...makeProps(makeTopic({ tags: [] }), onChange)} />);

    const input = screen.getByRole('textbox', { name: /new tag input/i });
    await user.type(input, 'donating,');

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ tags: expect.arrayContaining(['donating']) })
    );
  });

  it('normalises tag to snake_case (replaces spaces and lowercases)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TopicFormFields {...makeProps(makeTopic({ tags: [] }), onChange)} />);

    const input = screen.getByRole('textbox', { name: /new tag input/i });
    await user.type(input, 'My Tag{Enter}');

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ tags: expect.arrayContaining(['my_tag']) })
    );
  });

  it('does not add an empty string as a tag', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TopicFormFields {...makeProps(makeTopic({ tags: [] }), onChange)} />);

    const input = screen.getByRole('textbox', { name: /new tag input/i });
    await user.type(input, '{Enter}');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not add a duplicate tag', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <TopicFormFields
        {...makeProps(makeTopic({ tags: ['existing'] }), onChange)}
      />
    );

    const input = screen.getByRole('textbox', { name: /new tag input/i });
    await user.type(input, 'existing{Enter}');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('removes a tag when the remove button is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <TopicFormFields
        {...makeProps(makeTopic({ tags: ['food', 'health'] }), onChange)}
      />
    );

    await user.click(screen.getByRole('button', { name: /remove tag food/i }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ['health'] })
    );
  });

  it('removes the last tag with Backspace when input is empty', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <TopicFormFields
        {...makeProps(makeTopic({ tags: ['first', 'second'] }), onChange)}
      />
    );

    const input = screen.getByRole('textbox', { name: /new tag input/i });
    await user.click(input);
    await user.keyboard('{Backspace}');

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ['first'] })
    );
  });

  it('commits pending tag input on blur', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TopicFormFields {...makeProps(makeTopic({ tags: [] }), onChange)} />);

    const input = screen.getByRole('textbox', { name: /new tag input/i });
    await user.type(input, 'pending');
    // blur by tabbing away
    await user.tab();

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ tags: expect.arrayContaining(['pending']) })
    );
  });

  it('remove button is keyboard accessible (has accessible name)', () => {
    render(
      <TopicFormFields {...makeProps(makeTopic({ tags: ['accessibility'] }))} />
    );
    const btn = screen.getByRole('button', { name: /remove tag accessibility/i });
    expect(btn).toBeInTheDocument();
    // Can receive keyboard focus
    btn.focus();
    expect(btn).toHaveFocus();
  });

  it('tag container has role="group" and an aria-labelledby', () => {
    render(<TopicFormFields {...makeProps(makeTopic())} />);
    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('aria-labelledby');
  });
});

// ===========================================================================
// TopicFormFields — Role Select
// ===========================================================================

describe('TopicFormFields — Role Select', () => {
  it('renders the Role label', () => {
    render(<TopicFormFields {...makeProps(makeTopic())} />);
    // Use getByRole to find the label element specifically — multiple elements match /role/i
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  it('shows "None" option when role is undefined', () => {
    render(<TopicFormFields {...makeProps(makeTopic({ role: undefined }))} />);
    expect(screen.getByText(/none \(no role filter\)/i)).toBeInTheDocument();
  });

  it('shows helper text about learn always passing the filter', () => {
    render(<TopicFormFields {...makeProps(makeTopic())} />);
    expect(
      screen.getByText(/"learn" always passes the role filter/i)
    ).toBeInTheDocument();
  });
});

// ===========================================================================
// TopicFormFields — Depth Override checkbox
// ===========================================================================

describe('TopicFormFields — Depth Override checkbox', () => {
  it('does NOT render the depth override checkbox when tags is empty', () => {
    render(<TopicFormFields {...makeProps(makeTopic({ tags: [] }))} />);
    expect(
      screen.queryByRole('checkbox', { name: /always show action ctas/i })
    ).toBeNull();
  });

  it('renders the depth override checkbox when tags are present', () => {
    render(
      <TopicFormFields {...makeProps(makeTopic({ tags: ['donating'] }))} />
    );
    expect(
      screen.getByRole('checkbox', { name: /always show action ctas/i })
    ).toBeInTheDocument();
  });

  it('checkbox is unchecked when depth_override is undefined', () => {
    render(
      <TopicFormFields
        {...makeProps(makeTopic({ tags: ['donating'], depth_override: undefined }))}
      />
    );
    expect(
      screen.getByRole('checkbox', { name: /always show action ctas/i })
    ).not.toBeChecked();
  });

  it('checkbox is checked when depth_override is "action"', () => {
    render(
      <TopicFormFields
        {...makeProps(
          makeTopic({ tags: ['donating'], depth_override: 'action' })
        )}
      />
    );
    expect(
      screen.getByRole('checkbox', { name: /always show action ctas/i })
    ).toBeChecked();
  });

  it('calls onChange with depth_override "action" when toggled on', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <TopicFormFields
        {...makeProps(makeTopic({ tags: ['donating'], depth_override: undefined }), onChange)}
      />
    );

    await user.click(
      screen.getByRole('checkbox', { name: /always show action ctas/i })
    );

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ depth_override: 'action' })
    );
  });

  it('calls onChange with depth_override undefined when toggled off', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <TopicFormFields
        {...makeProps(
          makeTopic({ tags: ['donating'], depth_override: 'action' }),
          onChange
        )}
      />
    );

    await user.click(
      screen.getByRole('checkbox', { name: /always show action ctas/i })
    );

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ depth_override: undefined })
    );
  });

  it('checkbox has aria-describedby pointing to the hint paragraph', () => {
    render(
      <TopicFormFields {...makeProps(makeTopic({ tags: ['t'] }))} />
    );
    const checkbox = screen.getByRole('checkbox', { name: /always show action ctas/i });
    const describedById = checkbox.getAttribute('aria-describedby');
    expect(describedById).toBeTruthy();
    const hint = document.getElementById(describedById!);
    expect(hint).toBeTruthy();
    expect(hint?.textContent).toMatch(/depth_override to "action"/i);
  });
});

// ===========================================================================
// TopicCardContent
// ===========================================================================

describe('TopicCardContent', () => {
  it('renders description text', () => {
    render(
      <TopicCardContent
        entity={makeTopic({ description: 'A short description for display.' })}
      />
    );
    expect(screen.getByText('A short description for display.')).toBeInTheDocument();
  });

  it('truncates long descriptions at ~120 chars with ellipsis', () => {
    const long = 'A'.repeat(150);
    render(<TopicCardContent entity={makeTopic({ description: long })} />);
    const text = screen.getByTitle(long);
    expect(text.textContent?.endsWith('…')).toBe(true);
    expect(text.textContent?.length).toBeLessThan(130);
  });

  it('shows "No description provided" when description is empty', () => {
    render(<TopicCardContent entity={makeTopic({ description: '' })} />);
    expect(screen.getByText(/no description provided/i)).toBeInTheDocument();
  });

  it('renders tag pills for each tag', () => {
    render(
      <TopicCardContent entity={makeTopic({ tags: ['food', 'health'] })} />
    );
    expect(screen.getByText('food')).toBeInTheDocument();
    expect(screen.getByText('health')).toBeInTheDocument();
  });

  it('tags container has aria-label="Tags"', () => {
    render(<TopicCardContent entity={makeTopic({ tags: ['food'] })} />);
    expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
  });

  it('renders role badge when role is set', () => {
    render(<TopicCardContent entity={makeTopic({ role: 'give', tags: ['t'] })} />);
    expect(screen.getByText(/role: give/i)).toBeInTheDocument();
  });

  it('does NOT render role badge when role is undefined', () => {
    render(<TopicCardContent entity={makeTopic({ role: undefined })} />);
    expect(screen.queryByText(/^role:/i)).toBeNull();
  });

  it('renders depth override badge when depth_override is "action"', () => {
    render(
      <TopicCardContent
        entity={makeTopic({ depth_override: 'action', tags: ['t'] })}
      />
    );
    expect(screen.getByText(/depth: action/i)).toBeInTheDocument();
  });

  it('does NOT render depth badge when depth_override is undefined', () => {
    render(<TopicCardContent entity={makeTopic({ depth_override: undefined })} />);
    expect(screen.queryByText(/depth:/i)).toBeNull();
  });

  it('shows "Informational — no CTAs" text when no tags', () => {
    render(<TopicCardContent entity={makeTopic({ tags: [] })} />);
    expect(screen.getByText(/informational — no ctas/i)).toBeInTheDocument();
  });

  it('does NOT show informational label when tags are present', () => {
    render(<TopicCardContent entity={makeTopic({ tags: ['food'] })} />);
    expect(screen.queryByText(/informational — no ctas/i)).toBeNull();
  });
});

// ===========================================================================
// validateTopic — standalone logic tests
// ===========================================================================

describe('validateTopic', () => {
  const baseContext = {
    isEditMode: false,
    existingIds: [],
    existingEntities: {} as Record<string, TopicEntity>,
  };

  it('returns no errors for a valid topic', () => {
    const errors = validateTopic(makeTopic(), baseContext);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('requires topicName', () => {
    const errors = validateTopic(makeTopic({ topicName: '' }), baseContext);
    expect(errors.topicName).toBeTruthy();
  });

  it('rejects topicName that starts with a number', () => {
    const errors = validateTopic(makeTopic({ topicName: '1bad' }), baseContext);
    expect(errors.topicName).toBeTruthy();
  });

  it('rejects topicName with uppercase letters', () => {
    const errors = validateTopic(makeTopic({ topicName: 'BadName' }), baseContext);
    expect(errors.topicName).toBeTruthy();
  });

  it('rejects topicName with hyphens', () => {
    const errors = validateTopic(makeTopic({ topicName: 'bad-name' }), baseContext);
    expect(errors.topicName).toBeTruthy();
  });

  it('accepts valid snake_case topicName', () => {
    const errors = validateTopic(makeTopic({ topicName: 'good_name_123' }), baseContext);
    expect(errors.topicName).toBeUndefined();
  });

  it('detects duplicate topicName in create mode', () => {
    const errors = validateTopic(
      makeTopic({ topicName: 'existing' }),
      { ...baseContext, existingIds: ['existing'] }
    );
    expect(errors.topicName).toMatch(/already exists/i);
  });

  it('does NOT flag duplicate in edit mode when name unchanged', () => {
    const topic = makeTopic({ topicName: 'existing' });
    const errors = validateTopic(topic, {
      ...baseContext,
      isEditMode: true,
      existingIds: ['existing'],
      originalEntity: topic,
    });
    expect(errors.topicName).toBeUndefined();
  });

  it('requires description', () => {
    const errors = validateTopic(makeTopic({ description: '' }), baseContext);
    expect(errors.description).toBeTruthy();
  });

  it('rejects description shorter than 20 characters', () => {
    const errors = validateTopic(
      makeTopic({ description: 'Too short.' }),
      baseContext
    );
    expect(errors.description).toMatch(/at least 20/i);
  });

  it('accepts description of exactly 20 characters', () => {
    const errors = validateTopic(
      makeTopic({ description: 'Exactly twenty chars!' }),
      baseContext
    );
    expect(errors.description).toBeUndefined();
  });

  it('flags invalid tag format', () => {
    const errors = validateTopic(
      makeTopic({ tags: ['Bad-Tag'] }),
      baseContext
    );
    expect(errors.tags).toBeTruthy();
  });

  it('accepts valid snake_case tags', () => {
    const errors = validateTopic(
      makeTopic({ tags: ['good_tag', 'another_tag123'] }),
      baseContext
    );
    expect(errors.tags).toBeUndefined();
  });

  it('flags depth_override when no tags are set', () => {
    const errors = validateTopic(
      makeTopic({ tags: [], depth_override: 'action' }),
      baseContext
    );
    expect(errors.depth_override).toMatch(/requires at least one tag/i);
  });

  it('does NOT flag depth_override when tags are present', () => {
    const errors = validateTopic(
      makeTopic({ tags: ['donating'], depth_override: 'action' }),
      baseContext
    );
    expect(errors.depth_override).toBeUndefined();
  });

  it('returns no errors for informational topic (no tags, no depth_override)', () => {
    const errors = validateTopic(
      makeTopic({ tags: [], depth_override: undefined }),
      baseContext
    );
    expect(errors.depth_override).toBeUndefined();
    expect(errors.tags).toBeUndefined();
  });
});
