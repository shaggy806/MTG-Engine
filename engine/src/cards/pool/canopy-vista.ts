import { defineCard } from "../define.js";
import { enterTappedUnlessLands, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Canopy Vista",
  types: ["land"],
  subtypes: ["Forest", "Plains"],
  text:
    "Canopy Vista enters the battlefield tapped unless you control two or more basic lands.\n" +
    "{T}: Add {G} or {W}.",
  static: [enterTappedUnlessLands("Canopy Vista", 2, "basic")],
  activated: [manaTapAbility("G"), manaTapAbility("W")],
});
