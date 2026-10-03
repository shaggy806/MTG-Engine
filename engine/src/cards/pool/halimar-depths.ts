import { defineCard } from "../define.js";

// "Put them back in any order" is every looked-at card chosen, back on top in
// the order picked (Ponder's shape).
const LOOK_TEXT =
  "When this land enters, look at the top three cards of your library, then put them back in any order.";

export default defineCard({
  name: "Halimar Depths",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n${LOOK_TEXT}\n{T}: Add {U}.`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
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
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: "{T}: Add {U}.",
    },
  ],
});
