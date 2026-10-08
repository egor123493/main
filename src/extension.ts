import * as vscode from 'vscode';
 
type Issue = {
  line: number;
  column: number;
  message: string;
  code: string;
};
 
const SOURCE_LANGUAGES = ['cpp', 'c'];
 
// Декорация вместо диагностики: подчёркивание есть, в Problems ничего не появляется.
const unreachableDecoration = vscode.window.createTextEditorDecorationType({
  textDecoration: 'underline wavy #c586c0 1px',
  // Можно раскомментировать, чтобы строка ещё и слегка затенялась:
  // opacity: '0.6'
});
 
export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('cppDeadCode.analyzeFile', () =>
      analyzeEditor(vscode.window.activeTextEditor)
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('cppDeadCode.analyzeWorkspace', analyzeWorkspace)
  );
 
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(document => {
      const shouldAnalyze =
        isSource(document) &&
        vscode.workspace.getConfiguration('cppDeadCode').get<boolean>('analyzeOnSave', true);
      if (shouldAnalyze) {
        for (const editor of vscode.window.visibleTextEditors) {
          if (editor.document === document) decorateEditor(editor);
        }
      }
    })
  );
 
  // При смене активного редактора декорации нужно проставить заново —
  // они привязаны к конкретному TextEditor, а не к документу.
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor && isSource(editor.document)) decorateEditor(editor);
    })
  );
 
  for (const editor of vscode.window.visibleTextEditors) {
    if (isSource(editor.document)) decorateEditor(editor);
  }
}
 
function isSource(document: vscode.TextDocument): boolean {
  return SOURCE_LANGUAGES.includes(document.languageId);
}
 
function analyzeEditor(editor: vscode.TextEditor | undefined): void {
  if (!editor || !isSource(editor.document)) {
    vscode.window.showWarningMessage('Откройте файл C или C++ (.c, .cpp, .h, .hpp).');
    return;
  }
  decorateEditor(editor);
  vscode.window.showInformationMessage(
    'C++ Dead Code Inspector: анализ текущего файла завершён.'
  );
}
 
async function analyzeWorkspace(): Promise<void> {
  const uris = await vscode.workspace.findFiles(
    '**/*.{c,cc,cpp,cxx,h,hpp,hxx}',
    '**/{node_modules,.git}/**'
  );
  let analyzedCount = 0;
  for (const uri of uris) {
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = vscode.window.visibleTextEditors.find(e => e.document === document);
    if (editor) {
      decorateEditor(editor);
      analyzedCount++;
    }
    // Для невидимых документов декорации проставить нельзя (нужен TextEditor),
    // поэтому считаем только реально обработанные.
  }
  vscode.window.showInformationMessage(
    `C++ Dead Code Inspector: проверено открытых файлов: ${analyzedCount} из ${uris.length}.`
  );
}
 
/** Прогоняет анализ и расставляет декорации подчёркивания на видимом редакторе. */
function decorateEditor(editor: vscode.TextEditor): void {
  const issues = analyze(editor.document.getText());
 
  const ranges: vscode.DecorationOptions[] = issues.map(issue => {
    const lineLength = editor.document.lineAt(issue.line).text.length;
    const range = new vscode.Range(
      issue.line,
      issue.column,
      issue.line,
      Math.max(issue.column + 1, lineLength)
    );
    return { range, hoverMessage: issue.message };
  });
 
  editor.setDecorations(unreachableDecoration, ranges);
}
 
// Строка, целиком состоящая из return/throw/break/continue — безусловно завершает блок.
const TERMINATOR_PATTERN =
  /^\s*(return\b[^;]*;|throw\b[^;]*;|break\s*;|continue\s*;)\s*$/;
 
// Строка не содержит исполняемого кода: пустая, состоит только из скобок, либо это комментарий.
function isExecutableLine(trimmedLine: string): boolean {
  return (
    trimmedLine.length > 0 &&
    !/^[{}]+;?$/.test(trimmedLine) &&
    !trimmedLine.startsWith('//')
  );
}
 
/** Выполняет лёгкий лексический анализ потока управления без внешнего компилятора. */
export function analyze(source: string): Issue[] {
  const lines = stripCommentsAndStrings(source).split(/\r?\n/);
  const issues: Issue[] = [];
 
  const terminatedAtDepth = new Map<number, number>();
  let depth = 0;
 
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const opening = (line.match(/\{/g) || []).length;
    const closing = (line.match(/\}/g) || []).length;
 
    // 1. Закрываем блоки на этой строке — отметка стирается ТОЛЬКО здесь
    for (let i = 0; i < closing; i++) {
      terminatedAtDepth.delete(depth);
      depth = Math.max(0, depth - 1);
    }
 
    // 2. Проверяем недостижимость (без удаления отметки после warning)
    if (isExecutableLine(trimmed) && terminatedAtDepth.has(depth)) {
      issues.push({
        line: index,
        column: line.search(/\S/),
        message:
          'Недостижимая строка: перед ней есть безусловный оператор завершения управления.',
        code: 'unreachable-code'
      });
    }
 
    // 3. Если строка сама — терминатор, помечаем текущую глубину
    if (TERMINATOR_PATTERN.test(line)) {
      terminatedAtDepth.set(depth, index);
    }
 
    // 4. Наследуем "мёртвость" во все новые вложенные блоки
    if (opening > 0 && terminatedAtDepth.has(depth)) {
      const sourceLine = terminatedAtDepth.get(depth)!;
      for (let i = 1; i <= opening; i++) {
        terminatedAtDepth.set(depth + i, sourceLine);
      }
    }
 
    depth += opening;
  });
 
  return issues;
}
 
/** Заменяет содержимое комментариев и строковых/символьных литералов пробелами той же длины. */
function stripCommentsAndStrings(text: string): string {
  return text.replace(
    /\/\*[\s\S]*?\*\/|\/\/.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/gm,
    part => part.replace(/[^\n]/g, ' ')
  );
}
 
export function deactivate(): void {
  // Явная очистка не обязательна — decoration type освобождается с dispose,
  // но делаем это на всякий случай, если расширение активировалось повторно.
  unreachableDecoration.dispose();
}
 
