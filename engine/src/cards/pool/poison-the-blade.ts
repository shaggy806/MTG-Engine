import { defineCard } from "../define.js";

export default defineCard({
  name: "Poison the Blade",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Target creature gains deathtouch until end of turn.\nDraw a card.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "grant-keyword", target: 0, keyword: "deathtouch", duration: "end-of-turn" },
      { kind: "draw", amount: 1 },
    ],
  },
});
