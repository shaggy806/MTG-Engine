import { defineCard } from "../define.js";

// Commander backlog — EDHREC commander rank 370.
//
// Two abilities, both already in the vocabulary:
//
// - "Whenever ~ enters **or attacks**" is two triggers here, the way Sun Titan
//   and Korvold spell the same wording: the `TriggerSpec` union carries one
//   event per entry and both do the same thing.
// - "I LOVE Squirrels!" is Krenko, Mob Boss's shape with a mana cost instead
//   of a tap — so it's repeatable within a turn, and X is a live board count
//   read as the ability resolves. Squirrel Girl is herself a Squirrel, so she
//   counts, as do the tokens from her trigger and from earlier activations.
//
// The two ability names ("Do You Like Squirrels?", "I LOVE Squirrels!") are
// ability words — flavour prefixes with no rules meaning — so they live in
// `text` and nowhere else. Scryfall reports the second one under `keywords`,
// which is an artefact of the Marvel set's styling, not a real keyword.
export default defineCard({
  name: "The Unbeatable Squirrel Girl",
  manaCost: "{1}{G}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Squirrel", "Human", "Hero"],
  power: 4,
  toughness: 4,
  text:
    "Do You Like Squirrels? — Whenever The Unbeatable Squirrel Girl enters or attacks, create a 1/1 green Squirrel creature token.\n" +
    "I LOVE Squirrels! — {1}{G}{G}{G}: Create X 1/1 green Squirrel creature tokens, where X is the number of Squirrels you control.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Squirrel Token", count: 1 },
      resolve: null,
      text:
        "Do You Like Squirrels? — Whenever The Unbeatable Squirrel Girl enters, create a 1/1 green Squirrel creature token.",
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Squirrel Token", count: 1 },
      resolve: null,
      text:
        "Do You Like Squirrels? — Whenever The Unbeatable Squirrel Girl attacks, create a 1/1 green Squirrel creature token.",
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{G}{G}{G}", tap: false },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Squirrel Token",
        count: { countOf: { subtype: "Squirrel", controlledBy: "you" } },
      },
      resolve: null,
      text:
        "I LOVE Squirrels! — {1}{G}{G}{G}: Create X 1/1 green Squirrel creature tokens, where X is the number of Squirrels you control.",
    },
  ],
});
