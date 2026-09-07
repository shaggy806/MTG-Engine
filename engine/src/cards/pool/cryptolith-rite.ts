import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Cryptolith Rite",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: "Creatures you control have \"{T}: Add one mana of any color.\"",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantsActivated: [
        addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." }),
      ],
      text: "Creatures you control have \"{T}: Add one mana of any color.\"",
    },
  ],
});
