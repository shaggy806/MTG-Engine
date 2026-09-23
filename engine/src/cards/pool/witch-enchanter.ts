import { defineCard } from "../define.js";

/** A modal double-faced card (creature // land) — its back face,
 * Witch-Blessed Meadow, is a land you play instead. The enters trigger is
 * mandatory and only reaches an opponent's artifact or enchantment. */
export default defineCard({
  name: "Witch Enchanter",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Warlock"],
  power: 2,
  toughness: 2,
  text: "When this creature enters, destroy target artifact or enchantment an opponent controls.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [
        { kind: "permanent", whose: "opponent", filter: { typesAnyOf: ["artifact", "enchantment"] } },
      ],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "When this creature enters, destroy target artifact or enchantment an opponent controls.",
    },
  ],
  faces: ["Witch Enchanter", "Witch-Blessed Meadow"],
});
