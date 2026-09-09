import { defineCard } from "../define.js";

export default defineCard({
  name: "Aftermath Analyst",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Detective"],
  power: 1,
  toughness: 3,
  text:
    "When Aftermath Analyst enters, mill three cards.\n" +
    "{3}{G}, Sacrifice Aftermath Analyst: Return all land cards from your " +
    "graveyard to the battlefield tapped.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 3 },
      resolve: null,
      text: "When Aftermath Analyst enters, mill three cards.",
    },
  ],
  activated: [
    {
      cost: { mana: "{3}{G}", tap: false, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "return-from-graveyard",
        filter: { type: "land" },
        destination: "battlefield",
        count: "all",
        enterTapped: true,
      },
      resolve: null,
      text:
        "{3}{G}, Sacrifice Aftermath Analyst: Return all land cards from your " +
        "graveyard to the battlefield tapped.",
    },
  ],
});
