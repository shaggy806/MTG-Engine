import { defineCard } from "../define.js";
import { regenerateSelfAbility } from "../helpers.js";

// The -1/-1 counters its damage puts on a creature stay through regeneration
// and the end of the turn (the ruling).
export default defineCard({
  name: "Skithiryx, the Blight Dragon",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Dragon", "Skeleton"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "infect"],
  text: "Flying\nInfect (This creature deals damage to creatures in the form of -1/-1 counters and to players in the form of poison counters.)\n{B}: Skithiryx gains haste until end of turn.\n{B}{B}: Regenerate Skithiryx.",
  activated: [
    {
      cost: { mana: "{B}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "haste", duration: "end-of-turn" },
      resolve: null,
      text: "{B}: Skithiryx gains haste until end of turn.",
    },
    regenerateSelfAbility("{B}{B}", "{B}{B}: Regenerate Skithiryx."),
  ],
});
