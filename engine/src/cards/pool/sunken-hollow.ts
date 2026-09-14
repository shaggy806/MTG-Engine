import { defineCard } from "../define.js";
import { enterTappedUnlessLands, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Sunken Hollow",
  types: ["land"],
  subtypes: ["Island", "Swamp"],
  text:
    "Sunken Hollow enters the battlefield tapped unless you control two or more basic lands.\n" +
    "{T}: Add {U} or {B}.",
  static: [enterTappedUnlessLands("Sunken Hollow", 2, "basic")],
  activated: [manaTapAbility("U"), manaTapAbility("B")],
});
