require("ts-node/register");

module.exports = (async () => {
  const config = await import("./knexfile.ts");
  return config.default;
})();
