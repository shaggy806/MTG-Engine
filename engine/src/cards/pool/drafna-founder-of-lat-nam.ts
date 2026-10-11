import { defineCard } from "../define.js";

// EDHREC rank 6692.
//
// Rulings:
//   A resolving copy of a permanent spell becomes a token, so the token isn't "created." Effects
//     that care about a token being created won't interact with a token that enters the
//     battlefield because the triggered ability copied a permanent spell.
//   If an effect copies a prototyped spell, that copy (as well as the token it becomes on the
//     battlefield) will have the same characteristics as the prototyped spell.
//
// Lithoform Engine's permanent-spell copy (rules 707.10f, 111.13), narrowed to
// artifact spells.

const BOUNCE_TEXT = "{1}{U}: Return target artifact you control to its owner's hand.";
const COPY_TEXT = "{3}, {T}: Copy target artifact spell you control. (The copy becomes a token.)";

export default defineCard({
  name: "Drafna, Founder of Lat-Nam",
  manaCost: "{1}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Artificer", "Advisor"],
  power: 2,
  toughness: 1,
  text: `${BOUNCE_TEXT}\n${COPY_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}{U}", tap: false },
      targets: [{ kind: "permanent", filter: { type: "artifact", controlledBy: "you" } }],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: BOUNCE_TEXT,
    },
    {
      cost: { mana: "{3}", tap: true },
      targets: [{ kind: "spell", whose: "you", filter: { type: "artifact" } }],
      effect: { kind: "copy-spell", target: 0 },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
