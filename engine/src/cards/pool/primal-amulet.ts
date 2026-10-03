import { defineCard } from "../define.js";

const REDUCE_TEXT = "Instant and sorcery spells you cast cost {1} less to cast.";
const CHARGE_TEXT =
  "Whenever you cast an instant or sorcery spell, put a charge counter on this artifact. Then if there are four " +
  "or more charge counters on it, you may remove those counters and transform it.";

// Transforms into Primal Wellspring. The four-counter check is the trigger's
// own, as it resolves: a fourth counter put on some other way waits for the
// next instant or sorcery (the ruling). "Those counters" are all of them.
export default defineCard({
  name: "Primal Amulet",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: `${REDUCE_TEXT}\n${CHARGE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { typesAnyOf: ["instant", "sorcery"] }, caster: "you", reduceGeneric: 1 },
      text: REDUCE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "charge", amount: 1 },
          {
            kind: "conditional",
            condition: { kind: "self-counters", counter: "charge", compare: { op: "gte", n: 4 } },
            then: {
              kind: "may",
              prompt: "Remove the charge counters and transform Primal Amulet?",
              effect: {
                kind: "sequence",
                effects: [
                  {
                    kind: "remove-counter",
                    target: "source",
                    counter: "charge",
                    amount: { countersOn: "source", counter: "charge" },
                  },
                  { kind: "transform", target: "source" },
                ],
              },
            },
          },
        ],
      },
      resolve: null,
      text: CHARGE_TEXT,
    },
  ],
  faces: ["Primal Amulet", "Primal Wellspring"],
  transform: true,
});
