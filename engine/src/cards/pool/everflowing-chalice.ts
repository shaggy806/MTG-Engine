import { defineCard } from "../define.js";

const ENTER_TEXT = "This artifact enters with a charge counter on it for each time it was kicked.";
const MANA_TEXT = "{T}: Add {C} for each charge counter on this artifact.";

// Multikicker (rule 702.33c): offered once per number of times it can be
// kicked; the count rides the spell onto the battlefield
// (`GameObject.enteredTimesKicked`). Put onto the battlefield without being
// cast, it was never kicked and enters with no counters (the rulings).
export default defineCard({
  name: "Everflowing Chalice",
  manaCost: "{0}",
  colors: [],
  types: ["artifact"],
  text: `Multikicker {2} (You may pay an additional {2} any number of times as you cast this spell.)\n${ENTER_TEXT}\n${MANA_TEXT}`,
  kicker: { cost: "{2}", multi: true },
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "charge", amount: "times-kicked" } },
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: { countersOn: "source", counter: "charge" } },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
