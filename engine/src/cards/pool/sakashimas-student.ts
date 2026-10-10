import { defineCard } from "../define.js";
import { ninjutsu, ninjutsuText } from "../helpers.js";

// EDHREC rank 3662. Put onto the battlefield by ninjutsu it may still enter
// as a copy (the choice is made as it enters), and enters attacking all the
// same.
const COPY =
  "You may have this creature enter as a copy of any creature on the battlefield, except it's a Ninja in addition to its other creature types.";

export default defineCard({
  name: "Sakashima's Student",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Ninja"],
  power: 0,
  toughness: 0,
  text: `${ninjutsuText("{1}{U}")}\n${COPY}`,
  activated: [ninjutsu("{1}{U}")],
  copyOnEnter: { filter: { type: "creature" }, except: { addSubtypes: ["Ninja"] } },
});
