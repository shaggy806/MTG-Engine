import { defineCard } from "../define.js";

// EDHREC rank 5037.
//
// Rulings:
//   [2025-10-02] Earthbend doesn't give the land you control a color. As most lands are colorless,
//     in most cases the resulting land creature will also be colorless.
//   [2025-10-02] The land will retain any other types, subtypes, or supertypes it previously had.
//     It will also retain any mana abilities it had as a result of those subtypes. For example, a
//     Forest that's turned into a creature this way can still be tapped for {G}.
//   [2025-10-02] You may target a land that is already a creature, perhaps because of a previous
//     earthbend ability. The land will get the +1/+1 counters, gain haste, and have its base power
//     and toughness set to 0/0.
//   [2025-10-02] If the targeted land becomes an illegal target before the spell or ability that
//     includes earthbend resolves, earthbend does nothing. If the spell or ability didn't have
//     other targets, it won't resolve.
//   [2025-10-02] "Earthbend N" means "Target land you control becomes a 0/0 land creature with
//     haste in addition to its other types. Put N +1/+1 counters on it. When it dies or is exiled,
//     return it to the battlefield tapped under your control."
//   [2025-10-02] If a land was animated by earthbend and would go to any zone other than the
//     graveyard or exile, it will not be returned to the battlefield by the delayed triggered
//     ability created by earthbend.

export default defineCard({
  name: "The Boulder, Ready to Rumble",
  manaCost: "{3}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior", "Performer"],
  power: 4,
  toughness: 4,
  text: "Whenever The Boulder attacks, earthbend X, where X is the number of creatures you control with power 4 or greater. (Target land you control becomes a 0/0 creature with haste that's still a land. Put X +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped.)",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["land-you-control"],
      // X is counted as the ability resolves (Badgermole's `earthbend`).
      effect: {
        kind: "earthbend",
        target: 0,
        amount: { countOf: { type: "creature", controlledBy: "you", power: { op: "gte", n: 4 } } },
      },
      resolve: null,
      text: "Whenever The Boulder attacks, earthbend X, where X is the number of creatures you control with power 4 or greater.",
    },
  ],
});
