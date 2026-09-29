import { defineCard } from "../define.js";

const DAMAGE_TEXT =
  "Whenever a creature you control deals combat damage to a player, put a +1/+1 counter on that creature.";
const UNLOCK_TEXT = "Unlock Ability — Creatures you control with +1/+1 counters on them have reach and trample.";

// A creature that blocked thanks to reach keeps blocking if it then loses
// its counters or Sphere Grid leaves (the ruling) — blocks aren't re-checked.
export default defineCard({
  name: "Sphere Grid",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${DAMAGE_TEXT}\n${UNLOCK_TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "add-counter", target: "trigger-object", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", counters: { kind: "+1/+1", compare: { op: "gte", n: 1 } } },
      },
      grantKeywords: ["reach", "trample"],
      text: UNLOCK_TEXT,
    },
  ],
});
