"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import JSZip from "jszip";

export const generateZip = action({
  args: { 
    businessId: v.id("businesses"), 
    userId: v.id("users"),
    includePdfs: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const data = await ctx.runQuery(internal.businesses.exportDataInternal, {
        businessId: args.businessId,
        userId: args.userId
    });

    if (!data) throw new Error("Business not found or unauthorized");

    const zip = new JSZip();
    zip.file("data.json", JSON.stringify(data, null, 2));

    if (args.includePdfs) {
        const pdfFolder = zip.folder("pdfs");
        if (pdfFolder) {
            // Fetch PDFs for Invoices
            for (const inv of data.invoices) {
                if (inv.pdfUrl) {
                    try {
                        const res = await fetch(inv.pdfUrl);
                        if (res.ok) {
                            const blob = await res.arrayBuffer();
                            pdfFolder.file(`invoice_${inv.invoiceNumber}.pdf`, blob);
                        }
                    } catch (e) {
                        console.error(`Failed to fetch PDF for invoice ${inv.invoiceNumber}`, e);
                    }
                }
            }
            // Fetch PDFs for Purchase Invoices
            for (const pinv of data.purchaseInvoices) {
                if (pinv.pdfUrl) {
                    try {
                        const res = await fetch(pinv.pdfUrl);
                        if (res.ok) {
                            const blob = await res.arrayBuffer();
                            pdfFolder.file(`purchase_${pinv.invoiceNumber}.pdf`, blob);
                        }
                    } catch (e) {
                        console.error(`Failed to fetch PDF for purchase ${pinv.invoiceNumber}`, e);
                    }
                }
            }
        }
    }

    const content = await zip.generateAsync({ type: "arraybuffer" });
    return content;
  }
});
