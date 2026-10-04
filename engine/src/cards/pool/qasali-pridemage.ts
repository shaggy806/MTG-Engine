import { defineCard } from "../define.js";

// EDHREC rank 5162.
// Exalted is Ignoble Hierarch's shape: an "attacks-alone" trigger pumping the
// lone attacker (rule 702.111a). Each exalted instance triggers separately.

const EXALTED_TEXT =
  "Exalted (Whenever a creature you control attacks alone, that creature gets +1/+1 until end of turn.)";
const SAC_TEXT = "{1}, Sacrifice this creature: Destroy target artifact or enchantment.";

export default defineCard({
  name: "Qasali Pridemage",
  manaCost: "{G}{W}",
  colors: ["W", "G"],
  types: ["creature"],
  subtypes: ["Cat", "Wizard"],
  power: 2,
  toughness: 2,
  text: `${EXALTED_TEXT}\n${SAC_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: "self" },
      targets: ["artifact-or-enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks-alone", who: "you-control" },
      targets: [],
      effect: {
        kind: "modify-pt",
        target: "trigger-object",
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: EXALTED_TEXT,
    },
  ],
});
