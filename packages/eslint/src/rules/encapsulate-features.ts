import path from 'node:path'
import type { TSESLint } from '@typescript-eslint/utils'
import { visitModuleSources } from '../module-sources.js'

type MessageId = 'sharedLayerImport' | 'internalFeatureImport'

interface FeatureOccurrence {
  name: string
  nameIndex: number
}

const sharedLayers = new Set([
  'middleware',
  'handlers',
  'services',
  'schema',
  'utils',
  'constants',
  'types',
])

function findFeatures(segments: string[]): FeatureOccurrence[] {
  const occurrences: FeatureOccurrence[] = []
  segments.forEach((segment, index) => {
    const feature = segments[index + 1]
    if (
      segment === 'features' &&
      feature !== undefined &&
      feature !== '.' &&
      feature !== '..'
    ) {
      occurrences.push({ name: feature, nameIndex: index + 1 })
    }
  })
  return occurrences
}

function isRelative(source: string): boolean {
  return (
    source === '.' ||
    source === '..' ||
    source.startsWith('./') ||
    source.startsWith('../')
  )
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isPublicFeatureEntry(
  innerSegments: string[],
  featureName: string,
): boolean {
  if (innerSegments.length === 0) return true
  if (innerSegments.length > 1) return false
  const entry = innerSegments[0]
  if (entry === undefined) return true
  return (
    /^index(?:\.[cm]?[jt]sx?)?$/i.test(entry) ||
    new RegExp(
      `^${escapeRegExp(featureName)}\\.route(?:\\.[cm]?[jt]sx?)?$`,
      'i',
    ).test(entry)
  )
}

const encapsulateFeatures: TSESLint.RuleModule<MessageId, []> = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Prevent shared layers from importing features and require external callers to mount features through <feature>.route.',
    },
    schema: [],
    messages: {
      sharedLayerImport:
        'Shared layers must not import "{{source}}" from features/. Move shared code into the matching src-level layer instead of depending on a feature.',
      internalFeatureImport:
        'Do not import feature internals "{{source}}" from outside that feature. Mount the feature through its root "<feature>.route" file, or move shared code to a src-level layer.',
    },
  },
  create(context) {
    const directory = path.posix.dirname(context.filename.replace(/\\/g, '/'))
    const callerSegments = directory.split('/').filter(Boolean)
    const callerFeatures = findFeatures(callerSegments)
    const lastCallerFeature = callerFeatures[callerFeatures.length - 1]
    const scopeSegments =
      lastCallerFeature !== undefined
        ? callerSegments.slice(lastCallerFeature.nameIndex + 1)
        : callerSegments.slice(callerSegments.lastIndexOf('src') + 1)
    const callerInSharedLayer = scopeSegments.some((segment) =>
      sharedLayers.has(segment),
    )

    return visitModuleSources(context, (source): MessageId | undefined => {
      const target = isRelative(source)
        ? path.posix.join(directory, source)
        : source
      const targetSegments = target.split('/').filter(Boolean)
      const targetFeatures = findFeatures(targetSegments)

      if (
        callerInSharedLayer &&
        callerFeatures.length === 0 &&
        targetSegments.includes('features')
      ) {
        return 'sharedLayerImport'
      }

      const extendsCallerFeatures =
        targetFeatures.length > callerFeatures.length &&
        callerFeatures.every(
          (feature, index) => feature.name === targetFeatures[index]?.name,
        )
      if (!extendsCallerFeatures) return undefined

      if (callerInSharedLayer) return 'sharedLayerImport'

      const enteredFeature = targetFeatures[callerFeatures.length]
      if (!enteredFeature) return undefined
      const innerSegments = targetSegments.slice(enteredFeature.nameIndex + 1)
      if (!isPublicFeatureEntry(innerSegments, enteredFeature.name)) {
        return 'internalFeatureImport'
      }
      return undefined
    })
  },
}

export default encapsulateFeatures
