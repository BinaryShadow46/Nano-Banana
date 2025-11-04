// Vercel Serverless function: /api/generate
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).send('Method Not Allowed');
  try{
    const {image_b64,prompt,num_images=3,size=1024}=req.body||{};
    if(!image_b64||!prompt) return res.status(400).json({error:'Missing image or prompt'});
    const API_KEY = process.env.GEMINI_API_KEY;
    if(!API_KEY) return res.status(500).json({error:'GEMINI_API_KEY missing'});

    const model='gemini-2.5-flash-image';
    const endpoint=`https://api.generativeai.google/v1/models/${model}:generate`;
    const body={
      input:[
        {type:'image',image:{data:image_b64.split(',').pop(),encoding:'base64'}},
        {type:'text',text:prompt}
      ],
      params:{num_images:Number(num_images),size:`${size}x${size}`}
    };

    const r = await fetch(endpoint,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${AIzaSyBqY-6jC0vd6xlfBykn1CR1dzFhiT10Zc4}`},
      body:JSON.stringify(body)
    });

    if(!r.ok){ const txt=await r.text(); return res.status(502).json({error:'Gemini API error',details:txt}); }
    const data=await r.json();
    const images=[];
    try{
      const candidates=data.candidates||data.outputs||[];
      for(const c of candidates){
        if(c.content && c.content.parts){
          for(const p of c.content.parts){
            if(p.inline_data && p.inline_data.data) images.push(p.inline_data.data);
          }
        }
        if(c.image && c.image.data) images.push(c.image.data);
      }
    }catch(e){ console.warn('Parse fallback',e); }
    if(!images.length && data.base64_image) images.push(data.base64_image);
    return res.status(200).json({images});
  }catch(err){ console.error(err); return res.status(500).json({error:'Internal server error',details:String(err)});}
}
