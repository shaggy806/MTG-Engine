import { defineCard } from "../define.js";

// EDHREC rank 5706.

export default defineCard({
  name: "Languish",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "All creatures get -4/-4 until end of turn.",
  effect: { kind: "modify-pt-all", filter: { type: "creature" }, power: -4, toughness: -4, duration: "end-of-turn" },
});
