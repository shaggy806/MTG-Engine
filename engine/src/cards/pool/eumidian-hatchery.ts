import { defineCard } from "../define.js";

const MANA_TEXT = "{T}, Pay 1 life: Add {B}. Put a hatchling counter on this land.";
const DIES_TEXT =
  "When this land is put into a graveyard from the battlefield, for each hatchling counter on it, create a 1/1 black Insect creature token with flying.";

// The counter rides on the mana ability (rule 605.1a), so it's put on off the
// stack, even while paying for a spell. The leave trigger counts the
// hatchling counters the land had as it left.
export default defineCard({
  name: "Eumidian Hatchery",
  types: ["land"],
  text: `${MANA_TEXT}\n${DIES_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true, payLife: 1 },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "B",
        amount: 1,
        also: { kind: "add-counter", target: "source", counter: "hatchling", amount: 1 },
      },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Insect Token (Black, Flying)",
        count: { countersOn: "source", counter: "hatchling" },
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
