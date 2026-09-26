import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const ATTACK_TEXT =
  "Whenever equipped creature attacks, it deals damage equal to its power to the player or planeswalker it's attacking.";

// The creature deals it even if Mage Slayer has left or moved on by then
// (the ruling); one removed from combat since isn't attacking anything.
export default defineCard({
  name: "Mage Slayer",
  manaCost: "{1}{R}{G}",
  colors: ["R", "G"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${ATTACK_TEXT}\nEquip {3}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "attached" },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "trigger-object", filter: { attacking: true } },
        then: {
          kind: "damage",
          amount: { powerOf: "trigger-object" },
          toTriggerRecipient: true,
          from: "trigger-object",
        },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  activated: [equip("{3}")],
});
