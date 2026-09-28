import { defineCard } from "../define.js";
import { myriad } from "../helpers.js";

// Myriad is a triggered ability (rule 702.116a), so "creatures you control
// have myriad" grants the trigger itself; a creature that has it twice (its
// own and this) triggers twice (702.116b).
const TEXT =
  "Creatures you control have myriad. (Whenever a creature with myriad attacks, for each opponent other than defending player, you may create a token copy that's tapped and attacking that player or a planeswalker they control. Exile the tokens at end of combat.)";

export default defineCard({
  name: "Legion Loyalty",
  manaCost: "{6}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: TEXT,
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantsTriggered: [myriad()],
      text: TEXT,
    },
  ],
});
