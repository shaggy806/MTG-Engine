import { defineCard } from "../define.js";

// The enters trigger isn't equipping: no mana, no sorcery timing (the 2023
// rulings), so with flash it can dress a legendary creature at instant speed.
// It targets, so a target that turns illegal leaves the Coat unattached. The
// Coat is indestructible itself, and grants it to whatever it's attached to.
export default defineCard({
  name: "Mithril Coat",
  manaCost: "{3}",
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  keywords: ["flash", "indestructible"],
  text:
    "Flash\n" +
    "Indestructible\n" +
    "When Mithril Coat enters, attach it to target legendary creature you control.\n" +
    "Equipped creature has indestructible.\n" +
    "Equip {3}",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [
        { kind: "permanent", whose: "you", filter: { type: "creature", supertype: "legendary" } },
      ],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      text: "When Mithril Coat enters, attach it to target legendary creature you control.",
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["indestructible"],
      text: "Equipped creature has indestructible.",
    },
  ],
  activated: [
    {
      cost: { mana: "{3}", tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      text: "Equip {3}",
      sorcerySpeed: true,
    },
  ],
});
