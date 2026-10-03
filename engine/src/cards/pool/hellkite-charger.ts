import { defineCard } from "../define.js";

const ATTACK_TEXT =
  "Whenever this creature attacks, you may pay {5}{R}{R}. If you do, untap all attacking creatures and after this phase, there is an additional combat phase.";

// Paid as the ability resolves (the first ruling); each payment adds its own
// combat phase straight after this one, with no main phase between (the
// third). The untap happens as the ability resolves, not as the new combat
// begins (the fourth).
export default defineCard({
  name: "Hellkite Charger",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 5,
  keywords: ["flying", "haste"],
  text: `Flying, haste\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {5}{R}{R} to untap all attacking creatures and add a combat phase?",
        cost: "{5}{R}{R}",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "untap-all", filter: { type: "creature", attacking: true } },
            { kind: "additional-combat", afterThisPhase: true },
          ],
        },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
