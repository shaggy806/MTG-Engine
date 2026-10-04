import { defineCard } from "../define.js";

// EDHREC rank 4312.
//
// Rulings:
//   [2024-04-12] Desert is a land subtype with no special meaning. It doesn't grant the land an
//     intrinsic mana ability. Other cards may care about which lands are Deserts.
//
// Crossroads Village's shape: the colour is asked as it enters (rule 614.12).

export default defineCard({
  name: "Mirage Mesa",
  colors: [],
  types: ["land"],
  subtypes: ["Desert"],
  text: "This land enters tapped. As it enters, choose a color.\n{T}: Add one mana of the chosen color.",
  chooseOnEnter: ["W", "U", "B", "R", "G"],
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
      effect: { kind: "add-mana", mana: "chosen", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of the chosen color.",
    },
  ],
});
