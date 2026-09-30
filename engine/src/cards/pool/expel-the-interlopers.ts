import { defineCard } from "../define.js";

// The number is chosen as the spell resolves — one mode per number.
export default defineCard({
  name: "Expel the Interlopers",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Choose a number between 0 and 10. Destroy all creatures with power greater than or equal to the chosen number.",
  effect: {
    kind: "modal",
    minModes: 1,
    maxModes: 1,
    modes: [
      { text: "Choose 0. Destroy all creatures with power 0 or greater.", effect: { kind: "destroy-all", filter: { type: "creature", power: { op: "gte", n: 0 } } } },
      { text: "Choose 1. Destroy all creatures with power 1 or greater.", effect: { kind: "destroy-all", filter: { type: "creature", power: { op: "gte", n: 1 } } } },
      { text: "Choose 2. Destroy all creatures with power 2 or greater.", effect: { kind: "destroy-all", filter: { type: "creature", power: { op: "gte", n: 2 } } } },
      { text: "Choose 3. Destroy all creatures with power 3 or greater.", effect: { kind: "destroy-all", filter: { type: "creature", power: { op: "gte", n: 3 } } } },
      { text: "Choose 4. Destroy all creatures with power 4 or greater.", effect: { kind: "destroy-all", filter: { type: "creature", power: { op: "gte", n: 4 } } } },
      { text: "Choose 5. Destroy all creatures with power 5 or greater.", effect: { kind: "destroy-all", filter: { type: "creature", power: { op: "gte", n: 5 } } } },
      { text: "Choose 6. Destroy all creatures with power 6 or greater.", effect: { kind: "destroy-all", filter: { type: "creature", power: { op: "gte", n: 6 } } } },
      { text: "Choose 7. Destroy all creatures with power 7 or greater.", effect: { kind: "destroy-all", filter: { type: "creature", power: { op: "gte", n: 7 } } } },
      { text: "Choose 8. Destroy all creatures with power 8 or greater.", effect: { kind: "destroy-all", filter: { type: "creature", power: { op: "gte", n: 8 } } } },
      { text: "Choose 9. Destroy all creatures with power 9 or greater.", effect: { kind: "destroy-all", filter: { type: "creature", power: { op: "gte", n: 9 } } } },
      { text: "Choose 10. Destroy all creatures with power 10 or greater.", effect: { kind: "destroy-all", filter: { type: "creature", power: { op: "gte", n: 10 } } } },
    ],
  },
});
