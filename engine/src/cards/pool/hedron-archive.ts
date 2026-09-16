import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Hedron Archive",
  manaCost: "{4}",
  types: ["artifact"],
  text: "{T}: Add {C}{C}.\n{2}, {T}, Sacrifice Hedron Archive: Draw two cards.",
  activated: [
    addManaAbility({ mana: "C", amount: 2, text: "{T}: Add {C}{C}." }),
    {
      cost: { mana: "{2}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "{2}, {T}, Sacrifice Hedron Archive: Draw two cards.",
    },
  ],
});
