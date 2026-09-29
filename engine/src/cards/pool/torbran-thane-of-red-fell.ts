import { defineCard } from "../define.js";

const TEXT =
  "If a red source you control would deal damage to an opponent or a permanent an opponent controls, it deals that much damage plus 2 instead.";

// Added per recipient after the damage is divided or assigned (the ruling:
// a 5/5 trampler assigning 2 and 3 deals 4 and 5), and by the same source.
export default defineCard({
  name: "Torbran, Thane of Red Fell",
  manaCost: "{1}{R}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dwarf", "Noble"],
  power: 2,
  toughness: 4,
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "would-deal-damage",
        plus: 2,
        source: { colors: ["R"], controlledBy: "you" },
        to: "opponent-side",
      },
      text: TEXT,
    },
  ],
});
