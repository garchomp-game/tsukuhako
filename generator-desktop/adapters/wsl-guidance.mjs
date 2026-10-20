// The helper diagnoses Linux tools, but a Windows user's setup is Desktop + WSL.
// Keep observations/states intact; only route the next action to the right host.
export function windowsGuidance(checks) {
  return checks.map(check => ({
    ...check,
    guide: 'windows',
    reason: `選択したWSL内の確認です。${check.reason}`,
    ...(check.id.startsWith('docker-') || check.id === 'compose' ? {
      nextAction: 'Windows側でDocker Desktopを起動し、Linux containers・WSL 2 backend・選択したWSLのIntegrationを確認します。そのWSLの通常ユーザーで docker version を確認してから、ツクハコで再確認してください。'
    } : {})
  }));
}
