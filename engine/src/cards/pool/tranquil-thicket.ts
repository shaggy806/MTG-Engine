import { defineCard } from "../define.js";
import { addManaAbility, entersTappedStatic } from "../helpers.js";

export default defineCard({
  name: "Tranquil Thicket",
  types: ["land"],
  cycling: { cost: "{G}" },
  text:
    "Tranquil Thicket enters the battlefield tapped.\n" +
    "{T}, Sacrifice Tranquil Thicket: Add {G}.\n" +
    "Cycling {G}",
  activated: [
    addManaAbility({
      mana: "G",
      sacrifice: "self",
      text: "{T}, Sacrifice Tranquil Thicket: Add {G}.",
    }),
  ],
  static: [entersTappedStatic("Tranquil Thicket")],
});
