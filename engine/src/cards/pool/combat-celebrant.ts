import { defineCard } from "../define.js";

const EXERT_TEXT =
  "If this creature hasn't been exerted this turn, you may exert it as it attacks. When you do, untap all other creatures you control and after this phase, there is an additional combat phase. (An exerted creature won't untap during your next untap step.)";

export default defineCard({
  name: "Combat Celebrant",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 4,
  toughness: 1,
  text: EXERT_TEXT,
  static: [{ affects: { scope: "self" }, exertAsItAttacks: { unlessExertedThisTurn: true }, text: EXERT_TEXT }],
  triggered: [
    {
      trigger: { on: "exerted", who: "self", asItAttacks: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "untap-all", filter: { type: "creature", controlledBy: "you" }, exceptSource: true },
          { kind: "additional-combat", afterThisPhase: true },
        ],
      },
      resolve: null,
      text: EXERT_TEXT,
    },
  ],
});
