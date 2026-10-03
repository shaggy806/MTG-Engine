import { defineCard } from "../define.js";

const UPKEEP_TEXT =
  "At the beginning of your upkeep, you may exile this enchantment. If you do, return it to the battlefield under " +
  "its owner's control.";
const COPY_TEXT =
  "You may have this enchantment enter as a copy of an enchantment you control, except it has " +
  `"${UPKEEP_TEXT}"`;

// The upkeep ability is part of the copy (rule 707.9a): declining, it doesn't
// have it, and it can't copy itself to get it (its ruling). What comes back
// is a new object (rule 400.7) that chooses again what it copies.
export default defineCard({
  name: "Estrid's Invocation",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: COPY_TEXT,
  copyOnEnter: {
    filter: { type: "enchantment", controlledBy: "you" },
    except: {
      triggered: [
        {
          trigger: { on: "step-begins", step: "upkeep", who: "you" },
          targets: [],
          effect: {
            kind: "may",
            prompt: "Exile this enchantment and return it to the battlefield?",
            effect: { kind: "flicker", target: "source" },
          },
          resolve: null,
          text: UPKEEP_TEXT,
        },
      ],
    },
  },
});
