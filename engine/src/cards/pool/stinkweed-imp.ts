import { defineCard } from "../define.js";

// EDHREC rank 3124.
//
// - Not deathtouch: a trigger on combat damage only (its ruling), once per
//   creature dealt it, destroying "that creature" untargeted — the damage's
//   recipient, only while it's still that permanent (rule 400.7), so a
//   creature that regenerates or is indestructible survives.
// - Dredge is `CardDefinition.dredge` (Life from the Loam's).
const DAMAGE_TEXT = "Whenever this creature deals combat damage to a creature, destroy that creature.";

export default defineCard({
  name: "Stinkweed Imp",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Imp"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  dredge: 5,
  text:
    `Flying\n${DAMAGE_TEXT}\n` +
    "Dredge 5 (If you would draw a card, you may mill five cards instead. If you do, return this card from your graveyard to your hand.)",
  triggered: [
    {
      trigger: { on: "deals-damage", who: "self", to: "creature", combat: true },
      targets: [],
      effect: { kind: "destroy", target: "trigger-recipient" },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
});
