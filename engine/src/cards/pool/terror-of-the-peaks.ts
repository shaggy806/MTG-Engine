import { defineCard } from "../define.js";

/**
 * The extra 3 life is part of a spell's cost as it's cast (the
 * `targetedBySpellsCost` static, rule 601.2f): paid by an opponent casting a
 * spell that targets it, never for an ability, and a spell that can't pay it
 * can't be cast that way.
 */
const COST_TEXT = "Spells your opponents cast that target this creature cost an additional 3 life to cast.";
const TRIGGER_TEXT =
  "Whenever another creature you control enters, this creature deals damage equal to that " +
  "creature's power to any target.";

export default defineCard({
  name: "Terror of the Peaks",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${COST_TEXT}\n${TRIGGER_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      targetedBySpellsCost: { payLife: 3 },
      text: COST_TEXT,
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
      text: TRIGGER_TEXT,
    },
  ],
});
