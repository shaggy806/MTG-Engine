import { defineCard } from "../define.js";

const TEXT = "{T}: Exchange target opponent's life total with this creature's toughness.";

// Tree of Redemption's exchange (rule 701.12g), aimed at an opponent: its
// toughness becomes their former life total, under counters and bonuses
// (the Cultist's Staff ruling), and they gain or lose the life to reach its
// former toughness. Gone before it resolves — even shrunk to death in
// response — and nothing happens (the ruling); a player who can't gain (or
// lose) that life, and neither half does (701.12a).
export default defineCard({
  name: "Tree of Perdition",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Plant"],
  power: 0,
  toughness: 13,
  keywords: ["defender"],
  text: `Defender\n${TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["opponent"],
      effect: { kind: "exchange-life-toughness", target: "source", player: { target: 0 } },
      resolve: null,
      text: TEXT,
    },
  ],
});
