import { defineCard } from "../define.js";

export default defineCard({
  name: "Mage's Guile",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  cycling: { cost: "{U}" },
  text: "Target creature gains shroud until end of turn. (It can't be the target of spells or abilities.)\nCycling {U} ({U}, Discard this card: Draw a card.)",
  targets: ["creature"],
  effect: { kind: "grant-keyword", target: 0, keyword: "shroud", duration: "end-of-turn" },
});
