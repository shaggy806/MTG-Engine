import { defineCard } from "../define.js";

// EDHREC rank 2846.

export default defineCard({
  name: "Transcendent Envoy",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment", "creature"],
  subtypes: ["Griffin"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nAura spells you cast cost {1} less to cast.",
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { subtypes: ["Aura"] }, caster: "you", reduceGeneric: 1 },
      text: "Aura spells you cast cost {1} less to cast.",
    },
  ],
});
