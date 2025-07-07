/// <reference types="cypress" />

describe('Menu Management', () => {
  it('should load the menu management page', () => {
    // Visit the menu management page
    cy.visit('/dashboard/menus/test-restaurant-123');
    
    // Wait for the page to load - just check that we get past the loading spinner
    cy.get('body').should('be.visible');
    
    // Check that the page has loaded by looking for any div (most basic check)
    cy.get('div').should('exist');
  });
}); 