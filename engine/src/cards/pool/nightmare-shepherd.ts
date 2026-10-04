import { defineCard } from "../define.js";

// EDHREC rank 4289.
//
// Rulings:
//   [2020-01-24] If the copied creature had {X} in its mana cost, X is considered to be 0.
//   [2020-01-24] If the copied creature was copying something else, then the token enters the
//     battlefield as whatever that creature copied.
//   [2020-01-24] If the token is a copy of a creature whose power and toughness are defined by an
//     ability (usually printed as */* or similar), the token doesn't copy the ability that defines
//     its power and toughness. It remains a 1/1 creature.
//   [2020-01-24] The token copies exactly what was printed on the original creature and nothing
//     else (unless that creature is copying something else; see below). It doesn't copy whether
//     that creature was tapped or untapped, whether it had any counters on it or Auras or
//     Equipment attached to it, or any non-copy effects that had changed its power, toughness,
//     types, color, or so on.
//   [2020-01-24] The token copies the creature as it last existed on the battlefield before it
//     died, not as it existed in the graveyard before it was exiled.
//   [2020-01-24] If something becomes a copy of the token, the copy is also a 1/1 and a Nightmare.
//   [2020-01-24] Any enters-the-battlefield abilities of the copied creature will trigger when the
//     token enters the battlefield. Any "as [this creature] enters the battlefield" or "[this
//     creature] enters the battlefield with" abilities of the creature will also work.

// Brenard, Ginger Sculptor's shape: "you may exile it. If you do" is the card
// the creature became, still in the graveyard it went to (rule 400.7); the
// copy is of the creature as it last existed on the battlefield (rule 608.2h —
// the ruling), and "1/1 and a Nightmare in addition to its other types" are
// copy exceptions, part of the token's copiable values (rule 707.9b), so a
// copy of the token is a 1/1 Nightmare too.
const DIES_TEXT =
  "Whenever another nontoken creature you control dies, you may exile it. If you do, create a token that's a copy of that creature, except it's 1/1 and it's a Nightmare in addition to its other types.";

export default defineCard({
  name: "Nightmare Shepherd",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["enchantment", "creature"],
  subtypes: ["Demon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying
${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", otherOnly: true, filter: { type: "creature", token: false } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Exile it and create a 1/1 Nightmare copy of it?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "exile", target: "trigger-object" },
            {
              kind: "conditional",
              condition: { kind: "this-way", what: "exiled" },
              then: {
                kind: "create-token-copy",
                of: "trigger-object",
                count: 1,
                who: "you",
                exceptions: { basePt: [1, 1], addSubtypes: ["Nightmare"] },
              },
            },
          ],
        },
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
