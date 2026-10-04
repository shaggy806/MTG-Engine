import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// EDHREC rank 3892.
//
// Rulings:
//   [2022-02-18] If a channel ability requires a target, you may not activate it without a target
//     just to discard the card.
//   [2022-02-18] Discarding the card is part of the cost to activate a channel ability.

const RETURN_CARD_TEXT =
  "Channel — {2}{G}, Discard this card: Return target card from your graveyard to your hand.";
const BOUNCE_TEXT = "Channel — {1}{U}, Discard this card: Return target creature to its owner's hand.";

// Channel is Boseiju's shape: an ability activated from the hand (`zone:
// "hand"`), discarding the card as part of its cost (rule 702.51a).
export default defineCard({
  name: "Colossal Skyturtle",
  manaCost: "{4}{G}{G}{U}",
  colors: ["U", "G"],
  types: ["enchantment", "creature"],
  subtypes: ["Turtle"],
  power: 6,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying, ward {2}\n${RETURN_CARD_TEXT}\n${BOUNCE_TEXT}`,
  activated: [
    {
      cost: { mana: "{2}{G}", tap: false },
      targets: [{ kind: "card-in-graveyard", whose: "you" }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: RETURN_CARD_TEXT,
      zone: "hand",
    },
    {
      cost: { mana: "{1}{U}", tap: false },
      targets: ["creature"],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: BOUNCE_TEXT,
      zone: "hand",
    },
  ],
  triggered: [ward({ mana: "{2}" })],
});
