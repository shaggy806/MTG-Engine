import { defineCard } from "../define.js";

const KICKED_TEXT =
  "When this creature enters, if it was kicked, search your library for a land card with a basic land type, reveal it, put it into your hand, then shuffle.";
const DRAW_TEXT = "{R}, {T}, Sacrifice a land: Draw a card.";

// "A land card with a basic land type" is any land card with one of the five
// basic land types, basic or not (the ruling).
export default defineCard({
  name: "Sprouting Goblin",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Druid"],
  power: 2,
  toughness: 2,
  text: `Kicker {G} (You may pay an additional {G} as you cast this spell.)\n${KICKED_TEXT}\n${DRAW_TEXT}`,
  kicker: { cost: "{G}" },
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      condition: { kind: "self-kicked" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "land", subtypes: ["Plains", "Island", "Swamp", "Mountain", "Forest"] },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: KICKED_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{R}", tap: true, sacrifice: { filter: { type: "land" } } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
