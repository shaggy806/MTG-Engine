import { defineCard } from "../define.js";
import { crew } from "../helpers.js";

// EDHREC rank 2492. With no land in the library, every card is revealed and
// all of them go to the bottom.
const REVEAL =
  "Whenever The Regalia attacks, reveal cards from the top of your library until you reveal a land card. Put that card onto the battlefield tapped and the rest on the bottom of your library in a random order.";

export default defineCard({
  name: "The Regalia",
  manaCost: "{4}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Vehicle"],
  power: 4,
  toughness: 4,
  keywords: ["haste"],
  text: `Haste\n${REVEAL}\nCrew 1`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "reveal-until", filter: { type: "land" }, put: "battlefield", tapped: true, rest: "bottom-random" },
      resolve: null,
      text: REVEAL,
    },
  ],
  activated: [crew(1)],
});
