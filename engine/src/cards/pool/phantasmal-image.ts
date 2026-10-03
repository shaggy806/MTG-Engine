import { defineCard } from "../define.js";

const SACRIFICE_TEXT = "When this creature becomes the target of a spell or ability, sacrifice it.";
const COPY_TEXT =
  "You may have this creature enter as a copy of any creature on the battlefield, except it's an Illusion in " +
  `addition to its other types and it has "${SACRIFICE_TEXT}"`;

// The Illusion type and the triggered ability are copiable values (its
// ruling, rule 707.9a), so a copy of the Image has them too. Declining, it's
// a 0/0 without the ability.
export default defineCard({
  name: "Phantasmal Image",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Illusion"],
  power: 0,
  toughness: 0,
  text: COPY_TEXT,
  copyOnEnter: {
    filter: { type: "creature" },
    except: {
      addSubtypes: ["Illusion"],
      triggered: [
        {
          trigger: { on: "becomes-target", who: "self" },
          targets: [],
          effect: { kind: "sacrifice-source" },
          resolve: null,
          text: SACRIFICE_TEXT,
        },
      ],
    },
  },
});
