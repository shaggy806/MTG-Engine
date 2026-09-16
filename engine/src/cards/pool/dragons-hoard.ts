import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Dragon's Hoard",
  manaCost: "{3}",
  types: ["artifact"],
  text:
    "Whenever a Dragon you control enters, put a gold counter on Dragon's Hoard.\n" +
    "{T}, Remove a gold counter from Dragon's Hoard: Draw a card.\n" +
    "{T}: Add one mana of any color.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you",
        filter: { subtype: "Dragon", controlledBy: "you" },
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "gold", amount: 1 },
      resolve: null,
      text: "Whenever a Dragon you control enters, put a gold counter on Dragon's Hoard.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true, removeCounter: { kind: "gold", count: 1 } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{T}, Remove a gold counter from Dragon's Hoard: Draw a card.",
    },
    addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." }),
  ],
});
