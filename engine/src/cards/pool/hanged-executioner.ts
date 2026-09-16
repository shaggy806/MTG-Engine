import { defineCard } from "../define.js";

export default defineCard({
  name: "Hanged Executioner",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "When Hanged Executioner enters, create a 1/1 white Spirit creature token " +
    "with flying.\n" +
    "{3}{W}, Exile Hanged Executioner: Exile target creature.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Spirit Token", count: 1 },
      resolve: null,
      text:
        "When Hanged Executioner enters, create a 1/1 white Spirit creature token " +
        "with flying.",
    },
  ],
  activated: [
    {
      // Exiled, not sacrificed — nothing watching for a death sees one.
      cost: { mana: "{3}{W}", tap: false, exileSelf: true },
      targets: ["creature"],
      effect: { kind: "exile", target: 0 },
      resolve: null,
      text: "{3}{W}, Exile Hanged Executioner: Exile target creature.",
    },
  ],
});
