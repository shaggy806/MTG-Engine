import { defineCard } from "../define.js";

// EDHREC rank 4282.
//
// Rulings:
//   [2024-04-12] A monocolored permanent is exactly one color. Colorless permanents aren't
//     monocolored.
//
// "Monocolored" is exactly one colour: not multicoloured, and at least one
// colour (`anyOf` the five), so a colourless permanent isn't a legal target.
// Both read its current colours.

export default defineCard({
  name: "Vanishing Verse",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  types: ["instant"],
  text: "Exile target monocolored permanent.",
  targets: [
    {
      kind: "permanent",
      filter: {
        multicolored: false,
        anyOf: [{ colors: ["W"] }, { colors: ["U"] }, { colors: ["B"] }, { colors: ["R"] }, { colors: ["G"] }],
      },
    },
  ],
  effect: { kind: "exile", target: 0 },
});
