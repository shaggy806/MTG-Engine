import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

export default defineCard({
  name: "Darksteel Citadel",
  types: ["artifact", "land"],
  keywords: ["indestructible"],
  text: "Indestructible\n{T}: Add {C}.",
  activated: [addManaAbility({ mana: "C", text: "{T}: Add {C}." })],
});
