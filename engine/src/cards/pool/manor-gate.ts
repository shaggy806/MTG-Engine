import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

// EDHREC rank 2480.
// The thriving-land shape (`thrivingLand`) with a Gate subtype: the colour is
// asked before it moves (rule 614.12), from the four other than green.

export default defineCard({
  name: "Manor Gate",
  colors: [],
  types: ["land"],
  subtypes: ["Gate"],
  text: "This land enters tapped.\nAs this land enters, choose a color other than green.\n{T}: Add {G} or one mana of the chosen color.",
  chooseOnEnter: ["W", "U", "B", "R"],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  activated: [
    manaTapAbility("G"),
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "chosen", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of the chosen color.",
    },
  ],
});
