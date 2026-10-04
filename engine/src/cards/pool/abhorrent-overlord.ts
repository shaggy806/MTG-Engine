import { defineCard } from "../define.js";

// EDHREC rank 5930.
// Makes Harpy → new token "Harpy Token" (scaffolded).
//
// Rulings:
//   [2013-09-15] Numeric mana symbols ({0}, {1}, and so on) in mana costs of permanents you
//     control don't count toward your devotion to any color.
//   [2013-09-15] Mana symbols in the text boxes of permanents you control don't count toward your
//     devotion to any color.
//   [2013-09-15] Hybrid mana symbols, monocolored hybrid mana symbols, and Phyrexian mana symbols
//     do count toward your devotion to their color(s).
//   [2013-09-15] If an activated ability or triggered ability has an effect that depends on your
//     devotion to a color, you count the number of mana symbols of that color among the mana costs
//     of permanents you control as the ability resolves. The permanent with that ability will be
//     counted if it's still on the battlefield at that time.

export default defineCard({
  name: "Abhorrent Overlord",
  manaCost: "{5}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 6,
  toughness: 6,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, create a number of 1/1 black Harpy creature tokens with flying equal to your devotion to black. (Each {B} in the mana costs of permanents you control counts toward your devotion to black.)\nAt the beginning of your upkeep, sacrifice a creature.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      // Fanatic of Mogis's devotion amount, counted as it resolves (the ruling).
      effect: { kind: "create-token", token: "Harpy Token", count: { devotionTo: "B" } },
      resolve: null,
      text: "When this creature enters, create a number of 1/1 black Harpy creature tokens with flying equal to your devotion to black.",
    },
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "sacrifice", who: "you", filter: { type: "creature" }, count: 1 },
      resolve: null,
      text: "At the beginning of your upkeep, sacrifice a creature.",
    },
  ],
});
