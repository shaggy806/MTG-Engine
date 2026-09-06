import { defineCard } from "../define.js";

export default defineCard({
  name: "Wurmcoil Engine",
  manaCost: "{6}",
  types: ["artifact", "creature"],
  subtypes: ["Wurm"],
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
      effect: null,
      resolve: (ctx) => {
        ctx.createToken("Phyrexian Wurm Token (Deathtouch)", 1);
        ctx.createToken("Phyrexian Wurm Token (Lifelink)", 1);
      },
      text:
        "When Wurmcoil Engine dies, create a 3/3 deathtouch Wurm and a 3/3 " +
        "lifelink Wurm.",
    },
  ],
});
