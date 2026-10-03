import { defineCard } from "../define.js";

const TEXT = "{T}: Exchange your life total with this creature's toughness.";

// Rule 701.12g: its toughness becomes your former life total (layer 7b, so
// counters and bonuses apply on top — the Lunarch Mantle ruling) and you gain
// or lose the life it takes to reach its former toughness. Gone by the time
// it resolves, nothing happens (the ruling); unable to gain (or lose) that
// life, neither half does (701.12a).
export default defineCard({
  name: "Tree of Redemption",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Plant"],
  power: 0,
  toughness: 13,
  keywords: ["defender"],
  text: `Defender\n${TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "exchange-life-toughness", target: "source" },
      resolve: null,
      text: TEXT,
    },
  ],
});
