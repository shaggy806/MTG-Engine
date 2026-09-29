import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

const ETB_TEXT = "When this creature enters, exile up to two target artifacts and/or enchantments.";

export default defineCard({
  name: "Angel of the Ruins",
  manaCost: "{5}{W}{W}",
  colors: ["W"],
  types: ["artifact", "creature"],
  subtypes: ["Angel"],
  power: 5,
  toughness: 7,
  keywords: ["flying"],
  text:
    `Flying\n${ETB_TEXT}\n` +
    "Plainscycling {2} ({2}, Discard this card: Search your library for a Plains card, reveal it, put it into your hand, then shuffle.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: distinctTargets(2, "artifact-or-enchantment", { optional: true }),
      // One instruction over both targets: they leave together.
      effect: {
        kind: "sequence",
        simultaneous: true,
        effects: [
          { kind: "exile", target: 0 },
          { kind: "exile", target: 1 },
        ],
      },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
  cycling: { cost: "{2}", search: { subtype: "Plains" } },
});
