import { defineCard } from "../define.js";

export default defineCard({
  name: "Dispersing Orb",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: "{3}{U}, Sacrifice a permanent: Return target permanent to its owner's hand.",
  activated: [
    {
      cost: { mana: "{3}{U}", tap: false, sacrifice: { filter: {} } },
      targets: ["permanent"],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: "{3}{U}, Sacrifice a permanent: Return target permanent to its owner's hand.",
    },
  ],
});
