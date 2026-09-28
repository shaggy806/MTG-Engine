import { defineCard } from "../define.js";
import { myriad } from "../helpers.js";

// Devoid (rule 702.114): no colours, whatever its mana cost says.
const LEAVE_TEXT =
  "When this creature leaves the battlefield, create a 0/1 colorless Eldrazi Spawn creature token with \"Sacrifice this token: Add {C}.\"";

export default defineCard({
  name: "Chittering Dispatcher",
  manaCost: "{2}{G}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi", "Drone"],
  power: 2,
  toughness: 3,
  text: `Devoid (This card has no color.)\nMyriad\n${LEAVE_TEXT}`,
  triggered: [
    myriad(),
    {
      trigger: { on: "leaves-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Eldrazi Spawn Token", count: 1 },
      resolve: null,
      text: LEAVE_TEXT,
    },
  ],
});
