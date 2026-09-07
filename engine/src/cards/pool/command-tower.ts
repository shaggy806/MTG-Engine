import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Command Tower",
  types: ["land"],
  text: "{T}: Add one mana of any color.",
  activated: [
    addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." }),
  ],
});
