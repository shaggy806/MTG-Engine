import { defineCard } from "../define.js";
import { firebending } from "../helpers.js";

// #141 in top-commanders.txt.
//
// Two `grantsToGraveyard` statics, both gated to your turn: a non-Lesson
// instant or sorcery gets flashback equal to its own mana cost, a Lesson
// gets flashback {1}. A card with a printed flashback keeps its own.
const SPELLS_TEXT =
  "During your turn, each non-Lesson instant and sorcery card in your graveyard has flashback. " +
  "The flashback cost is equal to that card's mana cost. (You may cast a card from your graveyard " +
  "for its flashback cost. Then exile it.)";
const LESSONS_TEXT = "During your turn, each Lesson card in your graveyard has flashback {1}.";

export default defineCard({
  name: "Iroh, Grand Lotus",
  manaCost: "{3}{G}{U}{R}",
  colors: ["G", "U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Noble", "Ally"],
  power: 5,
  toughness: 5,
  text: `Firebending 2\n${SPELLS_TEXT}\n${LESSONS_TEXT}`,
  triggered: [firebending(2)],
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "your-turn" },
      grantsToGraveyard: {
        filter: { typesAnyOf: ["instant", "sorcery"], notSubtypes: ["Lesson"] },
        flashback: { cost: "mana-cost" },
      },
      text: SPELLS_TEXT,
    },
    {
      affects: { scope: "self" },
      condition: { kind: "your-turn" },
      grantsToGraveyard: { filter: { subtype: "Lesson" }, flashback: { cost: "{1}" } },
      text: LESSONS_TEXT,
    },
  ],
});
