import { defineCard } from "../define.js";

export default defineCard({
  name: "Wurmcoil Engine",
  manaCost: "{6}",
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Wurm"],
  power: 6,
  toughness: 6,
  keywords: ["deathtouch", "lifelink"],
  text:
    "Deathtouch, lifelink. When Wurmcoil Engine dies, create a 3/3 colorless " +
    "Phyrexian Wurm artifact creature token with deathtouch and a 3/3 " +
    "colorless Phyrexian Wurm artifact creature token with lifelink.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "create-token", token: "Phyrexian Wurm Token (Deathtouch)", count: 1 },
          { kind: "create-token", token: "Phyrexian Wurm Token (Lifelink)", count: 1 },
        ],
      },
      resolve: null,
      text:
        "When Wurmcoil Engine dies, create a 3/3 deathtouch Wurm and a 3/3 " +
        "lifelink Wurm.",
    },
  ],
});
