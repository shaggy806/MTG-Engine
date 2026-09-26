import { defineCard } from "../define.js";

// Exiling a spell isn't countering it, so a spell that can't be countered
// goes too (the ruling). The free cast needs one opponent to have cast three
// spells this turn, not three opponents one each.
export default defineCard({
  name: "Mindbreak Trap",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  subtypes: ["Trap"],
  text:
    "If an opponent cast three or more spells this turn, you may pay {0} rather than pay this spell's mana cost.\n" +
    "Exile any number of target spells.",
  freeCastIf: { condition: { kind: "turn-stat", stat: "spells-cast", who: "opponent", atLeast: 3 } },
  targets: [{ kind: "any-number", of: "spell" }],
  effect: { kind: "for-each-target", from: 0, effect: { kind: "exile", target: 0 }, simultaneous: true },
});
