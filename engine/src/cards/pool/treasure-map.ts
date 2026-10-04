import { defineCard } from "../define.js";

// EDHREC rank 3031.
// Makes Treasure → "Treasure Token".
//
// Rulings:
//   [2017-09-29] If a third landmark counter is put on Treasure Map by something other than the
//     resolution of its first ability (as modified by any applicable replacement effects), you
//     won't remove those counters, transform Treasure Map, or get Treasures yet. You'll have to
//     wait until you activate its first ability again.
//   [2017-09-29] If Treasure Map leaves the battlefield before its ability resolves, you can't put
//     a landmark counter on it. However, if it somehow already had three landmark counters on it
//     before it left the battlefield, you'll get three Treasures.
//
// Transforms into Treasure Cove. Primal Amulet's shape: the three-counter check is the
// ability's own, as it resolves (the first ruling), and `self-counters` reads a departed Map's
// last-known counters (the second — `remove-counter` and `transform` then find nothing).
// "Those counters" are all the landmark counters.
const TEXT =
  "{1}, {T}: Scry 1. Put a landmark counter on this artifact. Then if there are three or more landmark counters on it, remove those counters, transform this artifact, and create three Treasure tokens.";

export default defineCard({
  name: "Treasure Map",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: `${TEXT} (They're artifacts with "{T}, Sacrifice this token: Add one mana of any color.")`,
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "scry", amount: 1 },
          { kind: "add-counter", target: "source", counter: "landmark", amount: 1 },
          {
            kind: "conditional",
            condition: { kind: "self-counters", counter: "landmark", compare: { op: "gte", n: 3 } },
            then: {
              kind: "sequence",
              effects: [
                {
                  kind: "remove-counter",
                  target: "source",
                  counter: "landmark",
                  amount: { countersOn: "source", counter: "landmark" },
                },
                { kind: "transform", target: "source" },
                { kind: "create-token", token: "Treasure Token", count: 3 },
              ],
            },
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
  faces: ["Treasure Map", "Treasure Cove"],
  transform: true,
});
