// Verification utility only. The caller must pass the ChildProcess it spawned.
// Register the observation before issuing the synchronous window-close request.
export async function closeOwnedProcess(child, requestExit, {timeoutMs=15000, cleanupMs=2000}={}) {
  let onExit, onError;
  const alreadyExited=child.exitCode!==null||child.signalCode!==null;
  const exit=new Promise(resolve=>{
    onExit=(code,signal)=>resolve({code,signal});
    onError=error=>resolve({code:null,signal:null,error:String(error)});
    child.once('exit',onExit);
    child.once('error',onError);
    if(alreadyExited)onExit(child.exitCode,child.signalCode);
  });
  async function within(ms) {
    let timer;
    try { return await Promise.race([exit,new Promise(resolve=>{timer=setTimeout(()=>resolve(null),ms)})]); }
    finally { clearTimeout(timer); }
  }
  const result={pid:child.pid,status:'FAIL',requestIssued:false,timedOut:false,exitCode:null,signal:null,cleanup:[],cleanupComplete:false};
  function terminate(signal) {
    // Never kill by executable name or target a process group belonging to the host.
    if(child.exitCode!==null||child.signalCode!==null)return;
    try { result.cleanup.push({signal,sent:child.kill(signal)}); }
    catch(error) { result.cleanup.push({signal,error:String(error)}); }
  }
  try {
    let observed;
    if(alreadyExited) {
      observed=await exit;
      result.reason='EXITED_BEFORE_REQUEST';
    } else {
      try { result.requestIssued=true;requestExit(); }
      catch(error) { result.reason='EXIT_REQUEST_FAILED';result.error=String(error); }
      if(!result.error)observed=await within(timeoutMs);
      if(!observed) {
        if(!result.error) { result.timedOut=true;result.reason='TIMEOUT'; }
        terminate('SIGTERM');observed=await within(cleanupMs);
        if(!observed) { terminate('SIGKILL');observed=await within(cleanupMs); }
      }
    }
    result.exitCode=observed?.code??null;result.signal=observed?.signal??null;
    result.cleanupComplete=Boolean(observed&&!observed.error);
    if(observed?.error) { result.reason='PROCESS_ERROR';result.error=observed.error; }
    if(!result.reason)result.reason=result.signal?'SIGNAL_EXIT':result.exitCode===0?'NORMAL_EXIT':'NONZERO_EXIT';
    if(result.reason==='NORMAL_EXIT')result.status='PASS';
    return result;
  } finally {
    child.removeListener('exit',onExit);child.removeListener('error',onError);
  }
}
