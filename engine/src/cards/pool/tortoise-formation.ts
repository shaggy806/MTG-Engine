import { defineCard } from "../define.js";

export default defineCard({
  name: "Tortoise Formation",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Creatures you control gain shroud until end of turn. (They can't be the targets of spells or abilities.)",
  effect: {
    kind: "grant-keyword-all",
    filter: { type: "creature", controlledBy: "you" },
    keyword: "shroud",
    duration: "end-of-turn",
  },
});
