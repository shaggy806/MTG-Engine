import { defineCard } from "../define.js";

export default defineCard({
  name: "Shadowcloak Vampire",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 4,
  toughness: 3,
  text: "Pay 2 life: This creature gains flying until end of turn. (It can't be blocked except by creatures with flying or reach.)",
  activated: [
    {
      cost: { mana: null, tap: false, payLife: 2 },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "Pay 2 life: This creature gains flying until end of turn.",
    },
  ],
});
