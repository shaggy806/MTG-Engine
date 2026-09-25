import { defineCard } from "../define.js";

// #334 in top-commanders.txt.
const LANDS_TEXT = "You may play lands from your graveyard.";
const SACRIFICE_TEXT =
  "Whenever you sacrifice another nontoken permanent during your turn, put a number of +1/+1 counters " +
  "equal to Szarel's power on up to one other target creature.";

export default defineCard({
  name: "Szarel, Genesis Shepherd",
  manaCost: "{2}{B}{R}{G}",
  colors: ["B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Insect", "Druid"],
  power: 2,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${LANDS_TEXT}\n${SACRIFICE_TEXT}`,
  static: [{ affects: { scope: "self" }, playFromGraveyard: { type: "land" }, text: LANDS_TEXT }],
  triggered: [
    {
      trigger: { on: "sacrifice", who: "you", otherOnly: true, filter: { token: false } },
      condition: { kind: "your-turn" },
      targets: [{ kind: "optional", of: { kind: "other", of: "creature" } }],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: { powerOf: "source" } },
      resolve: null,
      text: SACRIFICE_TEXT,
    },
  ],
});
