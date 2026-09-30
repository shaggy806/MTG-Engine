import { defineCard } from "../define.js";

const SEARCH_TEXT =
  "When you cast this spell, search your library for a land card, put it onto the battlefield, then shuffle.";
const EXILE_TEXT = "When you cast this spell, if it was kicked, exile target land.";

// Devoid: colorless despite its green mana cost. Both cast triggers resolve
// before the spell, even if it's then countered (the ruling).
export default defineCard({
  name: "Sowing Mycospawn",
  manaCost: "{3}{G}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi", "Fungus"],
  power: 3,
  toughness: 3,
  text:
    "Devoid (This card has no color.)\nKicker {1}{C} (You may pay an additional {1}{C} as you cast this spell.)\n" +
    `${SEARCH_TEXT}\n${EXILE_TEXT}`,
  kicker: { cost: "{1}{C}" },
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: [],
      effect: { kind: "search-library", filter: { type: "land" }, destination: "battlefield", min: 0, max: 1 },
      resolve: null,
      text: SEARCH_TEXT,
    },
    {
      trigger: { on: "this-cast" },
      condition: { kind: "self-kicked" },
      targets: ["land"],
      effect: { kind: "exile", target: 0 },
      resolve: null,
      text: EXILE_TEXT,
    },
  ],
});
