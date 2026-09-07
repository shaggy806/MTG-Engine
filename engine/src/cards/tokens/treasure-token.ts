import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Treasure Token",
  types: ["artifact"],
  subtypes: ["Treasure"],
  text: "{T}, Sacrifice this artifact: Add one mana of any color.",
  activated: [
    addManaAbility({
      mana: "any-color",
      sacrifice: "self",
      text: "{T}, Sacrifice this artifact: Add one mana of any color.",
    }),
  ],
});
