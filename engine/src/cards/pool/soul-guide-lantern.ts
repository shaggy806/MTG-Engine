import { defineCard } from "../define.js";

export default defineCard({
  name: "Soul-Guide Lantern",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text:
    "When this artifact enters, exile target card from a graveyard.\n" +
    "{T}, Sacrifice this artifact: Exile each opponent's graveyard.\n" +
    "{1}, {T}, Sacrifice this artifact: Draw a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard" }],
      effect: { kind: "exile", target: 0 },
      resolve: null,
      text: "When this artifact enters, exile target card from a graveyard.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "exile-graveyard", target: "each-opponent" },
      resolve: null,
      text: "{T}, Sacrifice this artifact: Exile each opponent's graveyard.",
    },
    {
      cost: { mana: "{1}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{1}, {T}, Sacrifice this artifact: Draw a card.",
    },
  ],
});
