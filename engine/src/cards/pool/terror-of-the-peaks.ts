import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

/**
 * The "spells your opponents cast that target this creature cost an additional
 * 3 life" clause is approximated as "Ward—Pay 3 life." (the `ward` helper: the
 * caster chooses to pay 3 life when the trigger resolves, or their spell is
 * countered) — the engine has no cast-time additional-cost hook. Unlike the
 * real card it also reaches abilities, and an unpaid spell is cast and then
 * countered rather than never cast.
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
    {
      ...ward({ payLife: 3 }),
      text: "Spells your opponents cast that target this creature cost an additional 3 life to cast.",
    },
  ],
});
