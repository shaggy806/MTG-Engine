import type { EffectSpec } from "../../effects.js";
import type { TargetSpec } from "../../target.js";
import { defineCard } from "../define.js";

// EDHREC rank 5710.
//
// Rulings:
//   [2013-01-24] You can choose a number of targets up to the number of opponents you have, one
//     target per opponent.
//   [2013-01-24] Molten Primordial’s triggered ability can target a creature that’s already
//     untapped.

const ETB_TEXT =
  "When this creature enters, for each opponent, gain control of up to one target creature that player controls until end of turn. Untap those creatures. They gain haste until end of turn.";

// Hideous Taskmaster's shape: one optional slot per opponent's seat, each
// bound to "that player".
const perOpponent = (seat: number): TargetSpec => ({
  kind: "optional",
  of: { kind: "permanent", whose: { seat }, filter: { type: "creature" } },
});

const steal = (slot: number): EffectSpec[] => [
  { kind: "gain-control", target: slot, untilEndOfTurn: true },
  { kind: "untap", target: slot },
  { kind: "grant-keyword", target: slot, keyword: "haste", duration: "end-of-turn" },
];

export default defineCard({
  name: "Molten Primordial",
  manaCost: "{5}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Avatar"],
  power: 6,
  toughness: 4,
  keywords: ["haste"],
  text: `Haste\n${ETB_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [perOpponent(1), perOpponent(2), perOpponent(3)],
      effect: { kind: "sequence", effects: [...steal(0), ...steal(1), ...steal(2)] },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
});
