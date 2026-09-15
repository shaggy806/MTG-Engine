import { defineCard } from "../define.js";

/** An Adventure card (rule 715): cast the adventure half (`Fertile Footsteps`)
 * first and the card is exiled, then cast the creature from exile later. */
export default defineCard({
  name: "Beanstalk Giant",
  manaCost: "{6}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Giant"],
  power: 0,
  toughness: 0,
  text: "Beanstalk Giant's power and toughness are each equal to the number of lands you control.",
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: { countOf: "lands-you-control", plusPower: 0, plusToughness: 0 },
      text:
        "Beanstalk Giant's power and toughness are each equal to the number of lands you control.",
    },
  ],
  faces: ["Beanstalk Giant", "Fertile Footsteps"],
  adventure: true,
});
