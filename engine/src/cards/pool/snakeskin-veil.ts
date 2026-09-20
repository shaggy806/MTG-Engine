import { defineCard } from "../define.js";

export default defineCard({
  name: "Snakeskin Veil",
  manaCost: "{G}",
  colors: ["G"],
  types: ["instant"],
  text:
    "Put a +1/+1 counter on target creature you control. " +
    "It gains hexproof until end of turn.",
  targets: ["creature-you-control"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      { kind: "grant-keyword", target: 0, keyword: "hexproof", duration: "end-of-turn" },
    ],
  },
});
