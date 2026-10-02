import { defineCard } from "../define.js";

// Amass's Army (rule 701.44) — a 0/0 black Army, which survives only because
// amass puts +1/+1 counters on it in the same instruction. The creature type
// amass names ("amass Zombies N") is added by the effect, not printed here.
export default defineCard({
  name: "Army Token",
  art: "2f4b7c63-8430-4ca4-baee-dc958d5bd22f",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Army"],
  power: 0,
  toughness: 0,
});
