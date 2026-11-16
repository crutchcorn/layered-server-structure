import path from 'node:path'
import type { FolderStructureConfig } from 'eslint-plugin-project-structure'
import { ROUTE_VERBS } from './route-conventions.js'
import { createFolderStructure } from 'eslint-plugin-project-structure'

type StructureRuleId =
  'modules' | 'services' | 'types' | 'testingUtilities' | 'assets'
type StructureRule = NonNullable<
  FolderStructureConfig<StructureRuleId>['rules']
>[StructureRuleId]

const kebabName = '{kebab-case}'
const descriptiveKebab = '{descriptive-kebab}'
const verbGroup = `(${ROUTE_VERBS.join('|')})`
const moduleFile = { name: `${kebabName}.ts` }
const declarations = { name: `${kebabName}.d.ts` }
const barrel = { name: 'index.ts' }
const layerTests = { name: `${kebabName}.(spec|test).ts` }
const featureTests = {
  name: `${descriptiveKebab}(.(route|logic))?.(spec|test).ts`,
}
const subrouteTests = {
  name: `${descriptiveKebab}(.${verbGroup})?(.(route|logic))?.(spec|test).ts`,
}

function recursiveDirectory(
  ruleId: StructureRuleId,
  files: StructureRule[],
): StructureRule {
  return {
    name: kebabName,
    children: [...files, { ruleId }],
  }
}

function layers(): StructureRule[] {
  return [
    { name: 'constants', ruleId: 'modules' },
    { name: 'handlers', ruleId: 'modules' },
    { name: 'middleware', ruleId: 'modules' },
    { name: 'schema', ruleId: 'modules' },
    {
      name: 'services',
      children: [
        { name: 'schemas', children: [declarations, barrel] },
        moduleFile,
        layerTests,
        { ruleId: 'services' },
      ],
    },
    { name: 'types', ruleId: 'types' },
    {
      name: 'utils',
      children: [
        { name: 'testing-utils', ruleId: 'testingUtilities' },
        moduleFile,
        layerTests,
        { ruleId: 'modules' },
      ],
    },
    { name: 'assets', ruleId: 'assets' },
  ]
}

export function createLssFolderStructure(root: string): FolderStructureConfig {
  if (typeof root !== 'string' || !path.isAbsolute(root)) {
    throw new TypeError(
      'LSS structure root must be an absolute project directory',
    )
  }

  return createFolderStructure({
    // An absolute path avoids upstream node_modules-based root discovery.
    projectRoot: root,
    structureRoot: 'src',
    longPathsInfo: false,
    regexParameters: {
      'descriptive-kebab': '(?!index(?=$|\\.))[a-z0-9]+(?:-[a-z0-9]+)*',
    },
    structure: [
      { name: '(app|index|main|server).ts' },
      { name: '(app|index|main|server).(spec|test).ts' },
      ...layers(),
      {
        name: 'features',
        children: [
          {
            name: descriptiveKebab,
            children: [
              { name: `${descriptiveKebab}.route.ts` },
              { name: `${descriptiveKebab}.logic.ts` },
              featureTests,
              barrel,
              ...layers(),
              {
                name: 'routes',
                children: [
                  {
                    name: kebabName,
                    children: [
                      { name: `${descriptiveKebab}.${verbGroup}.route.ts` },
                      { name: `${descriptiveKebab}.${verbGroup}.logic.ts` },
                      subrouteTests,
                      barrel,
                      ...layers(),
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    rules: {
      modules: recursiveDirectory('modules', [moduleFile, layerTests]),
      services: recursiveDirectory('services', [moduleFile, layerTests]),
      types: recursiveDirectory('types', [
        moduleFile,
        declarations,
        layerTests,
      ]),
      testingUtilities: recursiveDirectory('testingUtilities', [
        moduleFile,
        layerTests,
      ]),
      assets: recursiveDirectory('assets', [
        {
          name: `${kebabName}.(svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf|otf|mp3|mp4|webm|ogg|wav|wasm|json|sql|html|txt)`,
        },
      ]),
    },
  })
}
