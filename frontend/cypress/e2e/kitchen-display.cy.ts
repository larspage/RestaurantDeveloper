describe('Kitchen Display System', () => {
  let testRestaurantId: string;

  beforeEach(() => {
    // Set up test data
    cy.fixture('restaurants').then((restaurants) => {
      testRestaurantId = restaurants[0]._id;
    });

    // Mock the API responses
    cy.intercept('GET', `/api/restaurants/${testRestaurantId}`, {
      fixture: 'restaurants.json'
    }).as('getRestaurant');

    cy.intercept('GET', `/api/orders/restaurant/${testRestaurantId}`, {
      fixture: 'kitchen-orders.json'
    }).as('getOrders');

    cy.intercept('PATCH', '/api/orders/*/status', {
      statusCode: 200,
      body: { success: true }
    }).as('updateOrderStatus');
  });

  describe('Kitchen Display Interface', () => {
    it('should display the kitchen interface correctly', () => {
      cy.visit(`/kitchen/${testRestaurantId}`);

      // Check page title and header
      cy.get('h1').should('contain', 'Kitchen Display');
      cy.get('[data-testid="restaurant-name"]').should('be.visible');
      
      // Check real-time clock
      cy.get('[data-testid="current-time"]').should('be.visible');
      cy.get('[data-testid="current-time"]').should('match', /\d{1,2}:\d{2}:\d{2} [AP]M/);
      
      // Check connection status
      cy.get('[data-testid="connection-status"]').should('contain', 'Connected');
      
      // Check control buttons
      cy.get('[data-testid="refresh-button"]').should('be.visible');
      cy.get('[data-testid="auto-refresh-toggle"]').should('contain', 'Auto-refresh: ON');
      cy.get('[data-testid="audio-toggle"]').should('contain', 'Audio: ON');
    });

    it('should display orders in the correct format', () => {
      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getOrders');

      // Check order cards are displayed
      cy.get('[data-testid^="order-card-"]').should('have.length.greaterThan', 0);
      
      // Check order card content
      cy.get('[data-testid^="order-card-"]').first().within(() => {
        cy.get('[data-testid="order-id"]').should('be.visible');
        cy.get('[data-testid="elapsed-time"]').should('be.visible');
        cy.get('[data-testid="customer-info"]').should('be.visible');
        cy.get('[data-testid="order-items"]').should('be.visible');
        cy.get('[data-testid="order-total"]').should('be.visible');
      });
    });

    it('should display special instructions when present', () => {
      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getOrders');

      // Check for special instructions
      cy.get('[data-testid="special-instructions"]').should('be.visible');
      cy.get('[data-testid="special-instructions"]')
        .should('have.class', 'bg-yellow-100'); // Highlighted background
    });

    it('should show item modifications', () => {
      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getOrders');

      // Check for item modifications
      cy.get('[data-testid="item-modification"]').should('be.visible');
      cy.get('[data-testid="item-modification"]')
        .should('have.class', 'bg-blue-100'); // Blue background for modifications
    });
  });

  describe('Order Status Management', () => {
    it('should allow confirming received orders', () => {
      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getOrders');

      // Find a received order and confirm it
      cy.get('[data-testid^="order-card-"]')
        .contains('RECEIVED')
        .parent()
        .within(() => {
          cy.get('[data-testid="confirm-button"]').click();
        });

      cy.wait('@updateOrderStatus');
      
      // Verify the API was called with correct parameters
      cy.get('@updateOrderStatus').should('have.been.calledWith', 'PATCH');
    });

    it('should allow starting cooking for confirmed orders', () => {
      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getOrders');

      // Find a confirmed order and start cooking
      cy.get('[data-testid^="order-card-"]')
        .contains('CONFIRMED')
        .parent()
        .within(() => {
          cy.get('[data-testid="start-cooking-button"]').click();
        });

      cy.wait('@updateOrderStatus');
    });

    it('should allow marking orders as ready', () => {
      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getOrders');

      // Find an in-kitchen order and mark as ready
      cy.get('[data-testid^="order-card-"]')
        .contains('IN_KITCHEN')
        .parent()
        .within(() => {
          cy.get('[data-testid="ready-button"]').click();
        });

      cy.wait('@updateOrderStatus');
    });

    it('should refresh orders after status updates', () => {
      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getOrders');

      // Update order status
      cy.get('[data-testid="confirm-button"]').first().click();
      cy.wait('@updateOrderStatus');

      // Should trigger another API call to refresh orders
      cy.wait('@getOrders');
    });
  });

  describe('Priority and Timing System', () => {
    it('should display elapsed time correctly', () => {
      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getOrders');

      // Check elapsed time format
      cy.get('[data-testid="elapsed-time"]').should('match', /\d+ min/);
    });

    it('should show estimated completion time', () => {
      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getOrders');

      // Check estimated completion time
      cy.get('[data-testid="estimated-completion"]').should('be.visible');
      cy.get('[data-testid="estimated-completion"]').should('match', /Est: \d{1,2}:\d{2} [AP]M/);
    });

    it('should apply correct priority colors', () => {
      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getOrders');

      // Check for different priority colors
      cy.get('[data-testid^="order-card-"]').then(($cards) => {
        // Should have cards with different priority colors
        const hasGreen = $cards.toArray().some(card => 
          card.classList.contains('border-green-200')
        );
        const hasYellow = $cards.toArray().some(card => 
          card.classList.contains('border-yellow-200')
        );
        const hasRed = $cards.toArray().some(card => 
          card.classList.contains('border-red-200')
        );

        expect(hasGreen || hasYellow || hasRed).to.be.true;
      });
    });

    it('should highlight overdue orders', () => {
      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getOrders');

      // Check for overdue indicators
      cy.get('[data-testid="overdue-indicator"]').should('be.visible');
      cy.get('[data-testid="overdue-indicator"]')
        .should('have.class', 'text-red-600')
        .and('contain', 'OVERDUE');
    });
  });

  describe('Real-time Updates', () => {
    it('should auto-refresh orders periodically', () => {
      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getOrders');

      // Wait for auto-refresh interval (10 seconds)
      cy.wait(10000);
      cy.wait('@getOrders');

      // Verify multiple API calls were made
      cy.get('@getOrders').should('have.been.called.at.least', 2);
    });

    it('should allow manual refresh', () => {
      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getOrders');

      // Click refresh button
      cy.get('[data-testid="refresh-button"]').click();
      cy.wait('@getOrders');

      // Verify additional API call
      cy.get('@getOrders').should('have.been.called.at.least', 2);
    });

    it('should toggle auto-refresh', () => {
      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getOrders');

      // Toggle auto-refresh off
      cy.get('[data-testid="auto-refresh-toggle"]').click();
      cy.get('[data-testid="auto-refresh-toggle"]').should('contain', 'Auto-refresh: OFF');

      // Wait for what would be refresh interval
      cy.wait(10000);

      // Should not make additional API calls
      cy.get('@getOrders').should('have.been.called.exactly', 1);
    });

    it('should update timer display', () => {
      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getOrders');

      // Get initial time
      cy.get('[data-testid="current-time"]').invoke('text').as('initialTime');

      // Wait for timer update (1 minute)
      cy.wait(60000);

      // Check time has updated
      cy.get('[data-testid="current-time"]').invoke('text').then((newTime) => {
        cy.get('@initialTime').should('not.equal', newTime);
      });
    });
  });

  describe('Audio and Visual Alerts', () => {
    it('should toggle audio alerts', () => {
      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getOrders');

      // Toggle audio off
      cy.get('[data-testid="audio-toggle"]').click();
      cy.get('[data-testid="audio-toggle"]').should('contain', 'Audio: OFF');

      // Toggle audio back on
      cy.get('[data-testid="audio-toggle"]').click();
      cy.get('[data-testid="audio-toggle"]').should('contain', 'Audio: ON');
    });

    it('should flash screen for new orders', () => {
      // Start with empty orders
      cy.intercept('GET', `/api/orders/restaurant/${testRestaurantId}`, {
        body: []
      }).as('getEmptyOrders');

      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getEmptyOrders');

      // Mock new orders arriving
      cy.intercept('GET', `/api/orders/restaurant/${testRestaurantId}`, {
        fixture: 'kitchen-orders.json'
      }).as('getNewOrders');

      // Trigger refresh
      cy.get('[data-testid="refresh-button"]').click();
      cy.wait('@getNewOrders');

      // Check for flash effect
      cy.get('[data-testid="kitchen-display-container"]')
        .should('have.class', 'bg-yellow-100');

      // Flash should disappear after 2 seconds
      cy.wait(2000);
      cy.get('[data-testid="kitchen-display-container"]')
        .should('not.have.class', 'bg-yellow-100');
    });
  });

  describe('Footer Statistics', () => {
    it('should display correct order counts', () => {
      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getOrders');

      // Check footer statistics
      cy.get('[data-testid="footer-stats"]').should('be.visible');
      cy.get('[data-testid="new-count"]').should('contain', 'NEW:');
      cy.get('[data-testid="confirmed-count"]').should('contain', 'CONFIRMED:');
      cy.get('[data-testid="cooking-count"]').should('contain', 'COOKING:');
      cy.get('[data-testid="overdue-count"]').should('contain', 'OVERDUE:');
    });

    it('should update statistics when orders change', () => {
      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getOrders');

      // Get initial counts
      cy.get('[data-testid="new-count"]').invoke('text').as('initialNewCount');

      // Confirm an order
      cy.get('[data-testid="confirm-button"]').first().click();
      cy.wait('@updateOrderStatus');
      cy.wait('@getOrders');

      // Check counts have updated
      cy.get('[data-testid="new-count"]').invoke('text').then((newCount) => {
        cy.get('@initialNewCount').should('not.equal', newCount);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      // Mock API error
      cy.intercept('GET', `/api/orders/restaurant/${testRestaurantId}`, {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('getOrdersError');

      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getOrdersError');

      // Check error message
      cy.get('[data-testid="error-message"]').should('contain', 'Error loading orders');
      cy.get('[data-testid="connection-status"]').should('contain', 'Disconnected');
    });

    it('should handle status update errors', () => {
      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getOrders');

      // Mock update error
      cy.intercept('PATCH', '/api/orders/*/status', {
        statusCode: 500,
        body: { error: 'Update failed' }
      }).as('updateOrderStatusError');

      // Try to update status
      cy.get('[data-testid="confirm-button"]').first().click();
      cy.wait('@updateOrderStatusError');

      // Check error message
      cy.get('[data-testid="error-message"]').should('contain', 'Error updating order status');
    });

    it('should recover from connection errors', () => {
      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getOrders');

      // Mock connection error
      cy.intercept('GET', `/api/orders/restaurant/${testRestaurantId}`, {
        statusCode: 500,
        body: { error: 'Connection failed' }
      }).as('getOrdersError');

      // Trigger refresh
      cy.get('[data-testid="refresh-button"]').click();
      cy.wait('@getOrdersError');

      // Check disconnected status
      cy.get('[data-testid="connection-status"]').should('contain', 'Disconnected');

      // Mock connection recovery
      cy.intercept('GET', `/api/orders/restaurant/${testRestaurantId}`, {
        fixture: 'kitchen-orders.json'
      }).as('getOrdersRecovered');

      // Trigger refresh again
      cy.get('[data-testid="refresh-button"]').click();
      cy.wait('@getOrdersRecovered');

      // Check connected status
      cy.get('[data-testid="connection-status"]').should('contain', 'Connected');
    });
  });

  describe('Touch-Friendly Interface', () => {
    it('should have large, clickable buttons', () => {
      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getOrders');

      // Check button sizes
      cy.get('[data-testid="confirm-button"]').should('have.class', 'px-6', 'py-3');
      cy.get('[data-testid="start-cooking-button"]').should('have.class', 'px-6', 'py-3');
      cy.get('[data-testid="ready-button"]').should('have.class', 'px-6', 'py-3');
    });

    it('should work well on tablet viewport', () => {
      cy.viewport('ipad-2');
      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getOrders');

      // Check responsive layout
      cy.get('[data-testid="orders-grid"]').should('be.visible');
      cy.get('[data-testid^="order-card-"]').should('be.visible');
      
      // Check buttons are still accessible
      cy.get('[data-testid="confirm-button"]').should('be.visible').and('be.enabled');
    });
  });

  describe('Dark Theme', () => {
    it('should use dark theme appropriate for kitchen environment', () => {
      cy.visit(`/kitchen/${testRestaurantId}`);
      cy.wait('@getOrders');

      // Check dark background
      cy.get('[data-testid="kitchen-display-container"]')
        .should('have.class', 'bg-gray-900');

      // Check light text on dark background
      cy.get('h1').should('have.class', 'text-white');
    });
  });

  describe('Navigation Integration', () => {
    it('should be accessible from restaurant dashboard', () => {
      cy.visit(`/dashboard/restaurants/${testRestaurantId}`);

      // Check kitchen display button exists
      cy.get('[data-testid="kitchen-display-button"]').should('be.visible');
      cy.get('[data-testid="kitchen-display-button"]').click();

      // Should navigate to kitchen display
      cy.url().should('include', `/kitchen/${testRestaurantId}`);
    });

    it('should be accessible from main dashboard', () => {
      cy.visit('/dashboard');

      // Check kitchen button on restaurant card
      cy.get('[data-testid="kitchen-button"]').first().should('be.visible');
      cy.get('[data-testid="kitchen-button"]').first().click();

      // Should navigate to kitchen display
      cy.url().should('include', '/kitchen/');
    });
  });
}); 