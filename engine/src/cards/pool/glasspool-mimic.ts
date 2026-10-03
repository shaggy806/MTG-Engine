import { defineCard } from "../define.js";

// Modal double-faced: the back face is Glasspool Shore. "Shapeshifter Rogue
// in addition" is copiable (its ruling), so a copy of the Mimic is one too.
export default defineCard({
  name: "Glasspool Mimic",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Shapeshifter", "Rogue"],
  power: 0,
  toughness: 0,
  text:
    "You may have this creature enter as a copy of a creature you control, except it's a Shapeshifter Rogue in " +
    "addition to its other types.",
  copyOnEnter: {
    filter: { type: "creature", controlledBy: "you" },
    except: { addSubtypes: ["Shapeshifter", "Rogue"] },
  },
  faces: ["Glasspool Mimic", "Glasspool Shore"],
});
