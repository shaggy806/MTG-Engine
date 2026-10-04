import { defineCard } from "../define.js";

// EDHREC rank 3836.
//
// Rulings:
//   [2013-09-15] Hybrid mana symbols, monocolored hybrid mana symbols, and Phyrexian mana symbols
//     do count toward your devotion to their color(s).
//   [2013-09-15] Mana symbols in the text boxes of permanents you control don't count toward your
//     devotion to any color.
//   [2013-09-15] Numeric mana symbols ({0}, {1}, and so on) in mana costs of permanents you
//     control don't count toward your devotion to any color.
//   [2013-09-15] If an activated ability or triggered ability has an effect that depends on your
//     devotion to a color, you count the number of mana symbols of that color among the mana costs
//     of permanents you control as the ability resolves. The permanent with that ability will be
//     counted if it's still on the battlefield at that time.

export default defineCard({
  name: "Fanatic of Mogis",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Minotaur", "Shaman"],
  power: 4,
  toughness: 2,
  text: "When this creature enters, it deals damage to each opponent equal to your devotion to red. (Each {R} in the mana costs of permanents you control counts toward your devotion to red.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "damage", amount: { devotionTo: "R" }, who: "each-opponent" },
      resolve: null,
      text: "When this creature enters, it deals damage to each opponent equal to your devotion to red.",
    },
  ],
});
