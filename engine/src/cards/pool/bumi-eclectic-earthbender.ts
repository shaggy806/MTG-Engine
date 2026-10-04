import { defineCard } from "../define.js";

// EDHREC rank 4820.
//
// Rulings:
//   [2025-10-02] You may target a land that is already a creature, perhaps because of a previous
//     earthbend ability. The land will get the +1/+1 counters, gain haste, and have its base power
//     and toughness set to 0/0.
//   [2025-10-02] "Earthbend N" means "Target land you control becomes a 0/0 land creature with
//     haste in addition to its other types. Put N +1/+1 counters on it. When it dies or is exiled,
//     return it to the battlefield tapped under your control."
//   [2025-10-02] If the targeted land becomes an illegal target before the spell or ability that
//     includes earthbend resolves, earthbend does nothing. If the spell or ability didn't have
//     other targets, it won't resolve.
//   [2025-10-02] The land will retain any other types, subtypes, or supertypes it previously had.
//     It will also retain any mana abilities it had as a result of those subtypes. For example, a
//     Forest that's turned into a creature this way can still be tapped for {G}.
//   [2025-10-02] Earthbend doesn't give the land you control a color. As most lands are colorless,
//     in most cases the resulting land creature will also be colorless.
//   [2025-10-02] If a land was animated by earthbend and would go to any zone other than the
//     graveyard or exile, it will not be returned to the battlefield by the delayed triggered
//     ability created by earthbend.

export default defineCard({
  name: "Bumi, Eclectic Earthbender",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Noble", "Ally"],
  power: 4,
  toughness: 4,
  text: "When Bumi enters, earthbend 1. (Target land you control becomes a 0/0 creature with haste that's still a land. Put a +1/+1 counter on it. When it dies or is exiled, return it to the battlefield tapped.)\nWhenever Bumi attacks, put two +1/+1 counters on each land creature you control.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["land-you-control"],
      effect: { kind: "earthbend", target: 0, amount: 1 },
      resolve: null,
      text: "When Bumi enters, earthbend 1.",
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { types: ["land", "creature"], controlledBy: "you" },
        counter: "+1/+1",
        amount: 2,
      },
      resolve: null,
      text: "Whenever Bumi attacks, put two +1/+1 counters on each land creature you control.",
    },
  ],
});
