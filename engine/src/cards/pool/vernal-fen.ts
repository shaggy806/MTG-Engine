import { defineCard } from "../define.js";
import { enterTappedUnlessLands, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Vernal Fen",
  types: ["land"],
  subtypes: ["Swamp", "Forest"],
  text:
    "Vernal Fen enters the battlefield tapped unless you control two or more basic lands.\n" +
    "{T}: Add {B} or {G}.",
  static: [enterTappedUnlessLands("Vernal Fen", 2, "basic")],
  activated: [manaTapAbility("B"), manaTapAbility("G")],
});
