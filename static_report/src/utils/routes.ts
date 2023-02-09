export const TABLE_DETAILS_ROUTE_PATH = '/tables/:tableName';
export const COLUMN_DETAILS_ROUTE_PATH = `${TABLE_DETAILS_ROUTE_PATH}/columns/:columnName*`;
export const RECONCILE_DETAILS_ROUTE_PATH = '/reconciles/:reconcileName';
export const RECONCILE_COLUMNS_DETAILS_ROUTE_PATH = `${RECONCILE_DETAILS_ROUTE_PATH}/rules/:ruleName*`;
export const ASSERTIONS_ROUTE_PATH = `/assertions`;
export const BM_ROUTE_PATH = `/business-metrics`;
