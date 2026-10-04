import { defineCard } from "../define.js";

// EDHREC rank 3911.
//
// Rulings:
//   [2011-01-01] The second ability destroys each creature that's tapped at the time it resolves,
//     including creatures you control. If Sunblast Angel has become tapped by the time its ability
//     resolves, it will be destroyed too.

export default defineCard({
  name: "Sunblast Angel",
  manaCost: "{4}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 4,
  toughness: 5,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, destroy all tapped creatures.",
  triggered: [
    {
      // Read as it resolves, your own creatures and itself included (the ruling).
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "destroy-all", filter: { type: "creature", tapped: true } },
      resolve: null,
      text: "When this creature enters, destroy all tapped creatures.",
    },
  ],
});
