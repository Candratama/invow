/**
 * Unit Tests for CustomersLocked Component
 *
 * Tests the locked state UI for free users accessing customer management.
 * Requirements: 2.1, 2.2, 5.3
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CustomersLocked } from "../customers-locked";

// Mock the UpgradeModal component
vi.mock("@/components/features/subscription/upgrade-modal", () => ({
  default: ({
    isOpen,
    onClose,
    feature,
  }: {
    isOpen: boolean;
    onClose: () => void;
    feature: string;
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="upgrade-modal" role="dialog">
        <span data-testid="modal-feature">{feature}</span>
        <button onClick={onClose} data-testid="close-modal">
          Close
        </button>
      </div>
    );
  },
}));

describe("CustomersLocked Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: Renders locked state with premium badge
   * Validates: Requirement 2.1 - Clear description of benefits
   */
  it("should render locked state with premium badge", () => {
    render(<CustomersLocked />);

    // Should show Customers title
    expect(screen.getByText("Customers")).toBeInTheDocument();

    // Should show Premium badge
    expect(screen.getByText("Premium")).toBeInTheDocument();

    // Should show lock icon (via the unlock title)
    expect(screen.getByText("Unlock Customer Management")).toBeInTheDocument();
  });

  /**
   * Test: Displays feature benefits
   * Validates: Requirement 2.1 - Clear description of benefits
   */
  it("should display customer management benefits", () => {
    render(<CustomersLocked />);

    // Should show benefit titles
    expect(screen.getByText("Save Customer Details")).toBeInTheDocument();
    expect(screen.getByText("Faster Invoice Creation")).toBeInTheDocument();
    expect(screen.getByText("Customer History")).toBeInTheDocument();

    // Should show benefit descriptions
    expect(
      screen.getByText(/Store customer name, phone, address/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Select saved customers instead of typing/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Keep track of all customers/)).toBeInTheDocument();
  });

  /**
   * Test: Upgrade button opens modal
   * Validates: Requirement 2.2 - Upgrade button opens modal
   */
  it("should open upgrade modal when upgrade button is clicked", () => {
    render(<CustomersLocked />);

    // Modal should not be visible initially
    expect(screen.queryByTestId("upgrade-modal")).not.toBeInTheDocument();

    // Click upgrade button
    const upgradeButton = screen.getByRole("button", {
      name: /Upgrade to Premium/i,
    });
    fireEvent.click(upgradeButton);

    // Modal should now be visible
    expect(screen.getByTestId("upgrade-modal")).toBeInTheDocument();

    // Modal should have correct feature name
    expect(screen.getByTestId("modal-feature")).toHaveTextContent(
      "Customer Management"
    );
  });

  /**
   * Test: Modal can be closed
   * Validates: Requirement 2.2 - Modal interaction
   */
  it("should close upgrade modal when close is triggered", () => {
    render(<CustomersLocked />);

    // Open modal
    const upgradeButton = screen.getByRole("button", {
      name: /Upgrade to Premium/i,
    });
    fireEvent.click(upgradeButton);

    // Modal should be visible
    expect(screen.getByTestId("upgrade-modal")).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByTestId("close-modal");
    fireEvent.click(closeButton);

    // Modal should be hidden
    expect(screen.queryByTestId("upgrade-modal")).not.toBeInTheDocument();
  });

  /**
   * Test: Data preservation message NOT shown by default
   * Validates: Requirement 5.3 - Data preservation message conditional
   */
  it("should NOT show data preservation message when hasExistingCustomers is false", () => {
    render(<CustomersLocked hasExistingCustomers={false} />);

    // Should NOT show data preservation message
    expect(screen.queryByText(/Your data is safe/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/existing customer records are preserved/)
    ).not.toBeInTheDocument();
  });

  /**
   * Test: Data preservation message shown when user has existing customers
   * Validates: Requirement 5.3 - Data preservation message
   */
  it("should show data preservation message when hasExistingCustomers is true", () => {
    render(<CustomersLocked hasExistingCustomers={true} />);

    // Should show data preservation message
    expect(screen.getByText(/Your data is safe/)).toBeInTheDocument();
    expect(
      screen.getByText(/existing customer records are preserved/)
    ).toBeInTheDocument();
  });

  /**
   * Test: Default hasExistingCustomers is false
   * Validates: Requirement 5.3 - Default behavior
   */
  it("should default hasExistingCustomers to false", () => {
    render(<CustomersLocked />);

    // Should NOT show data preservation message by default
    expect(screen.queryByText(/Your data is safe/)).not.toBeInTheDocument();
  });

  /**
   * Test: Upgrade button is accessible
   * Validates: Requirement 2.2 - Accessible upgrade flow
   */
  it("should have accessible upgrade button", () => {
    render(<CustomersLocked />);

    const upgradeButton = screen.getByRole("button", {
      name: /Upgrade to Premium/i,
    });

    // Button should be enabled and clickable
    expect(upgradeButton).toBeEnabled();
    expect(upgradeButton).toBeVisible();
  });
});
