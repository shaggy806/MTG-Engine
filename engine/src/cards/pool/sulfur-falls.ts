import { defineCard } from "../define.js";
import { checkLandStatic, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Sulfur Falls",
  types: ["land"],
  text:
    "Sulfur Falls enters the battlefield tapped unless you control an Island or a Mountain.\n" +
    "{T}: Add {U} or {R}.",
  static: [checkLandStatic("Sulfur Falls", ["Island", "Mountain"])],
  activated: [manaTapAbility("U"), manaTapAbility("R")],
});
