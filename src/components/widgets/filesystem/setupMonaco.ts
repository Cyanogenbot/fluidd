import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { loadWASM } from 'onigasm'
import { IGrammarDefinition, Registry } from 'monaco-textmate'
import { wireTmGrammars } from 'monaco-editor-textmate'
import getVueApp from '@/util/get-vue-app'
import themeDark from '@/monaco/theme/editor.dark.theme.json'
import themeLight from '@/monaco/theme/editor.light.theme.json'

const extruderRegExp = /^extruder[0-9]+$/

const getDocsSection = (sectionName: string) => {
  if (sectionName.startsWith('stepper_')) {
    return 'stepper'
  }

  if (extruderRegExp.test(sectionName)) {
    return 'extruder'
  }

  return sectionName
}

async function setupMonaco () {
  const wasm = await require('onigasm/lib/onigasm.wasm')
  await loadWASM(wasm.default)

  // Register our custom TextMate languages.
  const registry = new Registry({
    getGrammarDefinition: async (scopeName): Promise<IGrammarDefinition> => {
      const fileName = scopeName.split('.').pop()
      return import(
                /* webpackChunkName: "grammar-[request]" */
                `@/monaco/language/${fileName}.tmLanguage.json`
      )
        .then(language => {
          return Promise.resolve({
            format: 'json',
            content: language.default
          })
        })
    }
  })

  // Load our grammars...
  const grammars = new Map()
  grammars.set('gcode', 'source.gcode')
  grammars.set('klipper-config', 'source.klipper-config')
  grammars.set('log', 'text.log')

  // ... and our languages
  monaco.languages.register({ id: 'gcode', extensions: ['gcode', 'g', 'gc', 'gco', 'ufp', 'nc'] })
  monaco.languages.register({ id: 'klipper-config', extensions: ['cfg', 'conf'] })
  monaco.languages.register({ id: 'log', extensions: ['log'] })

  // Define how commenting works.
  monaco.languages.setLanguageConfiguration('gcode', {
    comments: {
      lineComment: ';'
    }
  })
  monaco.languages.setLanguageConfiguration('klipper-config', {
    comments: {
      lineComment: '#'
    }
  })

  const app = getVueApp()

  monaco.editor.registerCommand('fluidd_open_docs', (_, isMoonrakerConfig, hash) => {
    if (isMoonrakerConfig) {
      const url = app.$t('app.file_system.url.moonraker_config', { hash }).toString()
      window.open(url)
    } else {
      const url = app.$t('app.file_system.url.klipper_config', { hash }).toString()
      window.open(url)
    }
  })

  monaco.languages.registerCodeLensProvider('klipper-config', {
    provideCodeLenses: (model) => {
      const isMoonrakerConfig = model.uri.path.toLowerCase().endsWith('/moonraker.conf')

      const linesContent = model.getLinesContent()

      const sections = linesContent.reduce((ranges, lineContent, index) => {
        const section = /^\[([^\]]+)\]/.exec(lineContent)
        if (section) {
          const [sectionName] = section[1].split(' ')

          const referenceSection = getDocsSection(sectionName)

          return ranges.concat({
            referenceSection,
            range: {
              startLineNumber: index + 1,
              startColumn: model.getLineFirstNonWhitespaceColumn(index + 1),
              endLineNumber: index + 1,
              endColumn: model.getLineLastNonWhitespaceColumn(index + 1)
            }
          })
        }
        return ranges
      }, [] as { referenceSection: string, range: monaco.IRange }[])

      return {
        lenses: sections.map((section, index) =>
          ({
            range: section.range,
            id: `docs${index}`,
            command: {
              id: 'fluidd_open_docs',
              title: app.$t('app.file_system.label.view_section_documentation', { section: section.referenceSection }).toString(),
              arguments: [isMoonrakerConfig, section.referenceSection]
            }
          })
        ),
        dispose: () => undefined
      }
    },
    resolveCodeLens: (_model, codeLens) => codeLens
  })

  monaco.languages.registerFoldingRangeProvider('klipper-config', {
    provideFoldingRanges: (model) => {
      const linesContent = model.getLinesContent()

      return linesContent.reduce((sections, lineContent, index) => {
        const isSection = /^\[([^\]]+)\]/.test(lineContent)

        if (isSection) {
          return sections.concat({
            start: index + 1,
            end: index + 1,
            kind: monaco.languages.FoldingRangeKind.Region
          })
        }

        const lastSection = sections.length > 0 ? sections[sections.length - 1] : undefined
        const isLastSectionComment = lastSection?.kind === monaco.languages.FoldingRangeKind.Comment

        const isComment = lineContent.startsWith('#')

        if (isComment && !isLastSectionComment) {
          return sections.concat({
            start: index + 1,
            end: index + 1,
            kind: monaco.languages.FoldingRangeKind.Comment
          })
        }

        if (lineContent.trim().length > 0 && isComment === isLastSectionComment) {
          sections[sections.length - 1].end = index + 1
        }

        return sections
      }, [] as monaco.languages.FoldingRange[])
    }
  })

  // Defined the themes.
  monaco.editor.defineTheme('dark-converted', themeDark as any)
  monaco.editor.defineTheme('light-converted', themeLight as any)

  // Wire it up.
  await wireTmGrammars(monaco, registry, grammars)

  return monaco
}

// Exporting a promise ensures that setupMonaco is run only once
const promise = setupMonaco()
export default promise
