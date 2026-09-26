import { defineCard } from "../define.js";

// #439 in top-commanders.txt.
//
// The spells asked about are read as they were cast: their mana values count
// the {X} chosen for them (rule 202.3e), and an Adventure cast as its instant
// half was an instant spell. The Elemental is X/X as it's made, its X read
// as the ability resolves.
const COMBAT_TEXT =
  "At the beginning of combat on your turn, if you've cast an instant or sorcery spell this turn, create an X/X " +
  "blue and red Elemental creature token with flying and haste, where X is the greatest mana value among instant " +
  "and sorcery spells you've cast this turn.";

const INSTANT_OR_SORCERY = { typesAnyOf: ["instant", "sorcery"] } as const;

export default defineCard({
  name: "Rootha, Mastering the Moment",
  manaCost: "{2}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Orc", "Sorcerer"],
  power: 3,
  toughness: 4,
  text: COMBAT_TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      condition: { kind: "cast-this-turn", filter: INSTANT_OR_SORCERY },
      targets: [],
      effect: {
        kind: "create-token",
        token: "X/X Elemental Token (Flying, Haste)",
        count: 1,
        basePt: {
          power: { castThisTurn: INSTANT_OR_SORCERY, greatest: "mana-value" },
          toughness: { castThisTurn: INSTANT_OR_SORCERY, greatest: "mana-value" },
        },
      },
      resolve: null,
      text: COMBAT_TEXT,
    },
  ],
});
