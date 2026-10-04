import { defineCard } from "../define.js";

// EDHREC rank 3036.
//
// Rulings:
//   [2013-09-15] The activated ability is a mana ability. It doesn't use the stack and can't be
//     responded to.
//   [2013-09-15] Mana symbols in the text boxes of permanents you control don't count toward your
//     devotion to any color.
//   [2013-09-15] Hybrid mana symbols, monocolored hybrid mana symbols, and Phyrexian mana symbols
//     do count toward your devotion to their color(s).
//   [2013-09-15] If an activated ability or triggered ability has an effect that depends on your
//     devotion to a color, you count the number of mana symbols of that color among the mana costs
//     of permanents you control as the ability resolves. The permanent with that ability will be
//     counted if it's still on the battlefield at that time.
//   [2013-09-15] Numeric mana symbols ({0}, {1}, and so on) in mana costs of permanents you
//     control don't count toward your devotion to any color.
//
// Nykthos's `devotionTo` amount, read for a fixed colour (`liveManaAmount`).
const TEXT =
  "{T}: Add an amount of {G} equal to your devotion to green. (Each {G} in the mana costs of permanents you control counts toward your devotion to green.)";

export default defineCard({
  name: "Karametra's Acolyte",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 1,
  toughness: 4,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: { devotionTo: "G" } },
      resolve: null,
      text: TEXT,
    },
  ],
});
