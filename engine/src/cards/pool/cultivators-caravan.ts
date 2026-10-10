import { defineCard } from "../define.js";
import { crew, crewText } from "../helpers.js";

// EDHREC rank 2945. A crewed Caravan that came under your control this turn
// can't tap for mana: the {T} of a creature's own ability (rule 302.6).
const MANA = "{T}: Add one mana of any color.";

export default defineCard({
  name: "Cultivator's Caravan",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Vehicle"],
  power: 5,
  toughness: 5,
  text: `${MANA}\n${crewText(3)}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: MANA,
    },
    crew(3, crewText(3)),
  ],
});
