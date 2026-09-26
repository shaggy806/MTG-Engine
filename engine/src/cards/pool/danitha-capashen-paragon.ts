import { defineCard } from "../define.js";

export default defineCard({
  name: "Danitha Capashen, Paragon",
  manaCost: "{2}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 2,
  toughness: 2,
  keywords: ["first-strike", "vigilance", "lifelink"],
  text: "First strike, vigilance, lifelink\nAura and Equipment spells you cast cost {1} less to cast.",
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { subtypes: ["Aura", "Equipment"] }, caster: "you", reduceGeneric: 1 },
      text: "Aura and Equipment spells you cast cost {1} less to cast.",
    },
  ],
});
