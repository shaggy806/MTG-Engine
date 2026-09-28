import { defineCard } from "../define.js";

const HEXPROOF_TEXT =
  "Creatures you control have hexproof. (They can't be the targets of spells or abilities your opponents control.)";
const REGEN_TEXT = "{1}{G}: Regenerate target creature.";

export default defineCard({
  name: "Asceticism",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${HEXPROOF_TEXT}\n${REGEN_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["hexproof"],
      text: HEXPROOF_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false },
      targets: ["creature"],
      effect: { kind: "regenerate", target: 0 },
      resolve: null,
      text: REGEN_TEXT,
    },
  ],
});
