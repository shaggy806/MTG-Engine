import { defineCard } from "../define.js";

// EDHREC rank 6677.
//
// Rulings:
//   The number of Goblins is counted when this ability resolves.
//
// Goblin Rabblemaster's count, two power apiece (`times: 2`): every other
// attacking Goblin, whoever controls it, read as the trigger resolves and
// locked in.

const PUMP_TEXT = "Whenever this creature attacks, it gets +2/+0 until end of turn for each other attacking Goblin.";

export default defineCard({
  name: "Goblin Piledriver",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 1,
  toughness: 2,
  text: `Protection from blue (This creature can't be blocked, targeted, dealt damage, or enchanted by anything blue.)\n${PUMP_TEXT}`,
  static: [{ affects: { scope: "self" }, protection: { colors: ["U"] }, text: "Protection from blue" }],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "modify-pt",
        target: "source",
        power: { countOf: { type: "creature", subtype: "Goblin", attacking: true }, excludeSelf: true, times: 2 },
        toughness: 0,
        duration: "end-of-turn",
      },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
});
