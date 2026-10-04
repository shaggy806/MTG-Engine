import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

// EDHREC rank 3029.
//
// Sea Gate's shape: the colour is chosen before it moves (rule 614.12), and it taps for {W}
// or that colour.

export default defineCard({
  name: "Citadel Gate",
  colors: [],
  types: ["land"],
  subtypes: ["Gate"],
  text: "This land enters tapped.\nAs this land enters, choose a color other than white.\n{T}: Add {W} or one mana of the chosen color.",
  chooseOnEnter: ["U", "B", "R", "G"],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  activated: [
    manaTapAbility("W"),
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "chosen", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of the chosen color.",
    },
  ],
});
