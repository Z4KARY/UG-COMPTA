/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as auth from "../auth.js";
import type * as businesses from "../businesses.js";
import type * as customers from "../customers.js";
import type * as declarations from "../declarations.js";
import type * as fiscal from "../fiscal.js";
import type * as fiscalParameters from "../fiscalParameters.js";
import type * as http from "../http.js";
import type * as invoices from "../invoices.js";
import type * as products from "../products.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "auth/emailOtp": typeof auth_emailOtp;
  auth: typeof auth;
  businesses: typeof businesses;
  customers: typeof customers;
  declarations: typeof declarations;
  fiscal: typeof fiscal;
  fiscalParameters: typeof fiscalParameters;
  http: typeof http;
  invoices: typeof invoices;
  products: typeof products;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
