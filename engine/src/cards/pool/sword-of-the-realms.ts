import { defineCard } from "../define.js";

export default defineCard({
  name: "Sword of the Realms",
  art: "https://cards.scryfall.io/art_crop/back/9/7/97502411-5c93-434c-b77b-ceb2c32feae7.jpg",
  manaCost: "{1}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature gets +2/+0 and has vigilance.\nWhenever equipped creature dies, return it to its owner's hand.\nEquip {1}{W}",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      text: "Equip {1}{W}",
      sorcerySpeed: true,
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 0],
      grantKeywords: ["vigilance"],
      text: "Equipped creature gets +2/+0 and has vigilance.",
    },
  ],
  faces: ["Halvar, God of Battle", "Sword of the Realms"],
  triggered: [
    {
      // The card goes back only if it's still in the graveyard it died into
      // (the rulings); a token has ceased to exist by then.
      trigger: { on: "dies", who: "attached" },
      targets: [],
      effect: { kind: "return-to-hand", target: "trigger-object", from: "graveyard" },
      resolve: null,
      text: "Whenever equipped creature dies, return it to its owner's hand.",
    },
  ],
});
