import { defineCard } from "../define.js";

export default defineCard({
  name: "Without Weakness",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  cycling: { cost: "{2}" },
  text: "Target creature you control gains indestructible until end of turn. (Damage and effects that say \"destroy\" don't destroy it. If its toughness is 0 or less, it still dies.)\nCycling {2} ({2}, Discard this card: Draw a card.)",
  targets: ["creature-you-control"],
  effect: { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
});
