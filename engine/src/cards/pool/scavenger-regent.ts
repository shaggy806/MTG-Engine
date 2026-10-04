import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// EDHREC rank 6114.
// An omen card (rule 720): cast as Exude Toxin it's shuffled into its owner's
// library as it resolves.

const WARD = ward({ discard: 1 });

export default defineCard({
  name: "Scavenger Regent",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${WARD.text}`,
  triggered: [WARD],
  faces: ["Scavenger Regent", "Exude Toxin"],
  omen: true,
});
