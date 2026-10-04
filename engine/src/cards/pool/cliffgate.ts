import { defineCard } from "../define.js";

// EDHREC rank 3043.
//
// The Thriving lands' shape (`thrivingLand`) with the Gate subtype: the colour
// is asked before it moves (rule 614.12 — `chooseOnEnter`).
export default defineCard({
  name: "Cliffgate",
  colors: [],
  types: ["land"],
  subtypes: ["Gate"],
  text: "This land enters tapped.\nAs this land enters, choose a color other than red.\n{T}: Add {R} or one mana of the chosen color.",
  chooseOnEnter: ["W", "U", "B", "G"],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "{T}: Add {R}.",
    },
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "chosen", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of the chosen color.",
    },
  ],
});
