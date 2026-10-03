import { defineCard } from "../define.js";

const ENTER_TEXT = "When this creature enters, you become the monarch.";
const UPKEEP_TEXT =
  "At the beginning of your upkeep, if you're the monarch, create a 5/5 red Dragon creature token with flying.";

// The upkeep ability is an intervening-if (rule 603.4): asked as the upkeep
// begins and again as it resolves (the rulings).
export default defineCard({
  name: "Skyline Despot",
  manaCost: "{5}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${ENTER_TEXT}\n${UPKEEP_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "become-monarch" },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: { kind: "monarch", who: "you" },
      targets: [],
      effect: { kind: "create-token", token: "Dragon Token", count: 1 },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
