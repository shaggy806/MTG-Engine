import { defineCard } from "../define.js";

export default defineCard({
  name: "Deep Analysis",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text:
    "Target player draws two cards.\n" +
    "Flashback—{1}{U}, Pay 3 life.",
  targets: ["player"],
  effect: { kind: "draw", amount: 2, target: 0 },
  flashback: { cost: "{1}{U}", payLife: 3 },
});
