import { defineCard } from "../define.js";

const ETB_TEXT = "When this creature enters, choose one —";
const SCRY_MODE = "Scry 2.";
const LIFE_MODE = "You gain 3 life.";
const BLINK_MODE =
  "Exile another target creature you own. Return it to the battlefield under your control at the beginning of the next end step.";

// "A creature you own" includes one another player controls, and it comes
// back under yours (the rulings); a token exiled this way is gone for good.
export default defineCard({
  name: "Charming Prince",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Noble"],
  power: 2,
  toughness: 2,
  text: `${ETB_TEXT}\n• ${SCRY_MODE}\n• ${LIFE_MODE}\n• ${BLINK_MODE}`,
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
          { text: SCRY_MODE, effect: { kind: "scry", amount: 2 } },
          { text: LIFE_MODE, effect: { kind: "gain-life", amount: 3 } },
          {
            text: BLINK_MODE,
            targets: [{ kind: "other", of: { kind: "permanent", filter: { type: "creature", ownedBy: "you" } } }],
            effect: {
              kind: "flicker",
              target: 0,
              underYourControl: true,
              returnAt: "next-end-step",
              returnText: "Return the exiled creature to the battlefield under your control.",
            },
          },
        ],
      },
      resolve: null,
      text: `${ETB_TEXT} ${SCRY_MODE} ${LIFE_MODE} ${BLINK_MODE}`,
    },
  ],
});
