import { defineCard } from "../define.js";

/** Disturb (rule 702.150): cast the front face normally, or cast the back face
 * (`Hook-Haunt Drifter`) from your graveyard for the disturb cost — it enters
 * transformed and is exiled if it would leave the battlefield. */
export default defineCard({
  name: "Baithook Angler",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Peasant"],
  power: 2,
  toughness: 1,
  text: "Disturb {1}{U} (You may cast this card from your graveyard transformed for its disturb cost.)",
  faces: ["Baithook Angler", "Hook-Haunt Drifter"],
  transform: true,
  disturb: { cost: "{1}{U}" },
});
