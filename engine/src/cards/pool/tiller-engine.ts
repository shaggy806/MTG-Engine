import { defineCard } from "../define.js";

const TRIGGER_TEXT = "Whenever a land you control enters tapped, choose one —";
const UNTAP_MODE = "Untap that land.";
const TAP_MODE = "Tap target nonland permanent an opponent controls.";

export default defineCard({
  name: "Tiller Engine",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 1,
  toughness: 3,
  text: `${TRIGGER_TEXT}\n• ${UNTAP_MODE}\n• ${TAP_MODE}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land", tapped: true } },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          { text: UNTAP_MODE, effect: { kind: "untap", target: "trigger-object" } },
          {
            text: TAP_MODE,
            targets: ["nonland-permanent-an-opponent-controls"],
            effect: { kind: "tap", target: 0 },
          },
        ],
      },
      resolve: null,
      text: `${TRIGGER_TEXT} ${UNTAP_MODE} ${TAP_MODE}`,
    },
  ],
});
