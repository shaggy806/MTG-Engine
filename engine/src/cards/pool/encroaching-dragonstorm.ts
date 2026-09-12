import { defineCard } from "../define.js";

// needed-cards P16. New: "return-to-hand" target widened to EffectTargetRef
// so it can bounce the effect's own source, untargeted, instead of always
// needing a target. The search is already-shipped vocab.
export default defineCard({
  name: "Encroaching Dragonstorm",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text:
    "When this enchantment enters, search your library for up to two basic land cards, " +
    "put them onto the battlefield tapped, then shuffle.\n" +
    "When a Dragon you control enters, return this enchantment to its owner's hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "land", supertype: "basic" },
        destination: "battlefield",
        min: 0,
        max: 2,
        enterTapped: true,
      },
      resolve: null,
      text:
        "When this enchantment enters, search your library for up to two basic land cards, " +
        "put them onto the battlefield tapped, then shuffle.",
    },
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtype: "Dragon" },
      },
      targets: [],
      effect: { kind: "return-to-hand", target: "source" },
      resolve: null,
      text: "When a Dragon you control enters, return this enchantment to its owner's hand.",
    },
  ],
});
