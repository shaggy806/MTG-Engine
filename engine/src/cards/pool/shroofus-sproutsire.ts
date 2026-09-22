import { defineCard } from "../define.js";

export default defineCard({
  name: "Shroofus Sproutsire",
  manaCost: "{2}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Saproling"],
  power: 1,
  toughness: 1,
  keywords: ["trample"],
  text:
    "Trample\n" +
    "Whenever a Saproling you control deals combat damage to a player, create that many 1/1 " +
    "green Saproling creature tokens.",
  triggered: [
    {
      // Shroofus is a Saproling itself, so its own combat damage counts too —
      // `you-control` includes the source, and the filter reads computed
      // subtypes, so any creature that *is* a Saproling right now qualifies.
      trigger: {
        on: "deals-combat-damage-to-player",
        who: "you-control",
        filter: { subtype: "Saproling" },
      },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Saproling Token",
        count: { triggerValue: true },
      },
      resolve: null,
      text:
        "Whenever a Saproling you control deals combat damage to a player, create that many 1/1 " +
        "green Saproling creature tokens.",
    },
  ],
});
