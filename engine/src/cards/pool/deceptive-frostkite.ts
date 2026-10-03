import { defineCard } from "../define.js";

const COPY_TEXT =
  "You may have this creature enter as a copy of a creature you control with power 4 or greater, except it's a " +
  "Dragon in addition to its other types and it has flying.";

// The power is read as it is now, as the copy is chosen — anthems and
// counters count — though the copy itself gets only the printed values.
export default defineCard({
  name: "Deceptive Frostkite",
  manaCost: "{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: `Flying\n${COPY_TEXT}`,
  copyOnEnter: {
    filter: { type: "creature", controlledBy: "you", power: { op: "gte", n: 4 } },
    except: { addSubtypes: ["Dragon"], keywords: ["flying"] },
  },
});
