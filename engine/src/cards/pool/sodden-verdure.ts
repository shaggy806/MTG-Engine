import { defineCard } from "../define.js";
import { enterTappedUnlessLands, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Sodden Verdure",
  types: ["land"],
  subtypes: ["Forest", "Island"],
  text: "({T}: Add {G} or {U}.)\nThis land enters tapped unless you control two or more basic lands.",
  static: [enterTappedUnlessLands("Sodden Verdure", 2, "basic")],
  activated: [manaTapAbility("G"), manaTapAbility("U")],
});
