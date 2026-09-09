import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

export default defineCard({
  name: "Birds of Paradise",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 0,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\n{T}: Add one mana of any color.",
  activated: [
    addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." }),
  ],
});
