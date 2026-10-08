function clean(v){return String(v||'').trim().replace(/^['"]|['"]$/g,'');}
async function json(res){try{return await res.json();}catch{return null;}}
async function groq(body){
  const key=process.env.GROQ_API_KEY;if(!key) throw Object.assign(new Error('GROQ_API_KEY is missing in Vercel Environment Variables.'),{status:500});
  const model=clean(body.model||process.env.GROQ_MODEL||'openai/gpt-oss-120b');
  const messages=Array.isArray(body.messages)?body.messages:(Array.isArray(body.contents)?body.contents.map(c=>({role:'user',content:(c.parts||[]).map(p=>p.text||'').join('')})):[]);
  const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model,messages,temperature:0.2,response_format:{type:'json_object'}})});
  const d=await json(r);if(!r.ok)throw Object.assign(new Error(d?.error?.message||`Groq API HTTP ${r.status}`),{status:r.status});
  const text=d?.choices?.[0]?.message?.content;if(!text)throw Object.assign(new Error('Groq returned no text.'),{status:502});return {text,model:d?.model||model,provider:'Groq'};
}
async function gemini(body){
  const key=process.env.GEMINI_API_KEY;if(!key) throw Object.assign(new Error('GEMINI_API_KEY is missing in Vercel Environment Variables.'),{status:500});
  const model=clean(body.model||process.env.GEMINI_MODEL||'gemini-3.6-flash');
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:body.contents,generationConfig:body.generationConfig||{}})});
  const d=await json(r);if(!r.ok)throw Object.assign(new Error(d?.error?.message||`Gemini API HTTP ${r.status}`),{status:r.status});
  const text=(d?.candidates?.[0]?.content?.parts||[]).map(p=>p?.text||'').join('').trim();if(!text)throw Object.assign(new Error('Gemini returned no text.'),{status:502});return {text,model:d?.modelVersion||model,provider:'Google Gemini'};
}
module.exports=async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed. Use POST.'});
  const body=req.body||{};const provider=clean(body.provider||'groq').toLowerCase();
  try{
    let out;
    if(provider==='gemini') out=await gemini(body);
    else if(provider==='groq') out=await groq(body);
    else if(provider==='auto'){
      try{out=await gemini(body);}catch(e){out=await groq(body);out.fallbackUsed=true;}
    }else out=await groq(body);
    return res.status(200).json(out);
  }catch(e){return res.status(e.status||500).json({error:e.message||'AI service failed.'});}
};
