import { defineCard } from "../define.js";

export default defineCard({
  name: "Giant's Boulder",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: "When this artifact enters, scry 2. (Look at the top two cards of your library, then put any number of them on the bottom and the rest on top in any order.)\n{1}, {T}: Add one mana of any color.\n{7}, {T}, Sacrifice this artifact: Destroy target permanent.",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{1}, {T}: Add one mana of any color.",
    },
    {
      cost: { mana: "{7}", tap: true, sacrifice: "self" },
      targets: ["permanent"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{7}, {T}, Sacrifice this artifact: Destroy target permanent.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "scry", amount: 2 },
      resolve: null,
      text: "When this artifact enters, scry 2.",
    },
  ],
});
