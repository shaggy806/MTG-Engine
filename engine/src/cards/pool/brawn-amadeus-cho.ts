import { defineCard } from "../define.js";
import { powerUp } from "../helpers.js";

// EDHREC rank 22439.

export default defineCard({
  name: "Brawn, Amadeus Cho",
  manaCost: "{1}{G/U}",
  colors: ["U", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Gamma", "Scientist", "Hero"],
  power: 1,
  toughness: 1,
  text: "When Brawn enters, draw a card.\nPower-up — {4}{G/U}: Put a +1/+1 counter on Brawn for each card in your hand. (Activate each power-up ability only once. Reduce the cost by his mana cost if he entered this turn.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "When Brawn enters, draw a card.",
    },
  ],
  activated: [
    powerUp(
      "{4}{G/U}",
      { kind: "add-counter", target: "source", counter: "+1/+1", amount: { cardsInHand: "you" } },
      "Power-up — {4}{G/U}: Put a +1/+1 counter on Brawn for each card in your hand. (Activate each power-up ability only once. Reduce the cost by his mana cost if he entered this turn.)",
    ),
  ],
});
