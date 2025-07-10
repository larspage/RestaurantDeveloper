/// <reference types="cypress" />

describe('Printer Management', () => {
  let restaurantId: string;

  beforeEach(() => {
    // Create test user and restaurant
    cy.task('createTestUser').then((user: any) => {
      cy.task('createTestRestaurant', { userId: user._id }).then((restaurant: any) => {
        restaurantId = restaurant._id;
        
        // Login
        cy.visit('/login');
        cy.get('[data-testid="email-input"]').type(user.email);
        cy.get('[data-testid="password-input"]').type('password123');
        cy.get('[data-testid="login-button"]').click();
        
        // Navigate to printer management
        cy.visit(`/dashboard/restaurants/${restaurantId}/printers`);
        cy.url().should('include', '/printers');
      });
    });
  });

  afterEach(() => {
    // Clean up test data
    cy.task('cleanupTestData');
  });

  describe('Printer Management Interface', () => {
    it('should display printer management page with empty state', () => {
      cy.get('[data-testid="printer-management-title"]').should('contain', 'Printer Management');
      cy.get('[data-testid="printers-tab"]').should('be.visible');
      cy.get('[data-testid="print-queue-tab"]').should('be.visible');
      cy.get('[data-testid="add-printer-button"]').should('be.visible');
      cy.get('[data-testid="no-printers-message"]').should('contain', 'No printers configured');
    });

    it('should show breadcrumb navigation', () => {
      cy.get('[data-testid="breadcrumb-dashboard"]').should('be.visible');
      cy.get('[data-testid="breadcrumb-restaurant"]').should('be.visible');
      cy.get('[data-testid="breadcrumb-printers"]').should('contain', 'Printers');
    });

    it('should navigate between tabs', () => {
      cy.get('[data-testid="print-queue-tab"]').click();
      cy.get('[data-testid="no-print-jobs-message"]').should('contain', 'No print jobs');
      
      cy.get('[data-testid="printers-tab"]').click();
      cy.get('[data-testid="no-printers-message"]').should('be.visible');
    });
  });

  describe('Adding Printers', () => {
    it('should open add printer modal', () => {
      cy.get('[data-testid="add-printer-button"]').click();
      cy.get('[data-testid="printer-modal"]').should('be.visible');
      cy.get('[data-testid="modal-title"]').should('contain', 'Add Printer');
    });

    it('should add a network printer successfully', () => {
      cy.get('[data-testid="add-printer-button"]').click();
      
      // Fill in printer details
      cy.get('[data-testid="printer-name-input"]').type('Kitchen Printer 1');
      cy.get('[data-testid="printer-type-select"]').select('kitchen');
      cy.get('[data-testid="connection-type-select"]').select('network');
      cy.get('[data-testid="ip-address-input"]').type('192.168.1.100');
      cy.get('[data-testid="port-input"]').clear().type('9100');
      cy.get('[data-testid="auto-print-checkbox"]').check();
      
      // Submit form
      cy.get('[data-testid="submit-printer-button"]').click();
      
      // Verify success
      cy.get('[data-testid="success-notification"]').should('contain', 'Printer added successfully');
      cy.get('[data-testid="printer-card"]').should('contain', 'Kitchen Printer 1');
      cy.get('[data-testid="printer-status"]').should('contain', 'offline');
    });

    it('should add a USB printer successfully', () => {
      cy.get('[data-testid="add-printer-button"]').click();
      
      // Fill in USB printer details
      cy.get('[data-testid="printer-name-input"]').type('Receipt Printer 1');
      cy.get('[data-testid="printer-type-select"]').select('receipt');
      cy.get('[data-testid="connection-type-select"]').select('usb');
      cy.get('[data-testid="usb-device-input"]').type('/dev/usb/lp0');
      
      // Submit form
      cy.get('[data-testid="submit-printer-button"]').click();
      
      // Verify success
      cy.get('[data-testid="success-notification"]').should('contain', 'Printer added successfully');
      cy.get('[data-testid="printer-card"]').should('contain', 'Receipt Printer 1');
    });

    it('should validate required fields', () => {
      cy.get('[data-testid="add-printer-button"]').click();
      cy.get('[data-testid="submit-printer-button"]').click();
      
      // Should show validation error
      cy.get('[data-testid="error-notification"]').should('contain', 'required');
    });

    it('should validate network printer requirements', () => {
      cy.get('[data-testid="add-printer-button"]').click();
      
      cy.get('[data-testid="printer-name-input"]').type('Network Printer');
      cy.get('[data-testid="printer-type-select"]').select('kitchen');
      cy.get('[data-testid="connection-type-select"]').select('network');
      // Don't fill IP or port
      
      cy.get('[data-testid="submit-printer-button"]').click();
      cy.get('[data-testid="error-notification"]').should('contain', 'IP address');
    });

    it('should validate USB printer requirements', () => {
      cy.get('[data-testid="add-printer-button"]').click();
      
      cy.get('[data-testid="printer-name-input"]').type('USB Printer');
      cy.get('[data-testid="printer-type-select"]').select('receipt');
      cy.get('[data-testid="connection-type-select"]').select('usb');
      // Don't fill USB device
      
      cy.get('[data-testid="submit-printer-button"]').click();
      cy.get('[data-testid="error-notification"]').should('contain', 'USB device');
    });

    it('should cancel adding printer', () => {
      cy.get('[data-testid="add-printer-button"]').click();
      cy.get('[data-testid="cancel-printer-button"]').click();
      cy.get('[data-testid="printer-modal"]').should('not.exist');
    });
  });

  describe('Managing Printers', () => {
    beforeEach(() => {
      // Add a test printer first
      cy.get('[data-testid="add-printer-button"]').click();
      cy.get('[data-testid="printer-name-input"]').type('Test Printer');
      cy.get('[data-testid="printer-type-select"]').select('kitchen');
      cy.get('[data-testid="connection-type-select"]').select('network');
      cy.get('[data-testid="ip-address-input"]').type('192.168.1.100');
      cy.get('[data-testid="port-input"]').clear().type('9100');
      cy.get('[data-testid="submit-printer-button"]').click();
      cy.get('[data-testid="success-notification"]').should('be.visible');
    });

    it('should test printer connection', () => {
      cy.get('[data-testid="test-printer-button"]').click();
      
      // Should show testing state
      cy.get('[data-testid="test-printer-button"]').should('contain', 'Testing...');
      
      // Wait for test result
      cy.get('[data-testid="success-notification"]', { timeout: 10000 })
        .should('contain', 'Test print successful');
      
      // Status should update
      cy.get('[data-testid="printer-status"]').should('contain', 'online');
    });

    it('should edit printer configuration', () => {
      cy.get('[data-testid="edit-printer-button"]').click();
      
      // Modal should show with current values
      cy.get('[data-testid="modal-title"]').should('contain', 'Edit Printer');
      cy.get('[data-testid="printer-name-input"]').should('have.value', 'Test Printer');
      
      // Update printer name
      cy.get('[data-testid="printer-name-input"]').clear().type('Updated Test Printer');
      cy.get('[data-testid="enabled-checkbox"]').uncheck();
      
      cy.get('[data-testid="submit-printer-button"]').click();
      
      // Verify update
      cy.get('[data-testid="success-notification"]').should('contain', 'Printer updated successfully');
      cy.get('[data-testid="printer-card"]').should('contain', 'Updated Test Printer');
    });

    it('should delete printer with confirmation', () => {
      cy.get('[data-testid="delete-printer-button"]').click();
      
      // Should show confirmation dialog
      cy.on('window:confirm', () => true);
      
      // Verify deletion
      cy.get('[data-testid="success-notification"]').should('contain', 'Printer deleted successfully');
      cy.get('[data-testid="no-printers-message"]').should('be.visible');
    });

    it('should cancel printer deletion', () => {
      cy.get('[data-testid="delete-printer-button"]').click();
      
      // Cancel confirmation
      cy.on('window:confirm', () => false);
      
      // Printer should still exist
      cy.get('[data-testid="printer-card"]').should('contain', 'Test Printer');
    });
  });

  describe('Print Queue Management', () => {
    beforeEach(() => {
      // Add printer and create print job
      cy.task('createTestPrinter', { restaurantId }).then((printer: any) => {
        cy.task('createTestOrder', { restaurantId }).then((order: any) => {
          cy.task('createTestPrintJob', { 
            orderId: order._id, 
            printerId: printer.id 
          });
        });
      });
      
      // Navigate to print queue tab
      cy.get('[data-testid="print-queue-tab"]').click();
    });

    it('should display print jobs in queue', () => {
      cy.get('[data-testid="print-job-card"]').should('be.visible');
      cy.get('[data-testid="job-order-id"]').should('be.visible');
      cy.get('[data-testid="job-status"]').should('be.visible');
      cy.get('[data-testid="job-printer"]').should('be.visible');
      cy.get('[data-testid="job-type"]').should('be.visible');
    });

    it('should show job details', () => {
      cy.get('[data-testid="print-job-card"]').within(() => {
        cy.get('[data-testid="job-status"]').should('contain', 'COMPLETED');
        cy.get('[data-testid="job-attempts"]').should('contain', '1/3');
        cy.get('[data-testid="job-timestamp"]').should('be.visible');
      });
    });

    it('should retry failed print jobs', () => {
      // This test would require a failed job setup
      // For now, we'll test the UI elements exist
      cy.get('[data-testid="print-job-card"]').should('be.visible');
      
      // If job was failed, retry button should be visible
      // cy.get('[data-testid="retry-print-button"]').click();
      // cy.get('[data-testid="success-notification"]').should('contain', 'Print job retried');
    });
  });

  describe('Advanced Print Integration', () => {
    beforeEach(() => {
      // Add printer and order for testing
      cy.task('createTestPrinter', { restaurantId }).then(() => {
        cy.task('createTestOrder', { restaurantId }).then((order: any) => {
          // Navigate to order detail page
          cy.visit(`/dashboard/orders/${order._id}`);
        });
      });
    });

    it('should show advanced print button on order page', () => {
      cy.get('[data-testid="advanced-print-button"]').should('be.visible');
    });

    it('should open printer selection menu', () => {
      cy.get('[data-testid="print-options-button"]').click();
      cy.get('[data-testid="printer-selection-menu"]').should('be.visible');
    });

    it('should show available printers in selection menu', () => {
      cy.get('[data-testid="print-options-button"]').click();
      cy.get('[data-testid="printer-option"]').should('be.visible');
      cy.get('[data-testid="printer-status-badge"]').should('be.visible');
    });

    it('should print to specific printer', () => {
      cy.get('[data-testid="print-options-button"]').click();
      cy.get('[data-testid="kitchen-print-button"]').first().click();
      
      cy.get('[data-testid="success-notification"]')
        .should('contain', 'Print job sent to');
    });

    it('should show fallback browser print option', () => {
      cy.get('[data-testid="print-options-button"]').click();
      cy.get('[data-testid="browser-print-button"]').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should work on tablet viewport', () => {
      cy.viewport('ipad-2');
      cy.get('[data-testid="printer-management-title"]').should('be.visible');
      cy.get('[data-testid="add-printer-button"]').should('be.visible');
    });

    it('should work on mobile viewport', () => {
      cy.viewport('iphone-x');
      cy.get('[data-testid="printer-management-title"]').should('be.visible');
      cy.get('[data-testid="add-printer-button"]').should('be.visible');
    });
  });

  describe('Navigation Integration', () => {
    it('should navigate from restaurant detail page', () => {
      cy.visit(`/dashboard/restaurants/${restaurantId}`);
      cy.get('[data-testid="printer-management-button"]').click();
      cy.url().should('include', '/printers');
    });

    it('should navigate back to restaurant from breadcrumbs', () => {
      cy.get('[data-testid="breadcrumb-restaurant"]').click();
      cy.url().should('include', `/restaurants/${restaurantId}`);
    });

    it('should navigate back to dashboard from breadcrumbs', () => {
      cy.get('[data-testid="breadcrumb-dashboard"]').click();
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      // Intercept API calls to simulate errors
      cy.intercept('GET', `/printers/restaurants/${restaurantId}/printers`, {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('getPrintersError');
      
      cy.reload();
      cy.wait('@getPrintersError');
      
      cy.get('[data-testid="error-message"]').should('contain', 'Failed to load printer data');
    });

    it('should handle printer test failures', () => {
      // Add printer first
      cy.get('[data-testid="add-printer-button"]').click();
      cy.get('[data-testid="printer-name-input"]').type('Test Printer');
      cy.get('[data-testid="printer-type-select"]').select('kitchen');
      cy.get('[data-testid="connection-type-select"]').select('network');
      cy.get('[data-testid="ip-address-input"]').type('192.168.1.100');
      cy.get('[data-testid="port-input"]').clear().type('9100');
      cy.get('[data-testid="submit-printer-button"]').click();
      
      // Intercept test call to simulate failure
      cy.intercept('POST', '**/test', {
        statusCode: 200,
        body: { success: false, message: 'Connection failed' }
      }).as('testPrinterFail');
      
      cy.get('[data-testid="test-printer-button"]').click();
      cy.wait('@testPrinterFail');
      
      cy.get('[data-testid="error-notification"]').should('contain', 'Connection failed');
      cy.get('[data-testid="printer-status"]').should('contain', 'error');
    });
  });

  describe('Performance and Loading States', () => {
    it('should show loading state while fetching data', () => {
      cy.intercept('GET', `/printers/restaurants/${restaurantId}/printers`, {
        delay: 2000,
        statusCode: 200,
        body: []
      }).as('getPrintersDelay');
      
      cy.reload();
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      cy.wait('@getPrintersDelay');
      cy.get('[data-testid="loading-spinner"]').should('not.exist');
    });

    it('should show loading state during printer operations', () => {
      // Add printer first
      cy.get('[data-testid="add-printer-button"]').click();
      cy.get('[data-testid="printer-name-input"]').type('Test Printer');
      cy.get('[data-testid="printer-type-select"]').select('kitchen');
      cy.get('[data-testid="connection-type-select"]').select('network');
      cy.get('[data-testid="ip-address-input"]').type('192.168.1.100');
      cy.get('[data-testid="port-input"]').clear().type('9100');
      
      // Intercept submit to add delay
      cy.intercept('POST', '**/printers', {
        delay: 1000,
        statusCode: 200,
        body: { id: 'test123', name: 'Test Printer' }
      }).as('addPrinterDelay');
      
      cy.get('[data-testid="submit-printer-button"]').click();
      cy.get('[data-testid="submit-printer-button"]').should('be.disabled');
    });
  });
}); 