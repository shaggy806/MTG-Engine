import { defineCard } from "../define.js";
import { CHOSEN_CREATURE_TYPE } from "../helpers.js";

export default defineCard({
  name: "Kindred Dominance",
  manaCost: "{5}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Choose a creature type. Destroy all creatures that aren't of the chosen type.",
  effect: {
    kind: "choose-creature-type",
    then: {
      kind: "destroy-all",
      filter: { type: "creature", notSubtypes: [CHOSEN_CREATURE_TYPE] },
    },
  },
});
