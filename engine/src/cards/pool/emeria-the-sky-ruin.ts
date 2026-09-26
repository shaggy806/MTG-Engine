import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const UPKEEP_TEXT =
  "At the beginning of your upkeep, if you control seven or more Plains, you may return target creature card from your graveyard to the battlefield.";

// An intervening-if (rule 603.4): seven Plains as the upkeep begins, and
// still as it resolves. "You may" is an "up to one" target.
export default defineCard({
  name: "Emeria, the Sky Ruin",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n${UPKEEP_TEXT}\n{T}: Add {W}.`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: { kind: "controls", filter: { subtype: "Plains" }, atLeast: 7 },
      targets: [{ kind: "optional", of: { kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } } }],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
  activated: [manaTapAbility("W")],
});
