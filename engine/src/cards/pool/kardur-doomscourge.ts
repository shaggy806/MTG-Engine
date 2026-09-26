import { defineCard } from "../define.js";

// The Chaos Incarnate precon's commander.
//
// The ETB imposes goad's two requirements without goading anything: it is a
// continuous effect that modifies the rules of the game, so it binds every
// creature an opponent controls until your next turn — one that comes under
// their control afterwards too (rule 611.2c) — and none of them is *goaded*
// (a "whenever a goaded creature …" doesn't see them). An `attack-requirement`,
// not a `goad`.
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
      effect: {
        kind: "attack-requirement",
        filter: { type: "creature", controlledBy: "opponent" },
        otherThanYou: true,
      },
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
