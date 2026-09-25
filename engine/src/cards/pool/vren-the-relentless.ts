import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// - "Would die, exile it instead" is the dies-only graveyard replacement, so
//   a discard or a mill still goes to the graveyard (2024-07-26 ruling).
// - Vren leaving at the same time as an opponent's creatures that would die
//   still exiles them (ruling): the victims of one event leave together.
// - X counts every creature exiled from under an opponent's control this
//   turn, tokens included (ruling), by whatever means.
const WARD_TEXT = "Ward {2}";
const EXILE_TEXT = "If a creature an opponent controls would die, exile it instead.";
const RATS_TEXT =
  'At the beginning of each end step, create X 1/1 black Rat creature tokens with "This token gets ' +
  '+1/+1 for each other Rat you control," where X is the number of creatures that were exiled under ' +
  "your opponents' control this turn.";

export default defineCard({
  name: "Vren, the Relentless",
  manaCost: "{2}{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Rat", "Rogue"],
  power: 3,
  toughness: 4,
  text: `${WARD_TEXT}\n${EXILE_TEXT}\n${RATS_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "would-be-put-into-graveyard",
        instead: "exile",
        from: "battlefield",
        filter: { type: "creature", controlledBy: "opponent" },
      },
      text: EXILE_TEXT,
    },
  ],
  triggered: [
    ward({ mana: "{2}" }),
    {
      trigger: { on: "step-begins", step: "end", who: "any" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Rat Token (Vren)",
        count: { turnHistory: "exiled", who: "each-opponent", filter: { type: "creature" } },
      },
      resolve: null,
      text: RATS_TEXT,
    },
  ],
});
