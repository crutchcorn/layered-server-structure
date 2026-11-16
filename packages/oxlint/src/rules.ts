import encapsulateFeatures from './rules/encapsulate-features.js'
import featureImports from './rules/feature-imports.js'
import handlerImports from './rules/handler-imports.js'
import logicImports from './rules/logic-imports.js'
import middlewareImports from './rules/middleware-imports.js'
import oneLogicPerFolder from './rules/one-logic-per-folder.js'
import pureImports from './rules/pure-imports.js'
import routeFiles from './rules/route-files.js'
import serviceImports from './rules/service-imports.js'

export const rules = {
  'one-logic-per-folder': oneLogicPerFolder,
  'route-files': routeFiles,
  'encapsulate-features': encapsulateFeatures,
  'feature-imports': featureImports,
  'handler-imports': handlerImports,
  'logic-imports': logicImports,
  'middleware-imports': middlewareImports,
  'pure-imports': pureImports,
  'service-imports': serviceImports,
}
