import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Thought Vessel",
  manaCost: "{2}",
  types: ["artifact"],
  text: "You have no maximum hand size.\n{T}: Add {C}.",
  static: [
    {
      // A fact about the *controller*, not about anything this affects — so
      // the scope is `self` and the cleanup step reads the flag directly.
      affects: { scope: "self" },
      noMaxHandSize: true,
      text: "You have no maximum hand size.",
    },
  ],
  activated: [addManaAbility({ mana: "C", text: "{T}: Add {C}." })],
});
