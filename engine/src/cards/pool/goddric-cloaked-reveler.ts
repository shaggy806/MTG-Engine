import { defineCard } from "../define.js";

// Celebration reads the turn's history, not the board: two nonland
// permanents that entered under your control this turn count even if they've
// left since (the rulings). "Is a Dragon … (He loses all other creature
// types)" is a layer-4 `setSubtypes`; base 4/4 is layer 7b and flying and the
// granted ability layer 6. Having applied in layer 4, the whole static keeps
// applying if he later loses his abilities (rule 613.6 — still a 4/4 Dragon,
// the ruling), its flying and {R} ability going against that loss in
// timestamp order. The {R} ability pumps only the Dragons there as it
// resolves (the ruling).
const CELEBRATION_TEXT =
  'Celebration — As long as two or more nonland permanents entered the battlefield under your control this turn, Goddric is a Dragon with base power and toughness 4/4, flying, and "{R}: Dragons you control get +1/+0 until end of turn." (He loses all other creature types.)';
const PUMP_TEXT = "{R}: Dragons you control get +1/+0 until end of turn.";

export default defineCard({
  name: "Goddric, Cloaked Reveler",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Noble"],
  power: 3,
  toughness: 3,
  keywords: ["haste"],
  text: `Haste\n${CELEBRATION_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "turn-history", what: "entered", filter: { notTypes: ["land"] }, atLeast: 2 },
      setSubtypes: ["Dragon"],
      setBasePt: { power: 4, toughness: 4 },
      grantKeywords: ["flying"],
      grantsActivated: [
        {
          cost: { mana: "{R}", tap: false },
          targets: [],
          effect: {
            kind: "modify-pt-all",
            filter: { subtype: "Dragon", controlledBy: "you" },
            power: 1,
            toughness: 0,
            duration: "end-of-turn",
          },
          resolve: null,
          text: PUMP_TEXT,
        },
      ],
      text: CELEBRATION_TEXT,
    },
  ],
});
