import { defineCard } from "../define.js";

// EDHREC rank 6046.
//
// Rulings:
//   [2025-10-02] You may target a land that is already a creature, perhaps because of a previous
//     earthbend ability. The land will get the +1/+1 counters, gain haste, and have its base power
//     and toughness set to 0/0.
//   [2025-10-02] If a land was animated by earthbend and would go to any zone other than the
//     graveyard or exile, it will not be returned to the battlefield by the delayed triggered
//     ability created by earthbend.
//   [2025-10-02] If either target is an illegal target as the fight ability tries to resolve,
//     neither creature will deal or be dealt damage.
//   [2025-10-02] The land will retain any other types, subtypes, or supertypes it previously had.
//     It will also retain any mana abilities it had as a result of those subtypes. For example, a
//     Forest that's turned into a creature this way can still be tapped for {G}.
//   [2025-10-02] Earthbend doesn't give the land you control a color. As most lands are colorless,
//     in most cases the resulting land creature will also be colorless.
//   [2025-10-02] If the targeted land becomes an illegal target before the spell or ability that
//     includes earthbend resolves, earthbend does nothing. If the spell or ability didn't have
//     other targets, it won't resolve.
//   [2025-10-02] "Earthbend N" means "Target land you control becomes a 0/0 land creature with
//     haste in addition to its other types. Put N +1/+1 counters on it. When it dies or is exiled,
//     return it to the battlefield tapped under your control."

export default defineCard({
  name: "Earth Rumble",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Earthbend 2. When you do, up to one target creature you control fights target creature an opponent controls. (To earthbend 2, target land you control becomes a 0/0 creature with haste that's still a land. Put two +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped. Creatures that fight each deal damage equal to their power to the other.)",
  // The land is the spell's only target, so if it's illegal the spell doesn't
  // resolve at all; resolving, it has earthbent, and "when you do" follows.
  targets: ["land-you-control"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "earthbend", target: 0, amount: 2 },
      {
        kind: "reflexive-trigger",
        targets: [{ kind: "optional", of: "creature-you-control" }, "creature-an-opponent-controls"],
        // An empty or illegal slot leaves a blank, and a fight needs both.
        effect: { kind: "fight", a: 0, b: 1 },
        text: "When you do, up to one target creature you control fights target creature an opponent controls.",
      },
    ],
  },
});
