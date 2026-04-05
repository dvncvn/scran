/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as functions_chefs from "../functions/chefs.js";
import type * as functions_households from "../functions/households.js";
import type * as functions_mealPlans from "../functions/mealPlans.js";
import type * as functions_recipes from "../functions/recipes.js";
import type * as functions_shoppingLists from "../functions/shoppingLists.js";
import type * as functions_users from "../functions/users.js";
import type * as lib_aggregateIngredients from "../lib/aggregateIngredients.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "functions/chefs": typeof functions_chefs;
  "functions/households": typeof functions_households;
  "functions/mealPlans": typeof functions_mealPlans;
  "functions/recipes": typeof functions_recipes;
  "functions/shoppingLists": typeof functions_shoppingLists;
  "functions/users": typeof functions_users;
  "lib/aggregateIngredients": typeof lib_aggregateIngredients;
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
