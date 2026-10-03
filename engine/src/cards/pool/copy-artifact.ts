import { defineCard } from "../define.js";

// It takes the copied artifact's colours, so it isn't still blue (its
// ruling) — an artifact enchantment, an artifact creature enchantment if it
// copies an artifact creature.
export default defineCard({
  name: "Copy Artifact",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text:
    "You may have this enchantment enter as a copy of any artifact on the battlefield, except it's an enchantment " +
    "in addition to its other types.",
  copyOnEnter: { filter: { type: "artifact" }, except: { addTypes: ["enchantment"] } },
});
