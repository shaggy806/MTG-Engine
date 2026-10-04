import { defineCard } from "../define.js";

// EDHREC rank 2909.
//
// Rulings:
//   [2021-02-05] Use the toughness of the creature as the last ability resolves to determine how
//     much life you gain. If the Elf is no longer on the battlefield at that time, use its
//     toughness from when it was last on the battlefield.
// `toughnessOf: "trigger-object"` reads it as the ability resolves, or as it last existed.

export default defineCard({
  name: "Wolverine Riders",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 4,
  toughness: 4,
  text: "At the beginning of each upkeep, create a 1/1 green Elf Warrior creature token.\nWhenever another Elf you control enters, you gain life equal to its toughness.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "any" },
      targets: [],
      effect: { kind: "create-token", token: "Elf Warrior Token", count: 1 },
      resolve: null,
      text: "At the beginning of each upkeep, create a 1/1 green Elf Warrior creature token.",
    },
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtype: "Elf" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "gain-life", amount: { toughnessOf: "trigger-object" } },
      resolve: null,
      text: "Whenever another Elf you control enters, you gain life equal to its toughness.",
    },
  ],
});
