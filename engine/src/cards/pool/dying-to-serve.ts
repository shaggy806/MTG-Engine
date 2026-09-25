import { defineCard } from "../define.js";

export default defineCard({
  name: "Dying to Serve",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "Whenever you discard one or more cards, create a tapped 2/2 black Zombie creature token. This ability triggers only once each turn.",
  triggered: [
    {
      trigger: { on: "discards", who: "you" },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Token", count: 1, tapped: true },
      resolve: null,
      text: "Whenever you discard one or more cards, create a tapped 2/2 black Zombie creature token. This ability triggers only once each turn.",
      oncePerTurn: true,
    },
  ],
});
