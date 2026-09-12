import { defineCard } from "../define.js";

/** 1/1 green Minion made by Mole Man, Moloid Master (needed-cards P16). */
export default defineCard({
  name: "Moloid",
  art: "https://scryfall.com/card/tmsh/13/moloid",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Minion"],
  power: 1,
  toughness: 1,
  text: "Whenever this token attacks, you may mill a card.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "may", prompt: "Mill a card?", effect: { kind: "mill", target: "you", amount: 1 } },
      resolve: null,
      text: "Whenever this token attacks, you may mill a card.",
    },
  ],
});
