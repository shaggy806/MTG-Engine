import { defineCard } from "../define.js";

export default defineCard({
  name: "Razorgrass Field",
  art: "https://cards.scryfall.io/art_crop/back/5/7/57065dca-f90e-4184-bbc4-95d726a4160b.jpg",
  types: ["land"],
  text: "As this land enters, you may pay 3 life. If you don't, it enters tapped.\n{T}: Add {W}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "W", amount: 1 },
      resolve: null,
      text: "{T}: Add {W}.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", mayPayLife: 3 },
      text: "As this land enters, you may pay 3 life. If you don't, it enters tapped.",
    },
  ],
  faces: ["Razorgrass Ambush", "Razorgrass Field"],
});
