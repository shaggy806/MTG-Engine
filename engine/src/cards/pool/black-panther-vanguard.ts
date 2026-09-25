import { defineCard } from "../define.js";

export default defineCard({
  name: "Black Panther, Vanguard",
  manaCost: "{2}{G}{W}",
  colors: ["W", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior", "Hero"],
  power: 4,
  toughness: 4,
  text: "Whenever another nontoken Hero you control enters, choose one —\n• Create a 1/1 white Soldier creature token.\n• Creatures you control get +1/+1 until end of turn.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { token: false, subtype: "Hero" },
        otherOnly: true,
      },
      targets: [],
      effect: {
        kind: "modal",
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: "Create a 1/1 white Soldier creature token.",
            effect: { kind: "create-token", token: "Soldier Token", count: 1 },
          },
          {
            text: "Creatures you control get +1/+1 until end of turn.",
            effect: {
              kind: "modify-pt-all",
              filter: { type: "creature", controlledBy: "you" },
              power: 1,
              toughness: 1,
              duration: "end-of-turn",
            },
          },
        ],
      },
      resolve: null,
      text: "Whenever another nontoken Hero you control enters, choose one —",
    },
  ],
});
