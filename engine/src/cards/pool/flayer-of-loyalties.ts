import { defineCard } from "../define.js";
import { annihilator } from "../helpers.js";

// EDHREC rank 3204.
//
// Rulings:
//   [2023-07-28] Annihilator abilities trigger and resolve during the declare attackers step. The
//     defending player chooses and sacrifices the required number of permanents before they
//     declare blockers. Any creatures sacrificed this way won't be able to block.
//   [2023-07-28] If a creature with annihilator    is attacking a planeswalker, and the defending
//     player chooses to sacrifice that planeswalker, the attacking creature continues to attack.
//     It may be blocked. If it isn't blocked, it simply won't deal combat damage to anything.
//
// The cast trigger resolves before the spell, even if the spell is countered.
// "Base power and toughness 10/10" is an `animate` adding no types (layer
// 7b), with trample and haste; annihilator 2 is a granted triggered ability.
const CAST_TEXT =
  "When you cast this spell, gain control of target creature until end of turn. Untap that creature. Until end of turn, it has base power and toughness 10/10 and gains trample, annihilator 2, and haste.";

export default defineCard({
  name: "Flayer of Loyalties",
  manaCost: "{8}{C}{C}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi"],
  power: 10,
  toughness: 10,
  keywords: ["trample"],
  text: `${CAST_TEXT}\nAnnihilator 2 (Whenever this creature attacks, defending player sacrifices two permanents of their choice.)\nTrample`,
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: ["creature"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-control", target: 0, untilEndOfTurn: true },
          { kind: "untap", target: 0 },
          {
            kind: "animate",
            target: 0,
            power: 10,
            toughness: 10,
            addTypes: [],
            addSubtypes: [],
            keywords: ["trample", "haste"],
            duration: "end-of-turn",
          },
          { kind: "grant-triggered", target: 0, ability: annihilator(2), duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: CAST_TEXT,
    },
    annihilator(2),
  ],
});
