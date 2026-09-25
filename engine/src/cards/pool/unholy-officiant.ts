import { defineCard } from "../define.js";

export default defineCard({
  name: "Unholy Officiant",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Vampire", "Cleric"],
  power: 1,
  toughness: 2,
  keywords: ["vigilance"],
  text: "Vigilance\n{4}{W}: Put a +1/+1 counter on this creature.",
  activated: [
    {
      cost: { mana: "{4}{W}", tap: false },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{4}{W}: Put a +1/+1 counter on this creature.",
    },
  ],
});
