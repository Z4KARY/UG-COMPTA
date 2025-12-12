/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as audit from "../audit.js";
import type * as auth from "../auth.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as businesses from "../businesses.js";
import type * as crons from "../crons.js";
import type * as customers from "../customers.js";
import type * as declarations from "../declarations.js";
import type * as exportActions from "../exportActions.js";
import type * as fiscal from "../fiscal.js";
import type * as fiscalParameters from "../fiscalParameters.js";
import type * as http from "../http.js";
import type * as importActions from "../importActions.js";
import type * as imports from "../imports.js";
import type * as invoice_logic from "../invoice_logic.js";
import type * as invoices from "../invoices.js";
import type * as members from "../members.js";
import type * as periods from "../periods.js";
import type * as products from "../products.js";
import type * as purchaseInvoices from "../purchaseInvoices.js";
import type * as reminders from "../reminders.js";
import type * as report_logic_dashboard from "../report_logic/dashboard.js";
import type * as report_logic_expenses from "../report_logic/expenses.js";
import type * as report_logic_financial from "../report_logic/financial.js";
import type * as report_logic_sales from "../report_logic/sales.js";
import type * as reports from "../reports.js";
import type * as subscriptions from "../subscriptions.js";
import type * as suppliers from "../suppliers.js";
import type * as taxEngine from "../taxEngine.js";
import type * as test_flow from "../test_flow.js";
import type * as test_setup from "../test_setup.js";
import type * as translation from "../translation.js";
import type * as users from "../users.js";
import type * as webhookActions from "../webhookActions.js";
import type * as webhooks from "../webhooks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  audit: typeof audit;
  auth: typeof auth;
  "auth/emailOtp": typeof auth_emailOtp;
  businesses: typeof businesses;
  crons: typeof crons;
  customers: typeof customers;
  declarations: typeof declarations;
  exportActions: typeof exportActions;
  fiscal: typeof fiscal;
  fiscalParameters: typeof fiscalParameters;
  http: typeof http;
  importActions: typeof importActions;
  imports: typeof imports;
  invoice_logic: typeof invoice_logic;
  invoices: typeof invoices;
  members: typeof members;
  periods: typeof periods;
  products: typeof products;
  purchaseInvoices: typeof purchaseInvoices;
  reminders: typeof reminders;
  "report_logic/dashboard": typeof report_logic_dashboard;
  "report_logic/expenses": typeof report_logic_expenses;
  "report_logic/financial": typeof report_logic_financial;
  "report_logic/sales": typeof report_logic_sales;
  reports: typeof reports;
  subscriptions: typeof subscriptions;
  suppliers: typeof suppliers;
  taxEngine: typeof taxEngine;
  test_flow: typeof test_flow;
  test_setup: typeof test_setup;
  translation: typeof translation;
  users: typeof users;
  webhookActions: typeof webhookActions;
  webhooks: typeof webhooks;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
