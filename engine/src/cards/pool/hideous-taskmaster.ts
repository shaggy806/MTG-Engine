import type { EffectSpec } from "../../effects.js";
import type { TargetSpec } from "../../target.js";
import { defineCard } from "../define.js";
import { annihilator } from "../helpers.js";

// EDHREC rank 3878.
//
// Rulings:
//   [2024-06-07] Devoid works in all zones, not just on the battlefield.
//   [2024-06-07] A card with devoid is just colorless. It's not colorless and the colors of mana
//     in its mana cost.
//   [2024-06-07] Other cards and abilities can give a card with devoid a color. If that happens,
//     it's just the new color, not that color and colorless.
//   [2024-06-07] If a creature with annihilator is attacking a planeswalker, and the defending
//     player chooses to sacrifice that planeswalker, the attacking creature continues to attack.
//     It may be blocked. If it isn't blocked, it simply won't deal combat damage to anything.
//   [2024-06-07] If a card loses devoid, it will still be colorless. This is because effects that
//     change an object's color (like the one created by devoid) are considered before the object
//     loses devoid.
//   [2024-06-07] Annihilator abilities trigger and resolve during the declare attackers step. The
//     defending player sacrifices the required number of permanents of their choice before they
//     declare blockers. Any creatures sacrificed this way won't be able to block.
//   [2024-06-07] Devoid doesn't affect the color identity of the card for the purposes of the
//     Commander variant. For example, while Abstruse Appropriation is colorless because it has
//     devoid, its color identity is still white and black, and it can't be included in a Commander
//     deck where the commander's color identity doesn't include both white and black.
//   [2024-06-07] Hideous Taskmaster's second ability will resolve before Hideous Taskmaster does.
//     If Hideous Taskmaster is countered or otherwise leaves the stack in response to that
//     triggered ability, the triggered ability will still resolve as normal.

const CAST_TEXT =
  "When you cast this spell, for each opponent, gain control of up to one target creature that player controls until end of turn. Untap those creatures. They gain trample, haste, and annihilator 1 until end of turn.";

const perOpponent = (seat: number): TargetSpec => ({
  kind: "optional",
  of: { kind: "permanent", whose: { seat }, filter: { type: "creature" } },
});

// One slot per opponent seat (Dismantling Wave's shape); a seat with no
// target chosen is a hole the steps for it skip.
const steal = (slot: number): EffectSpec[] => [
  { kind: "gain-control", target: slot, untilEndOfTurn: true },
  { kind: "untap", target: slot },
  { kind: "grant-keyword", target: slot, keyword: "trample", duration: "end-of-turn" },
  { kind: "grant-keyword", target: slot, keyword: "haste", duration: "end-of-turn" },
  { kind: "grant-triggered", target: slot, ability: annihilator(1), duration: "end-of-turn" },
];

// Devoid: colorless in every zone, for its red mana cost (Flayer of
// Loyalties' and the pool's other devoid cards' shape).
export default defineCard({
  name: "Hideous Taskmaster",
  manaCost: "{6}{R}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi"],
  power: 7,
  toughness: 2,
  keywords: ["trample", "haste"],
  text: `Devoid (This card has no color.)\n${CAST_TEXT}\nTrample, haste, annihilator 1 (Whenever this creature attacks, defending player sacrifices a permanent of their choice.)`,
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: [perOpponent(1), perOpponent(2), perOpponent(3)],
      effect: { kind: "sequence", effects: [...steal(0), ...steal(1), ...steal(2)] },
      resolve: null,
      text: CAST_TEXT,
    },
    annihilator(1),
  ],
});
