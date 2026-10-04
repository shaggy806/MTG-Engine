import { defineCard } from "../define.js";

// EDHREC rank 4727.
//
// Rulings:
//   [2022-02-18] A creature that is equipped is considered modified no matter who controls the
//     Equipment that's attached to it.
//   [2022-02-18] A creature with a counter on it is considered modified no matter what kind of
//     counter it is or which player put it on that creature.
//   [2022-02-18] An Aura controlled by an opponent does not cause a creature you control to be
//     modified.
// Modified (rule 700.9) is Kodama of the West Tree's filter.

const COUNTERS_TEXT = "This enchantment enters with four +1/+1 counters on it.";
const HASTE_TEXT =
  "Modified creatures you control have haste. (Equipment, Auras you control, and counters are modifications.)";
const MOVE_TEXT =
  "Remove a +1/+1 counter from this enchantment: Put a +1/+1 counter on target creature you control. Activate only as a sorcery and only once each turn.";

export default defineCard({
  name: "Invigorating Hot Spring",
  manaCost: "{1}{R}{G}",
  colors: ["R", "G"],
  types: ["enchantment"],
  text: `${COUNTERS_TEXT}\n${HASTE_TEXT}\n${MOVE_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: false, removeCounter: { kind: "+1/+1", count: 1 } },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: MOVE_TEXT,
      sorcerySpeed: true,
      oncePerTurn: true,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: 4 } },
      text: COUNTERS_TEXT,
    },
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you", modified: true } },
      grantKeywords: ["haste"],
      text: HASTE_TEXT,
    },
  ],
});
