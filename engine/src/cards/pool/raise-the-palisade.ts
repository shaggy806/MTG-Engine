import { defineCard } from "../define.js";
import { CHOSEN_CREATURE_TYPE } from "../helpers.js";

// A changeling is of every creature type, the chosen one included, so it
// stays.
export default defineCard({
  name: "Raise the Palisade",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Choose a creature type. Return all creatures that aren't of the chosen type to their owners' hands.",
  effect: {
    kind: "choose-creature-type",
    then: {
      kind: "return-to-hand-all",
      filter: { type: "creature", notSubtypes: [CHOSEN_CREATURE_TYPE] },
    },
  },
});
