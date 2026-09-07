import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "./cards.js";
import { colorIdentityOf, identityString, withinIdentity } from "./identity.js";

const reg = createDefaultRegistry();
const id = (name: string): string => identityString(colorIdentityOf(reg.get(name)));

describe("colorIdentityOf (rule 903.4)", () => {
  it("reads the mana cost", () => {
    expect(id("Lightning Bolt")).toBe("R");
    expect(id("Ashmark, Mardu Vanguard")).toBe("WBR");
    expect(id("Bloodbraid Elf")).toBe("RG");
  });

  it("counts a hybrid pip's colours", () => {
    expect(id("Wilt-Leaf Cavaliers")).toBe("WG"); // {2}{G/W}{G/W}
  });

  it("reads mana symbols in rules / ability text, not just the cost", () => {
    expect(id("Forest")).toBe("G"); // colourless card, {T}: Add {G}
    expect(id("Doom Blade")).toBe("B"); // "nonblack" is not a symbol; {B} in cost
  });

  it("is colourless for a card with no coloured mana symbols anywhere", () => {
    expect(id("Sol Ring")).toBe("");
    expect(id("Command Tower")).toBe(""); // "any color" has no coloured pip
    expect(id("Chromatic Lantern")).toBe("");
  });

  it("withinIdentity checks containment", () => {
    const rg = colorIdentityOf(reg.get("Bloodbraid Elf"));
    expect(withinIdentity(colorIdentityOf(reg.get("Lightning Bolt")), rg)).toBe(true);
    expect(withinIdentity(colorIdentityOf(reg.get("Forest")), rg)).toBe(true);
    expect(withinIdentity(colorIdentityOf(reg.get("Doom Blade")), rg)).toBe(false); // B not in RG
    expect(withinIdentity(colorIdentityOf(reg.get("Sol Ring")), rg)).toBe(true); // colourless
  });
});
