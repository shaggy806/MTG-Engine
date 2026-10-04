import { defineCard } from "../define.js";

// EDHREC rank 5069.
//
// Rulings:
//   [2024-07-26] You pay all costs and follow all timing rules for cards played this way. For
//     example, if one of the exiled cards is a land card, you may play it only during your main
//     phase while the stack is empty.
//   [2024-07-26] The effect of Hugs's last ability that allows you to play an additional land is
//     cumulative with similar effects. For example, if you control Hugs as well as Exploration (an
//     enchantment with "You may play an additional land on each of your turns."), you'll be able
//     to play three lands during each of your turns.
//   [2024-07-26] You may play the exiled cards even if Hugs is no longer on the battlefield or
//     under your control.

// X is the X Hugs was cast with (Farmer Cotton's enter trigger reads it the
// same way; 0 when it wasn't cast). "Until the end of your next turn, you may
// play those cards" is Blazing Crescendo's `"your-next-turn"` impulse, which
// outlasts Hugs (the ruling). The extra land drop is Aesi's static.
const ENTER_TEXT =
  "When Hugs enters, exile the top X cards of your library. Until the end of your next turn, you may play those cards.";
const LAND_TEXT = "You may play an additional land on each of your turns.";

export default defineCard({
  name: "Hugs, Grisly Guardian",
  manaCost: "{X}{R}{R}{G}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Badger", "Warrior"],
  power: 5,
  toughness: 5,
  keywords: ["trample"],
  text: `Trample\n${ENTER_TEXT}\n${LAND_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "impulse-exile", amount: "x", duration: "your-next-turn" },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      extraLandsPerTurn: 1,
      text: LAND_TEXT,
    },
  ],
});
