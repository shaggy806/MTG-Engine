import { defineCard } from "../define.js";

// needed-cards P16. No new vocab beyond P16's own extraLandsPerTurn —
// playFromGraveyard and the landfall-mill trigger were already shipped.
export default defineCard({
  name: "Icetill Explorer",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect", "Scout"],
  power: 2,
  toughness: 4,
  text:
    "You may play an additional land on each of your turns.\n" +
    "You may play lands from your graveyard.\n" +
    "Landfall — Whenever a land you control enters, mill a card.",
  static: [
    {
      affects: { scope: "self" },
      extraLandsPerTurn: 1,
      text: "You may play an additional land on each of your turns.",
    },
    {
      affects: { scope: "self" },
      playFromGraveyard: { type: "land" },
      text: "You may play lands from your graveyard.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 1 },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, mill a card.",
    },
  ],
});
