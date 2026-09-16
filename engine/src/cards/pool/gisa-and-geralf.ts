import { defineCard } from "../define.js";

/** The Grave Danger precon's commander. */
export default defineCard({
  name: "Gisa and Geralf",
  manaCost: "{2}{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 4,
  toughness: 4,
  text:
    "When Gisa and Geralf enters, mill four cards.\n" +
    "Once during each of your turns, you may cast a Zombie creature spell from " +
    "your graveyard.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 4 },
      resolve: null,
      text: "When Gisa and Geralf enters, mill four cards.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      castFromGraveyard: {
        filter: { type: "creature", subtype: "Zombie" },
        // "Once during each of your turns" is both gates at once.
        oncePerTurn: true,
        yourTurnOnly: true,
      },
      text:
        "Once during each of your turns, you may cast a Zombie creature spell from " +
        "your graveyard.",
    },
  ],
});
