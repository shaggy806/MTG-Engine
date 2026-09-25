import { defineCard } from "../define.js";

export default defineCard({
  name: "Totem-Guide Hartebeest",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Antelope"],
  power: 2,
  toughness: 5,
  text: "When this creature enters, you may search your library for an Aura card, reveal it, put it into your hand, then shuffle.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { subtype: "Aura" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: "When this creature enters, you may search your library for an Aura card, reveal it, put it into your hand, then shuffle.",
    },
  ],
});
