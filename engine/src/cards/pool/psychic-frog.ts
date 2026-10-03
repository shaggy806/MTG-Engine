import { defineCard } from "../define.js";

// An attacker deals its combat damage to the one player or planeswalker it
// attacks, so the two halves of the draw never fire for the same damage
// (Grateful Apparition's shape). The cards each cost takes are picked as the
// ability goes on the stack.
const DRAW_TEXT = "Whenever this creature deals combat damage to a player or planeswalker, draw a card.";
const COUNTER_TEXT = "Discard a card: Put a +1/+1 counter on this creature.";
const FLYING_TEXT = "Exile three cards from your graveyard: This creature gains flying until end of turn.";

export default defineCard({
  name: "Psychic Frog",
  manaCost: "{U}{B}",
  colors: ["U", "B"],
  types: ["creature"],
  subtypes: ["Frog"],
  power: 1,
  toughness: 2,
  text: `${DRAW_TEXT}\n${COUNTER_TEXT}\n${FLYING_TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-damage", who: "self", to: "player", combat: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
    {
      trigger: { on: "deals-damage", who: "self", to: "planeswalker", combat: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, discard: { count: 1 } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: COUNTER_TEXT,
    },
    {
      cost: { mana: null, tap: false, exileFromGraveyard: { count: 3 } },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: FLYING_TEXT,
    },
  ],
});
