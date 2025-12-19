import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export async function generateInvoiceNumber(
  ctx: MutationCtx, 
  businessId: Id<"businesses">, 
  type: "invoice" | "quote" | "credit_note" | "pro_forma" | "delivery_note" | "sale_order", 
  dateTimestamp: number
) {
  const date = new Date(dateTimestamp);
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1).getTime();
  const endOfYear = new Date(year + 1, 0, 1).getTime();
  
  // Get business settings for prefixes
  const business = await ctx.db.get(businessId);
  let prefix = "";
  if (type === "invoice") prefix = business?.invoicePrefix || "INV-";
  if (type === "quote") prefix = business?.quotePrefix || "DEV-";
  if (type === "credit_note") prefix = business?.creditNotePrefix || "AV-";
  if (type === "pro_forma") prefix = business?.proFormaPrefix || "PF-";
  if (type === "delivery_note") prefix = business?.deliveryNotePrefix || "BL-";
  if (type === "sale_order") prefix = business?.saleOrderPrefix || "BC-";

  // Find the actual last invoice to ensure counter sync
  // This makes the system self-healing if counters get out of sync
  const lastInvoice = await ctx.db
    .query("invoices")
    .withIndex("by_business", (q) => q.eq("businessId", businessId))
    .order("desc")
    .filter((q) => 
      q.and(
        q.eq(q.field("type"), type),
        q.gte(q.field("issueDate"), startOfYear),
        q.lt(q.field("issueDate"), endOfYear)
      )
    )
    .first();

  let maxCount = 0;
  if (lastInvoice && lastInvoice.invoiceNumber.startsWith(prefix)) {
    // Extract the number part
    // Format: PREFIX-YEAR-NNN
    const withoutPrefix = lastInvoice.invoiceNumber.substring(prefix.length);
    const yearPrefix = `${year}-`;
    if (withoutPrefix.startsWith(yearPrefix)) {
        const numberPart = withoutPrefix.substring(yearPrefix.length);
        const parsed = parseInt(numberPart, 10);
        if (!isNaN(parsed)) {
            maxCount = parsed;
        }
    }
  }

  // Get current counter
  const counter = await ctx.db
    .query("invoiceCounters")
    .withIndex("by_business_type_year", (q) => 
      q.eq("businessId", businessId).eq("type", type).eq("year", year)
    )
    .first();

  const nextCount = maxCount + 1;

  if (counter) {
    await ctx.db.patch(counter._id, { count: nextCount });
  } else {
    await ctx.db.insert("invoiceCounters", {
      businessId,
      type,
      year,
      count: nextCount,
    });
  }
  
  const paddedNumber = nextCount.toString().padStart(3, "0");
  return `${prefix}${year}-${paddedNumber}`;
}

export async function decrementInvoiceCounterIfLast(
  ctx: MutationCtx, 
  businessId: Id<"businesses">, 
  type: "invoice" | "quote" | "credit_note" | "pro_forma" | "delivery_note" | "sale_order", 
  invoiceNumber: string,
  dateTimestamp: number
) {
  const date = new Date(dateTimestamp);
  const year = date.getFullYear();
  
  // Get business settings for prefixes
  const business = await ctx.db.get(businessId);
  let prefix = "";
  if (type === "invoice") prefix = business?.invoicePrefix || "INV-";
  if (type === "quote") prefix = business?.quotePrefix || "DEV-";
  if (type === "credit_note") prefix = business?.creditNotePrefix || "AV-";
  if (type === "pro_forma") prefix = business?.proFormaPrefix || "PF-";
  if (type === "delivery_note") prefix = business?.deliveryNotePrefix || "BL-";
  if (type === "sale_order") prefix = business?.saleOrderPrefix || "BC-";

  // Get current counter
  const counter = await ctx.db
    .query("invoiceCounters")
    .withIndex("by_business_type_year", (q) => 
      q.eq("businessId", businessId).eq("type", type).eq("year", year)
    )
    .first();

  if (!counter) return;

  // Check if there are any other invoices for this year/type
  // We need to check if the deleted invoice was the ONLY one or if we are deleting the last one
  // Note: The invoice is already deleted or about to be deleted. 
  // If this function is called AFTER deletion, we check if any exist.
  // If called BEFORE deletion, we check if count is 1.
  
  // This function is called AFTER deletion in deleteInvoiceLogic.
  
  // Check if any invoices remain for this year
  // We need to filter by year. Since we don't have a direct index on year, 
  // we can use the range of timestamps for the year.
  const startOfYear = new Date(year, 0, 1).getTime();
  const endOfYear = new Date(year + 1, 0, 1).getTime();

  const remainingInvoices = await ctx.db
    .query("invoices")
    .withIndex("by_business", (q) => q.eq("businessId", businessId))
    .filter((q) => 
      q.and(
        q.eq(q.field("type"), type),
        q.gte(q.field("issueDate"), startOfYear),
        q.lt(q.field("issueDate"), endOfYear)
      )
    )
    .first();

  if (!remainingInvoices) {
    // No invoices left for this year, reset counter to 0
    await ctx.db.patch(counter._id, { count: 0 });
    return;
  }

  // Check if the invoice number matches the current counter
  const currentCount = counter.count;
  const paddedNumber = currentCount.toString().padStart(3, "0");
  const expectedNumber = `${prefix}${year}-${paddedNumber}`;

  if (invoiceNumber === expectedNumber) {
    // It matches, so we can decrement
    const newCount = Math.max(0, currentCount - 1);
    await ctx.db.patch(counter._id, { count: newCount });
  }
}