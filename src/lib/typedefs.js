/**
 * @namespace tocqdefs
 */

/**
 * @typedef DataNodeBody
 * @property {string} dataName
 * @property {number} [size]
 * @property {string} format
 * @property {{x: number, y: number}} position
 * @memberof tocqdefs
 */

/**
 * @typedef BaseNode
 * @property {string} id
 * /
 
/**
 * @typedef {BaseNode & DataNodeBody} DataNode
 */

/**
 * @typedef QueryNodeBody
 * @property {string} [statement]
 * @property {string} dataName
 * @property {string} format
 * @property {{x: number, y: number}} position
 * @memberof tocqdefs
 */

/**
 * @typedef {BaseNode & QueryNodeBody} QueryNode
 */

/**
 * @typedef ChartNodeBody
 * @property {string} chartConfig
 * @property {string} chartName
 * @property {{x: number, y: number}} position
 * @memberof tocqdefs
 */

/**
 * @typedef {BaseNode & ChartNodeBody} ChartNode
 */

/**
 * @typedef CsvConfig
 * @property {string} delimiter
 * @property {string} quote
 * @property {string} comment
 * @property {string} escape
 * @property {string} null_regex
 * @property {boolean} truncated
 * @memberof tocqdefs
 */
 