import { defineCard } from "../define.js";
import { checkLandStatic, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Drowned Catacomb",
  types: ["land"],
  text:
    "Drowned Catacomb enters the battlefield tapped unless you control an Island or a Swamp.\n" +
    "{T}: Add {U} or {B}.",
  static: [checkLandStatic("Drowned Catacomb", ["Island", "Swamp"])],
  activated: [manaTapAbility("U"), manaTapAbility("B")],
});
