import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

export default defineCard({
  name: "Ornithopter of Paradise",
  manaCost: "{2}",
  types: ["artifact", "creature"],
  subtypes: ["Thopter"],
  power: 0,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{T}: Add one mana of any color.",
  activated: [addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." })],
});
