import { defineCard } from "../define.js";

// EDHREC rank 4130.
//
// Rulings:
//   [2010-03-01] Tectonic Edge’s second ability checks how many lands an opponent controls only at
//     the time you activate the ability.
//   [2010-03-01] Assuming you can activate Tectonic Edge’s second ability, you can target any
//     nonbasic land with it (not just one controlled by an opponent that controls four or more
//     lands).

const DESTROY_TEXT =
  "{1}, {T}, Sacrifice this land: Destroy target nonbasic land. Activate only if an opponent controls four or more lands.";

export default defineCard({
  name: "Tectonic Edge",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${DESTROY_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{1}", tap: true, sacrifice: "self" },
      // Checked as it's activated, by some one opponent on their own (the ruling).
      condition: { kind: "opponent-controls", filter: { type: "land" }, atLeast: 4 },
      targets: [{ kind: "permanent", filter: { type: "land", notSupertype: "basic" } }],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: DESTROY_TEXT,
    },
  ],
});
