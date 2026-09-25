import { defineCard } from "../define.js";

export default defineCard({
  name: "Channel the Suns",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Add {W}{U}{B}{R}{G}.",
  effect: { kind: "add-mana", mana: { all: ["W", "U", "B", "R", "G"] }, amount: 1 },
});
