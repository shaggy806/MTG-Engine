import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

// EDHREC rank 2557.
//
// A Thriving land's shape (`thrivingLand`) with the Gate subtype: the colour
// is chosen before it moves (rule 614.12), and it taps for {B} or that colour.

export default defineCard({
  name: "Black Dragon Gate",
  colors: [],
  types: ["land"],
  subtypes: ["Gate"],
  text: "This land enters tapped.\nAs this land enters, choose a color other than black.\n{T}: Add {B} or one mana of the chosen color.",
  chooseOnEnter: ["W", "U", "R", "G"],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  activated: [
    manaTapAbility("B"),
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "chosen", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of the chosen color.",
    },
  ],
});
