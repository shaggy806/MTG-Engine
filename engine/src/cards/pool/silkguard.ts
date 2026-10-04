import { defineCard } from "../define.js";

const COUNTER_TEXT = "Put a +1/+1 counter on each of up to X target creatures you control.";
const HEXPROOF_TEXT =
  "Auras, Equipment, and modified creatures you control gain hexproof until end of turn. (Equipment, Auras you control, and counters are modifications.)";

// Rulings: a creature with a counter of any kind, or one that's equipped (by
// anyone's Equipment), is modified; an opponent's Aura doesn't make it so —
// the `modified` filter clause (rule 700.9). Which permanents gain hexproof
// is fixed as the spell resolves, after its counters are on, so a creature
// it just put a counter on is one of them.
export default defineCard({
  name: "Silkguard",
  manaCost: "{X}{G}",
  colors: ["G"],
  types: ["instant"],
  text: `${COUNTER_TEXT}\n${HEXPROOF_TEXT}`,
  targets: [{ kind: "any-number", of: "creature-you-control", max: "x" }],
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "for-each-target",
        from: 0,
        effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      },
      {
        kind: "grant-keyword-all",
        filter: {
          controlledBy: "you",
          anyOf: [{ subtype: "Aura" }, { subtype: "Equipment" }, { type: "creature", modified: true }],
        },
        keyword: "hexproof",
        duration: "end-of-turn",
      },
    ],
  },
});
