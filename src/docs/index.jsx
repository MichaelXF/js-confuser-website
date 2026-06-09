// Load all .md files eagerly (at build time)
const modules = import.meta.glob("./*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

/**
 * @type {Record<string, string>}
 */
export default modules;
