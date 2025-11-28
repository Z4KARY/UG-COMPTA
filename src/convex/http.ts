import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/businesses/:id/export/full",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
        return new Response("Unauthorized", { status: 401 });
    }

    const url = new URL(request.url);
    // Path is /businesses/:id/export/full
    // split: ["", "businesses", "id", "export", "full"]
    const pathParts = url.pathname.split("/");
    const businessId = pathParts[2] as Id<"businesses">;
    const includePdfs = url.searchParams.get("includePdfs") === "true";

    try {
        const zipBuffer = await ctx.runAction(api.exportActions.generateZip, {
            businessId,
            userId,
            includePdfs
        });

        return new Response(zipBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="export_${businessId}.zip"`,
            }
        });
    } catch (e: any) {
        return new Response(e.message || "Export failed", { status: 500 });
    }
  }),
});

export default http;