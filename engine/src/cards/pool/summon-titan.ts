import { defineCard } from "../define.js";

// needed-cards P15. Real text turned out to need zero new vocab — the
// planning note's guess ("chapter counters on a creature" as a new
// mechanic) was wrong: an enchantment creature with `chapters` already
// works exactly like any other Saga (the SBA that sacrifices a completed
// Saga doesn't care what other types it has), and every chapter effect is
// already-shipped vocab (mill / return-from-graveyard / a countOf pump).
// Chapter III's "another target creature" drops the "another" the same way
// Anafenza, the Foremost's attack trigger does — the engine has no generic
// "not this object" targeting exclusion.
export default defineCard({
  name: "Summon: Titan",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["enchantment", "creature"],
  subtypes: ["Saga", "Giant"],
  power: 7,
  toughness: 7,
  keywords: ["reach", "trample"],
  text:
    "(As this Saga enters and after your draw step, add a lore counter. Sacrifice after III.)\n" +
    "Reach, trample\n" +
    "I — Mill five cards.\n" +
    "II — Return all land cards from your graveyard to the battlefield tapped.\n" +
    "III — Until end of turn, another target creature you control gains trample and gets " +
    "+X/+X, where X is the number of lands you control.",
  chapters: [
    {
      at: [1],
      targets: [],
      effect: { kind: "mill", target: "you", amount: 5 },
      resolve: null,
      text: "I — Mill five cards.",
    },
    {
      at: [2],
      targets: [],
      effect: {
        kind: "return-from-graveyard",
        filter: { type: "land" },
        destination: "battlefield",
        count: "all",
        enterTapped: true,
      },
      resolve: null,
      text: "II — Return all land cards from your graveyard to the battlefield tapped.",
    },
    {
      at: [3],
      targets: ["creature-you-control"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
          {
            kind: "modify-pt",
            target: 0,
            power: { countOf: { type: "land", controlledBy: "you" } },
            toughness: { countOf: { type: "land", controlledBy: "you" } },
            duration: "end-of-turn",
          },
        ],
      },
      resolve: null,
      text:
        "III — Until end of turn, another target creature you control gains trample and gets " +
        "+X/+X, where X is the number of lands you control.",
    },
  ],
});
