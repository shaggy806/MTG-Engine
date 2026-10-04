import { defineCard } from "../define.js";

// EDHREC rank 4408.
//
// Rulings:
//   [2010-03-01] The last ability counts the total number of +1/+1 counters on Joraga Warcaller,
//     not just the ones placed on it as a result of its "enters" ability.

const ENTER_TEXT = "This creature enters with a +1/+1 counter on it for each time it was kicked.";
const LORD_TEXT = "Other Elf creatures you control get +1/+1 for each +1/+1 counter on this creature.";

export default defineCard({
  name: "Joraga Warcaller",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 1,
  toughness: 1,
  text: `Multikicker {1}{G} (You may pay an additional {1}{G} any number of times as you cast this spell.)\n${ENTER_TEXT}\n${LORD_TEXT}`,
  kicker: { cost: "{1}{G}", multi: true },
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: "times-kicked" } },
      text: ENTER_TEXT,
    },
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", subtype: "Elf", controlledBy: "you" },
        excludeSelf: true,
      },
      grantPtPerCount: { countersOnSource: "+1/+1", pt: [1, 1] },
      text: LORD_TEXT,
    },
  ],
});
