import { defineCard } from "../define.js";

export default defineCard({
  name: "Hideous Visage",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Creatures you control gain intimidate until end of turn. (Each of those creatures can't be blocked except by artifact creatures and/or creatures that share a color with it.)",
  effect: {
    kind: "grant-keyword-all",
    filter: { type: "creature", controlledBy: "you" },
    keyword: "intimidate",
    duration: "end-of-turn",
  },
});
