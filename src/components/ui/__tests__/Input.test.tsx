/**
 * Input Component Tests
 * Comprehensive tests for the Input UI component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';
import { Search } from 'lucide-react';

describe('Input Component', () => {
  describe('rendering', () => {
    it('should render input field', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<Input label="Email" />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('should show required indicator when required', () => {
      render(<Input label="Email" required />);
      const asterisk = screen.getByText('*');
      expect(asterisk).toBeInTheDocument();
      expect(asterisk).toHaveClass('text-red-500');
    });

    it('should apply custom className', () => {
      const { container } = render(<Input className="custom-input" />);
      const input = container.querySelector('.custom-input');
      expect(input).toBeInTheDocument();
    });

    it('should forward ref', () => {
      const ref = vi.fn();
      render(<Input ref={ref} />);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('validation states', () => {
    it('should show error state', () => {
      render(<Input label="Email" error="Invalid email" />);
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Invalid email');
      expect(errorMessage).toHaveClass('text-red-600');
    });

    it('should show success state', () => {
      render(<Input label="Email" success="Email is valid" />);
      const successMessage = screen.getByText(/email is valid/i);
      expect(successMessage).toHaveClass('text-green-600');
    });

    it('should show helper text', () => {
      render(<Input label="Password" helperText="At least 8 characters" />);
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });

    it('should prioritize error over success', () => {
      render(<Input error="Error" success="Success" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Error');
      expect(screen.queryByText('Success')).not.toBeInTheDocument();
    });

    it('should prioritize error over helperText', () => {
      render(<Input error="Error" helperText="Helper" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Error');
      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
    });
  });

  describe('input types', () => {
    it('should support text type', () => {
      render(<Input type="text" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should support email type', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should support password type', () => {
      render(<Input type="password" />);
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });

    it('should support number type', () => {
      render(<Input type="number" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  describe('icons and elements', () => {
    it('should render left element', () => {
      render(<Input leftElement={<Search data-testid="search-icon" />} />);
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('should render right element when no validation state', () => {
      render(<Input rightElement={<Search data-testid="search-icon" />} />);
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('should hide right element when error is shown', () => {
      render(
        <Input
          rightElement={<Search data-testid="search-icon" />}
          error="Error"
        />
      );
      expect(screen.queryByTestId('search-icon')).not.toBeInTheDocument();
    });

    it('should show error icon when error is present', () => {
      const { container } = render(<Input error="Error" />);
      const errorIcon = container.querySelector('.text-red-500');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should show success icon when success is present', () => {
      const { container } = render(<Input success="Success" />);
      const successIcon = container.querySelector('.text-green-500');
      expect(successIcon).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should have disabled styles', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
    });
  });

  describe('interactions', () => {
    it('should call onChange when value changes', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'test');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should update value when typing', async () => {
      const user = userEvent.setup();

      render(<Input />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      await user.type(input, 'hello');
      expect(input.value).toBe('hello');
    });

    it('should support onFocus and onBlur', async () => {
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();
      const user = userEvent.setup();

      render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');

      await user.click(input);
      expect(handleFocus).toHaveBeenCalled();

      await user.tab();
      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have textbox role for text input', () => {
      render(<Input type="text" />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should link label to input with htmlFor', () => {
      render(<Input label="Email" />);
      const label = screen.getByText('Email');
      const input = screen.getByRole('textbox');
      expect(label).toHaveAttribute('for', input.id);
    });

    it('should set aria-invalid when error is present', () => {
      render(<Input error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should link error message with aria-describedby', () => {
      render(<Input label="Email" error="Invalid email" />);
      const input = screen.getByRole('textbox');
      const errorId = input.getAttribute('aria-describedby');
      expect(errorId).toBeTruthy();
      expect(document.getElementById(errorId!)).toHaveTextContent('Invalid email');
    });

    it('should link helper text with aria-describedby', () => {
      render(<Input label="Password" helperText="8+ characters" />);
      const input = screen.getByRole('textbox');
      const helperId = input.getAttribute('aria-describedby');
      expect(helperId).toBeTruthy();
      expect(document.getElementById(helperId!)).toHaveTextContent('8+ characters');
    });
  });

  describe('placeholder', () => {
    it('should show placeholder text', () => {
      render(<Input placeholder="Enter your name" />);
      expect(screen.getByPlaceholderText(/enter your name/i)).toBeInTheDocument();
    });

    it('should have placeholder styles', () => {
      render(<Input placeholder="Placeholder" />);
      const input = screen.getByPlaceholderText(/placeholder/i);
      expect(input).toHaveClass('placeholder:text-gray-400');
    });
  });
});
