import { defineCard } from "../define.js";
import { myriad } from "../helpers.js";

const COPY_TEXT =
  "You may have this creature enter as a copy of any creature on the battlefield, except it isn't legendary, is an " +
  "artifact in addition to its other types, and has myriad. (Whenever it attacks, for each opponent other than " +
  "defending player, you may create a token copy that's tapped and attacking that player or a planeswalker they " +
  "control. Exile the tokens at end of combat.)";

// Myriad is part of the copy (rule 707.9a), so each myriad token — a copy of
// whatever it copied — carries the exceptions too (its ruling). Declining,
// it has no myriad and is a 0/0.
export default defineCard({
  name: "Auton Soldier",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Alien", "Soldier"],
  power: 0,
  toughness: 0,
  text: COPY_TEXT,
  copyOnEnter: {
    filter: { type: "creature" },
    except: { notLegendary: true, addTypes: ["artifact"], triggered: [myriad()] },
  },
});
