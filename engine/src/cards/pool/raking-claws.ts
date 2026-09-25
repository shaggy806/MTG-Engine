import { defineCard } from "../define.js";

export default defineCard({
  name: "Raking Claws",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  cycling: { cost: "{2}" },
  text: "Target creature gains double strike until end of turn.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  targets: ["creature"],
  effect: { kind: "grant-keyword", target: 0, keyword: "double-strike", duration: "end-of-turn" },
});
