import { defineCard } from "../define.js";

// EDHREC rank 6740.
//
// Rulings: a creature with any counter on it, or equipped by anyone's
// Equipment, is modified; an Aura an opponent controls doesn't make it so
// (rule 700.9 — the `modified` filter). Playing the exiled card follows the
// normal costs and timing (a land only in your main phase with a land drop
// left).

const ATTACK_TEXT =
  "Whenever a modified creature you control attacks, exile the top card of your library. You may play that card this turn.";
const CAST_TEXT = "Whenever you cast a spell from exile, put a +1/+1 counter on target creature you control.";

export default defineCard({
  name: "Kami of Celebration",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 3,
  toughness: 3,
  text: `${ATTACK_TEXT} (Equipment, Auras you control, and counters are modifications.)\n${CAST_TEXT}`,
  triggered: [
    {
      // One trigger per modified attacker (Araña, Heart of the Spider's
      // filter; Laelia's impulse exile).
      trigger: { on: "attacks", who: "you-control", filter: { type: "creature", modified: true } },
      targets: [],
      effect: { kind: "impulse-exile", amount: 1, duration: "end-of-turn" },
      resolve: null,
      text: ATTACK_TEXT,
    },
    {
      // Fire Lord Zuko's cast-from-exile trigger.
      trigger: { on: "cast-spell", who: "you", from: "exile" },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
