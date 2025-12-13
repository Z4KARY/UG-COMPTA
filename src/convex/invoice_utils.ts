import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export async function generateInvoiceNumber(
  ctx: MutationCtx, 
  businessId: Id<"businesses">, 
  type: "invoice" | "quote" | "credit_note", 
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

  // Get current counter
  const counter = await ctx.db
    .query("invoiceCounters")
    .withIndex("by_business_type_year", (q) => 
      q.eq("businessId", businessId).eq("type", type).eq("year", year)
    )
    .first();

  let nextCount = 1;
  if (counter) {
    nextCount = counter.count + 1;
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
