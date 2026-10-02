import { defineCard } from "../define.js";
import { addManaAbility, entersTappedStatic } from "../helpers.js";

export default defineCard({
  name: "Tranquil Thicket",
  types: ["land"],
  cycling: { cost: "{G}" },
  text:
    "Tranquil Thicket enters tapped.\n" +
    "{T}: Add {G}.\n" +
    "Cycling {G}",
  activated: [
    addManaAbility({ mana: "G", text: "{T}: Add {G}." }),
  ],
  static: [entersTappedStatic("Tranquil Thicket")],
});
