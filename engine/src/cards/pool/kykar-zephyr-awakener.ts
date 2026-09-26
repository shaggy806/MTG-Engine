import { defineCard } from "../define.js";

const CAST_TEXT = "Whenever you cast a noncreature spell, choose one —";
const BLINK_MODE =
  "Exile another target creature you control. Return that card to the battlefield under its owner's control at the beginning of the next end step.";
const SPIRIT_MODE = "Create a 1/1 white Spirit creature token with flying.";

export default defineCard({
  name: "Kykar, Zephyr Awakener",
  manaCost: "{2}{W}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Bird", "Wizard"],
  power: 3,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${CAST_TEXT}\n• ${BLINK_MODE}\n• ${SPIRIT_MODE}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: BLINK_MODE,
            targets: [{ kind: "other", of: "creature-you-control" }],
            effect: {
              kind: "flicker",
              target: 0,
              returnAt: "next-end-step",
              returnText: "Return the exiled card to the battlefield under its owner's control.",
            },
          },
          { text: SPIRIT_MODE, effect: { kind: "create-token", token: "Spirit Token", count: 1 } },
        ],
      },
      resolve: null,
      text: `${CAST_TEXT} ${BLINK_MODE} ${SPIRIT_MODE}`,
    },
  ],
});
