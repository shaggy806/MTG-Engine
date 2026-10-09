import { defineCard } from "../define.js";

// EDHREC rank 4160. Back face: Avatar Roku (avatar-roku.ts).
//
// Rulings:
//   [2025-10-02] If you are instructed to put a card that isn't a double-faced card onto the
//     battlefield transformed, it will not enter the battlefield at all. In that case, it stays in
//     the zone it was previously in. For example, if a single-faced card is a copy of The Legend of
//     Roku, the chapter III ability will cause it to be exiled and then remain in exile.
//   [2025-10-02] You pay all costs and follow all timing rules for cards played from exile using
//     The Legend of Roku's first chapter ability. For example, if one of the exiled cards is a land
//     card, you may play it only during your main phase while the stack is empty. You may play
//     those exiled cards even if you no longer control The Legend of Roku.
//
// Chapter III is Jugan Defends the Temple's: it comes back as a new object
// that isn't a Saga — and a copy that isn't double-faced stays in exile
// (rule 712.14a, `moveObject`).
const CHAPTER_I =
  "I — Exile the top three cards of your library. Until the end of your next turn, you may play those cards.";
const CHAPTER_II = "II — Add one mana of any color.";
const CHAPTER_III = "III — Exile this Saga, then return it to the battlefield transformed under your control.";

export default defineCard({
  name: "The Legend of Roku",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Saga"],
  text: `(As this Saga enters and after your draw step, add a lore counter.)\n${CHAPTER_I}\n${CHAPTER_II}\n${CHAPTER_III}`,
  faces: ["The Legend of Roku", "Avatar Roku"],
  transform: true,
  chapters: [
    {
      at: [1],
      targets: [],
      effect: { kind: "impulse-exile", amount: 3, duration: "your-next-turn" },
      resolve: null,
      text: CHAPTER_I,
    },
    {
      at: [2],
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: CHAPTER_II,
    },
    {
      at: [3],
      targets: [],
      effect: { kind: "flicker", target: "source", transformed: true, underYourControl: true },
      resolve: null,
      text: CHAPTER_III,
    },
  ],
});
