import { defineCard } from "../define.js";

const CAST_TEXT = "Whenever you cast an artifact spell, investigate.";
const COST_TEXT =
  "Activated abilities of artifacts you control cost {1} less to activate. This effect can't " +
  "reduce the mana in that cost to less than one mana.";

// Only abilities of artifacts on the battlefield (the ruling — cycling isn't
// reduced), mana abilities included: a Signet's {1} stays {1}.
export default defineCard({
  name: "Forensic Gadgeteer",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Vedalken", "Artificer", "Detective"],
  power: 2,
  toughness: 3,
  text:
    `${CAST_TEXT} (Create a Clue token. It's an artifact with "{2}, Sacrifice this token: Draw a card.")\n` +
    COST_TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "artifact" } },
      targets: [],
      effect: { kind: "create-token", token: "Clue Token", count: 1 },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      abilityCostModification: {
        applies: { type: "artifact", controlledBy: "you" },
        reduceGeneric: 1,
        leavesOneMana: true,
      },
      text: COST_TEXT,
    },
  ],
});
