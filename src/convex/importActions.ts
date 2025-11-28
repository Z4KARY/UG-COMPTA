"use node";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import * as XLSX from "xlsx";

export const processImport = internalAction({
  args: { jobId: v.id("importJobs") },
  handler: async (ctx, args) => {
    const job = await ctx.runQuery(internal.imports.getJob, { jobId: args.jobId });
    if (!job) return;

    try {
      await ctx.runMutation(internal.imports.updateJobStatus, { 
          jobId: args.jobId, 
          status: "PROCESSING" 
      });

      const fileUrl = await ctx.storage.getUrl(job.storageId);
      if (!fileUrl) throw new Error("File not found");

      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const mapping = JSON.parse(job.mapping);
      const processedData: any[] = [];
      const errors: any[] = [];

      // Helper to map row
      const mapRow = (row: any) => {
        const mapped: any = {};
        for (const [csvHeader, dbField] of Object.entries(mapping)) {
            if (dbField === "__ignore") continue;
            if (row[csvHeader] !== undefined) {
                mapped[dbField as string] = row[csvHeader];
            }
        }
        return mapped;
      };

      if (job.type === "CUSTOMERS") {
        for (const row of jsonData) {
            const mapped = mapRow(row);
            // Basic validation/defaults
            if (!mapped.name) {
                errors.push({ row, error: "Missing name" });
                continue;
            }
            processedData.push(mapped);
        }

        if (processedData.length > 0) {
            await ctx.runMutation(internal.customers.createBatch, {
                businessId: job.businessId,
                userId: job.userId,
                customers: processedData,
            });
        }

      } else if (job.type === "PRODUCTS") {
        for (const row of jsonData) {
            const mapped = mapRow(row);
            if (!mapped.name || mapped.unitPrice === undefined) {
                errors.push({ row, error: "Missing name or price" });
                continue;
            }
            // Ensure types
            mapped.unitPrice = Number(mapped.unitPrice);
            mapped.tvaRate = mapped.tvaRate !== undefined ? Number(mapped.tvaRate) : 19; // Default 19%
            
            processedData.push(mapped);
        }

        if (processedData.length > 0) {
            await ctx.runMutation(internal.products.createBatch, {
                businessId: job.businessId,
                userId: job.userId,
                products: processedData,
            });
        }
      }

      await ctx.runMutation(internal.imports.updateJobStatus, {
          jobId: args.jobId,
          status: "DONE",
          finishedAt: Date.now(),
          report: JSON.stringify({ processed: processedData.length, errors }),
      });

    } catch (error: any) {
      await ctx.runMutation(internal.imports.updateJobStatus, {
          jobId: args.jobId,
          status: "FAILED",
          finishedAt: Date.now(),
          report: JSON.stringify({ error: error.message }),
      });
    }
  },
});
