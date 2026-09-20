import { defineCard } from "../define.js";

export default defineCard({
  name: "Pitiless Plunderer",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Pirate"],
  power: 1,
  toughness: 4,
  text: "Whenever another creature you control dies, create a Treasure token.",
  triggered: [
    {
      // "**another** creature **you control**" — `otherOnly` excludes the
      // Plunderer's own death, which would otherwise trigger it on the way out.
      trigger: {
        on: "dies",
        who: "you-control",
        otherOnly: true,
        filter: { type: "creature" },
      },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: "Whenever another creature you control dies, create a Treasure token.",
    },
  ],
});
