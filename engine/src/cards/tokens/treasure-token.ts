import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Treasure Token",
  art: "21210145-8edd-41f5-9a64-9f0b5be79864",
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
