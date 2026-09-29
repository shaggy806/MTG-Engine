import { defineCard } from "../define.js";

const CREATURE_TEXT = "Whenever an opponent discards a creature card, create a 2/2 black Zombie creature token.";
const LAND_TEXT = "Whenever an opponent discards a land card, add {B}{B}.";
const OTHER_TEXT = "Whenever an opponent discards a noncreature, nonland card, draw a card.";

// Once per card discarded. The {B}{B} is added as the trigger resolves — it
// isn't a mana ability — and empties with the step like any other mana.
export default defineCard({
  name: "Waste Not",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: `${CREATURE_TEXT}\n${LAND_TEXT}\n${OTHER_TEXT}`,
  triggered: [
    {
      trigger: { on: "discards", who: "opponent", filter: { type: "creature" }, perCard: true },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Token", count: 1 },
      resolve: null,
      text: CREATURE_TEXT,
    },
    {
      trigger: { on: "discards", who: "opponent", filter: { type: "land" }, perCard: true },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 2 },
      resolve: null,
      text: LAND_TEXT,
    },
    {
      trigger: { on: "discards", who: "opponent", filter: { notTypes: ["creature", "land"] }, perCard: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: OTHER_TEXT,
    },
  ],
});
