import { defineCard } from "../define.js";

export default defineCard({
  name: "Sharding Sphinx",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Sphinx"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Whenever an artifact creature you control deals combat damage to a player, " +
    "you may create a 1/1 blue Thopter artifact creature token with flying.",
  triggered: [
    {
      trigger: {
        on: "deals-combat-damage-to-player",
        who: "you-control",
        filter: { type: "artifact" },
      },
      // No target slot, so the auto-filled damaged player has nowhere to go.
      targets: [],
      effect: {
        kind: "may",
        prompt: "Create a 1/1 blue Thopter artifact creature token with flying?",
        effect: { kind: "create-token", token: "Thopter Token", count: 1 },
      },
      resolve: null,
      text:
        "Whenever an artifact creature you control deals combat damage to a player, " +
        "you may create a 1/1 blue Thopter artifact creature token with flying.",
    },
  ],
});
