import { defineCard } from "../define.js";

const TEXT =
  "Crackling Doom deals 2 damage to each opponent. Each opponent sacrifices a creature with the greatest power " +
  "among creatures that player controls.";

// No targets: protection doesn't stop it. Each opponent chooses among their
// own creatures tied for the greatest power, in turn order and knowing the
// choices before theirs, and they're all sacrificed together (the rulings).
// The sacrifice doesn't depend on the damage.
export default defineCard({
  name: "Crackling Doom",
  manaCost: "{R}{W}{B}",
  colors: ["B", "R", "W"],
  types: ["instant"],
  text: TEXT,
  effect: {
    kind: "sequence",
    effects: [
      { kind: "damage", amount: 2, who: "each-opponent" },
      {
        kind: "sacrifice",
        who: "each-opponent",
        filter: { type: "creature", greatestAmongItsController: { of: "power", among: { type: "creature" } } },
        count: 1,
      },
    ],
  },
});
