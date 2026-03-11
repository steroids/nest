const allowedTypes = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
];

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // [2, 'always', allowedTypes]:
    // 2 = error, если правило нарушено
    // 'always' = type должен всегда входить в список allowedTypes
    // allowedTypes = разрешенные значения type
    'type-enum': [2, 'always', allowedTypes],

    // [2, 'always', 'lower-case']:
    // 2 = error, если правило нарушено
    // 'always' = scope должен всегда быть в lower-case
    // 'lower-case' = разрешены только строчные буквы в scope
    'scope-case': [2, 'always', 'lower-case'],

    // [0] = правило выключено, scope не ограничен конкретным списком значений
    'scope-enum': [0],

    // [0] = правило выключено, scope может быть как пустым, так и непустым
    'scope-empty': [0],

    // [2, 'never']:
    // 2 = error, если правило нарушено
    // 'never' = subject не должен быть пустым
    'subject-empty': [2, 'never'],

    // [0] = правило выключено, пустая строка перед body не требуется
    'body-leading-blank': [0],

    // [0] = правило выключено, максимальная длина строк в body не проверяется
    'body-max-line-length': [0],

    // [0] = правило выключено, пустая строка перед footer не требуется
    'footer-leading-blank': [0],

    // [0] = правило выключено, максимальная длина строк в footer не проверяется
    'footer-max-line-length': [0],

    // [0] = правило выключено, commitlint не требует использовать "!"
    // в header вместе с BREAKING CHANGE в body/footer
    'breaking-change-exclamation-mark': [0],

    // [2, 'always']:
    // 2 = error, если правило нарушено
    // 'always' = кастомное правило должно всегда выполняться
    // Запрещает BREAKING CHANGE в body/footer. Для breaking changes
    // нужно использовать только header: "type!:" или "type(scope)!:"
    'no-breaking-change-in-body-or-footer': [2, 'always'],
  },
  plugins: [
    {
      rules: {
        'no-breaking-change-in-body-or-footer': (parsed) => {
          const raw = parsed && typeof parsed.raw === 'string' ? parsed.raw : '';
          const [, ...rest] = raw.split(/\r?\n/);
          const nonHeader = rest.join('\n');
          const hasBreakingKeyword = /(^|\n)\s*BREAKING[ -]CHANGE\s*:/i.test(nonHeader);

          return [
            !hasBreakingKeyword,
            'BREAKING CHANGE is forbidden in body/footer. Use "type!:" or "type(scope)!:" in header.',
          ];
        },
      },
    },
  ],
};
