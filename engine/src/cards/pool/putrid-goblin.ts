import { defineCard } from "../define.js";
import { persist } from "../helpers.js";

// EDHREC rank 3776.

export default defineCard({
  name: "Putrid Goblin",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Goblin"],
  power: 2,
  toughness: 2,
  text: "Persist (When this creature dies, if it had no -1/-1 counters on it, return it to the battlefield under its owner's control with a -1/-1 counter on it.)",
  triggered: [persist()],
});
