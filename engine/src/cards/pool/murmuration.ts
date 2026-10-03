import { defineCard } from "../define.js";

// The count is every spell you've cast this turn, read as the trigger
// resolves (the rulings) — countered ones and ones cast before Murmuration
// was on the battlefield included.
const LORD_TEXT = "Birds you control get +1/+1 and have vigilance.";
const END_TEXT =
  "At the beginning of your end step, for each spell you've cast this turn, create a 1/2 blue Bird creature token with flying named Storm Crow.";

export default defineCard({
  name: "Murmuration",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: `${LORD_TEXT}\n${END_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Bird" },
      grantPt: [1, 1],
      grantKeywords: ["vigilance"],
      text: LORD_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: { kind: "create-token", token: "Storm Crow Token", count: { turnStat: "spells-cast" } },
      resolve: null,
      text: END_TEXT,
    },
  ],
});
