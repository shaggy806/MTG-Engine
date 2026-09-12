import { defineCard } from "../define.js";

// needed-cards P16. New: EffectSpec "damage" gains an optional `who`
// scope (mirroring `lose-life`), for untargeted damage to a whole player
// scope instead of a chosen target.
export default defineCard({
  name: "Sabotender",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Plant"],
  power: 2,
  toughness: 1,
  keywords: ["reach"],
  text: "Reach\nLandfall — Whenever a land you control enters, this creature deals 1 damage to each opponent.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, this creature deals 1 damage to each opponent.",
    },
  ],
});
