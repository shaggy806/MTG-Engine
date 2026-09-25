import { defineCard } from "../define.js";

export default defineCard({
  name: "Gaius van Baelsar",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 2,
  text: "When Gaius van Baelsar enters, choose one —\n• Each player sacrifices a creature token of their choice.\n• Each player sacrifices a nontoken creature of their choice.\n• Each player sacrifices an enchantment of their choice.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "modal",
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: "Each player sacrifices a creature token of their choice.",
            effect: {
              kind: "sacrifice",
              who: "each-player",
              filter: { token: true, type: "creature" },
              count: 1,
            },
          },
          {
            text: "Each player sacrifices a nontoken creature of their choice.",
            effect: {
              kind: "sacrifice",
              who: "each-player",
              filter: { token: false, type: "creature" },
              count: 1,
            },
          },
          {
            text: "Each player sacrifices an enchantment of their choice.",
            effect: {
              kind: "sacrifice",
              who: "each-player",
              filter: { type: "enchantment" },
              count: 1,
            },
          },
        ],
      },
      resolve: null,
      text: "When Gaius van Baelsar enters, choose one —",
    },
  ],
});
