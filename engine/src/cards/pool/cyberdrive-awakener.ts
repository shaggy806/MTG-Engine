import { defineCard } from "../define.js";

const LORD_TEXT = "Other artifact creatures you control have flying.";
const ETB_TEXT =
  "When this creature enters, each noncreature artifact you control becomes a 4/4 artifact creature until end of turn.";

// The artifacts that become creatures are the ones that aren't creatures as
// the ability resolves (rule 611.2c) — and, now artifact creatures, they fly.
export default defineCard({
  name: "Cyberdrive Awakener",
  manaCost: "{5}{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${LORD_TEXT}\n${ETB_TEXT}`,
  static: [
    {
      affects: {
        scope: "filter",
        filter: { types: ["artifact", "creature"], controlledBy: "you" },
        excludeSelf: true,
      },
      grantKeywords: ["flying"],
      text: LORD_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "animate-all",
        filter: { type: "artifact", notTypes: ["creature"], controlledBy: "you" },
        power: 4,
        toughness: 4,
        addTypes: ["creature"],
        duration: "end-of-turn",
      },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
});
