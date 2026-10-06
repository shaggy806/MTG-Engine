import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 6599.
//
// Rulings:
//   [2011-01-01] As the triggered ability resolves, count each Locus on the battlefield regardless
//     of who controls it.

export default defineCard({
  name: "Glimmerpost",
  colors: [],
  types: ["land"],
  subtypes: ["Locus"],
  text: "When this land enters, you gain 1 life for each Locus on the battlefield.\n{T}: Add {C}.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      // Every Locus on the battlefield, whoever controls it (Cloudpost's count), read as it resolves.
      effect: { kind: "gain-life", amount: { countOf: { subtype: "Locus" } } },
      resolve: null,
      text: "When this land enters, you gain 1 life for each Locus on the battlefield.",
    },
  ],
  activated: [addManaAbility({ mana: "C", text: "{T}: Add {C}." })],
});
