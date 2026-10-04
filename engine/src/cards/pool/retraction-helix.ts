import type { ActivatedAbility } from "../../abilities.js";
import { defineCard } from "../define.js";

// EDHREC rank 4162.

// The granted ability is the creature's own until end of turn, activated by
// whoever controls that creature; its {T} needs the creature to have been
// under that player's control since their turn began (rule 302.6).
const GRANTED_TEXT = "{T}: Return target nonland permanent to its owner's hand.";
const BOUNCE: ActivatedAbility = {
  cost: { mana: null, tap: true },
  targets: ["nonland-permanent"],
  effect: { kind: "return-to-hand", target: 0 },
  resolve: null,
  text: GRANTED_TEXT,
};

export default defineCard({
  name: "Retraction Helix",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: `Until end of turn, target creature gains "${GRANTED_TEXT}"`,
  targets: ["creature"],
  effect: { kind: "grant-activated", target: 0, ability: BOUNCE, duration: "end-of-turn" },
});
