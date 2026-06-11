try {
  const h = await import("hardhat");
  console.log("Hardhat import success");
  console.log("Keys:", Object.keys(h.default));
} catch(e) {
  console.log("Hardhat import failed:", e.message);
}
