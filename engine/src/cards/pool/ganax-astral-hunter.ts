import { defineCard } from "../define.js";
import { thisOrAnother } from "../helpers.js";

/** Commander Legends: Battle for Baldur's Gate. "Choose a Background" is `pairing`: the deck validator lets a
 * legendary Background enchantment be its second commander. The creature's
 * own ability needs no new vocab — a Dragon-ETB trigger, and one for Ganax's
 * own entry whatever it is then (`thisOrAnother`). */
export default defineCard({
  name: "Ganax, Astral Hunter",
  manaCost: "{4}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 3,
  toughness: 4,
  pairing: { kind: "choose-a-background" },
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Whenever Ganax or another Dragon you control enters, create a Treasure token.\n" +
    "Choose a Background (You can have a Background as a second commander.)",
  triggered: [
    ...thisOrAnother({
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtype: "Dragon" },
      },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: "Whenever Ganax or another Dragon you control enters, create a Treasure token.",
    }),
  ],
});
