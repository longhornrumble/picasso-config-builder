/**
 * Modal Component Tests
 * Tests for modal positioning, accessibility, and behavior
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '../Modal';
import { Button } from '../Button';

describe('Modal Component', () => {
  describe('Positioning', () => {
    it('should render modal content with centering classes', () => {
      render(
        <Modal open={true}>
          <ModalContent data-testid="modal-content">
            <ModalHeader>
              <ModalTitle>Test Modal</ModalTitle>
            </ModalHeader>
          </ModalContent>
        </Modal>
      );

      const modalContent = screen.getByTestId('modal-content');
      const classes = modalContent.className;

      // Check for centering classes
      expect(classes).toContain('fixed');
      expect(classes).toContain('left-[50%]');
      expect(classes).toContain('top-[50%]');
      expect(classes).toContain('translate-x-[-50%]');
      expect(classes).toContain('translate-y-[-50%]');
    });

    it('should have responsive max-width classes', () => {
      render(
        <Modal open={true}>
          <ModalContent data-testid="modal-content">
            <ModalHeader>
              <ModalTitle>Test Modal</ModalTitle>
            </ModalHeader>
          </ModalContent>
        </Modal>
      );

      const modalContent = screen.getByTestId('modal-content');
      const classes = modalContent.className;

      // Check for mobile max-width
      expect(classes).toContain('w-[calc(100%-2rem)]');
      expect(classes).toContain('max-w-[calc(100vw-2rem)]');

      // Check for desktop max-width
      expect(classes).toContain('sm:max-w-lg');
    });

    it('should support custom className without breaking centering', () => {
      render(
        <Modal open={true}>
          <ModalContent className="max-w-4xl custom-class" data-testid="modal-content">
            <ModalHeader>
              <ModalTitle>Test Modal</ModalTitle>
            </ModalHeader>
          </ModalContent>
        </Modal>
      );

      const modalContent = screen.getByTestId('modal-content');
      const classes = modalContent.className;

      // Custom classes should be applied
      expect(classes).toContain('max-w-4xl');
      expect(classes).toContain('custom-class');

      // Centering classes should still be present
      expect(classes).toContain('left-[50%]');
      expect(classes).toContain('top-[50%]');
      expect(classes).toContain('translate-x-[-50%]');
      expect(classes).toContain('translate-y-[-50%]');
    });
  });

  describe('Accessibility', () => {
    it('should render with proper ARIA attributes', () => {
      render(
        <Modal open={true}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Accessible Modal</ModalTitle>
              <ModalDescription>This is a description</ModalDescription>
            </ModalHeader>
          </ModalContent>
        </Modal>
      );

      // Radix UI Dialog should set role="dialog"
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should have close button with screen reader text', () => {
      render(
        <Modal open={true}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Modal with Close</ModalTitle>
            </ModalHeader>
          </ModalContent>
        </Modal>
      );

      // Close button should have sr-only text
      const closeButton = screen.getByText('Close');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton.className).toContain('sr-only');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <Modal open={true} onOpenChange={onOpenChange}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Keyboard Modal</ModalTitle>
            </ModalHeader>
            <ModalFooter>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      );

      // Escape key should trigger onOpenChange
      await user.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Content Structure', () => {
    it('should render header, content, and footer', () => {
      render(
        <Modal open={true}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Test Title</ModalTitle>
              <ModalDescription>Test Description</ModalDescription>
            </ModalHeader>
            <div>Modal Body Content</div>
            <ModalFooter>
              <Button>Action</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Modal Body Content')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });

  describe('Overlay', () => {
    it('should render overlay backdrop', () => {
      const { baseElement } = render(
        <Modal open={true}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Test</ModalTitle>
            </ModalHeader>
          </ModalContent>
        </Modal>
      );

      // Radix UI Portal renders overlay outside of container
      const overlay = baseElement.querySelector('[data-state="open"]');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should have overflow scroll for tall content', () => {
      render(
        <Modal open={true}>
          <ModalContent data-testid="modal-content">
            <ModalHeader>
              <ModalTitle>Tall Modal</ModalTitle>
            </ModalHeader>
            <div style={{ height: '2000px' }}>Very tall content</div>
          </ModalContent>
        </Modal>
      );

      const modalContent = screen.getByTestId('modal-content');
      const classes = modalContent.className;

      // Should have overflow handling
      expect(classes).toContain('overflow-y-auto');
      expect(classes).toContain('max-h-[calc(100vh-2rem)]');
    });
  });

  describe('Animation', () => {
    it('should have animation classes', () => {
      render(
        <Modal open={true}>
          <ModalContent data-testid="modal-content">
            <ModalHeader>
              <ModalTitle>Animated Modal</ModalTitle>
            </ModalHeader>
          </ModalContent>
        </Modal>
      );

      const modalContent = screen.getByTestId('modal-content');
      const classes = modalContent.className;

      // Should have animation classes
      expect(classes).toContain('data-[state=open]:animate-in');
      expect(classes).toContain('data-[state=closed]:animate-out');
      expect(classes).toContain('data-[state=open]:zoom-in-95');
      expect(classes).toContain('data-[state=closed]:zoom-out-95');
    });
  });
});
