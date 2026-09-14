import { defineCard } from "../define.js";
import { enterTappedUnlessLands, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Smoldering Marsh",
  types: ["land"],
  subtypes: ["Swamp", "Mountain"],
  text:
    "Smoldering Marsh enters the battlefield tapped unless you control two or more basic lands.\n" +
    "{T}: Add {B} or {R}.",
  static: [enterTappedUnlessLands("Smoldering Marsh", 2, "basic")],
  activated: [manaTapAbility("B"), manaTapAbility("R")],
});
