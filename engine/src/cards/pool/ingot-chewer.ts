import { defineCard } from "../define.js";

// EDHREC rank 5270.
//
// Rulings:
//   [2013-04-15] If you cast this card for its evoke cost, you may put the sacrifice trigger and
//     the regular enters-the-battlefield trigger on the stack in either order. The one put on the
//     stack last will resolve first.

export default defineCard({
  name: "Ingot Chewer",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 3,
  toughness: 3,
  text: "When this creature enters, destroy target artifact.\nEvoke {R} (You may cast this spell for its evoke cost. If you do, it's sacrificed when it enters.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["artifact"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "When this creature enters, destroy target artifact.",
    },
  ],
  evoke: { cost: "{R}" },
});
