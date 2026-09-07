import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Arcane Signet",
  manaCost: "{2}",
  types: ["artifact"],
  text: "{T}: Add one mana of any color.",
  activated: [
    addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." }),
  ],
});
