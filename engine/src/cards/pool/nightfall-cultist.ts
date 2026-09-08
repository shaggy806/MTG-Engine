import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 10b — a non-werewolf transforming DFC: it turns over via its
 * own activated ability (rule 701.28 — a transform ability uses the stack).
 * The back face (`Voidfall Horror`) carries a `transforms` trigger.
 */
export default defineCard({
  name: "Nightfall Cultist",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 2,
  toughness: 1,
  text: "{2}{B}: Transform Nightfall Cultist.",
  activated: [
    {
      cost: { mana: "{2}{B}", tap: false },
      targets: [],
      effect: { kind: "transform", target: "source" },
      resolve: null,
      text: "{2}{B}: Transform Nightfall Cultist.",
    },
  ],
  faces: ["Nightfall Cultist", "Voidfall Horror"],
  transform: true,
});
