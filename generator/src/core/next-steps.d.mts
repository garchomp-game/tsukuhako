type GuideProject = {
 request:{templateId:string}; destination:string; ports:Record<string,number>;
 templateVersion:string; projectName:string;
};
export function quickStart(plan:GuideProject, options:{platform:string;includeContext?:boolean}):string;
