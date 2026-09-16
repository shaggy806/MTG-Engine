import { defineCard } from "../define.js";

export default defineCard({
  name: "Brash Taunter",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin"],
  power: 1,
  toughness: 1,
  keywords: ["indestructible"],
  text:
    "Indestructible\n" +
    "Whenever Brash Taunter is dealt damage, it deals that much damage to target " +
    "opponent.\n" +
    "{2}{R}, {T}: Brash Taunter fights another target creature.",
  triggered: [
    {
      trigger: { on: "dealt-damage", who: "self" },
      targets: ["opponent"],
      effect: { kind: "damage", amount: { triggerValue: true }, target: 0 },
      resolve: null,
      text:
        "Whenever Brash Taunter is dealt damage, it deals that much damage to target " +
        "opponent.",
    },
  ],
  activated: [
    {
      cost: { mana: "{2}{R}", tap: true },
      // "**Another** target creature" — the Taunter can't fight itself.
      targets: [{ kind: "permanent", filter: { type: "creature" } }],
      effect: { kind: "fight", a: "source", b: 0 },
      resolve: null,
      text: "{2}{R}, {T}: Brash Taunter fights another target creature.",
    },
  ],
});
