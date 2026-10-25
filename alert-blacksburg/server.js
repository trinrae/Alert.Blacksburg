import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const app=express(); const root=path.dirname(fileURLToPath(import.meta.url));
const PORT=process.env.PORT||3000;
app.disable('x-powered-by');
app.use(express.static(path.join(root,'public')));
const cache=new Map();
async function fetchCached(url, ttl=180000, mode='json') {
  const old=cache.get(url); if(old && Date.now()-old.at<ttl)return {...old,stale:false};
  const ctrl=new AbortController(); const timer=setTimeout(()=>ctrl.abort(),11000);
  try {
    const r=await fetch(url,{signal:ctrl.signal,headers:{'User-Agent':'AlertBlacksburg/1.0 (public information dashboard; contact: https://github.com)', 'Accept': mode==='json'?'application/geo+json, application/json':'application/rss+xml, application/xml, text/xml, */*'}});
    if(!r.ok)throw Error(`Upstream HTTP ${r.status}`);
    const data=mode==='json'?await r.json():await r.text();
    const record={data,at:Date.now(),stale:false};cache.set(url,record);return record;
  } catch(e){if(old)return {...old,stale:true};throw e;} finally {clearTimeout(timer)}
}
const lat=37.2296,lon=-80.4139;
const weatherUrl=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America%2FNew_York`;
const airUrl=`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5&timezone=America%2FNew_York`;
const nwsUrl=`https://api.weather.gov/alerts/active?point=${lat},${lon}`;
app.get('/api/health',(req,res)=>res.json({ok:true,city:'Blacksburg, Virginia',time:new Date().toISOString()}));
app.get('/api/weather',async(req,res)=>{try{const [w,a]=await Promise.allSettled([fetchCached(weatherUrl,180000),fetchCached(airUrl,300000)]);res.json({checked:new Date().toISOString(),weather:w.status==='fulfilled'?{current:w.value.data.current,units:w.value.data.current_units,stale:w.value.stale}:null,air:a.status==='fulfilled'?{current:a.value.data.current,units:a.value.data.current_units,stale:a.value.stale,modeled:true}:null,weatherError:w.status==='rejected',airError:a.status==='rejected'});}catch{res.status(502).json({error:'Weather unavailable'});}});
app.get('/api/alerts',async(req,res)=>{try{const r=await fetchCached(nwsUrl,120000);const now=Date.now();const items=(r.data.features||[]).filter(x=>{const end=Date.parse(x.properties?.ends||x.properties?.expires||'');return !Number.isFinite(end)||end>now;}).map(x=>({id:x.id,event:x.properties?.event||'NWS alert',severity:x.properties?.severity||'Unknown',headline:x.properties?.headline||'',description:x.properties?.description||'',instruction:x.properties?.instruction||'',area:x.properties?.areaDesc||'',onset:x.properties?.onset||null,expires:x.properties?.ends||x.properties?.expires||null,source:'National Weather Service',url:x.properties?.web||x.id}));res.json({source:'NWS API',checked:new Date().toISOString(),stale:r.stale,available:true,items,coverage:'Active alerts for a point in central Blacksburg; other New River Valley locations may differ.'});}catch(e){res.json({checked:new Date().toISOString(),available:false,stale:false,items:[],error:'NWS feed unavailable; check weather.gov directly.'});}});
function decodeXml(s){return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();}
function field(xml,tag){const m=xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,'i'));return m?decodeXml(m[1]):'';}
const newsUrl='https://news.google.com/rss/search?q=Blacksburg+Virginia+OR+Virginia+Tech+OR+Montgomery+County+Virginia&hl=en-US&gl=US&ceid=US:en';
app.get('/api/news',async(req,res)=>{try{const r=await fetchCached(newsUrl,900000,'text');const items=[...r.data.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0,12).map(x=>({title:field(x[1],'title'),url:field(x[1],'link'),published:field(x[1],'pubDate'),publisher:field(x[1],'source')||'Google News'})).filter(x=>x.title&&/^https?:\/\//.test(x.url));res.json({available:true,stale:r.stale,checked:new Date().toISOString(),source:'Google News RSS (aggregated headlines)',items});}catch{res.json({available:false,checked:new Date().toISOString(),items:[],error:'News feed unavailable. Open source directly.'});}});
app.get('/api/transport',(req,res)=>res.json({checked:new Date().toISOString(),automaticIncidents:false,note:'No verified machine-readable local transit disruption feed connected. Check official operator notices.',links:[{name:'Blacksburg Transit',url:'https://ridebt.org/'},{name:'Blacksburg Transit live information',url:'https://ridebt.org/'},{name:'Virginia 511 traffic and incidents',url:'https://www.511virginia.org/'},{name:'Town of Blacksburg',url:'https://www.blacksburg.gov/'}]}));
app.get('/api/sources',(req,res)=>res.json({weather:'https://www.weather.gov/rnk/',alerts:'https://www.weather.gov/alerts',roads:'https://www.511virginia.org/',transit:'https://ridebt.org/',news:'https://news.google.com/search?q=Blacksburg%20Virginia&hl=en-US&gl=US&ceid=US%3Aen',town:'https://www.blacksburg.gov/'}));
app.get('*',(req,res)=>res.sendFile(path.join(root,'public','index.html')));
app.listen(PORT,'0.0.0.0',()=>console.log('Alert.Blacksburg listening on '+PORT));
