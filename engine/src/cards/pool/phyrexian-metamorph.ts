import { defineCard } from "../define.js";

const COPY_TEXT =
  "You may have this creature enter as a copy of any artifact or creature on the battlefield, except it's an " +
  "artifact in addition to its other types.";

// A copy of a noncreature artifact is no longer a creature (its ruling);
// declining, it's a 0/0 that dies to the state-based check.
export default defineCard({
  name: "Phyrexian Metamorph",
  manaCost: "{3}{U/P}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Shapeshifter"],
  power: 0,
  toughness: 0,
  text: `({U/P} can be paid with either {U} or 2 life.)\n${COPY_TEXT}`,
  copyOnEnter: {
    filter: { typesAnyOf: ["artifact", "creature"] },
    except: { addTypes: ["artifact"] },
  },
});
