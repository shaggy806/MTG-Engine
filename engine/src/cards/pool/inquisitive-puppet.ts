import { defineCard } from "../define.js";

export default defineCard({
  name: "Inquisitive Puppet",
  manaCost: "{1}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 0,
  toughness: 2,
  text: "When this creature enters, scry 1.\nExile this creature: Create a 1/1 white Human creature token.",
  activated: [
    {
      cost: { mana: null, tap: false, exileSelf: true },
      targets: [],
      effect: { kind: "create-token", token: "Human Token", count: 1 },
      resolve: null,
      text: "Exile this creature: Create a 1/1 white Human creature token.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "When this creature enters, scry 1.",
    },
  ],
});
