import { defineCard } from "../define.js";
import { crew } from "../helpers.js";

// EDHREC rank 6596. Its {T} abilities are a noncreature artifact's until it
// becomes a creature; crewed or energised one it came under your control
// this turn, it can't use them (rule 302.6).
const ENERGY = "{T}: You get {E}{E} (two energy counters).";
const TAP = "{T}, Pay {E}{E}: Tap target creature.";
const DRAW = "{T}, Pay {E}{E}{E}: Draw a card.";
const ANIMATE = "Pay {E}{E}{E}{E}: This Vehicle becomes an artifact creature until end of turn.";

export default defineCard({
  name: "Bespoke Battlewagon",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["artifact"],
  subtypes: ["Vehicle"],
  power: 5,
  toughness: 6,
  text: `${ENERGY}\n${TAP}\n${DRAW}\n${ANIMATE}\nCrew 4`,
  activated: [
    { cost: { mana: null, tap: true }, targets: [], effect: { kind: "get-energy", amount: 2 }, resolve: null, text: ENERGY },
    {
      cost: { mana: null, tap: true, payEnergy: 2 },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: TAP,
    },
    {
      cost: { mana: null, tap: true, payEnergy: 3 },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW,
    },
    {
      cost: { mana: null, tap: false, payEnergy: 4 },
      targets: [],
      effect: { kind: "add-types", target: "source", addTypes: ["artifact", "creature"], duration: "end-of-turn" },
      resolve: null,
      text: ANIMATE,
    },
    crew(4),
  ],
});
