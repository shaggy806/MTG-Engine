import { defineCard } from "../define.js";

// EDHREC rank 6584.
//
// Rulings:
//   [2016-07-13] Turn Aside can target a spell that has multiple targets, as long as at least one
//     of those targets is a permanent you control.

export default defineCard({
  name: "Turn Aside",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target spell that targets a permanent you control.",
  // Rebuff the Wicked's shape.
  targets: [{ kind: "spell", filter: { targets: { permanent: { controlledBy: "you" } } } }],
  effect: { kind: "counter", target: 0 },
});
