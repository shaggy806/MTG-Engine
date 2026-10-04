import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// EDHREC rank 5741.
//
// Aetherworks Marvel's `cast-now` from the top six, free, the rest on the
// bottom in a random order — with the spell narrowed to a mana value no more
// than the greatest power among attacking creatures you control, read as the
// ability resolves (AUTHORING §15: a reading of the creatures attacking *as it
// resolves* is the `attacking: true` filter exactly; Ghalta and Mavren).

const ATTACK_TEXT =
  "Whenever you attack, look at the top six cards of your library. You may cast a spell from among them with mana value less than or equal to the greatest power among attacking creatures you control without paying its mana cost. Put the rest on the bottom of your library in a random order.";

export default defineCard({
  name: "Cosmic Cube",
  manaCost: "{5}",
  colors: [],
  types: ["artifact"],
  text: `Ward {2}\n${ATTACK_TEXT}`,
  triggered: [
    ward({ mana: "{2}" }),
    {
      trigger: { on: "attack-with", who: "you", atLeast: 1 },
      targets: [],
      effect: {
        kind: "cast-now",
        from: { libraryTop: 6 },
        free: true,
        spell: {
          manaValue: {
            op: "lte",
            n: {
              amount: {
                aggregate: "max",
                of: "power",
                filter: { type: "creature", controlledBy: "you", attacking: true },
              },
            },
          },
        },
        rest: "bottom-random",
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
