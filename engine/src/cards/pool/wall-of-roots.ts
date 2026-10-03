import { defineCard } from "../define.js";

const TEXT = "Put a -0/-1 counter on this creature: Add {G}. Activate only once each turn.";

// A mana ability (rule 605.1a) with no {T}: usable while tapped, the turn it
// arrives, and on any player's turn, once each turn. The counter is its cost
// (`addCounter`), so it can make its toughness 0 — and then be sacrificed to
// pay the rest of a cost that also wants a creature (the ruling) — and the
// auto-payer reaches for it only once everything else is spent.
export default defineCard({
  name: "Wall of Roots",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Plant", "Wall"],
  power: 0,
  toughness: 5,
  keywords: ["defender"],
  text: `Defender\n${TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: false, addCounter: { kind: "-0/-1", count: 1 } },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      oncePerTurn: true,
      text: TEXT,
    },
  ],
});
