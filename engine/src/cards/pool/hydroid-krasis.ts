import { defineCard } from "../define.js";

const CAST_TEXT = "When you cast this spell, you gain half X life and draw half X cards. Round down each time.";
const ENTER_TEXT = "This creature enters with X +1/+1 counters on it.";

// The cast trigger resolves before the spell, even if it's countered (its
// ruling), and reads the X chosen as it was cast.
export default defineCard({
  name: "Hydroid Krasis",
  manaCost: "{X}{G}{U}",
  colors: ["G", "U"],
  types: ["creature"],
  subtypes: ["Jellyfish", "Hydra", "Beast"],
  power: 0,
  toughness: 0,
  keywords: ["flying", "trample"],
  text: `${CAST_TEXT}\nFlying, trample\n${ENTER_TEXT}`,
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-life", amount: { half: "x", round: "down" } },
          { kind: "draw", amount: { half: "x", round: "down" } },
        ],
      },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: "x" } },
      text: ENTER_TEXT,
    },
  ],
});
