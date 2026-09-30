import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const GRANTED_TEXT = "Whenever this creature deals combat damage to a player, put that many +1/+1 counters on it.";
const STATIC_TEXT = `Equipped creature has trample and "${GRANTED_TEXT}"`;

export default defineCard({
  name: "Power Fist",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${STATIC_TEXT}\nEquip {2}`,
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["trample"],
      grantsTriggered: [
        {
          trigger: { on: "deals-combat-damage-to-player", who: "self" },
          targets: [],
          effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: { triggerValue: true } },
          resolve: null,
          text: GRANTED_TEXT,
        },
      ],
      text: STATIC_TEXT,
    },
  ],
  activated: [equip("{2}")],
});
