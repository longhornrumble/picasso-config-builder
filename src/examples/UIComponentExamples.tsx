/**
 * UI Component Examples
 *
 * Comprehensive examples demonstrating all UI components with various configurations.
 * Use this file as a reference for component APIs and patterns.
 */

import { useState } from 'react';
import { Plus, Save, Trash2, Search, Settings } from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Alert,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Tooltip,
  TooltipProvider,
  Spinner,
  LoadingOverlay,
} from '../components/ui';

export function UIComponentExamples() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const programOptions = [
    { value: 'love-box', label: 'Love Box Program' },
    { value: 'food-bank', label: 'Food Bank' },
    { value: 'volunteer', label: 'Volunteer Services', disabled: true },
  ];

  const handleSimulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 p-8 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl space-y-12">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50">
              UI Component Examples
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Comprehensive showcase of all available UI components
            </p>
          </div>

          {/* Buttons Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
              Buttons
            </h2>
            <Card>
              <CardHeader>
                <CardTitle>Button Variants</CardTitle>
                <CardDescription>
                  Different button styles for various use cases
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button loading>Loading</Button>
                  <Button disabled>Disabled</Button>
                  <Button leftIcon={<Plus className="h-4 w-4" />}>
                    Add Item
                  </Button>
                  <Button rightIcon={<Save className="h-4 w-4" />}>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Inputs Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
              Inputs
            </h2>
            <Card>
              <CardHeader>
                <CardTitle>Input Fields</CardTitle>
                <CardDescription>
                  Text inputs with various states and configurations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Program Name"
                  placeholder="Enter program name..."
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="user@example.com"
                  helperText="We'll never share your email"
                />

                <Input
                  label="Search"
                  placeholder="Search programs..."
                  leftElement={<Search className="h-4 w-4" />}
                />

                <Input
                  label="With Error"
                  error="This field is required"
                  defaultValue="Invalid input"
                />

                <Input
                  label="Success State"
                  success="Email is available"
                  defaultValue="valid@example.com"
                />

                <Input
                  label="Disabled"
                  disabled
                  defaultValue="Cannot edit"
                />
              </CardContent>
            </Card>
          </section>

          {/* Select Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
              Select Dropdowns
            </h2>
            <Card>
              <CardHeader>
                <CardTitle>Select Components</CardTitle>
                <CardDescription>Dropdown selection with options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  label="Select Program"
                  placeholder="Choose a program..."
                  options={programOptions}
                  value={selectedProgram}
                  onValueChange={setSelectedProgram}
                  required
                />

                <Select
                  label="With Error"
                  placeholder="Select option..."
                  options={programOptions}
                  error="Please select a program"
                />

                <Select
                  label="Disabled Select"
                  placeholder="Cannot select..."
                  options={programOptions}
                  disabled
                />
              </CardContent>
            </Card>
          </section>

          {/* Badges Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
              Badges
            </h2>
            <Card>
              <CardHeader>
                <CardTitle>Status Badges</CardTitle>
                <CardDescription>
                  Visual indicators for status and categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="success">Active</Badge>
                  <Badge variant="warning">Draft</Badge>
                  <Badge variant="error">Error</Badge>
                  <Badge variant="info">Info</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge size="sm">Small</Badge>
                  <Badge size="md">Medium</Badge>
                  <Badge size="lg">Large</Badge>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="primary" icon={<Settings className="h-3 w-3" />}>
                    With Icon
                  </Badge>
                  <Badge variant="success">5 Forms</Badge>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Alerts Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
              Alerts
            </h2>
            <div className="space-y-4">
              <Alert variant="info">
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>
                  This is an informational message with helpful context.
                </AlertDescription>
              </Alert>

              <Alert variant="success">
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                  Your changes have been saved successfully.
                </AlertDescription>
              </Alert>

              <Alert variant="warning">
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  This action may affect existing configurations.
                </AlertDescription>
              </Alert>

              <Alert variant="error" dismissible onDismiss={() => alert('Dismissed')}>
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  An error occurred while processing your request. Click the X to
                  dismiss.
                </AlertDescription>
              </Alert>
            </div>
          </section>

          {/* Cards Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
              Cards
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Simple Card</CardTitle>
                  <CardDescription>A basic card with header</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Card content goes here. This is a simple card layout.
                  </p>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardHeader bordered>
                  <CardTitle>Outlined Card</CardTitle>
                  <CardDescription>With bordered header</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This card has an outlined variant with a bordered header.
                  </p>
                </CardContent>
                <CardFooter bordered>
                  <Button size="sm" variant="outline">
                    Action
                  </Button>
                </CardFooter>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <CardTitle size="lg">Elevated Card</CardTitle>
                  <CardDescription>With shadow effect</CardDescription>
                </CardHeader>
                <CardContent className="relative min-h-[100px]">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This card has elevated styling with shadow.
                  </p>
                  <LoadingOverlay
                    isLoading={isLoading}
                    message="Loading..."
                    size="md"
                  />
                </CardContent>
                <CardFooter>
                  <Button size="sm" onClick={handleSimulateLoading}>
                    Simulate Loading
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </section>

          {/* Modal Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
              Modals
            </h2>
            <Card>
              <CardHeader>
                <CardTitle>Modal Dialogs</CardTitle>
                <CardDescription>
                  Overlay dialogs for confirmations and forms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>

                <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <ModalContent>
                    <ModalHeader>
                      <ModalTitle>Delete Program</ModalTitle>
                      <ModalDescription>
                        Are you sure you want to delete this program? This action
                        cannot be undone and will affect 5 associated forms.
                      </ModalDescription>
                    </ModalHeader>
                    <ModalFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="danger"
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        onClick={() => {
                          setIsModalOpen(false);
                          alert('Deleted!');
                        }}
                      >
                        Delete
                      </Button>
                    </ModalFooter>
                  </ModalContent>
                </Modal>
              </CardContent>
            </Card>
          </section>

          {/* Tabs Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
              Tabs
            </h2>
            <Card>
              <CardHeader>
                <CardTitle>Tabbed Content</CardTitle>
                <CardDescription>
                  Organize related content into tabs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="forms">Forms</TabsTrigger>
                    <TabsTrigger value="ctas">CTAs</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="space-y-4">
                    <h3 className="font-semibold">Overview Content</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This is the overview tab content. It contains a summary of
                      the configuration.
                    </p>
                  </TabsContent>
                  <TabsContent value="forms" className="space-y-4">
                    <h3 className="font-semibold">Forms Content</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Manage your conversational forms here.
                    </p>
                  </TabsContent>
                  <TabsContent value="ctas" className="space-y-4">
                    <h3 className="font-semibold">CTAs Content</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Configure your call-to-action buttons.
                    </p>
                  </TabsContent>
                  <TabsContent value="settings" className="space-y-4">
                    <h3 className="font-semibold">Settings Content</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Adjust tenant-level settings and preferences.
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </section>

          {/* Tooltips Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
              Tooltips
            </h2>
            <Card>
              <CardHeader>
                <CardTitle>Contextual Help</CardTitle>
                <CardDescription>
                  Hover over elements for additional information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Tooltip content="This is a helpful tooltip">
                    <Button variant="outline">Hover me</Button>
                  </Tooltip>

                  <Tooltip content="Save your changes" side="right">
                    <Button variant="primary" leftIcon={<Save className="h-4 w-4" />}>
                      Save
                    </Button>
                  </Tooltip>

                  <Tooltip content="Delete this item permanently" side="bottom">
                    <Button
                      variant="danger"
                      size="icon"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                    >
                      <span className="sr-only">Delete</span>
                    </Button>
                  </Tooltip>

                  <Tooltip
                    content="Add a new program to the configuration"
                    side="left"
                  >
                    <Button variant="secondary" leftIcon={<Plus className="h-4 w-4" />}>
                      Add Program
                    </Button>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Spinners Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
              Loading Indicators
            </h2>
            <Card>
              <CardHeader>
                <CardTitle>Spinners</CardTitle>
                <CardDescription>
                  Loading indicators for async operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-8">
                  <div className="space-y-2 text-center">
                    <Spinner size="sm" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">Small</p>
                  </div>
                  <div className="space-y-2 text-center">
                    <Spinner size="md" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Medium
                    </p>
                  </div>
                  <div className="space-y-2 text-center">
                    <Spinner size="lg" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">Large</p>
                  </div>
                  <div className="space-y-2 text-center">
                    <Spinner size="xl" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Extra Large
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-8">
                  <div className="space-y-2 text-center">
                    <Spinner variant="primary" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Primary
                    </p>
                  </div>
                  <div className="space-y-2 text-center">
                    <Spinner variant="secondary" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Secondary
                    </p>
                  </div>
                  <div className="space-y-2 text-center">
                    <div className="rounded bg-gray-900 p-4">
                      <Spinner variant="white" />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">White</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default UIComponentExamples;
