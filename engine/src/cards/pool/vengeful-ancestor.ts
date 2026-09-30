import { defineCard } from "../define.js";

const GOAD_TEXT =
  "Whenever this creature enters or attacks, goad target creature. (Until your next turn, that creature attacks each combat if able and attacks a player other than you if able.)";
const PING_TEXT = "Whenever a goaded creature attacks, it deals 1 damage to its controller.";

// Goaded by anyone counts. The attacker is the source of the damage, so its
// own lifelink or deathtouch applies.
export default defineCard({
  name: "Vengeful Ancestor",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Spirit", "Dragon"],
  power: 3,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${GOAD_TEXT}\n${PING_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "goad", target: 0 },
      resolve: null,
      text: GOAD_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["creature"],
      effect: { kind: "goad", target: 0 },
      resolve: null,
      text: GOAD_TEXT,
    },
    {
      trigger: { on: "attacks", who: "any", filter: { type: "creature", goaded: true } },
      targets: [],
      effect: { kind: "damage", amount: 1, from: "trigger-object", who: "trigger-controller" },
      resolve: null,
      text: PING_TEXT,
    },
  ],
});
