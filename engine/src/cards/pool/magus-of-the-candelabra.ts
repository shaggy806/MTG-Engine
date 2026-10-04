import { defineCard } from "../define.js";

// EDHREC rank 3690. Exactly X targets, X announced first (rule 601.2b–c):
// Curse of the Swine's `any-number` group fixed at X, on an activated
// ability whose group is its only slot (Shigeki, Jukai Visionary's channel).
const TEXT = "{X}, {T}: Untap X target lands.";

export default defineCard({
  name: "Magus of the Candelabra",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 2,
  text: TEXT,
  activated: [
    {
      cost: { mana: "{X}", tap: true },
      targets: [{ kind: "any-number", of: "land", min: "x", max: "x" }],
      effect: { kind: "for-each-target", from: 0, effect: { kind: "untap", target: 0 } },
      resolve: null,
      text: TEXT,
    },
  ],
});
