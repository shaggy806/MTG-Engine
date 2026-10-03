import { defineCard } from "../define.js";

// "Put into a graveyard this way" is a creature the wrath destroyed that
// went to a graveyard — any player's (`thisWay: "died"`; one that
// regenerated, or went to exile instead, wasn't). A creature *card*: a token
// isn't one. The return isn't "may", so one is chosen whenever there is one,
// and it comes back under the caster's control, a black Zombie as it enters
// — a colourless one simply black (the ruling). Then the sorcery exiles
// itself.
export default defineCard({
  name: "Necromantic Selection",
  manaCost: "{4}{B}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "Destroy all creatures, then return a creature card put into a graveyard this way to the battlefield under your control. It's a black Zombie in addition to its other colors and types. Exile Necromantic Selection.",
  exileOnResolve: true,
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy-all", filter: { type: "creature" } },
      {
        kind: "look-and-choose",
        zone: "graveyards",
        min: 1,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { type: "creature", token: false, thisWay: "died" },
        enterAs: { addColors: ["B"], addSubtypes: ["Zombie"] },
      },
    ],
  },
});
