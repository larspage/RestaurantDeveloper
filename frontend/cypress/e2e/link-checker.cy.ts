/// <reference types="cypress" />

describe('Link Checker', () => {
  const pagesToTest = ['/', '/login'];
  const knownBrokenLinks = [
    '/features', // Example of a known page that is not yet implemented
    '/pricing',
    '/contact',
    '/forgot-password',
    '/examples',
    '/signup',
    '/about',
    '/blog',
    '/privacy',
    '/terms'
  ];

  pagesToTest.forEach(page => {
    it(`should check all links on the ${page} page`, () => {
      cy.visit(page);
      
      cy.get('a').each(link => {
        const href = link.prop('href');
        
        // Skip mailto, tel, and other non-http links
        if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
          return;
        }

        // Skip known broken links
        if (knownBrokenLinks.some(brokenLink => href.includes(brokenLink))) {
          cy.log(`Skipping known broken link: ${href}`);
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