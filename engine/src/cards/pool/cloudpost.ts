import { defineCard } from "../define.js";

// EDHREC rank 5808.

export default defineCard({
  name: "Cloudpost",
  colors: [],
  types: ["land"],
  subtypes: ["Locus"],
  text: "This land enters tapped.\n{T}: Add {C} for each Locus on the battlefield.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      // Every Locus on the battlefield, whoever controls it (Gaea's Cradle's
      // shape with no `controlledBy`).
      effect: { kind: "add-mana", mana: "C", amount: { countOf: { subtype: "Locus" } } },
      resolve: null,
      text: "{T}: Add {C} for each Locus on the battlefield.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
