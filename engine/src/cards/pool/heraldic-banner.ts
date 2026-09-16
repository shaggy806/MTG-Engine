import { defineCard } from "../define.js";

export default defineCard({
  name: "Heraldic Banner",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text:
    "As this artifact enters, choose a color.\n" +
    "Creatures you control of the chosen color get +1/+0.\n" +
    "{T}: Add one mana of the chosen color.",
  chooseOnEnter: ["W", "U", "B", "R", "G"],
  static: [
    {
      affects: { scope: "creatures-you-control", chosenColorOnly: true },
      grantPt: [1, 0],
      text: "Creatures you control of the chosen color get +1/+0.",
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
