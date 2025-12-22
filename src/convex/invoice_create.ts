import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { calculateLineItem, calculateStampDuty, FISCAL_CONSTANTS, StampDutyConfig } from "./fiscal";
import { internal } from "./_generated/api";
import { requireBusinessAccess } from "./permissions";
import { generateInvoiceNumber } from "./invoice_utils";

export async function createInvoiceLogic(ctx: MutationCtx, args: any, userId: Id<"users">) {
    const business = await requireBusinessAccess(ctx, args.businessId as Id<"businesses">, userId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    // Validate Customer
    const customer = await ctx.db.get(args.customerId as Id<"customers">);
    if (!customer || customer.businessId !== args.businessId) {
        throw new Error("Invalid customer");
    }

    // Generate Invoice Number if not provided
    let finalInvoiceNumber = args.invoiceNumber;
    if (!finalInvoiceNumber || finalInvoiceNumber === "AUTO") {
        finalInvoiceNumber = await generateInvoiceNumber(ctx, args.businessId, args.type, args.issueDate);
    } else {
        // Check for uniqueness if manually entered
        const existing = await ctx.db
            .query("invoices")
            .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
            .filter((q) => q.eq(q.field("invoiceNumber"), finalInvoiceNumber))
            .first();
        
        if (existing) {
            throw new Error(`Invoice number ${finalInvoiceNumber} already exists`);
        }
    }

    // Auto-Entrepreneur Logic Enforcement: NO VAT
    const isAE = business.type === "auto_entrepreneur";

    // Fetch Fiscal Parameters (Stamp Duty)
    let stampDutyConfig: StampDutyConfig = FISCAL_CONSTANTS.STAMP_DUTY;
    
    const businessParam = await ctx.db
        .query("fiscalParameters")
        .withIndex("by_business_and_code", (q) => 
          q.eq("businessId", args.businessId).eq("code", "STAMP_DUTY")
        )
        .first();
    
    if (businessParam) {
        stampDutyConfig = businessParam.value as StampDutyConfig;
    } else {
        const globalParam = await ctx.db
            .query("fiscalParameters")
            .withIndex("by_business_and_code", (q) => 
              q.eq("businessId", undefined).eq("code", "STAMP_DUTY")
            )
            .first();
        if (globalParam) {
            stampDutyConfig = globalParam.value as StampDutyConfig;
        }
    }

    // Check for closed period
    const closure = await ctx.db.query("periodClosures")
        .withIndex("by_business", q => q.eq("businessId", args.businessId))
        .filter(q => q.and(q.lte(q.field("startDate"), args.issueDate), q.gte(q.field("endDate"), args.issueDate)))
        .first();
    
    if (closure) {
        throw new Error(`Cannot create invoice in a closed period (${new Date(closure.startDate).toLocaleDateString()} - ${new Date(closure.endDate).toLocaleDateString()})`);
    }

    // Server-side calculation to ensure fiscal compliance
    let calculatedSubtotalHt = 0;
    let calculatedTotalTva = 0;
    let calculatedDiscountTotal = 0;

    const processedItems = args.items.map((item: any) => {
      // Force TVA to 0 for Auto-Entrepreneur
      const effectiveTvaRate = isAE ? 0 : item.tvaRate;

      const { discountAmount, lineTotalHt, tvaAmount, lineTotalTtc } = calculateLineItem(
        item.quantity,
        item.unitPrice,
        item.discountRate || 0,
        effectiveTvaRate
      );

      calculatedSubtotalHt += lineTotalHt;
      calculatedTotalTva += tvaAmount;
      calculatedDiscountTotal += discountAmount;

      return {
        ...item,
        tvaRate: effectiveTvaRate, // Enforce 0 in storage
        discountAmount,
        tvaAmount,
        lineTotal: lineTotalHt, // Storing HT as lineTotal
        lineTotalHt,
        lineTotalTtc
      };
    });

    calculatedSubtotalHt = Math.round((calculatedSubtotalHt + Number.EPSILON) * 100) / 100;
    calculatedTotalTva = Math.round((calculatedTotalTva + Number.EPSILON) * 100) / 100;
    calculatedDiscountTotal = Math.round((calculatedDiscountTotal + Number.EPSILON) * 100) / 100;

    const totalBeforeStamp = calculatedSubtotalHt + calculatedTotalTva;
    
    const stampDutyAmount = calculateStampDuty(
      totalBeforeStamp, 
      args.paymentMethod || "OTHER",
      stampDutyConfig
    );

    const finalTotalTtc = totalBeforeStamp + stampDutyAmount;

    const invoiceData: any = {
      businessId: args.businessId,
      customerId: args.customerId,
      invoiceNumber: finalInvoiceNumber!,
      type: args.type,
      fiscalType: args.fiscalType,
      language: args.language || "fr",
      issueDate: args.issueDate,
      dueDate: args.dueDate,
      currency: args.currency,
      status: args.status,
      notes: args.notes,
      paymentMethod: args.paymentMethod,
      
      subtotalHt: calculatedSubtotalHt,
      totalHt: calculatedSubtotalHt, // Legacy alias
      discountTotal: calculatedDiscountTotal,
      totalTva: calculatedTotalTva,
      stampDutyAmount: stampDutyAmount,
      totalTtc: finalTotalTtc,
      amountPaid: 0,
      
      timbre: stampDutyAmount > 0,
    };

    // Sanitize invoiceData to remove undefined values
    Object.keys(invoiceData).forEach(key => {
        if (invoiceData[key] === undefined) {
            delete invoiceData[key];
        }
    });

    const invoiceId = await ctx.db.insert("invoices", invoiceData);

    for (const item of processedItems) {
      const itemData: any = {
        invoiceId,
        ...item,
        productType: item.productType || "service",
      };

      // Sanitize itemData
      Object.keys(itemData).forEach(key => {
        if (itemData[key] === undefined) {
            delete itemData[key];
        }
      });

      await ctx.db.insert("invoiceItems", itemData);
    }

    await ctx.scheduler.runAfter(0, internal.audit.log, {
        businessId: args.businessId,
        userId,
        entityType: "INVOICE",
        entityId: invoiceId,
        action: "CREATE",
        payloadAfter: invoiceData,
    });

    await ctx.scheduler.runAfter(0, internal.webhookActions.trigger, {
        businessId: args.businessId,
        event: "invoice.created",
        payload: {
            id: invoiceId,
            invoiceNumber: args.invoiceNumber,
            totalTtc: finalTotalTtc,
            customerId: args.customerId,
            createdAt: Date.now(),
        }
    });

    return invoiceId;
}