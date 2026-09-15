import { defineCard } from "../define.js";

/** A daybound/nightbound werewolf (rule 702.145). Casting it makes the game
 * day if it's neither; as it becomes night (the previous turn's player cast no
 * spells — rule 726.3) it transforms into `Harvesttide Assailant`, and back as
 * it becomes day. */
export default defineCard({
  name: "Harvesttide Infiltrator",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Werewolf"],
  power: 3,
  toughness: 2,
  keywords: ["trample", "daybound"],
  text: "Trample\nDaybound (If a player casts no spells during their own turn, it becomes night next turn.)",
  faces: ["Harvesttide Infiltrator", "Harvesttide Assailant"],
  transform: true,
});
