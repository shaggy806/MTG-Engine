import { defineCard } from "../define.js";

// "Put them back in any order" is every looked-at card chosen, back on top in
// the order picked (Ponder's shape). "Put this artifact on top of its owner's
// library" finds it only if it's still the permanent that was tapped (rule
// 400.7): moved away in response, it stays where it went and the draw still
// happens (its ruling). Activated in response to its own first ability, the
// Top itself is among the three looked at.
const LOOK_TEXT = "{1}: Look at the top three cards of your library, then put them back in any order.";
const DRAW_TEXT = "{T}: Draw a card, then put this artifact on top of its owner's library.";

export default defineCard({
  name: "Sensei's Divining Top",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: `${LOOK_TEXT}\n${DRAW_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}", tap: false },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 3,
        min: 3,
        max: 3,
        destination: "library-top",
        leftover: "stay",
      },
      resolve: null,
      text: LOOK_TEXT,
    },
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "put-on-library", target: "source", position: "top" },
        ],
      },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
