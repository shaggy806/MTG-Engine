import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Sol Ring",
  manaCost: "{1}",
  types: ["artifact"],
  text: "{T}: Add {C}{C}.",
  activated: [addManaAbility({ mana: "C", amount: 2, text: "{T}: Add {C}{C}." })],
});
