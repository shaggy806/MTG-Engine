import { defineCard } from "../define.js";

export default defineCard({
  name: "Efficient Construction",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: "Whenever you cast an artifact spell, create a 1/1 colorless Thopter artifact creature token with flying.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "artifact" } },
      targets: [],
      effect: { kind: "create-token", token: "Thopter Token", count: 1 },
      resolve: null,
      text: "Whenever you cast an artifact spell, create a 1/1 colorless Thopter artifact creature token with flying.",
    },
  ],
});
