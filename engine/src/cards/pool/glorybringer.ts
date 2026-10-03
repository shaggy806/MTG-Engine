import { defineCard } from "../define.js";

const EXERT_TEXT =
  "You may exert this creature as it attacks. When you do, it deals 4 damage to target non-Dragon creature an opponent controls. (An exerted creature won't untap during your next untap step.)";

// Exerting is asked as its attack is declared (rule 508.1g), even with no
// legal target for the "when you do" (the ruling) — which then just doesn't
// go on the stack. The trigger is linked to this exert alone (607.2h).
export default defineCard({
  name: "Glorybringer",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "haste"],
  text: `Flying, haste\n${EXERT_TEXT}`,
  static: [{ affects: { scope: "self" }, exertAsItAttacks: {}, text: EXERT_TEXT }],
  triggered: [
    {
      trigger: { on: "exerted", who: "self", asItAttacks: true },
      targets: [{ kind: "permanent", whose: "opponent", filter: { type: "creature", notSubtypes: ["Dragon"] } }],
      effect: { kind: "damage", target: 0, amount: 4 },
      resolve: null,
      text: EXERT_TEXT,
    },
  ],
});
