import { defineCard } from "../define.js";
import type { EffectSpec } from "../../effects.js";

const TEXT =
  "Whenever this creature or another nontoken creature you control dies, you may create a 0/1 colorless " +
  'Eldrazi Spawn creature token. It has "Sacrifice this token: Add {C}."';

const MAY_SPAWN: EffectSpec = {
  kind: "may",
  prompt: "Create a 0/1 Eldrazi Spawn token?",
  effect: { kind: "create-token", token: "Eldrazi Spawn Token", count: 1 },
};

// "This creature" counts even when it's a token copy; the others must be
// nontoken. Two triggers for the two halves, and one death fires one.
export default defineCard({
  name: "Pawn of Ulamog",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Shaman"],
  power: 2,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: MAY_SPAWN,
      resolve: null,
      text: TEXT,
    },
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature", token: false }, otherOnly: true },
      targets: [],
      effect: MAY_SPAWN,
      resolve: null,
      text: TEXT,
    },
  ],
});
