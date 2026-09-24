import { defineCard } from "../define.js";

/** Kaldheim. "Choose a Background" is `pairing`: the deck validator lets a
 * legendary Background enchantment be its second commander. The creature's own ability needs no new vocab — a plain Dragon-ETB trigger,
 * "another" not required since Ganax's own entry also counts. */
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
    "Choose a Background. (You can have a Background as a second commander.)",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtype: "Dragon" },
      },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: "Whenever Ganax or another Dragon you control enters, create a Treasure token.",
    },
  ],
});
