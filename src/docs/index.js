const requireContext = require.context("./", false, /\.md$/);

const filePaths = requireContext.keys().map(requireContext);

/**
 * @type {string[]}
 */
export default filePaths;
