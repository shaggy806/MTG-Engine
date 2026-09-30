import { defineCard } from "../define.js";

const ADAPT_TEXT = "{1}{G}: Adapt 1. (If this creature has no +1/+1 counters on it, put a +1/+1 counter on it.)";
const SPAWN_TEXT =
  'Whenever one or more +1/+1 counters are put on this creature, you may create a 0/1 colorless Eldrazi Spawn creature token with "Sacrifice this token: Add {C}."';

// Devoid: colorless for all its green mana cost.
export default defineCard({
  name: "Basking Broodscale",
  manaCost: "{1}{G}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi", "Lizard"],
  power: 2,
  toughness: 2,
  text: `Devoid (This card has no color.)\n${ADAPT_TEXT}\n${SPAWN_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "source", filter: { counters: { kind: "+1/+1", compare: { op: "eq", n: 0 } } } },
        then: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      },
      resolve: null,
      text: ADAPT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "counters-put", who: "self", counter: "+1/+1" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Create a 0/1 Eldrazi Spawn token?",
        effect: { kind: "create-token", token: "Eldrazi Spawn Token", count: 1 },
      },
      resolve: null,
      text: SPAWN_TEXT,
    },
  ],
});
