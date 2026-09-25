import { defineCard } from "../define.js";

export default defineCard({
  name: "Hungry Megasloth",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Sloth", "Beast"],
  power: 3,
  toughness: 3,
  keywords: ["reach"],
  text: "Reach (This creature can block creatures with flying.)\n{2}, {T}: Put a +1/+1 counter on this creature.",
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{2}, {T}: Put a +1/+1 counter on this creature.",
    },
  ],
});
