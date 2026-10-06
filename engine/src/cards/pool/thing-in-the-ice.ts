import { defineCard } from "../define.js";

// Rulings:
//   [2025-01-24] Removing all ice counters from Thing in the Ice some other way will not cause it
//     to transform. You'll need to cast an instant or sorcery spell and cause its last ability to
//     trigger.
//   [2025-01-24] When Thing in the Ice's triggered ability transforms it, Awoken Horror's ability
//     will trigger and resolve before the spell that caused Thing in the Ice's last ability to
//     trigger.
//
// The no-counters check is the trigger's own, as it resolves. Two triggers on
// the stack at once transform it only once (rule 701.27f).
const ENTERS_TEXT = "This creature enters with four ice counters on it.";
const CAST_TEXT =
  "Whenever you cast an instant or sorcery spell, remove an ice counter from this creature. Then if it has no ice " +
  "counters on it, transform it.";

export default defineCard({
  name: "Thing in the Ice",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Horror"],
  power: 0,
  toughness: 4,
  keywords: ["defender"],
  text: `Defender\n${ENTERS_TEXT}\n${CAST_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "ice", amount: 4 } },
      text: ENTERS_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "remove-counter", target: "source", counter: "ice", amount: 1 },
          {
            kind: "conditional",
            condition: { kind: "self-counters", counter: "ice", compare: { op: "eq", n: 0 } },
            then: { kind: "transform", target: "source" },
          },
        ],
      },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
  faces: ["Thing in the Ice", "Awoken Horror"],
  transform: true,
});
