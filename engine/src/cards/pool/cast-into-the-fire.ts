import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

// EDHREC rank 5598.

export default defineCard({
  name: "Cast into the Fire",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Choose one —\n• Cast into the Fire deals 1 damage to each of up to two target creatures.\n• Exile target artifact.",
  // Both modes target, so the mode is chosen as it's cast (Abrade's shape).
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Cast into the Fire deals 1 damage to each of up to two target creatures.",
        // "each of up to two target creatures" — two optional slots, two
        // different creatures (Rishkar's shape); one instruction, so one
        // damage event.
        targets: distinctTargets(2, "creature", { optional: true }),
        effect: {
          kind: "sequence",
          simultaneous: true,
          effects: [
            { kind: "damage", amount: 1, target: 0 },
            { kind: "damage", amount: 1, target: 1 },
          ],
        },
      },
      {
        text: "Exile target artifact.",
        targets: ["artifact"],
        effect: { kind: "exile", target: 0 },
      },
    ],
  },
});
