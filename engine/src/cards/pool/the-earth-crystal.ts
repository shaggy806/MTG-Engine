import { defineCard } from "../define.js";

const REDUCE_TEXT = "Green spells you cast cost {1} less to cast.";
const DOUBLE_TEXT =
  "If one or more +1/+1 counters would be put on a creature you control, twice that many +1/+1 counters are put on that creature instead.";
const DISTRIBUTE_TEXT =
  "{4}{G}{G}, {T}: Distribute two +1/+1 counters among one or two target creatures you control.";

// Two counters among one or two targets, at least one each: the split is
// fixed by how many targets are chosen — two on one, or one on each. With
// two chosen each keeps its one counter however the other fares, and a
// target found illegal loses its counter rather than passing it on (the
// ruling), which is why the branch asks whether a second target was
// *chosen*, not whether it's still legal.
export default defineCard({
  name: "The Earth Crystal",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `${REDUCE_TEXT}\n${DOUBLE_TEXT}\n${DISTRIBUTE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { colors: ["G"] }, caster: "you", reduceGeneric: 1 },
      text: REDUCE_TEXT,
    },
    {
      affects: { scope: "self" },
      replacement: {
        event: "would-add-counter",
        multiplier: 2,
        counterKind: "+1/+1",
        filter: { type: "creature" },
      },
      text: DOUBLE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{4}{G}{G}", tap: true },
      targets: [
        "creature-you-control",
        { kind: "optional", of: { kind: "other", of: "creature-you-control", than: { slot: 0 } } },
      ],
      effect: {
        kind: "conditional",
        condition: { kind: "target-chosen", index: 1 },
        then: {
          kind: "sequence",
          effects: [
            { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
            { kind: "add-counter", target: 1, counter: "+1/+1", amount: 1 },
          ],
        },
        else: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 },
      },
      resolve: null,
      text: DISTRIBUTE_TEXT,
    },
  ],
});
