import { defineCard } from "../define.js";

// EDHREC rank 5362.
//
// Rulings:
//   [2025-10-02] The land will retain any other types, subtypes, or supertypes it previously had.
//     It will also retain any mana abilities it had as a result of those subtypes. For example, a
//     Forest that's turned into a creature this way can still be tapped for {G}.
//   [2025-10-02] If the targeted land becomes an illegal target before the spell or ability that
//     includes earthbend resolves, earthbend does nothing. If the spell or ability didn't have
//     other targets, it won't resolve.
//   [2025-10-02] If a land was animated by earthbend and would go to any zone other than the
//     graveyard or exile, it will not be returned to the battlefield by the delayed triggered
//     ability created by earthbend.
//   [2025-10-02] You may target a land that is already a creature, perhaps because of a previous
//     earthbend ability. The land will get the +1/+1 counters, gain haste, and have its base power
//     and toughness set to 0/0.
//   [2025-10-02] "Earthbend N" means "Target land you control becomes a 0/0 land creature with
//     haste in addition to its other types. Put N +1/+1 counters on it. When it dies or is exiled,
//     return it to the battlefield tapped under your control."
//   [2025-10-02] Earthbend doesn't give the land you control a color. As most lands are colorless,
//     in most cases the resulting land creature will also be colorless.

export default defineCard({
  name: "Toph, Greatest Earthbender",
  manaCost: "{2}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior", "Ally"],
  power: 3,
  toughness: 3,
  text: "When Toph enters, earthbend X, where X is the amount of mana spent to cast her.\nLand creatures you control have double strike.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      // The mana spent stays with the permanent a spell becomes (and is read
      // from her last-known information if she's gone); X is 0 when she
      // wasn't cast.
      targets: ["land-you-control"],
      effect: { kind: "earthbend", target: 0, amount: { manaSpentOf: "source" } },
      resolve: null,
      text: "When Toph enters, earthbend X, where X is the amount of mana spent to cast her.",
    },
  ],
  static: [
    {
      affects: { scope: "filter", filter: { types: ["land", "creature"], controlledBy: "you" } },
      grantKeywords: ["double-strike"],
      text: "Land creatures you control have double strike.",
    },
  ],
});
