import { defineCard } from "../define.js";
import { persist } from "../helpers.js";

const COUNTER_TEXT = "{U}, Sacrifice this creature: Counter target noncreature spell.";

export default defineCard({
  name: "Glen Elendra Archmage",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Faerie", "Wizard"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text:
    `Flying\n${COUNTER_TEXT}\n` +
    "Persist (When this creature dies, if it had no -1/-1 counters on it, return it to the battlefield under its owner's control with a -1/-1 counter on it.)",
  activated: [
    {
      cost: { mana: "{U}", tap: false, sacrifice: "self" },
      targets: ["noncreature-spell"],
      effect: { kind: "counter", target: 0 },
      resolve: null,
      text: COUNTER_TEXT,
    },
  ],
  triggered: [persist()],
});
