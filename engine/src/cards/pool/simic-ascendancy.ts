import { defineCard } from "../define.js";

const PUMP = "{1}{G}{U}: Put a +1/+1 counter on target creature you control.";
const GROW =
  "Whenever one or more +1/+1 counters are put on a creature you control, put that many growth counters on this enchantment.";
const UPKEEP =
  "At the beginning of your upkeep, if this enchantment has twenty or more growth counters on it, you win the game.";

// "That many" is the trigger's value, once per creature per placement. The
// upkeep ability is an intervening-if (rule 603.4): twenty as the upkeep
// begins and again as it resolves — read as it last existed if it has left
// the battlefield since (the ruling), and lost if counters came off it.
export default defineCard({
  name: "Simic Ascendancy",
  manaCost: "{G}{U}",
  colors: ["U", "G"],
  types: ["enchantment"],
  text: `${PUMP}\n${GROW}\n${UPKEEP}`,
  activated: [
    {
      cost: { mana: "{1}{G}{U}", tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: PUMP,
    },
  ],
  triggered: [
    {
      trigger: { on: "counters-put", who: "you-control", filter: { type: "creature" }, counter: "+1/+1" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "growth", amount: { triggerValue: true } },
      resolve: null,
      text: GROW,
    },
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: { kind: "self-counters", counter: "growth", compare: { op: "gte", n: 20 } },
      targets: [],
      effect: { kind: "win-game" },
      resolve: null,
      text: UPKEEP,
    },
  ],
});
