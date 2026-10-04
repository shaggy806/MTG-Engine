import { defineCard } from "../define.js";

// EDHREC rank 6287.
// Makes Kor Ally → new token "Kor Ally Token". Retreat to Kazandu's shape.
//
// Rulings:
//   [2024-11-08] A landfall ability triggers whenever a land you control enters for any reason.
//   [2024-11-08] A landfall ability doesn't trigger if a permanent already on the battlefield
//     becomes a land.

const LANDFALL_TEXT = "Landfall — Whenever a land you control enters, choose one —";
const TOKEN_MODE = "Create a 1/1 white Kor Ally creature token.";
const PUMP_MODE = "Creatures you control get +1/+1 until end of turn.";

export default defineCard({
  name: "Retreat to Emeria",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: `${LANDFALL_TEXT}\n• ${TOKEN_MODE}\n• ${PUMP_MODE}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: TOKEN_MODE,
            effect: { kind: "create-token", token: "Kor Ally Token", count: 1 },
          },
          {
            text: PUMP_MODE,
            effect: {
              kind: "modify-pt-all",
              filter: { type: "creature", controlledBy: "you" },
              power: 1,
              toughness: 1,
              duration: "end-of-turn",
            },
          },
        ],
      },
      resolve: null,
      text: `${LANDFALL_TEXT} ${TOKEN_MODE} ${PUMP_MODE}`,
    },
  ],
});
