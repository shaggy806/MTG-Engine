import { defineCard } from "../define.js";

const TEXT = "Other permanents you control have indestructible.";

export default defineCard({
  name: "The Walls of Ba Sing Se",
  manaCost: "{8}",
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 30,
  keywords: ["defender"],
  text: `Defender\n${TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { controlledBy: "you" }, excludeSelf: true },
      grantKeywords: ["indestructible"],
      text: TEXT,
    },
  ],
});
