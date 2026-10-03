import { defineCard } from "../define.js";

// Top-commanders rank 199. The rulings this follows: spells cast before
// Stella entered count toward "your second spell" and "three or more"; a card
// played from exile follows its normal timing and costs (a land only as a
// land drop); the copy keeps the original's modes, {X}, division and the
// costs paid for it, isn't cast, and may be given new legal targets.
const IMPULSE_TEXT =
  "Whenever you cast your second spell each turn, exile the top card of your library. Until the end of " +
  "your next turn, you may play that card.";
const COPY_TEXT =
  "{T}: Copy target instant or sorcery spell you control. You may choose new targets for the copy. " +
  "Activate only if you've cast three or more spells this turn.";

export default defineCard({
  name: "Stella Lee, Wild Card",
  manaCost: "{1}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 2,
  toughness: 4,
  text: `${IMPULSE_TEXT}\n${COPY_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", nthEachTurn: 2 },
      targets: [],
      effect: { kind: "impulse-exile", amount: 1, duration: "your-next-turn" },
      resolve: null,
      text: IMPULSE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      condition: { kind: "cast-this-turn", atLeast: 3 },
      targets: [{ kind: "spell", whose: "you", filter: { typesAnyOf: ["instant", "sorcery"] } }],
      effect: { kind: "copy-spell", target: 0, newTargets: true },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
