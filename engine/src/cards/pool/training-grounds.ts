import { defineCard } from "../define.js";

const TEXT =
  "Activated abilities of creatures you control cost {2} less to activate. This effect can't " +
  "reduce the mana in that cost to less than one mana.";

// Generic mana only, after any increase (the rulings): {2}{G} costs {G}, {2}
// costs {1}, and {R}{R} or a cost with no mana is left alone. Only creatures
// on the battlefield — not cycling or unearth.
export default defineCard({
  name: "Training Grounds",
  manaCost: "{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      abilityCostModification: {
        applies: { type: "creature", controlledBy: "you" },
        reduceGeneric: 2,
        leavesOneMana: true,
      },
      text: TEXT,
    },
  ],
});
