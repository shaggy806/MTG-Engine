import type { ActivatedAbility } from "../../abilities.js";
import { defineCard } from "../define.js";

// EDHREC rank 6609.
//
// Rulings:
//   [2008-08-01] The targeted creature's controller, not Banishing Knack's controller, is the one
//     who can activate the creature's new ability.
//   [2008-08-01] "Summoning sickness" applies. The new ability can't be activated unless the
//     targeted creature has been under its controller's control since the beginning of that
//     player's most recent turn or it has haste.
//
// Retraction Helix's shape: the granted ability rides on the creature, so its
// controller activates it, and its {T} is subject to rule 302.6.
const GRANTED_TEXT = "{T}: Return target nonland permanent to its owner's hand.";
const BOUNCE: ActivatedAbility = {
  cost: { mana: null, tap: true },
  targets: ["nonland-permanent"],
  effect: { kind: "return-to-hand", target: 0 },
  resolve: null,
  text: GRANTED_TEXT,
};

export default defineCard({
  name: "Banishing Knack",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: `Until end of turn, target creature gains "${GRANTED_TEXT}"`,
  targets: ["creature"],
  effect: { kind: "grant-activated", target: 0, ability: BOUNCE, duration: "end-of-turn" },
});
