import { defineCard } from "../define.js";

// EDHREC rank 5774.
// Makes Human Soldier → use "Human Soldier Token".
//
// Rulings:
//   [2020-01-24] Hybrid mana symbols, monocolored hybrid mana symbols, and Phyrexian mana symbols
//     do count toward your devotion to their color(s).
//   [2020-01-24] If an activated ability or triggered ability has an effect that depends on your
//     devotion to a color, you count the number of mana symbols of that color among the mana costs
//     of permanents you control as the ability resolves. The permanent with that ability will be
//     counted if it’s still on the battlefield at that time.
//   [2020-01-24] If you put an Aura on an opponent’s permanent, you still control the Aura, and
//     mana symbols in its mana cost count towards your devotion.
//   [2020-01-24] Mana symbols in the text boxes of permanents you control don’t count toward your
//     devotion to any color.
//   [2020-01-24] Colorless and generic mana symbols ({C}, {0}, {1}, {2}, {X}, and so on) in mana
//     costs of permanents you control don’t count toward your devotion to any color.

export default defineCard({
  name: "Reverent Hoplite",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 1,
  toughness: 2,
  text: "When this creature enters, create a number of 1/1 white Human Soldier creature tokens equal to your devotion to white. (Each {W} in the mana costs of permanents you control counts toward your devotion to white.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Human Soldier Token", count: { devotionTo: "W" } },
      resolve: null,
      text: "When this creature enters, create a number of 1/1 white Human Soldier creature tokens equal to your devotion to white.",
    },
  ],
});
