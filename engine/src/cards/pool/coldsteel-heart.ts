import { defineCard } from "../define.js";

export default defineCard({
  name: "Coldsteel Heart",
  manaCost: "{2}",
  supertypes: ["snow"],
  types: ["artifact"],
  text: "This artifact enters tapped.\nAs this artifact enters, choose a color.\n{T}: Add one mana of the chosen color.",
  chooseOnEnter: ["W", "U", "B", "R", "G"],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This artifact enters tapped.",
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
