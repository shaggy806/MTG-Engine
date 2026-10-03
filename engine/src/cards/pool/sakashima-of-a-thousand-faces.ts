import { defineCard } from "../define.js";

const COPY_TEXT =
  "You may have Sakashima enter as a copy of another creature you control, except it has Sakashima's other abilities.";
const LEGEND_TEXT = 'The "legend rule" doesn\'t apply to permanents you control.';

// "Permanents you control", from the side of whoever controls the permanent
// with the ability — Sakashima itself, or Sakashima as a copy.
const YOURS = { scope: "filter", filter: { controlledBy: "you" } } as const;

// Sakashima's "other abilities" are the legend-rule static and partner, and
// partner only modifies deck construction (rule 702.124a) — so the copy
// exception is the static alone, as a copiable value (rule 707.9a): a Clone
// of Sakashima-as-Krenko has it too (the ruling). The copy may be another
// legendary creature you control, kept alongside it by that very ability.
export default defineCard({
  name: "Sakashima of a Thousand Faces",
  manaCost: "{3}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 3,
  toughness: 1,
  pairing: { kind: "partner" },
  text: `${COPY_TEXT}\n${LEGEND_TEXT}\nPartner (You can have two commanders if both have partner.)`,
  copyOnEnter: {
    filter: { type: "creature", controlledBy: "you" },
    except: { legendRuleOff: YOURS },
  },
  static: [{ affects: YOURS, legendRuleOff: true, text: LEGEND_TEXT }],
});
