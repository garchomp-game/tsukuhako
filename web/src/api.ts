export async function api<T=Record<string,unknown>>(path:string,input?:Record<string,unknown>):Promise<T> {
 const response=await fetch(path,{method:input?'POST':'GET',headers:input?{'Content-Type':'application/json'}:undefined,body:input?JSON.stringify(input):undefined,cache:'no-store',credentials:'same-origin'});
 const value=await response.json() as {error?:string};
 if(!response.ok)throw new Error(value.error || '処理を続けられませんでした。');
 return value as T;
}
