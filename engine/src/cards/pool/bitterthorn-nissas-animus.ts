import { defineCard } from "../define.js";
import { equip, livingWeapon } from "../helpers.js";

const ATTACK_TEXT =
  "Whenever equipped creature attacks, you may search your library for a basic land card, put it onto the battlefield tapped, then shuffle.";

export default defineCard({
  name: "Bitterthorn, Nissa's Animus",
  manaCost: "{3}",
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text:
    "Living weapon (When this Equipment enters, create a 0/0 black Phyrexian Germ creature token, then attach this to it.)\n" +
    `Equipped creature gets +1/+1.\n${ATTACK_TEXT}\nEquip {3}`,
  static: [{ affects: { scope: "attached" }, grantPt: [1, 1], text: "Equipped creature gets +1/+1." }],
  triggered: [
    livingWeapon(),
    {
      trigger: { on: "attacks", who: "attached" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search your library for a basic land card?",
        effect: {
          kind: "search-library",
          filter: { type: "land", supertype: "basic" },
          destination: "battlefield",
          enterTapped: true,
          min: 0,
          max: 1,
        },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  activated: [equip("{3}")],
});
