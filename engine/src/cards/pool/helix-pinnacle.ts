import { defineCard } from "../define.js";

const TOWER = "{X}: Put X tower counters on this enchantment.";
const UPKEEP =
  "At the beginning of your upkeep, if there are 100 or more tower counters on this enchantment, you win the game.";

// An intervening-if (rule 603.4): a hundred as the upkeep begins and again as
// it resolves, read as it last existed if it has left the battlefield since
// (the rulings).
export default defineCard({
  name: "Helix Pinnacle",
  manaCost: "{G}",
  colors: ["G"],
  types: ["enchantment"],
  keywords: ["shroud"],
  text: `Shroud (This enchantment can't be the target of spells or abilities.)\n${TOWER}\n${UPKEEP}`,
  activated: [
    {
      cost: { mana: "{X}", tap: false },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "tower", amount: "x" },
      resolve: null,
      text: TOWER,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: { kind: "self-counters", counter: "tower", compare: { op: "gte", n: 100 } },
      targets: [],
      effect: { kind: "win-game" },
      resolve: null,
      text: UPKEEP,
    },
  ],
});
