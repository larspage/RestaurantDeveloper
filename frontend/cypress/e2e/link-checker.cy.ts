/// <reference types="cypress" />

describe('Link Checker', () => {
  const pagesToTest = ['/', '/login'];

  pagesToTest.forEach(page => {
    it(`should check all links on the ${page} page`, () => {
      cy.visit(page);
      
      cy.get('a').each(link => {
        const href = link.prop('href');
        
        // Skip mailto, tel, and other non-http links
        if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
          return;
        }

        // Request the link and check for a successful status code
        cy.request({
          url: href,
          failOnStatusCode: false
        }).then(response => {
          expect(response.status).to.not.equal(404, `Link to ${href} is broken`);
        });
      });
    });
  });
}); 