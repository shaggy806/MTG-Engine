import { CHOSEN_CREATURE_TYPE } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Crippling Fear",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "Choose a creature type. Creatures that aren't of the chosen type get -3/-3 " +
    "until end of turn.",
  effect: {
    kind: "choose-creature-type",
    then: {
      // "**Creatures** that aren't …" — everyone's, not just yours.
      kind: "modify-pt-all",
      filter: { type: "creature", notSubtypes: [CHOSEN_CREATURE_TYPE] },
      power: -3,
      toughness: -3,
      duration: "end-of-turn",
    },
  },
});
