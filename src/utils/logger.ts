/** 写 info 日志到 stderr */
export function info(message: string): void {
  process.stderr.write(`[INFO] ${message}\n`);
}

/** 写错误日志到 stderr */
export function error(message: string): void {
  process.stderr.write(`[ERROR] ${message}\n`);
}
