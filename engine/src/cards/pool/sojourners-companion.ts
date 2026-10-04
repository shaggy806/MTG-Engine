import { defineCard } from "../define.js";
import { affinity } from "../helpers.js";

// EDHREC rank 6328.
//
// Rulings:
//   [2021-06-18] Unlike the normal cycling ability, typecycling doesn't allow you to draw a card.
//     Rather, it lets you search your library for a card with the type or types indicated by the
//     ability name. For example, a card with basic landcycling lets you search for a basic land
//     card, and a card with Wizardcycling lets you search for a Wizard card.
//   [2021-06-18] Typecycling is a form of cycling. Any ability that triggers on a card being
//     cycled also triggers on a card being typecycled. Any ability that stops a cycling ability
//     from being activated also stops a typecycling ability from being activated.

export default defineCard({
  name: "Sojourner's Companion",
  manaCost: "{7}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Salamander"],
  power: 4,
  toughness: 4,
  text: "Affinity for artifacts\nArtifact landcycling {2} ({2}, Discard this card: Search your library for an artifact land card, reveal it, put it into your hand, then shuffle.)",
  selfCostReduction: affinity({ type: "artifact" }),
  // Typecycling is cycling (rule 702.29f): Ash Barrens' shape.
  cycling: { cost: "{2}", search: { types: ["artifact", "land"] } },
});
