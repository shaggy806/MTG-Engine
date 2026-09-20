import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

export default defineCard({
  name: "Gilded Lotus",
  manaCost: "{5}",
  types: ["artifact"],
  text: "{T}: Add three mana of any one color.",
  activated: [
    addManaAbility({ mana: "any-color", amount: 3, text: "{T}: Add three mana of any one color." }),
  ],
});
