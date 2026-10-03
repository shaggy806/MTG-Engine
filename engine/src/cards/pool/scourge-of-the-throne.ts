import { defineCard } from "../define.js";
import { dethrone } from "../helpers.js";

// Dethrone (rule 702.105a) checks only as it triggers; the second ability's
// "if it's attacking the player with the most life or tied for most life"
// is an intervening if, asked again as it resolves (rule 603.4 — the
// ruling). Neither fires on attacking a planeswalker. "The first time each
// turn" is the first combat it's declared an attacker in, so the extra
// combat it adds doesn't fire it again.
const DETHRONE_TEXT =
  "Dethrone (Whenever this creature attacks the player with the most life or tied for most life, put a +1/+1 counter on it.)";
const ATTACK_TEXT =
  "Whenever this creature attacks for the first time each turn, if it's attacking the player with the most life or tied for most life, untap all attacking creatures. After this phase, there is an additional combat phase.";

export default defineCard({
  name: "Scourge of the Throne",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${DETHRONE_TEXT}\n${ATTACK_TEXT}`,
  triggered: [
    dethrone(),
    {
      trigger: { on: "attacks", who: "self", firstTimeEachTurn: true, defenderLife: "most-still-attacking" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "untap-all", filter: { type: "creature", attacking: true } },
          { kind: "additional-combat", afterThisPhase: true },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
