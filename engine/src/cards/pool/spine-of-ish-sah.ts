import { defineCard } from "../define.js";

// EDHREC rank 2589.
//
// Rulings:
//   [2011-06-01] Spine of Ish Sah's last ability doesn't allow you to sacrifice it. You must find
//     another way to get Spine of Ish Sah into the graveyard.

const RETURN_TEXT =
  "When this artifact is put into a graveyard from the battlefield, return it to its owner's hand.";

export default defineCard({
  name: "Spine of Ish Sah",
  manaCost: "{7}",
  colors: [],
  types: ["artifact"],
  text: `When this artifact enters, destroy target permanent.\n${RETURN_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["permanent"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "When this artifact enters, destroy target permanent.",
    },
    {
      // Rancor's shape.
      trigger: { on: "leaves-battlefield", who: "self", to: ["graveyard"] },
      targets: [],
      effect: { kind: "return-to-hand", target: "source", from: "graveyard" },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
