import { defineCard } from "../define.js";

// "If you cast it" is read off how it entered. The spell countered is exiled
// rather than put into a graveyard, and "then you may cast it" finds it there
// — a spell that can't be countered stays on the stack, a copy ceases to
// exist, and neither is cast. It's cast by this ability's controller, whoever
// owns it, for free as the ability resolves (rule 608.2g).
const TEXT =
  "When this creature enters, if you cast it, counter target spell. If that spell is countered this way, exile it instead of putting it into its owner's graveyard, then you may cast it without paying its mana cost.";

export default defineCard({
  name: "Transcendent Dragon",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 3,
  keywords: ["flash", "flying"],
  text: `Flash\nFlying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self", filter: { cast: true, castBy: "you" } },
      targets: ["spell"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "counter", target: 0, into: "exile" },
          { kind: "cast-now", target: 0, free: true },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
