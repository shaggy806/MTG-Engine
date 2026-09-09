import { defineCard } from "../define.js";

/**
 * The "spells your opponents cast that target this creature cost an additional
 * 3 life" clause is approximated as `ward { payLife: 3 }` (auto-paid at the
 * targeting spell's resolution, or it's countered) — the engine has no
 * cast-time additional-cost hook.
 */
export default defineCard({
  name: "Terror of the Peaks",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 4,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Spells your opponents cast that target this creature cost an additional " +
    "3 life to cast.\n" +
    "Whenever another creature you control enters, this creature deals damage " +
    "equal to that creature's power to any target.",
  static: [
    {
      affects: { scope: "self" },
      ward: { payLife: 3 },
      text: "Spells your opponents cast that target this creature cost an additional 3 life to cast.",
    },
  ],
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        otherOnly: true,
        filter: { type: "creature" },
      },
      targets: ["any-target"],
      effect: { kind: "damage", amount: { triggerValue: true }, target: 0 },
      resolve: null,
      text:
        "Whenever another creature you control enters, this creature deals " +
        "damage equal to that creature's power to any target.",
    },
  ],
});
