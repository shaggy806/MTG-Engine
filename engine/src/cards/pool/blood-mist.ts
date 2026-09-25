import { defineCard } from "../define.js";

export default defineCard({
  name: "Blood Mist",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "At the beginning of combat on your turn, target creature you control gains double strike until end of turn.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: ["creature-you-control"],
      effect: { kind: "grant-keyword", target: 0, keyword: "double-strike", duration: "end-of-turn" },
      resolve: null,
      text: "At the beginning of combat on your turn, target creature you control gains double strike until end of turn.",
    },
  ],
});
