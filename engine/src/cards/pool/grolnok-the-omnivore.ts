import { defineCard } from "../define.js";

// #404 in top-commanders.txt.
//
// Every permanent card put into your graveyard from your library is exiled,
// not only what the Frogs mill (the ruling) — one trigger per card, acting
// only while it's still that card in the graveyard (rule 400.7). The play
// permission reads the croak counter itself, so it reaches cards an earlier
// Grolnok exiled too (the ruling), and lapses while no Grolnok is around.
// Lands take the land drop and spells keep their timing, as from the hand.
const MILL_TEXT = "Whenever a Frog you control attacks, mill three cards.";
const EXILE_TEXT =
  "Whenever a permanent card is put into your graveyard from your library, exile it with a croak counter on it.";
const PLAY_TEXT =
  "You may play lands and cast spells from among cards you own in exile with croak counters on them.";

export default defineCard({
  name: "Grolnok, the Omnivore",
  manaCost: "{2}{G}{U}",
  colors: ["G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Frog"],
  power: 3,
  toughness: 3,
  text: `${MILL_TEXT}\n${EXILE_TEXT}\n${PLAY_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      playFromExile: {
        filter: { ownedBy: "you", counters: { kind: "croak", compare: { op: "gte", n: 1 } } },
      },
      text: PLAY_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "you-control", filter: { subtype: "Frog" } },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 3 },
      resolve: null,
      text: MILL_TEXT,
    },
    {
      trigger: {
        on: "put-into-graveyard",
        who: "you",
        from: "library",
        filter: { typesAnyOf: ["artifact", "creature", "enchantment", "land", "planeswalker", "battle"] },
      },
      targets: [],
      effect: { kind: "exile", target: "trigger-object", withCounters: { kind: "croak", amount: 1 } },
      resolve: null,
      text: EXILE_TEXT,
    },
  ],
});
