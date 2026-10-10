import { defineCard } from "../define.js";
import { ninjutsu, ninjutsuText } from "../helpers.js";

// EDHREC rank 6145.
const ENTER = "When this creature enters, target creature you control gains deathtouch and lifelink until end of turn.";

export default defineCard({
  name: "Nezumi Prowler",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["artifact", "creature"],
  subtypes: ["Rat", "Ninja"],
  power: 3,
  toughness: 1,
  text: `${ninjutsuText("{1}{B}")}\n${ENTER}`,
  activated: [ninjutsu("{1}{B}")],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-you-control"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: 0, keyword: "deathtouch", duration: "end-of-turn" },
          { kind: "grant-keyword", target: 0, keyword: "lifelink", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: ENTER,
    },
  ],
});
