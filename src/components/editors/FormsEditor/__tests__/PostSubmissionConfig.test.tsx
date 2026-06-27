/**
 * PostSubmissionConfig — "Book an appointment after this form" + post-booking question.
 * The scheduling pivot the operator authors; drives the runtime form -> schedule -> ask chain.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PostSubmissionConfig } from '../PostSubmissionConfig';

const base = { confirmation_message: 'Thanks — we received your application.' };

describe('PostSubmissionConfig — book appointment + post-booking question', () => {
  it('hides the question field until "Book an appointment" is enabled', () => {
    render(<PostSubmissionConfig value={base} onChange={vi.fn()} />);
    expect(screen.queryByLabelText(/question to ask after booking/i)).toBeNull();
  });

  it('checking "Book an appointment after this form" sets book_appointment: true', () => {
    const onChange = vi.fn();
    render(<PostSubmissionConfig value={base} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText(/book an appointment after this form/i));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ book_appointment: true }));
  });

  it('shows the question field when enabled and writes post_booking_question on input', () => {
    const onChange = vi.fn();
    render(<PostSubmissionConfig value={{ ...base, book_appointment: true }} onChange={onChange} />);
    const textarea = screen.getByLabelText(/question to ask after booking/i);
    fireEvent.change(textarea, { target: { value: 'What would you like to talk about?' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ post_booking_question: 'What would you like to talk about?' }),
    );
  });

  it('unchecking clears the coupled question (book_appointment:false + question undefined)', () => {
    const onChange = vi.fn();
    render(
      <PostSubmissionConfig
        value={{ ...base, book_appointment: true, post_booking_question: 'Q' }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByLabelText(/book an appointment after this form/i));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ book_appointment: false, post_booking_question: undefined }),
    );
  });
});
