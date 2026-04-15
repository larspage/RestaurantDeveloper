# CHANGELOG — RestaurantDeveloper

- 2026-04-15T15:30:00Z [fix]: Login redirect — changed to window.location.href, fixed ProtectedRoute SSR issue
- 2026-04-15T15:30:00Z [fix]: ProtectedRoute now client-side only with isMounted check
- 2026-04-15T15:30:00Z [fix]: NotificationToast — added simple single-notification pattern
- 2026-04-11T16:20:00Z [fix]: Order item validation — items array required, name must be 2+ chars, price must be non-zero number, quantity must be positive integer
- 2026-04-08T20:45:00Z [state]: Initial Moe STATE files created — synthesized from PROJECT_STATUS.md, tasks.md, reflection.md
- 2024-12-XX [add]: Customer Website Template completed — Phase 1 (5/5 tasks) with guest checkout, mobile-optimized ordering
- 2025-07-XX [add]: Price Points support — Small/Medium/Large pricing per menu item
- 2025-07-XX [add]: CSV Import/Export with preview functionality
- 2025-07-XX [fix]: All 52 tests passing (22 backend, 30 frontend)
- 2025-06-XX [add]: Comprehensive Logging System with Winston
- 2025-06-XX [add]: Print Settings — kitchen tickets and customer receipts
- 2025-06-XX [add]: Image upload for menu items with MinIO/S3
- 2025-06-XX [add]: Drag-and-drop section reordering
- 2025-06-XX [add]: Database seeding script
- 2025-06-XX [config]: npm Workspaces setup for module resolution
- 2025-06-XX [fix]: Authentication system — Supabase integration, role management
- 2025-06-XX [add]: JSON Import/Export for menu management
- 2024-12-XX [add]: MCP Server Integration — MongoDB, Supabase, Puppeteer
