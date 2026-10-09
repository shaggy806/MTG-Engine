import { defineCard } from "../define.js";
import { afflict } from "../helpers.js";

// EDHREC rank 2796. Itself included: it's an artifact creature you control.
const GRANT =
  "Artifact creatures you control have afflict 3. (Whenever a creature with afflict 3 becomes blocked, defending player loses 3 life.)";

export default defineCard({
  name: "Cyberman Patrol",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Cyberman"],
  power: 2,
  toughness: 2,
  text: GRANT,
  static: [
    {
      affects: { scope: "filter", filter: { types: ["artifact", "creature"], controlledBy: "you" } },
      grantsTriggered: [afflict(3)],
      text: GRANT,
    },
  ],
});
