import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 4614.
//
// Paradise Mantle's granted-ability shape; the granted ability belongs to the
// equipped creature, so the creature is the damage source and taps for it.

const GRANTED = "{T}: This creature deals 1 damage to any target.";
const TEXT = `Equipped creature has "${GRANTED}"`;

export default defineCard({
  name: "Viridian Longbow",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${TEXT}\nEquip {3} ({3}: Attach to target creature you control. Equip only as a sorcery.)`,
  static: [
    {
      affects: { scope: "attached" },
      grantsActivated: [
        {
          cost: { mana: null, tap: true },
          targets: ["any-target"],
          effect: { kind: "damage", amount: 1, target: 0 },
          resolve: null,
          text: GRANTED,
        },
      ],
      text: TEXT,
    },
  ],
  activated: [equip("{3}")],
});
