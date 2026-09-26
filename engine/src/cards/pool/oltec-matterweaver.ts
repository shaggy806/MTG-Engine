import { defineCard } from "../define.js";

const CAST_TEXT = "Whenever you cast a creature spell, choose one —";
const GNOME_MODE = "Create a 1/1 colorless Gnome artifact creature token.";
const COPY_MODE = "Create a token that's a copy of target artifact token you control.";

// Resolves before the creature spell, even if that's countered; the copy
// copies what the token was made as (the rulings).
export default defineCard({
  name: "Oltec Matterweaver",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 2,
  toughness: 4,
  text: `${CAST_TEXT}\n• ${GNOME_MODE}\n• ${COPY_MODE}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          { text: GNOME_MODE, effect: { kind: "create-token", token: "Gnome Token", count: 1 } },
          {
            text: COPY_MODE,
            targets: [{ kind: "permanent", whose: "you", filter: { type: "artifact", token: true } }],
            effect: { kind: "create-token-copy", of: 0, count: 1 },
          },
        ],
      },
      resolve: null,
      text: `${CAST_TEXT} ${GNOME_MODE} ${COPY_MODE}`,
    },
  ],
});
