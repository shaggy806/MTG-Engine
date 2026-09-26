import { defineCard } from "../define.js";

export default defineCard({
  name: "Unwind",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target noncreature spell. Untap up to three lands.",
  targets: ["noncreature-spell"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "counter", target: 0 },
      {
        kind: "choose-permanents",
        filter: { type: "land" },
        upTo: 3,
        then: { kind: "untap", target: 0 },
        prompt: "Untap up to three lands",
      },
    ],
  },
});
