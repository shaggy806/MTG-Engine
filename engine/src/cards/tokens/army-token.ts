import { defineCard } from "../define.js";

// Amass's Army (rule 701.44) — a 0/0 black Army, which survives only because
// amass puts +1/+1 counters on it in the same instruction. The creature type
// amass names ("amass Zombies N") is added by the effect, not printed here.
export default defineCard({
  name: "Army Token",
  art: "https://scryfall.com/card/twar/7/zombie-army",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Army"],
  power: 0,
  toughness: 0,
});
