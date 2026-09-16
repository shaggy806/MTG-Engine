import { defineCard } from "../define.js";

// The Chaos Incarnate precon's commander.
//
// The ETB is Goad in all but name: rule 701.38's "attacks each combat if able
// and attacks a player other than [the goader] if able", lapsing on the
// goader's next turn — which is exactly "until your next turn". So it's a
// `goad` over every opponent rather than one chosen player.
export default defineCard({
  name: "Kardur, Doomscourge",
  manaCost: "{2}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Demon", "Berserker"],
  power: 4,
  toughness: 3,
  text:
    "When Kardur, Doomscourge enters, until your next turn, creatures your " +
    "opponents control attack each combat if able and attack a player other " +
    "than you if able.\n" +
    "Whenever an attacking creature dies, each opponent loses 1 life and you " +
    "gain 1 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "goad", who: "each-opponent" },
      resolve: null,
      text:
        "When Kardur, Doomscourge enters, until your next turn, creatures your " +
        "opponents control attack each combat if able and attack a player other " +
        "than you if able.",
    },
    {
      // Any attacking creature, whoever controlled it — including your own.
      trigger: { on: "dies", who: "any", filter: { attacking: true } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text:
        "Whenever an attacking creature dies, each opponent loses 1 life and you " +
        "gain 1 life.",
    },
  ],
});
