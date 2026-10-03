import { defineCard } from "../define.js";

const DISCARD_TEXT = "Whenever you discard one or more cards, this creature deals that much damage to each opponent.";
const CYCLE_TEXT = "When you cycle this card, it deals 1 damage to each opponent.";

// "That much": the cards discarded together, once per discard. Cycled, the
// card is the source of its own trigger's damage, from the graveyard, and
// the trigger resolves before the cycling ability's draw.
export default defineCard({
  name: "Magmakin Artillerist",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental", "Pirate"],
  power: 1,
  toughness: 4,
  cycling: { cost: "{1}{R}" },
  text: `${DISCARD_TEXT}\nCycling {1}{R} ({1}{R}, Discard this card: Draw a card.)\n${CYCLE_TEXT}`,
  triggered: [
    {
      trigger: { on: "discards", who: "you" },
      targets: [],
      effect: { kind: "damage", amount: { triggerValue: true }, who: "each-opponent" },
      resolve: null,
      text: DISCARD_TEXT,
    },
    {
      trigger: { on: "this-cycled" },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: CYCLE_TEXT,
    },
  ],
});
