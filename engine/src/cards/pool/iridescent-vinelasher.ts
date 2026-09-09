import { defineCard } from "../define.js";

/**
 * Offspring {2} is not modeled (it needs a cast-time optional additional cost
 * + a token copy — see the P5 note in `neededCards-features.md`); the landfall
 * ping is the faithful part.
 */
export default defineCard({
  name: "Iridescent Vinelasher",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Lizard", "Assassin"],
  power: 1,
  toughness: 2,
  text:
    "Landfall — Whenever a land you control enters, this creature deals 1 " +
    "damage to target opponent.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: ["opponent"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text:
        "Landfall — Whenever a land you control enters, this creature deals 1 " +
        "damage to target opponent.",
    },
  ],
});
