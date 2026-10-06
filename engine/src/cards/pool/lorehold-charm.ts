import { defineCard } from "../define.js";

// EDHREC rank 6661.
//
// Rulings:
//   [2026-03-20] If a card in a graveyard has {X} in its mana cost, X is 0 for the purpose of
//     determining its mana value.

const SAC_MODE = "Each opponent sacrifices a nontoken artifact of their choice.";
const RETURN_MODE =
  "Return target artifact or creature card with mana value 2 or less from your graveyard to the battlefield.";
const PUMP_MODE = "Creatures you control get +1/+1 and gain trample until end of turn.";

// One mode targets, so the mode is chosen as it's cast (`castModal` — Boros
// Charm's shape).
export default defineCard({
  name: "Lorehold Charm",
  manaCost: "{R}{W}",
  colors: ["W", "R"],
  types: ["instant"],
  text: `Choose one —\n• ${SAC_MODE}\n• ${RETURN_MODE}\n• ${PUMP_MODE}`,
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: SAC_MODE,
        effect: {
          kind: "sacrifice",
          who: "each-opponent",
          filter: { type: "artifact", token: false },
          count: 1,
        },
      },
      {
        text: RETURN_MODE,
        targets: [
          {
            kind: "card-in-graveyard",
            whose: "you",
            filter: { typesAnyOf: ["artifact", "creature"], manaValue: { op: "lte", n: 2 } },
          },
        ],
        effect: { kind: "put-onto-battlefield", target: 0 },
      },
      {
        text: PUMP_MODE,
        // Only the creatures you control as it resolves (rule 611.2c).
        effect: {
          kind: "sequence",
          effects: [
            {
              kind: "modify-pt-all",
              filter: { type: "creature", controlledBy: "you" },
              power: 1,
              toughness: 1,
              duration: "end-of-turn",
            },
            {
              kind: "grant-keyword-all",
              filter: { type: "creature", controlledBy: "you" },
              keyword: "trample",
              duration: "end-of-turn",
            },
          ],
        },
      },
    ],
  },
});
