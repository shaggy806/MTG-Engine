import { CHOSEN_CREATURE_TYPE } from "../helpers.js";
import { defineCard } from "../define.js";

// EDHREC rank 3714. Crippling Fear's choose-then shape over Make a Stand's
// pair of mass effects.
//
// Rulings:
//   [2022-10-07] To choose a creature type, you must choose an existing creature type, such as
//     Vampire or Knight. You can't choose multiple creature types, such as "Vampire Knight." Card
//     types such as artifact can't be chosen, nor can subtypes that aren't creature types, such as
//     Jace, Vehicle, or Treasure.

const YOURS = { type: "creature", controlledBy: "you", subtype: CHOSEN_CREATURE_TYPE } as const;

export default defineCard({
  name: "And They Shall Know No Fear",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Choose a creature type. Creatures you control of the chosen type get +1/+0 and gain indestructible until end of turn.",
  effect: {
    kind: "choose-creature-type",
    then: {
      kind: "sequence",
      effects: [
        { kind: "modify-pt-all", filter: YOURS, power: 1, toughness: 0, duration: "end-of-turn" },
        { kind: "grant-keyword-all", filter: YOURS, keyword: "indestructible", duration: "end-of-turn" },
      ],
    },
  },
});
