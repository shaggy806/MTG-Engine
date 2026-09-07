import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

const anyColor = () =>
  addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." });

export default defineCard({
  name: "Chromatic Lantern",
  manaCost: "{3}",
  types: ["artifact"],
  text: "Lands you control have \"{T}: Add one mana of any color.\"\n{T}: Add one mana of any color.",
  activated: [anyColor()],
  static: [
    {
      affects: { scope: "lands-you-control" },
      grantsActivated: [anyColor()],
      text: "Lands you control have \"{T}: Add one mana of any color.\"",
    },
  ],
});
