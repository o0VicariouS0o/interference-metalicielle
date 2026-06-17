const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
};

export const log = {
  info:  (m: string) => console.log(m),
  ok:    (m: string) => console.log(`${C.green}OK  ${C.reset}${m}`),
  warn:  (m: string) => console.log(`${C.yellow}WARN${C.reset} ${m}`),
  err:   (m: string) => console.log(`${C.red}ERR ${C.reset}${m}`),
  step:  (m: string) => console.log(`\n${C.bold}${C.cyan}▶ ${m}${C.reset}`),
  dim:   (m: string) => console.log(`${C.gray}${m}${C.reset}`),
  title: (m: string) => console.log(`\n${C.bold}${m}${C.reset}\n${'─'.repeat(m.length)}`),
};