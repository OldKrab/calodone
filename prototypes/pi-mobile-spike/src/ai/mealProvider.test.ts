import assert from 'node:assert/strict';
import test from 'node:test';
import { zstdDecompressSync } from 'node:zlib';
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { streamSimple } from '@earendil-works/pi-ai/api/openai-codex-responses';
import { OPENAI_CODEX_MODELS } from '@earendil-works/pi-ai/providers/openai-codex.models';

// Keep Pi's real Codex request builder and SSE parser. Substitute only native
// services, credential lookup and HTTP; no real credentials or network are used.
const token='test.'+btoa(JSON.stringify({'https://api.openai.com/auth':{chatgpt_account_id:'fixture'}}))+'.test';
const fixture:any={model:{...Object.values(OPENAI_CODEX_MODELS)[0],reasoning:false},search:true,enabled:true,events:[]};
fixture.stream=(model:any,context:any,options:any)=>streamSimple(model,context,{...options,apiKey:token});
fixture.fetch=async(_url:any,init:any)=>{
  fixture.payload=JSON.parse(typeof init.body === 'string' ? init.body : zstdDecompressSync(init.body).toString());
  const output=[...(fixture.search?[{type:'web_search_call',id:'s',status:'completed',action:{sources:[{url:'https://source.test/drink',title:'Drink'}]}}]:[]),{type:'message',id:'msg',status:'completed',role:'assistant',content:[{type:'output_text',text:'{"title":"Spritz"}',annotations:[]}]}];
  const events=[...output.map(item=>({type:'response.output_item.done',item})),{type:'response.completed',response:{id:'resp-test',status:'completed',output,usage:{input_tokens:1,output_tokens:1,total_tokens:2}}}];
  return new Response(events.map(event=>`data: ${JSON.stringify(event)}\n\n`).join(''),{headers:{'content-type':'text/event-stream'}});
};
(globalThis as any).__mealProvider=fixture;
const sources:Record<string,string>={
  '@earendil-works/pi-ai':`export const contentText=content=>content.filter(x=>x.type==='text').map(x=>x.text).join('');
    export const getSupportedThinkingLevels=()=>[];export const createModels=()=>({setProvider(){},getModel:()=>globalThis.__mealProvider.model,getModels:()=>[globalThis.__mealProvider.model],streamSimple:(...args)=>globalThis.__mealProvider.stream(...args)});`,
  '@earendil-works/pi-agent-core':'export class Agent {}',
  'react-native':'export const AppState={currentState:"active"};',
  'expo/fetch':'export const fetch=(...args)=>globalThis.__mealProvider.fetch(...args);',
  'expo-file-system':'export class File {}',
  'expo-secure-store':`export const getItemAsync=async key=>key.includes('web-search')?String(globalThis.__mealProvider.enabled):null;`,
  './mobileRuntime':'export const installPiMobileRuntime=()=>{};',
  './mobileProviders':'export const mobilePiProviders=()=>[];',
  './openaiCodexMobileProvider':'export const openaiCodexMobileProvider=()=>({});',
  './secureCredentialStore':'export class SecureCredentialStore {}',
  '../services/foregroundRecovery':'export const waitForConnectionRecovery=async()=>{};',
  '../data/mealRepository':'export const getMeal=async()=>undefined;export const appendDiagnosticEvent=async event=>{globalThis.__mealProvider.events.push(event)};',
};
registerHooks({resolve(specifier,context,next){
  if(sources[specifier])return {url:'data:text/javascript,'+encodeURIComponent(sources[specifier]),shortCircuit:true};
  if(specifier.startsWith('.') && context.parentURL?.startsWith('file:')){
    const url=new URL(specifier+'.ts',context.parentURL);if(existsSync(fileURLToPath(url)))return next(url.href,context);
  }
  return next(specifier,context);
}});
const {refineMealAnalysis}=await import('./piClient.ts');
const input={mealId:'meal',photos:[],previousJson:'{}',question:'How much?',answer:'Google it, I drank the whole bottle',language:'English' as const};
test('real meal request forces search through Pi and returns provider evidence',async()=>{
  const result=await refineMealAnalysis(input);
  assert.deepEqual(fixture.payload.tool_choice,{type:'web_search'});
  assert.equal(result.research.status,'completed');
  assert.equal(result.research.sources[0].url,'https://source.test/drink');
  assert.equal(fixture.events.at(-1).searchStatus,'completed');
});
test('a provider that ignores forced search cannot return a successful meal estimate',async()=>{
  fixture.search=false;
  await assert.rejects(refineMealAnalysis(input),/search could not be verified/);
  assert.equal(fixture.events.at(-1).searchStatus,'not_searched');
});
test('disabled search remains disabled and is reported as unavailable',async()=>{
  fixture.enabled=false;
  const result=await refineMealAnalysis(input);
  assert.equal(result.research.status,'unavailable');
  assert.equal(fixture.payload.tools,undefined);
  assert.equal(fixture.payload.tool_choice,'auto');
});
