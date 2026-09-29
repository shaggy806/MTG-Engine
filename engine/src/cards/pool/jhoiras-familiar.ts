import { defineCard } from "../define.js";

const TEXT = "Historic spells you cast cost {1} less to cast. (Artifacts, legendaries, and Sagas are historic.)";
const HISTORIC = { anyOf: [{ type: "artifact" }, { supertype: "legendary" }, { subtype: "Saga" }] } as const;

// A static on the battlefield, so it doesn't discount the Familiar itself as
// it's cast (the ruling); a spell that is historic twice over saves {1}.
export default defineCard({
  name: "Jhoira's Familiar",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Bird"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: HISTORIC, caster: "you", reduceGeneric: 1 },
      text: TEXT,
    },
  ],
});
