import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

// Only your commanders' colours (`PlayerState.commanderIdentity`), and no
// mana at all without a commander, or with a colourless one (the rulings).
export default defineCard({
  name: "Arcane Signet",
  manaCost: "{2}",
  types: ["artifact"],
  text: "{T}: Add one mana of any color in your commander's color identity.",
  activated: [
    addManaAbility({ mana: "commander-identity", text: "{T}: Add one mana of any color in your commander's color identity." }),
  ],
});
