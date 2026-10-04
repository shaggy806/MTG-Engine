import { defineCard } from "../define.js";

// EDHREC rank 3056.
// Makes Knight → "Knight Token (Chivalric Alliance)" (white and blue, unlike
// the white "Knight Token").
const ATTACK_TEXT = "Whenever you attack with two or more creatures, draw a card.";
const TOKEN_TEXT = "{2}, Discard a card: Create a 2/2 white and blue Knight creature token with vigilance.";

export default defineCard({
  name: "Chivalric Alliance",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: `${ATTACK_TEXT}\n${TOKEN_TEXT}`,
  triggered: [
    {
      trigger: { on: "attack-with", who: "you", atLeast: 2 },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}", tap: false, discard: { count: 1 } },
      targets: [],
      effect: { kind: "create-token", token: "Knight Token (Chivalric Alliance)", count: 1 },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
});
