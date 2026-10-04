import { defineCard } from "../define.js";
import { firebending } from "../helpers.js";

// EDHREC rank 3177.
//
// Rulings:
//   [2025-10-02] Firebending abilities aren't mana abilities. They use the stack and can be
//     responded to.
//   [2025-10-02] Mana from firebending abilities isn't lost until you leave combat and go to your
//     second main phase.

const PROWESS_TEXT =
  "Prowess (Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn.)";
const FIREBENDING_TEXT =
  "Firebending X, where X is this creature's power. (Whenever this creature attacks, add X {R}. This mana lasts until end of combat.)";

export default defineCard({
  name: "Firebending Student",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Monk"],
  power: 1,
  toughness: 2,
  text: `${PROWESS_TEXT}\n${FIREBENDING_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: PROWESS_TEXT,
    },
    firebending({ powerOf: "source" }, FIREBENDING_TEXT),
  ],
});
