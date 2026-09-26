import { defineCard } from "../define.js";

const ETB_TEXT = "When this creature enters, choose one —";
const BIRD_MODE = "Create a 1/1 white Bird creature token with flying.";
const BOUNCE_MODE = "Return another target nonland permanent to its owner's hand.";
const DRAW_MODE = "Draw a card.";

export default defineCard({
  name: "Aether Channeler",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 1,
  text: `${ETB_TEXT}\n• ${BIRD_MODE}\n• ${BOUNCE_MODE}\n• ${DRAW_MODE}`,
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
          { text: BIRD_MODE, effect: { kind: "create-token", token: "Bird Token", count: 1 } },
          {
            text: BOUNCE_MODE,
            targets: [{ kind: "other", of: "nonland-permanent" }],
            effect: { kind: "return-to-hand", target: 0 },
          },
          { text: DRAW_MODE, effect: { kind: "draw", amount: 1 } },
        ],
      },
      resolve: null,
      text: `${ETB_TEXT} ${BIRD_MODE} ${BOUNCE_MODE} ${DRAW_MODE}`,
    },
  ],
});
