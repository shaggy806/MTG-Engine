import { defineCard } from "../define.js";

const LANDFALL_TEXT = "Landfall — Whenever a land you control enters, choose one —";
const TAP_MODE = "You may tap or untap target creature.";
const SCRY_MODE = "Scry 1.";

// "You may tap or untap": tap, untap or leave it, decided as it resolves.
export default defineCard({
  name: "Retreat to Coralhelm",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text:
    `${LANDFALL_TEXT}\n• ${TAP_MODE}\n` +
    `• ${SCRY_MODE} (Look at the top card of your library. You may put that card on the bottom.)`,
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
            text: TAP_MODE,
            targets: ["creature"],
            effect: {
              kind: "modal",
              minModes: 0,
              maxModes: 1,
              modes: [
                { text: "Tap it", effect: { kind: "tap", target: 0 } },
                { text: "Untap it", effect: { kind: "untap", target: 0 } },
              ],
            },
          },
          { text: SCRY_MODE, effect: { kind: "scry", amount: 1 } },
        ],
      },
      resolve: null,
      text: `${LANDFALL_TEXT} ${TAP_MODE} ${SCRY_MODE}`,
    },
  ],
});
