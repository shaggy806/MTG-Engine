import { defineCard } from "../define.js";

const RETURN_TEXT =
  "{2}{U}{U}: Return Sakashima the Impostor to its owner's hand at the beginning of the next end step.";
const COPY_TEXT =
  "You may have Sakashima the Impostor enter as a copy of any creature on the battlefield, except its name is " +
  `Sakashima the Impostor, it's legendary in addition to its other types, and it has "${RETURN_TEXT}"`;

// The ability is part of the copy (rule 707.9a), so declining leaves a 3/1
// Human Rogue without it (its ruling). The delayed return finds only the
// permanent it was activated for: one that has left the battlefield since,
// even if it came back, isn't returned (rule 400.7, its ruling).
export default defineCard({
  name: "Sakashima the Impostor",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 3,
  toughness: 1,
  text: COPY_TEXT,
  copyOnEnter: {
    filter: { type: "creature" },
    except: {
      name: "Sakashima the Impostor",
      addSupertypes: ["legendary"],
      activated: [
        {
          cost: { mana: "{2}{U}{U}", tap: false },
          targets: [],
          effect: {
            kind: "delayed-trigger",
            at: "next-end-step",
            effect: { kind: "return-to-hand", target: "source" },
            text: "Return Sakashima the Impostor to its owner's hand.",
          },
          resolve: null,
          text: RETURN_TEXT,
        },
      ],
    },
  },
});
