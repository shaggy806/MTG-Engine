import { defineCard } from "../define.js";

export default defineCard({
  name: "Reckless Fireweaver",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 1,
  toughness: 3,
  text: "Whenever an artifact you control enters, this creature deals 1 damage to each opponent.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "artifact" } },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Whenever an artifact you control enters, this creature deals 1 damage to each opponent.",
    },
  ],
});
