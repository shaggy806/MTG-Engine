import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// The colourless basic: no basic land type, so its mana ability is printed
// rather than implied (rule 305.6 covers only the five types).
export default defineCard({
  name: "Wastes",
  supertypes: ["basic"],
  types: ["land"],
  text: "{T}: Add {C}.",
  activated: [addManaAbility({ mana: "C", text: "{T}: Add {C}." })],
});
