import { defineCard } from "../define.js";

const CREATURE_TEXT = "Whenever you discard a creature card, create a 2/2 black Zombie creature token.";
const LAND_TEXT = "Whenever you discard a land card, add {B}{B}.";
const OTHER_TEXT = "Whenever you discard a noncreature, nonland card, draw a card.";

// Once per card. A land creature card fires both of the first two.
export default defineCard({
  name: "Bone Miser",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Wizard"],
  power: 4,
  toughness: 4,
  text: `${CREATURE_TEXT}\n${LAND_TEXT}\n${OTHER_TEXT}`,
  triggered: [
    {
      trigger: { on: "discards", who: "you", perCard: true, filter: { type: "creature" } },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Token", count: 1 },
      resolve: null,
      text: CREATURE_TEXT,
    },
    {
      trigger: { on: "discards", who: "you", perCard: true, filter: { type: "land" } },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 2 },
      resolve: null,
      text: LAND_TEXT,
    },
    {
      trigger: { on: "discards", who: "you", perCard: true, filter: { notTypes: ["creature", "land"] } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: OTHER_TEXT,
    },
  ],
});
