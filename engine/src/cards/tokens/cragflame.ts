import { defineCard } from "../define.js";

/**
 * Mabel, Heir to Cragflame's ETB token — "a legendary colorless Equipment
 * artifact token with 'Equipped creature gets +1/+1 and has vigilance,
 * trample, and haste' and equip {2}".
 *
 * A *named legendary* token like Karox Bladewing rather than a generic one, so
 * the legend rule (704.5j) applies to it: a second Mabel's Cragflame is put
 * into its owner's graveyard. `supertypes` is the whole of what makes that
 * happen — `runStateBasedActions` groups legendary battlefield permanents by
 * controller and name without caring that this one isn't a creature.
 *
 * Colorless, so `colors` is left at its empty default (the Treasure/Food
 * shape). The static + Equip pair is Basilisk Collar's.
 */
const EQUIPPED_TEXT = "Equipped creature gets +1/+1 and has vigilance, trample, and haste.";

export default defineCard({
  name: "Cragflame",
  art: "c76fa1c6-6000-47b2-9188-9c15b2c73f8f",
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${EQUIPPED_TEXT}\nEquip {2}`,
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 1],
      grantKeywords: ["vigilance", "trample", "haste"],
      text: EQUIPPED_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      text: "Equip {2}",
      sorcerySpeed: true,
    },
  ],
});
