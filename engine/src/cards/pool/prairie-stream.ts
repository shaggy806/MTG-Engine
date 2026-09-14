import { defineCard } from "../define.js";
import { enterTappedUnlessLands, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Prairie Stream",
  types: ["land"],
  subtypes: ["Plains", "Island"],
  text:
    "Prairie Stream enters the battlefield tapped unless you control two or more basic lands.\n" +
    "{T}: Add {W} or {U}.",
  static: [enterTappedUnlessLands("Prairie Stream", 2, "basic")],
  activated: [manaTapAbility("W"), manaTapAbility("U")],
});
