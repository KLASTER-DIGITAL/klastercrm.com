/**
 * Линт сайта. Взят из репозитория аналитики и сокращён до того, что применимо
 * здесь: у сайта нет слоя amoCRM, поэтому исключений для `src/amo/**` нет, а
 * запрет прямого запроса к amoCRM становится строже — сайт не ходит в CRM
 * ВООБЩЕ. Лицензия проверяет подпись токена, а не спрашивает amoCRM.
 *
 *  1. `any` — только с комментарием, почему тип неизвестен.
 *  2. Прямой запрос к api/v4 или amocrm.ru — ошибка без исключений.
 *  3. `no-floating-promises` — потерянный await в роуте кабинета отдаёт ответ
 *     раньше, чем запись дошла до базы, и молча теряет заявку.
 */

import tseslint from 'typescript-eslint';

const AMO_URL = String.raw`api\/v4|amocrm\.ru`;

const NO_AMO =
  'Сайт не ходит в API amoCRM. Данные CRM живут в репозиториях виджетов, ' +
  'сюда они попадают только через наши собственные роуты.';

const restrictedHttpSyntax = [
  { selector: `CallExpression[callee.name='fetch'] > Literal[value=/${AMO_URL}/]`, message: NO_AMO },
  { selector: `CallExpression[callee.name='fetch'] > TemplateLiteral > TemplateElement[value.raw=/${AMO_URL}/]`, message: NO_AMO },
  { selector: `CallExpression[callee.property.name='fetch'] > Literal[value=/${AMO_URL}/]`, message: NO_AMO },
  { selector: `CallExpression[callee.property.name='fetch'] > TemplateLiteral > TemplateElement[value.raw=/${AMO_URL}/]`, message: NO_AMO },
];

/** `any` без комментария рядом. Комментарий — на той же строке или строкой выше. */
const anyNeedsComment = {
  meta: {
    type: /** @type {const} */ ('problem'),
    docs: { description: 'any допустим только с объяснением, почему тип неизвестен' },
    schema: [],
    messages: { bare: 'any без объяснения. Допустим только с комментарием рядом, почему тип неизвестен.' },
  },
  create(context) {
    const sourceCode = context.sourceCode;
    let covered = null;
    const coveredLines = () => {
      if (covered === null) {
        covered = new Set();
        for (const comment of sourceCode.getAllComments()) {
          for (let l = comment.loc.start.line; l <= comment.loc.end.line + 1; l += 1) covered.add(l);
        }
      }
      return covered;
    };
    return {
      TSAnyKeyword(node) {
        if (!coveredLines().has(node.loc.start.line)) context.report({ node, messageId: 'bare' });
      },
    };
  },
};

const klaster = { meta: { name: 'klaster', version: '1.0.0' }, rules: { 'any-needs-comment': anyNeedsComment } };

const klasterRules = {
  'klaster/any-needs-comment': 'error',
  'no-restricted-syntax': ['error', ...restrictedHttpSyntax],
  'no-restricted-imports': [
    'error',
    { paths: [{ name: 'undici', message: NO_AMO }, { name: 'node-fetch', message: NO_AMO }, { name: 'axios', message: NO_AMO }] },
  ],
  'no-eval': 'error',
  'no-implied-eval': 'error',
};

const noUnusedVars = [
  'error',
  { args: 'after-used', argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_', ignoreRestSiblings: true },
];

export default tseslint.config(
  { ignores: ['node_modules/**', '.next/**', 'coverage/**', '**/*.json'] },
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [tseslint.configs.recommended],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    plugins: { klaster },
    rules: {
      ...klasterRules,
      '@typescript-eslint/no-unused-vars': noUnusedVars,
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: { parser: tseslint.parser, parserOptions: { ecmaVersion: 2023, sourceType: 'module' } },
    plugins: { klaster },
    rules: { ...klasterRules, 'no-unused-vars': noUnusedVars },
  },
);
