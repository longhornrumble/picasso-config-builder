/**
 * UI Components Barrel Export
 *
 * Centralized export point for all shared UI components.
 * Import components from this file throughout the application.
 *
 * @example
 * ```tsx
 * import { Button, Input, Card } from '@/components/ui';
 * ```
 */

// Button
export { Button } from './Button';
export type { ButtonProps } from './Button';

// Input
export { Input } from './Input';
export type { InputProps } from './Input';

// Select
export { Select } from './Select';
export type { SelectProps, SelectOption } from './Select';

// Card
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card';
export type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardFooterProps,
} from './Card';

// Badge
export { Badge } from './Badge';
export type { BadgeProps } from './Badge';

// Alert
export { Alert, AlertTitle, AlertDescription } from './Alert';
export type { AlertProps } from './Alert';

// Modal (Dialog)
export {
  Modal,
  ModalTrigger,
  ModalClose,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ModalOverlay,
} from './Modal';
export type { ModalProps } from './Modal';

// Tabs
export { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
export type { TabsProps } from './Tabs';

// Tooltip
export {
  Tooltip,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
} from './Tooltip';
export type { TooltipProps } from './Tooltip';

// Spinner
export { Spinner, LoadingOverlay } from './Spinner';
export type { SpinnerProps, LoadingOverlayProps } from './Spinner';
