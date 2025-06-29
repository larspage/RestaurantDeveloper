# Test Accounts & Data

This document outlines the test accounts created by the database seed script (`backend/scripts/seed.js`).

## Important Note on Passwords

The seed script creates user profiles directly in the MongoDB database but **does not create passwords**. Passwords and authentication are handled by Supabase.

Therefore, you cannot log in directly with these accounts using a password after seeding.

## How to Use These Accounts for Manual Testing

To test the application UI with one of the pre-defined user roles (e.g., as "Restaurant Owner 1"), follow these steps:

1.  Start the application (`npm run dev`).
2.  Navigate to the **Sign Up** page.
3.  Use one of the email addresses listed below (e.g., `owner1@example.com`).
4.  Enter any password you like.
5.  Complete the signup process.

The application will then associate your new Supabase account with the existing user profile from the seed data.

## Test Account Credentials

### Restaurant Owners
- **Email**: `owner1@example.com`
- **Email**: `owner2@example.com`
- **Email**: `owner3@example.com`

*Each owner is associated with one of the three seeded restaurants.*

### Customers
- **Email**: `customer1@example.com`
- **Email**: `customer2@example.com`
- **Email**: `customer3@example.com`
- **Email**: `customer4@example.com`
- **Email**: `customer5@example.com`
- **Email**: `customer6@example.com`
- **Email**: `customer7@example.com`
- **Email**: `customer8@example.com`
- **Email**: `customer9@example.com`
- **Email**: `customer10@example.com`

## For Automated Backend Testing

The automated Jest tests for the backend use a helper (`backend/tests/testAuthHelper.js`) that generates valid authentication tokens for these users without needing a password. The tests reference these users by their email addresses (e.g., `getAuthTokenFor('owner1@example.com')`). 