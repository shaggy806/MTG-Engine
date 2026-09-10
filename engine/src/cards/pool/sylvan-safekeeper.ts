import { defineCard } from "../define.js";

// needed-cards P6 — filtered sacrifice cost + a targeted, non-mana activated
// ability. (Oracle text is "hexproof"; the original printing said "shroud",
// which this engine doesn't model.)
export default defineCard({
  name: "Sylvan Safekeeper",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 1,
  text: "Sacrifice a land: Target creature you control gains hexproof until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { type: "land" } } },
      targets: ["creature-you-control"],
      effect: {
        kind: "grant-keyword",
        target: 0,
        keyword: "hexproof",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Sacrifice a land: Target creature you control gains hexproof until end of turn.",
    },
  ],
});
