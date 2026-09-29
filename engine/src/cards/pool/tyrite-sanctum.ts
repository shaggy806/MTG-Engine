import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const GOD_TEXT =
  "{2}, {T}: Target legendary creature becomes a God in addition to its other types. Put a +1/+1 counter on it.";
const COUNTER_TEXT = "{4}, {T}, Sacrifice this land: Put an indestructible counter on target God.";

// A legendary creature that's already a God can be targeted — it just gets
// the counter (the ruling).
export default defineCard({
  name: "Tyrite Sanctum",
  types: ["land"],
  text: `{T}: Add {C}.\n${GOD_TEXT}\n${COUNTER_TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{2}", tap: true },
      targets: [{ kind: "permanent", filter: { type: "creature", supertype: "legendary" } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-types", target: 0, addSubtypes: ["God"], duration: "permanent" },
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
        ],
      },
      resolve: null,
      text: GOD_TEXT,
    },
    {
      cost: { mana: "{4}", tap: true, sacrifice: "self" },
      targets: [{ kind: "permanent", filter: { subtype: "God" } }],
      effect: { kind: "add-counter", target: 0, counter: "indestructible", amount: 1 },
      resolve: null,
      text: COUNTER_TEXT,
    },
  ],
});
