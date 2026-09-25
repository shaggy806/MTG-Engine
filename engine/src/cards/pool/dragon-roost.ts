import { defineCard } from "../define.js";

export default defineCard({
  name: "Dragon Roost",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "{5}{R}{R}: Create a 5/5 red Dragon creature token with flying. (It can't be blocked except by creatures with flying or reach.)",
  activated: [
    {
      cost: { mana: "{5}{R}{R}", tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Dragon Token", count: 1 },
      resolve: null,
      text: "{5}{R}{R}: Create a 5/5 red Dragon creature token with flying.",
    },
  ],
});
