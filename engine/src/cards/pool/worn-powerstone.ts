import { addManaAbility, entersTappedStatic } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Worn Powerstone",
  manaCost: "{3}",
  types: ["artifact"],
  text: "Worn Powerstone enters tapped.\n{T}: Add {C}{C}.",
  static: [entersTappedStatic("Worn Powerstone")],
  activated: [addManaAbility({ mana: "C", amount: 2, text: "{T}: Add {C}{C}." })],
});
