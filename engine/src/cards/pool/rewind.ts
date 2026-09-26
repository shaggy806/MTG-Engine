import { defineCard } from "../define.js";

// Only the spell is a target; the lands are chosen as it resolves, each one
// untapped once. A spell that's gone by then takes the untap with it — the
// whole thing fizzles (the rulings).
export default defineCard({
  name: "Rewind",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target spell. Untap up to four lands.",
  targets: ["spell"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "counter", target: 0 },
      {
        kind: "choose-permanents",
        filter: { type: "land" },
        upTo: 4,
        then: { kind: "untap", target: 0 },
        prompt: "Untap up to four lands",
      },
    ],
  },
});
