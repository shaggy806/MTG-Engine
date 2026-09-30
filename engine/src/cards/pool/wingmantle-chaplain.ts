import { defineCard } from "../define.js";

const ENTER_TEXT = "When this creature enters, create a 1/1 white Bird creature token with flying for each creature with defender you control.";
const OTHER_TEXT = "Whenever another creature you control with defender enters, create a 1/1 white Bird creature token with flying.";

// The count includes this creature itself.
export default defineCard({
  name: "Wingmantle Chaplain",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 0,
  toughness: 3,
  keywords: ["defender"],
  text: `Defender\n${ENTER_TEXT}\n${OTHER_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Bird Token", count: { countOf: { type: "creature", controlledBy: "you", keyword: "defender" } } },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", otherOnly: true, filter: { type: "creature", keyword: "defender" } },
      targets: [],
      effect: { kind: "create-token", token: "Bird Token", count: 1 },
      resolve: null,
      text: OTHER_TEXT,
    },
  ],
});
