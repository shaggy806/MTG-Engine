import { defineCard } from "../define.js";
import type { EffectSpec } from "../../effects.js";

// EDHREC rank 2857.
// Makes Zombie → use "Zombie Token".

const TEXT = "Whenever this creature or another nontoken Zombie you control dies, create a 2/2 black Zombie creature token.";
const ZOMBIE: EffectSpec = { kind: "create-token", token: "Zombie Token", count: 1 };

// "This creature" counts even when it's a token copy; the others must be
// nontoken Zombies. Two triggers for the two halves (Pawn of Ulamog's shape),
// and one death fires one.
export default defineCard({
  name: "Headless Rider",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 3,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: ZOMBIE,
      resolve: null,
      text: TEXT,
    },
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature", subtype: "Zombie", token: false }, otherOnly: true },
      targets: [],
      effect: ZOMBIE,
      resolve: null,
      text: TEXT,
    },
  ],
});
