import { defineCard } from "../define.js";

const ETB_TEXT = "When this creature enters, create a 3/3 colorless Phyrexian Golem artifact creature token.";
const LORD_TEXT = "Golems you control have first strike.";

export default defineCard({
  name: "Blade Splicer",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Human", "Artificer"],
  power: 1,
  toughness: 1,
  text: `${ETB_TEXT}\n${LORD_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Phyrexian Golem Token", count: 1 },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Golem" },
      grantKeywords: ["first-strike"],
      text: LORD_TEXT,
    },
  ],
});
