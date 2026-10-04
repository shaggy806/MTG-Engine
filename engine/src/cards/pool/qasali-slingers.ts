import { defineCard } from "../define.js";
import type { EffectSpec } from "../../effects.js";

// EDHREC rank 5586.
//
// Rulings:
//   [2017-08-25] If Qasali Slingers enters the battlefield at the same time as other Cats you
//     control, its ability will trigger for each of those Cats.

// "This creature or another Cat you control enters" is two triggers (Coercive
// Recruiter's shape); the effect is Reclamation Sage's.
const TEXT =
  "Whenever this creature or another Cat you control enters, you may destroy target artifact or enchantment.";
const MAY_DESTROY: EffectSpec = {
  kind: "may",
  prompt: "Destroy target artifact or enchantment?",
  effect: { kind: "destroy", target: 0 },
};

export default defineCard({
  name: "Qasali Slingers",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Cat", "Warrior"],
  power: 3,
  toughness: 5,
  keywords: ["reach"],
  text: "Reach\nWhenever this creature or another Cat you control enters, you may destroy target artifact or enchantment.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["artifact-or-enchantment"],
      effect: MAY_DESTROY,
      resolve: null,
      text: TEXT,
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", otherOnly: true, filter: { subtype: "Cat" } },
      targets: ["artifact-or-enchantment"],
      effect: MAY_DESTROY,
      resolve: null,
      text: TEXT,
    },
  ],
});
