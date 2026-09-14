import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

export default defineCard({
  name: "Lotus Petal",
  manaCost: "{0}",
  types: ["artifact"],
  text: "{T}, Sacrifice Lotus Petal: Add one mana of any color.",
  activated: [
    addManaAbility({
      mana: "any-color",
      sacrifice: "self",
      text: "{T}, Sacrifice Lotus Petal: Add one mana of any color.",
    }),
  ],
});
