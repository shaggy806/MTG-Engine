import { defineCard } from "../define.js";

const MONSTROSITY_TEXT =
  "{X}{X}{G}: Monstrosity X. (If this creature isn't monstrous, put X +1/+1 counters on it and it becomes monstrous.)";
const TOKENS_TEXT = "When this creature becomes monstrous, create X X/X green Hydra creature tokens.";

// The trigger's X is the X its monstrosity ability was activated with (rule
// 701.37c, the ruling) — the `becomes-monstrous` trigger value — however
// many counters it actually got.
export default defineCard({
  name: "Hydra Broodmaster",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Hydra"],
  power: 7,
  toughness: 7,
  text: `${MONSTROSITY_TEXT}\n${TOKENS_TEXT}`,
  activated: [
    {
      cost: { mana: "{X}{X}{G}", tap: false },
      targets: [],
      effect: { kind: "monstrosity", amount: "x" },
      resolve: null,
      text: MONSTROSITY_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "becomes-monstrous", who: "self" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Hydra Token",
        count: { triggerValue: true },
        basePt: { power: { triggerValue: true }, toughness: { triggerValue: true } },
      },
      resolve: null,
      text: TOKENS_TEXT,
    },
  ],
});
