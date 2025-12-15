import { common } from "./common";
import { dashboard } from "./dashboard";
import { documents } from "./documents";
import { entities } from "./entities";
import { landing } from "./landing";
// import { settings } from "./settings"; // Uncomment if settings exists

export const fr = {
  ...common,
  ...dashboard,
  ...documents,
  ...entities,
  ...landing,
  // ...settings,
};
