import { defineCard } from "../define.js";

const TAPPED_TEXT = "Creatures your opponents control enter tapped.";
const LIFE_TEXT = "Whenever a creature an opponent controls enters, you gain 1 life.";

export default defineCard({
  name: "Authority of the Consuls",
  manaCost: "{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: `${TAPPED_TEXT}\n${LIFE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "others-enter-battlefield",
        filter: { type: "creature", controlledBy: "opponent" },
        tapped: true,
      },
      text: TAPPED_TEXT,
    },
  ],
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "any",
        filter: { type: "creature", controlledBy: "opponent" },
      },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: LIFE_TEXT,
    },
  ],
});
