import { CHOSEN_CREATURE_TYPE } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Distant Melody",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text:
    "Choose a creature type. Draw a card for each permanent you control of that " +
    "type.",
  effect: {
    kind: "choose-creature-type",
    then: {
      kind: "draw",
      // "Each **permanent**", not creature — a tribal or type-changed
      // non-creature permanent of the type counts too.
      amount: { countOf: { controlledBy: "you", subtype: CHOSEN_CREATURE_TYPE } },
    },
  },
});
