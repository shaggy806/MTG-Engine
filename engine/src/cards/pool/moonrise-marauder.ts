import { defineCard } from "../define.js";

/** ROADMAP Phase 10b — the nightbound back face of Moonrise Cultivator. */
export default defineCard({
  name: "Moonrise Marauder",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Werewolf"],
  power: 4,
  toughness: 4,
  keywords: ["trample", "nightbound"],
  text: "Trample\nNightbound (If a player casts at least two spells during their own turn, it becomes day next turn.)",
  faces: ["Moonrise Cultivator", "Moonrise Marauder"],
  transform: true,
});
