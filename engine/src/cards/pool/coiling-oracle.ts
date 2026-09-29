import { defineCard } from "../define.js";

const ENTER_TEXT =
  "When this creature enters, reveal the top card of your library. If it's a land card, put it " +
  "onto the battlefield. Otherwise, put that card into your hand.";

// One card looked at: a land must be taken (`min: 1`), anything else goes to
// the hand as the leftover.
export default defineCard({
  name: "Coiling Oracle",
  manaCost: "{G}{U}",
  colors: ["G", "U"],
  types: ["creature"],
  subtypes: ["Snake", "Elf", "Druid"],
  power: 1,
  toughness: 1,
  text: ENTER_TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 1,
        reveal: true,
        min: 1,
        max: 1,
        destination: "battlefield",
        leftover: "hand",
        filter: { type: "land" },
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
});
