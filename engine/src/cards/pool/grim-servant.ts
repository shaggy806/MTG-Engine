import { defineCard } from "../define.js";

// EDHREC rank 4011.
//
// Rulings:
//   [2024-06-07] If a card in a player's library has {X} in its mana cost, X is 0 when determining
//     that card's mana value.
//   [2024-06-07] Hybrid mana symbols, monocolored hybrid mana symbols, and Phyrexian mana symbols
//     do count toward your devotion to their color(s).
//   [2024-06-07] If you put an Aura on an opponent's permanent, you still control the Aura, and
//     mana symbols in its mana cost count towards your devotion. Similarly, if you make an
//     opponent the protector of a Siege you control, mana symbols in that battle's mana cost count
//     toward your devotion.
//   [2024-06-07] Colorless and generic mana symbols ({C}, {0}, {1}, {2}, {X}, and so on) in mana
//     costs of permanents you control don't count toward your devotion to any color.
//   [2024-06-07] Count the number of black mana symbols among the mana costs of permanents you
//     control as Grim Servant's triggered ability resolves to determine your devotion to black. If
//     Grim Servant is still on the battlefield at that time, it will be included in that count.
//   [2024-06-07] Mana symbols in the text boxes of permanents you control don't count toward your
//     devotion to any color.

// Beseech the Queen's search with Gray Merchant's `devotionTo` as the bound,
// read as the ability resolves.
const TEXT =
  "When this creature enters, search your library for a card with mana value less than or equal to your devotion to black, reveal it, put it into your hand, then shuffle. You lose 3 life. (Each {B} in the mana costs of permanents you control counts toward your devotion to black.)";

export default defineCard({
  name: "Grim Servant",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Warlock"],
  power: 3,
  toughness: 2,
  keywords: ["menace"],
  text: `Menace\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "search-library",
            filter: { manaValue: { op: "lte", n: { amount: { devotionTo: "B" } } } },
            destination: "hand",
            min: 0,
            max: 1,
            reveal: true,
          },
          { kind: "lose-life", amount: 3 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
