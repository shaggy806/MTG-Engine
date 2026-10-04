import { defineCard } from "../define.js";

// EDHREC rank 5400.
// A modal triggered ability, its mode chosen as it goes on the stack
// (`announced`). The second mode's sacrifice is High Society Hunter's
// "you may sacrifice another creature. If you do" shape.

const ETB_TEXT = "When this creature enters, choose one —";
const RAT_MODE = "Create a 1/1 black Rat creature token with \"This token can't block.\"";
const SAC_MODE = "You may sacrifice another creature. If you do, scry 2, then draw a card.";
const MENACE_MODE = "Creatures you control gain menace until end of turn.";

export default defineCard({
  name: "Lord Skitter's Butcher",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Rat", "Peasant"],
  power: 2,
  toughness: 3,
  text: `${ETB_TEXT}\n• ${RAT_MODE}\n• ${SAC_MODE}\n• ${MENACE_MODE}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          { text: RAT_MODE, effect: { kind: "create-token", token: "Rat Token (Can't Block)", count: 1 } },
          {
            text: SAC_MODE,
            effect: {
              kind: "each-player-may",
              who: "you",
              options: [{ sacrifice: { type: "creature" }, exceptSource: true, text: "Sacrifice another creature" }],
              ifDid: {
                kind: "sequence",
                effects: [
                  { kind: "scry", amount: 2 },
                  { kind: "draw", amount: 1 },
                ],
              },
            },
          },
          {
            text: MENACE_MODE,
            effect: {
              kind: "grant-keyword-all",
              filter: { type: "creature", controlledBy: "you" },
              keyword: "menace",
              duration: "end-of-turn",
            },
          },
        ],
      },
      resolve: null,
      text: `${ETB_TEXT} ${RAT_MODE} ${SAC_MODE} ${MENACE_MODE}`,
    },
  ],
});
