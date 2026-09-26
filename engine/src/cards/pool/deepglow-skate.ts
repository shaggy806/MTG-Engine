import { defineCard } from "../define.js";

const TEXT = "When this creature enters, double the number of each kind of counter on any number of target permanents.";

export default defineCard({
  name: "Deepglow Skate",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Fish"],
  power: 3,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "any-number", of: "permanent" }],
      effect: { kind: "for-each-target", from: 0, effect: { kind: "double-counters", target: 0 } },
      resolve: null,
      text: TEXT,
    },
  ],
});
