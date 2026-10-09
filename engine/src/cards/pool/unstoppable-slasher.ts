import { defineCard } from "../define.js";

// EDHREC rank 1552. "If it had no counters on it" is read from the creature
// as it last existed (rule 603.10a — persist's `self-counters`, any kind);
// the stun counters it comes back with each replace an untap (rule 122.1d).
const HALVE = "Whenever this creature deals combat damage to a player, they lose half their life, rounded up.";
const RETURN =
  "When this creature dies, if it had no counters on it, return it to the battlefield tapped under its owner's control with two stun counters on it.";

export default defineCard({
  name: "Unstoppable Slasher",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Assassin"],
  power: 2,
  toughness: 3,
  keywords: ["deathtouch"],
  text: `Deathtouch\n${HALVE}\n${RETURN}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "lose-life", who: "trigger-player", amount: { half: { lifeTotal: "each" }, round: "up" } },
      resolve: null,
      text: HALVE,
    },
    {
      trigger: { on: "dies", who: "self" },
      condition: { kind: "self-counters", compare: { op: "eq", n: 0 } },
      targets: [],
      effect: {
        kind: "put-onto-battlefield",
        target: "trigger-object",
        enterTapped: true,
        withCounters: { kind: "stun", amount: 2 },
      },
      resolve: null,
      text: RETURN,
    },
  ],
});
