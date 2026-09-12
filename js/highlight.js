import { escapeHtml } from "./doc.js";

const SHELL_KEYWORDS = new Set([
  "if", "then", "else", "elif", "fi", "for", "while", "until", "do", "done",
  "case", "esac", "in", "function", "select", "time", "return", "break",
  "continue", "local", "export", "declare", "readonly", "alias", "unset",
  "set", "shift", "trap", "exit", "source", "eval", "exec", "wait", "let"
]);

const SHELL_BUILTINS = new Set([
  "echo", "printf", "read", "cd", "pwd", "ls", "cp", "mv", "rm", "mkdir",
  "rmdir", "touch", "cat", "grep", "sed", "awk", "find", "chmod", "chown",
  "sudo", "apt", "apt-get", "dpkg", "dnf", "yum", "pacman", "systemctl",
  "git", "curl", "wget", "tar", "gzip", "ln", "head", "tail", "sort", "uniq",
  "wc", "cut", "tr", "xargs", "tee", "test", "true", "false"
]);

const PY_KEYWORDS = new Set([
  "False", "None", "True", "and", "as", "assert", "async", "await", "break",
  "class", "continue", "def", "del", "elif", "else", "except", "finally",
  "for", "from", "global", "if", "import", "in", "is", "lambda", "nonlocal",
  "not", "or", "pass", "raise", "return", "try", "while", "with", "yield",
  "match", "case"
]);

const PY_BUILTINS = new Set([
  "print", "len", "range", "str", "int", "float", "list", "dict", "set",
  "tuple", "bool", "bytes", "type", "isinstance", "input", "open", "enumerate",
  "zip", "map", "filter", "sum", "min", "max", "abs", "round", "sorted",
  "reversed", "any", "all", "super", "self", "cls", "Exception", "ValueError",
  "TypeError", "RuntimeError"
]);

function span(cls, text) {
  return `<span class="tok tok--${cls}">${escapeHtml(text)}</span>`;
}

function normalize(lang) {
  const l = String(lang || "").toLowerCase().trim();
  if (l === "py" || l === "python3" || l === "python") return "python";
  if (["sh", "bash", "zsh", "shell", "ksh"].includes(l)) return "shell";
  return l;
}

/* ---------------- Shell / Bash / Zsh ---------------- */
function highlightShell(code) {
  let out = "";
  let i = 0;
  const n = code.length;

  while (i < n) {
    const ch = code[i];

    if (ch === "#") {
      let j = code.indexOf("\n", i);
      if (j === -1) j = n;
      out += span("comment", code.slice(i, j));
      i = j;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      let j = i + 1;
      while (j < n && code[j] !== quote) {
        if (code[j] === "\\" && quote !== "'") j++;
        j++;
      }
      j = Math.min(j + 1, n);
      out += span("str", code.slice(i, j));
      i = j;
      continue;
    }

    if (ch === "$") {
      let j = i + 1;
      if (code[j] === "{") {
        const end = code.indexOf("}", j);
        j = end === -1 ? n : end + 1;
      } else if (code[j] === "(") {
        let depth = 1;
        j++;
        while (j < n && depth > 0) {
          if (code[j] === "(") depth++;
          else if (code[j] === ")") depth--;
          j++;
        }
      } else {
        while (j < n && /[A-Za-z0-9_@*#?$!-]/.test(code[j])) j++;
      }
      out += span("var", code.slice(i, j));
      i = j;
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_]/.test(code[j])) j++;
      const word = code.slice(i, j);
      if (SHELL_KEYWORDS.has(word)) out += span("key", word);
      else if (SHELL_BUILTINS.has(word)) out += span("cmd", word);
      else out += escapeHtml(word);
      i = j;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < n && /[0-9.]/.test(code[j])) j++;
      out += span("num", code.slice(i, j));
      i = j;
      continue;
    }

    if (ch === "-" && (i === 0 || /\s/.test(code[i - 1]))) {
      let j = i + 1;
      if (code[j] === "-") j++;
      while (j < n && /[A-Za-z0-9-]/.test(code[j])) j++;
      if (j > i + 1) {
        out += span("opt", code.slice(i, j));
        i = j;
        continue;
      }
    }

    out += escapeHtml(ch);
    i++;
  }

  return out;
}

/* ---------------- Python ---------------- */
function highlightPython(code) {
  let out = "";
  let i = 0;
  const n = code.length;
  let expectName = false;

  while (i < n) {
    const ch = code[i];

    if (ch === "#") {
      let j = code.indexOf("\n", i);
      if (j === -1) j = n;
      out += span("comment", code.slice(i, j));
      i = j;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const triple = ch.repeat(3);
      if (code.startsWith(triple, i)) {
        const end = code.indexOf(triple, i + 3);
        const j = end === -1 ? n : end + 3;
        out += span("str", code.slice(i, j));
        i = j;
        continue;
      }
      let j = i + 1;
      while (j < n && code[j] !== ch && code[j] !== "\n") {
        if (code[j] === "\\") j++;
        j++;
      }
      j = Math.min(j + 1, n);
      out += span("str", code.slice(i, j));
      i = j;
      continue;
    }

    if (ch === "@") {
      let j = i + 1;
      while (j < n && /[A-Za-z0-9_.]/.test(code[j])) j++;
      out += span("key", code.slice(i, j));
      i = j;
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_]/.test(code[j])) j++;
      const word = code.slice(i, j);
      if (expectName) {
        out += span("func", word);
        expectName = false;
      } else if (PY_KEYWORDS.has(word)) {
        out += span("key", word);
        if (word === "def" || word === "class") expectName = true;
      } else if (PY_BUILTINS.has(word)) {
        out += span("cmd", word);
      } else {
        out += escapeHtml(word);
      }
      i = j;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < n && /[0-9.xXa-fA-F_eE]/.test(code[j])) j++;
      out += span("num", code.slice(i, j));
      i = j;
      continue;
    }

    out += escapeHtml(ch);
    i++;
  }

  return out;
}

/**
 * Devuelve el código resaltado según el lenguaje.
 * @param {string} code
 * @param {string} lang  bash | zsh | sh | python | ...
 */
export function highlight(code, lang) {
  const text = String(code ?? "").replace(/\r\n?/g, "\n");
  let l = normalize(lang);

  if (!["python", "shell"].includes(l)) {
    const first = text.split("\n", 1)[0] || "";
    if (/python/.test(first)) l = "python";
    else if (/(bash|zsh|\/sh\b|shell)/.test(first)) l = "shell";
  }

  if (l === "python") return highlightPython(text);
  if (l === "shell") return highlightShell(text);
  return escapeHtml(text);
}
