npx convex run contact:submitRequest '{"name": "Test Verification", "email": "verify@test.com", "companyName": "Verification Corp", "message": "Verifying contact submission logic."}'

grep -A 10 "contactRequests" src/convex/schema.ts