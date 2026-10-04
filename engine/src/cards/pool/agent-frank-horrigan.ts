import { defineCard } from "../define.js";

// EDHREC rank 3515.
//
// Rulings:
//   [2024-03-08] If Agent Frank Horrigan enters the battlefield attacking, it doesn’t have
//     indestructible since it was never declared as an attacker.
//   [2024-03-08] The ability that causes Agent Frank Horrigan to have indestructible starts to
//     apply as soon as it’s declared as an attacker. It applies for the remainder of the turn. It
//     doesn’t matter what happens to the player or permanent it attacked after that point.
//   [2024-03-08] While proliferating twice, players can’t respond between proliferating the first
//     time and proliferating the second time.
//   [2024-03-08] If you proliferate twice, you don’t have to choose the same set of players and/or
//     permanents to get additional counters each time.
//
// "Attacked this turn" is `attackedThisTurn`, set only as it's declared an
// attacker (never for one put onto the battlefield attacking). Proliferate
// twice is two separate choices, the second the first's `then`.
const INDESTRUCTIBLE_TEXT = "Agent Frank Horrigan has indestructible as long as it attacked this turn.";
const TRIGGER_TEXT =
  "Whenever Agent Frank Horrigan enters or attacks, proliferate twice. (To proliferate, choose any number of permanents and/or players, then give each another counter of each kind already there.)";
const PROLIFERATE_TWICE = { kind: "proliferate", then: { kind: "proliferate" } } as const;

export default defineCard({
  name: "Agent Frank Horrigan",
  manaCost: "{5}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Mutant", "Warrior"],
  power: 8,
  toughness: 6,
  keywords: ["trample"],
  text: `Trample\n${INDESTRUCTIBLE_TEXT}\n${TRIGGER_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "source", filter: { attackedThisTurn: true } },
      grantKeywords: ["indestructible"],
      text: INDESTRUCTIBLE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: PROLIFERATE_TWICE,
      resolve: null,
      text: TRIGGER_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: PROLIFERATE_TWICE,
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
