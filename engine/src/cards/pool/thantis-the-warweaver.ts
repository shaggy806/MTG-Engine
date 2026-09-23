import { defineCard } from "../define.js";

export default defineCard({
  name: "Thantis, the Warweaver",
  manaCost: "{3}{B}{R}{G}",
  colors: ["B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spider"],
  power: 5,
  toughness: 5,
  keywords: ["reach", "vigilance"],
  text:
    "Reach, vigilance\n" +
    "All creatures attack each combat if able.\n" +
    "Whenever a creature attacks you or a planeswalker you control, put a +1/+1 counter on Thantis.",
  static: [
    {
      // Thantis included: "all creatures" has no "other".
      affects: { scope: "all-creatures" },
      restrictions: ["must-attack"],
      text: "All creatures attack each combat if able.",
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "any", attackingYou: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever a creature attacks you or a planeswalker you control, put a +1/+1 counter on Thantis.",
    },
  ],
});
