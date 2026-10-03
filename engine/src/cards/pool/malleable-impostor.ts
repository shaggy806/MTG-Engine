import { defineCard } from "../define.js";

const COPY_TEXT =
  "You may have this creature enter as a copy of a creature an opponent controls, except it's a Faerie " +
  "Shapeshifter in addition to its other types and it has flying.";

export default defineCard({
  name: "Malleable Impostor",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Faerie", "Shapeshifter"],
  power: 0,
  toughness: 0,
  keywords: ["flash", "flying"],
  text: `Flash\nFlying\n${COPY_TEXT}`,
  copyOnEnter: {
    filter: { type: "creature", controlledBy: "opponent" },
    except: { addSubtypes: ["Faerie", "Shapeshifter"], keywords: ["flying"] },
  },
});
