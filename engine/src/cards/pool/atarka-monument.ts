import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Atarka Monument",
  manaCost: "{3}",
  types: ["artifact"],
  text:
    "{T}: Add {R} or {G}.\n" +
    "{4}{R}{G}: Atarka Monument becomes a 4/4 red and green Dragon artifact " +
    "creature with flying until end of turn.",
  activated: [
    manaTapAbility("R"),
    manaTapAbility("G"),
    {
      cost: { mana: "{4}{R}{G}", tap: false },
      targets: [],
      effect: {
        kind: "animate",
        target: "source",
        power: 4,
        toughness: 4,
        addTypes: ["creature"],
        addSubtypes: ["Dragon"],
        setColors: ["R", "G"],
        keywords: ["flying"],
        duration: "end-of-turn",
      },
      resolve: null,
      text:
        "{4}{R}{G}: Atarka Monument becomes a 4/4 red and green Dragon artifact " +
        "creature with flying until end of turn.",
    },
  ],
});
