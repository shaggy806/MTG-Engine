import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

export default defineCard({
  name: "Decanter of Endless Water",
  manaCost: "{3}",
  types: ["artifact"],
  text: "You have no maximum hand size.\n{T}: Add one mana of any color.",
  static: [
    {
      affects: { scope: "self" },
      noMaxHandSize: true,
      text: "You have no maximum hand size.",
    },
  ],
  activated: [
    addManaAbility({ mana: "any-color", amount: 1, text: "{T}: Add one mana of any color." }),
  ],
});
