import { defineCard } from "../define.js";

export default defineCard({
  name: "Cleaver Riot",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Creatures you control gain double strike until end of turn. (They deal both first-strike and regular combat damage.)",
  effect: {
    kind: "grant-keyword-all",
    filter: { type: "creature", controlledBy: "you" },
    keyword: "double-strike",
    duration: "end-of-turn",
  },
});
