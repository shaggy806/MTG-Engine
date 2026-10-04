import { defineCard } from "../define.js";

// EDHREC rank 2928.
//
// Rulings:
//   [2016-11-08] If there are any alternative or additional costs to cast a spell with a converge
//     ability, the mana spent to pay those costs will count. For example, if an effect makes
//     Crystalline Crawler cost {1} more to cast, you could pay {W}{U}{B}{R}{G} to cast it and have
//     it enter the battlefield with five +1/+1 counters.
//   [2016-11-08] The colors of mana are white, blue, black, red, and green. Colorless is not a
//     color.
//   [2016-11-08] If you cast a spell with converge without spending any mana to cast it (perhaps
//     because an effect allowed you to cast it without paying its mana cost), then the number of
//     colors spent to cast it will be zero.
//   [2016-11-08] Unless a spell or ability allows you to, you can't choose to pay more mana for a
//     spell with a converge ability just to spend more colors of mana. Likewise, if a spell or
//     ability reduces the amount of mana it costs you to cast a spell with converge, you can't
//     ignore that cost reduction in order to spend more colors of mana.

// Converge reads the colours spent to cast it, which the permanent keeps from the stack;
// 0 if it wasn't cast or was cast without spending mana (the rulings).

export default defineCard({
  name: "Crystalline Crawler",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 1,
  toughness: 1,
  text: "Converge — This creature enters with a +1/+1 counter on it for each color of mana spent to cast it.\nRemove a +1/+1 counter from this creature: Add one mana of any color.\n{T}: Put a +1/+1 counter on this creature.",
  activated: [
    {
      cost: { mana: null, tap: false, removeCounter: { kind: "+1/+1", count: 1 } },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "Remove a +1/+1 counter from this creature: Add one mana of any color.",
    },
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{T}: Put a +1/+1 counter on this creature.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: { colorsSpentOf: "source" } } },
      text: "Converge — This creature enters with a +1/+1 counter on it for each color of mana spent to cast it.",
    },
  ],
});
