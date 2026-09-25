import { defineCard } from "../define.js";

export default defineCard({
  name: "Chain Devil",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Devil"],
  power: 4,
  toughness: 2,
  text: "Animate Chains — When this creature enters, each player sacrifices a nontoken creature of their choice.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sacrifice",
        who: "each-player",
        filter: { token: false, type: "creature" },
        count: 1,
      },
      resolve: null,
      text: "Animate Chains — When this creature enters, each player sacrifices a nontoken creature of their choice.",
    },
  ],
});
