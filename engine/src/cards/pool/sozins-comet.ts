import { defineCard } from "../define.js";
import { firebending } from "../helpers.js";

// EDHREC rank 3644.
//
// Rulings (abridged):
//   [2025-10-02] Mana from firebending abilities isn't lost until you leave combat and go to your
//     second main phase.
//   [2025-10-02] Multiple instances of firebending on the same creature trigger separately, each
//     granting you the appropriate amount of mana.
//   [2025-10-02] Firebending abilities aren't mana abilities. They use the stack and can be
//     responded to.
//
// Fire Nation Palace's grant, in Azlask's mass form: the creatures are the
// ones you control as it resolves (rule 611.2c), each gaining its own
// firebending 5 until end of turn.

const GRANT_TEXT =
  "Each creature you control gains firebending 5 until end of turn. (Whenever it attacks, add {R}{R}{R}{R}{R}. This mana lasts until end of combat.)";

export default defineCard({
  name: "Sozin's Comet",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: `${GRANT_TEXT}\nForetell {2}{R} (During your turn, you may pay {2} and exile this card from your hand face down. Cast it on a later turn for its foretell cost.)`,
  effect: {
    kind: "grant-triggered-all",
    filter: { type: "creature", controlledBy: "you" },
    ability: firebending(5),
    duration: "end-of-turn",
  },
  foretell: { cost: "{2}{R}" },
});
