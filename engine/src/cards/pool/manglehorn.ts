import { defineCard } from "../define.js";

const ENTER_TEXT = "When this creature enters, you may destroy target artifact.";
const TAPPED_TEXT = "Artifacts your opponents control enter tapped.";

export default defineCard({
  name: "Manglehorn",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 2,
  toughness: 2,
  text: `${ENTER_TEXT}\n${TAPPED_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "others-enter-battlefield",
        filter: { type: "artifact", controlledBy: "opponent" },
        tapped: true,
      },
      text: TAPPED_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["artifact"],
      effect: { kind: "may", prompt: "Destroy the target artifact?", effect: { kind: "destroy", target: 0 } },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
});
