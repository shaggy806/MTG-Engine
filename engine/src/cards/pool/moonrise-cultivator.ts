import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 10b — a made-up daybound/nightbound werewolf (rule 702.145).
 * Its front face is a {1}{G} 2/2. Casting it makes the game day if it's
 * neither; as it becomes night (the previous turn's player cast no spells —
 * rule 726.3) it transforms to `Moonrise Marauder`, and back as it becomes day.
 */
export default defineCard({
  name: "Moonrise Cultivator",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Werewolf"],
  power: 2,
  toughness: 2,
  keywords: ["daybound"],
  text: "Daybound (If a player casts no spells during their own turn, it becomes night next turn.)",
  faces: ["Moonrise Cultivator", "Moonrise Marauder"],
  transform: true,
});
