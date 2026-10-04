import { defineCard } from "../define.js";

// EDHREC rank 2940.
//
// Rulings:
//   [2025-10-02] You may target a land that is already a creature, perhaps because of a previous
//     earthbend ability. The land will get the +1/+1 counters, gain haste, and have its base power
//     and toughness set to 0/0.
//   [2025-10-02] If the targeted land becomes an illegal target before the spell or ability that
//     includes earthbend resolves, earthbend does nothing. If the spell or ability didn't have
//     other targets, it won't resolve.
//   [2025-10-02] Earthbend doesn't give the land you control a color. As most lands are colorless,
//     in most cases the resulting land creature will also be colorless.
//   [2025-10-02] The land will retain any other types, subtypes, or supertypes it previously had.
//     It will also retain any mana abilities it had as a result of those subtypes. For example, a
//     Forest that's turned into a creature this way can still be tapped for {G}.
//   [2025-10-02] "Earthbend N" means "Target land you control becomes a 0/0 land creature with
//     haste in addition to its other types. Put N +1/+1 counters on it. When it dies or is exiled,
//     return it to the battlefield tapped under your control."
//   [2025-10-02] If a land was animated by earthbend and would go to any zone other than the
//     graveyard or exile, it will not be returned to the battlefield by the delayed triggered
//     ability created by earthbend.

export default defineCard({
  name: "Toph, Hardheaded Teacher",
  manaCost: "{2}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior", "Ally"],
  power: 3,
  toughness: 4,
  text: "When Toph enters, you may discard a card. If you do, return target instant or sorcery card from your graveyard to your hand.\nWhenever you cast a spell, earthbend 1. If that spell is a Lesson, put an additional +1/+1 counter on that land. (Target land you control becomes a 0/0 creature with haste that's still a land. Put a +1/+1 counter on it. When it dies or is exiled, return it to the battlefield tapped.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { typesAnyOf: ["instant", "sorcery"] } }],
      effect: {
        kind: "may",
        prompt: "Discard a card to return the targeted instant or sorcery card to your hand?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "discard", target: "you", amount: 1 },
            {
              kind: "conditional",
              condition: { kind: "this-way", what: "discarded" },
              then: { kind: "return-to-hand", target: 0, from: "graveyard" },
            },
          ],
        },
      },
      resolve: null,
      text: "When Toph enters, you may discard a card. If you do, return target instant or sorcery card from your graveyard to your hand.",
    },
    {
      trigger: { on: "cast-spell", who: "you" },
      targets: ["land-you-control"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "earthbend", target: 0, amount: 1 },
          {
            kind: "conditional",
            condition: { kind: "trigger-object", filter: { subtype: "Lesson" } },
            then: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
          },
        ],
      },
      resolve: null,
      text: "Whenever you cast a spell, earthbend 1. If that spell is a Lesson, put an additional +1/+1 counter on that land.",
    },
  ],
});
