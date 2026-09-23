import { defineCard } from "../define.js";

// "Equip legendary creature {3}" is an equip whose target is narrowed (the
// 2018 ruling): "{3}: Attach to target legendary creature you control.
// Activate only as a sorcery." Legendary is checked on activation and
// resolution only, so a creature that stops being legendary keeps the blade.
// The land count is the Equipment controller's ("you"), read live.
export default defineCard({
  name: "Blackblade Reforged",
  manaCost: "{2}",
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text:
    "Equipped creature gets +1/+1 for each land you control.\n" +
    "Equip legendary creature {3}\n" +
    "Equip {7}",
  static: [
    {
      affects: { scope: "attached" },
      grantPtPerCount: { filter: { type: "land", controlledBy: "you" }, pt: [1, 1] },
      text: "Equipped creature gets +1/+1 for each land you control.",
    },
  ],
  activated: [
    {
      cost: { mana: "{3}", tap: false },
      targets: [
        { kind: "permanent", whose: "you", filter: { type: "creature", supertype: "legendary" } },
      ],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      text: "Equip legendary creature {3}",
      sorcerySpeed: true,
    },
    {
      cost: { mana: "{7}", tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      text: "Equip {7}",
      sorcerySpeed: true,
    },
  ],
});
