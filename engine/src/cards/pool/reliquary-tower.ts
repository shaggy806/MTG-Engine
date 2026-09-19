import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

export default defineCard({
  name: "Reliquary Tower",
  types: ["land"],
  text: "You have no maximum hand size.\n{T}: Add {C}.",
  static: [
    {
      // A fact about the controller rather than about anything this affects
      // — same shape Thought Vessel uses; the cleanup step reads the flag.
      affects: { scope: "self" },
      noMaxHandSize: true,
      text: "You have no maximum hand size.",
    },
  ],
  activated: [addManaAbility({ mana: "C", text: "{T}: Add {C}." })],
});
