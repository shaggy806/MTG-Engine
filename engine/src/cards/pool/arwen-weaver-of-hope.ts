import { defineCard } from "../define.js";

const TEXT =
  "Each other creature you control enters with a number of additional +1/+1 counters on it equal to Arwen's toughness.";

// Giada's shape: read as each creature enters, never counting one entering
// alongside it (rule 614.12).
export default defineCard({
  name: "Arwen, Weaver of Hope",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Noble"],
  power: 2,
  toughness: 1,
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "others-enter-battlefield",
        filter: { type: "creature", controlledBy: "you" },
        counters: { kind: "+1/+1", amount: { toughnessOf: "source" } },
      },
      text: TEXT,
    },
  ],
});
