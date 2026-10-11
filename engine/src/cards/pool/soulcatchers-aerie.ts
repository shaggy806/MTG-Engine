import { defineCard } from "../define.js";

// EDHREC rank 6732.

const DIES_TEXT =
  "Whenever a Bird is put into your graveyard from the battlefield, put a feather counter on this enchantment.";
const PUMP_TEXT = "Bird creatures get +1/+1 for each feather counter on this enchantment.";

// "Your graveyard" is its owner's (Colfenor's Urn's shape): a Bird of yours
// an opponent controlled counts, one of theirs you controlled doesn't. Any
// Bird permanent counts, a Bird token too — it reaches the graveyard before
// it ceases to exist (rule 111.7). The anthem is every player's Bird
// creatures, not only yours.
export default defineCard({
  name: "Soulcatchers' Aerie",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: `${DIES_TEXT}\n${PUMP_TEXT}`,
  triggered: [
    {
      trigger: { on: "dies", who: "any", filter: { subtype: "Bird", ownedBy: "you" } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "feather", amount: 1 },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", subtype: "Bird" } },
      grantPtPerCount: { countersOnSource: "feather", pt: [1, 1] },
      text: PUMP_TEXT,
    },
  ],
});
