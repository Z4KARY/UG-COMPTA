// This file is deprecated. Logic has been moved to src/convex/admin/*.ts
// Keeping this file empty or with minimal exports if needed for backward compatibility during migration,
// but we are updating the frontend to point to the new locations.
// We can remove the content to avoid confusion.

import { query } from "./_generated/server";

export const deprecated = query({
  handler: async () => {
    return "This file is deprecated. Please use api.admin.* modules.";
  }
});