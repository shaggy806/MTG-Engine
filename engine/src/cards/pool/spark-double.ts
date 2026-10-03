import { defineCard } from "../define.js";

const COPY_TEXT =
  "You may have this creature enter as a copy of a creature or planeswalker you control, except it enters with an " +
  "additional +1/+1 counter on it if it's a creature, it enters with an additional loyalty counter on it if it's a " +
  "planeswalker, and it isn't legendary.";

// The extra counters go by what it is as it enters, copy and all (rule
// 707.9f — the Gideon ruling): a planeswalker creature gets both. "Isn't
// legendary" is copiable, so a copy of it isn't either; the counters aren't
// (rule 707.9e). A copied planeswalker brings its printed loyalty, plus one.
export default defineCard({
  name: "Spark Double",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Illusion"],
  power: 0,
  toughness: 0,
  text: COPY_TEXT,
  copyOnEnter: {
    filter: { typesAnyOf: ["creature", "planeswalker"], controlledBy: "you" },
    except: { notLegendary: true },
    counters: [
      { kind: "+1/+1", amount: 1, ifType: "creature" },
      { kind: "loyalty", amount: 1, ifType: "planeswalker" },
    ],
  },
});
