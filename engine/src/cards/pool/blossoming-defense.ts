import { defineCard } from "../define.js";

export default defineCard({
  name: "Blossoming Defense",
  manaCost: "{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Target creature you control gets +2/+2 and gains hexproof until end of turn.",
  targets: ["creature-you-control"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: 2, toughness: 2, duration: "end-of-turn" },
      { kind: "grant-keyword", target: 0, keyword: "hexproof", duration: "end-of-turn" },
    ],
  },
});
