import { defineCard } from "../define.js";

export default defineCard({
  name: "Archive Dragon",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Dragon", "Wizard"],
  power: 4,
  toughness: 6,
  keywords: ["flying"],
  text: "Flying\nWard {2} (Whenever this creature becomes the target of a spell or ability an opponent controls, counter it unless that player pays {2}.)\nWhen this creature enters, scry 2.",
  triggered: [
    {
      trigger: { on: "becomes-target", who: "self", byOpponentOnly: true },
      targets: [],
      effect: { kind: "ward", cost: { mana: "{2}" } },
      resolve: null,
      text: "Ward {2}",
    },
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "scry", amount: 2 },
      resolve: null,
      text: "When this creature enters, scry 2.",
    },
  ],
});
