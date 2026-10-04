import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 6021.

const ATTACK_TEXT = "Whenever equipped creature attacks, put four +1/+1 counters on it.";

export default defineCard({
  name: "Bone Sabres",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${ATTACK_TEXT}\nEquip {3} ({3}: Attach to target creature you control. Equip only as a sorcery.)`,
  triggered: [
    {
      // The attacker is the trigger object (Genji Glove's shape).
      trigger: { on: "attacks", who: "attached" },
      targets: [],
      effect: { kind: "add-counter", target: "trigger-object", counter: "+1/+1", amount: 4 },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  activated: [equip("{3}")],
});
