/**
 * Climate Control Card — custom Home Assistant dashboard card.
 * Copyright (c) 2026 luigi-regolo. SPDX-License-Identifier: GPL-3.0-only.
 * Local Home Assistant states/actions only. No telemetry, remote scripts, assets or credentials.
 */
(() => {
  'use strict';
  const TAG = 'climate-control-card';
  const EDITOR = `${TAG}-editor`;
  const MODES = ['complete','heat','ac','valves','custom'];
  const THEMES = ['auto','light','dark'];
  const MONTHS = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
  const ENTITY_RX = /^(climate|select|sensor|binary_sensor|switch|automation|script|input_boolean)\.[a-z0-9_]+$/;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safe = (v, domains) => { const s = String(v ?? '').trim(); return ENTITY_RX.test(s) && domains.includes(s.split('.')[0]) ? s : ''; };
  const txt = (v, n=70) => String(v ?? '').trim().slice(0,n);
  const icon = (mdi) => `<ha-icon icon="mdi:${mdi}" aria-hidden="true"></ha-icon>`;
  const valid = e => !!e && !['unknown','unavailable',''].includes(e.state);
  const num = v => (v === null || v === undefined || String(v).trim() === '' || !Number.isFinite(Number(v))) ? null : Number(v);
  const temp = (n,unit='°C') => Number.isFinite(n) ? `${n.toLocaleString('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1})}${esc(unit)}` : 'N/D';
  const clip = (v,min,max) => Math.min(max,Math.max(min,v));
  const bool = v => v === true;
  const list = (v,domains) => Array.isArray(v) ? v.map(x=>safe(x,domains)).filter(Boolean) : [];
  const defaults = Object.freeze({
    type:`custom:${TAG}`, title:'Clima Casa', eyebrow:'CLIMATE CONTROL CARD', show_eyebrow:true, show_title:true, theme_mode:'auto', layout:'complete', temperature_control:'arc',
    show_heat:true,show_ac:true,show_valves:true,show_stats:true,show_seasons:true,show_automations:true,
    controls_enabled:true, confirm_automation_disable:false,
    heat_entity:'', heat_schedule_entity:'',heat_preset_entity:'',heat_activity_entity:'',
    ac_entity:'',ac_program_entity:'',ac_activity_entity:'',
    heat_today:'',heat_week:'',heat_month:'',ac_today:'',ac_week:'',ac_month:'',
    winter_last:'',winter_previous:'',summer_last:'',summer_previous:'',
    winter_months:[11,12,1,2,3],summer_months:[6,7,8,9],
    valves:[],automations:[]
  });
  function uniqueMonths(v,def) {
    if (!Array.isArray(v)) return [...def];
    return [...new Set(v.map(Number).filter(n=>Number.isInteger(n)&&n>=1&&n<=12))].sort((a,b)=>a-b);
  }
  function normalize(raw={}) {
    const r=raw && typeof raw==='object'&&!Array.isArray(raw)?raw:{};
    const c={...defaults,...r};
    c.title=txt(c.title,60)||defaults.title; c.eyebrow=txt(c.eyebrow,65)||defaults.eyebrow; c.show_eyebrow=c.show_eyebrow!==false; c.show_title=c.show_title!==false;
    c.theme_mode=THEMES.includes(c.theme_mode)?c.theme_mode:'auto';
    c.layout=MODES.includes(c.layout)?c.layout:'complete';
    c.temperature_control=c.temperature_control==='ring'?'ring':'arc';
    for(const k of ['show_heat','show_ac','show_valves','show_stats','show_seasons','show_automations']) c[k]=c[k]!==false;
    c.controls_enabled=bool(c.controls_enabled);c.confirm_automation_disable=bool(c.confirm_automation_disable);
    for(const k of ['heat_entity','heat_preset_entity','ac_entity']) c[k]=safe(c[k],['climate']);
    for(const k of ['heat_schedule_entity','ac_program_entity']) c[k]=safe(c[k],['select']);
    for(const k of ['heat_activity_entity','ac_activity_entity']) c[k]=safe(c[k],['binary_sensor','switch','sensor','input_boolean']);
    for(const k of ['heat_today','heat_week','heat_month','ac_today','ac_week','ac_month','winter_last','winter_previous','summer_last','summer_previous']) c[k]=safe(c[k],['sensor']);
    c.winter_months=uniqueMonths(c.winter_months,defaults.winter_months);
    c.summer_months=uniqueMonths(c.summer_months,defaults.summer_months);
    c.valves=Array.isArray(c.valves)?c.valves.filter(x=>x&&typeof x==='object').map(x=>({
      entity:safe(x.entity,['climate']),name:txt(x.name,55),
      restore_method:['none','netatmo','script'].includes(x.restore_method)?x.restore_method:'none',
      restore_script:safe(x.restore_script,['script']),
      today:safe(x.today,['sensor']),week:safe(x.week,['sensor']),month:safe(x.month,['sensor']),
      activity_entity:safe(x.activity_entity,['binary_sensor','switch','sensor','input_boolean'])
    })):[];
    c.automations=Array.isArray(c.automations)?c.automations.filter(x=>x&&typeof x==='object').map(x=>({entity:safe(x.entity,['automation']),name:txt(x.name,65)})):[];
    return c;
  }
  const isShown=(c,k)=>{
    if (c.layout==='custom'||c.layout==='complete') return c[`show_${k}`]!==false;
    if(k==='stats'||k==='seasons'||k==='automations')return c[`show_${k}`]!==false;
    return (c.layout==='heat'&&k==='heat')||(c.layout==='ac'&&k==='ac')||(c.layout==='valves'&&k==='valves');
  };
  const actionStatus = e => {
    if(!valid(e))return {label:'Non disponibile',state:'off'};
    if(e.attributes?.hvac_action==='heating')return {label:'In funzione',state:'heat'};
    if(e.attributes?.hvac_action==='cooling')return {label:'Raffreddamento',state:'cool'};
    if(e.attributes?.hvac_action==='idle')return {label:'In attesa',state:'off'};
    if(e.state==='off')return {label:'Spento',state:'off'};
    return {label:'Acceso',state:e.state==='heat'?'heat':e.state==='cool'?'cool':'on'};
  };
  const friendly = (h,id,fallback)=> txt(h?.states?.[id]?.attributes?.friendly_name,65)||fallback;
  function formatDuration(e) {
    if(!valid(e))return 'N/D';
    let value=num(e.state);
    const unit=String(e.attributes?.unit_of_measurement??'').trim().toLowerCase();
    if(value!==null&&value>=0){
      let minutes=null;
      if(['h','hr','hrs','hour','hours','ore'].includes(unit))minutes=value*60;
      else if(['min','mins','minute','minutes','m'].includes(unit))minutes=value;
      else if(['s','sec','seconds','secondi'].includes(unit))minutes=value/60;
      if(minutes!==null){minutes=Math.round(minutes);return `${Math.floor(minutes/60)}h ${String(minutes%60).padStart(2,'0')}m`;}
      if(unit)return `${value.toLocaleString('it-IT',{maximumFractionDigits:1})} ${esc(e.attributes.unit_of_measurement)}`;
    }
    if(/^\d{1,4}:\d{2}(?::\d{2})?$/.test(String(e.state))) return esc(e.state);
    return 'N/D';
  }
  function numericHours(e){
    if(!valid(e))return null;const v=num(e.state),u=String(e.attributes?.unit_of_measurement??'').toLowerCase();
    if(v===null||v<0)return null;
    if(['h','hr','hrs','hours','hour','ore'].includes(u))return v;
    if(['min','mins','minutes','minute','m'].includes(u))return v/60;
    if(['s','sec','seconds','secondi'].includes(u))return v/3600;
    return null;
  }
  const hours = n => n===null?'N/D':`${n.toLocaleString('it-IT',{maximumFractionDigits:1})}h`;
  function tempLimits(e, fallbackMin=5,fallbackMax=30){
    const min=num(e?.attributes?.min_temp), max=num(e?.attributes?.max_temp),step=num(e?.attributes?.target_temp_step);
    return {min:min??fallbackMin,max:max??fallbackMax,step:step&&step>0?step:0.5};
  }
  function target(e){const n=num(e?.attributes?.temperature);return valid(e)?n:null;}
  function ambient(e){return valid(e)?num(e.attributes?.current_temperature):null;}
  const mdiMode = s => s==='heat'?'radiator':s==='cool'?'snowflake':s==='off'?'power-off':s==='dry'?'water-percent':s==='fan_only'?'fan':'thermostat';

  const LS='climate-control-card:v1:';
  const memGet=id=>{try{const v=JSON.parse(localStorage.getItem(LS+id)||'null');return v&&typeof v==='object'?{t:Number.isFinite(v.t)?v.t:undefined,m:typeof v.m==='string'?v.m.slice(0,30):undefined}:{};}catch(_){return {};}};
  const memSet=(id,patch)=>{if(!id)return;try{localStorage.setItem(LS+id,JSON.stringify({...memGet(id),...patch}));}catch(_){/* storage unavailable */}};
  const ARC={cx:75,cy:70,r:58};
  const arcPt=f=>{const a=Math.PI*(1-f);return [ARC.cx+ARC.r*Math.cos(a),ARC.cy-ARC.r*Math.sin(a)];};
  const arcD=f=>{const [x,y]=arcPt(f);return `M${ARC.cx-ARC.r} ${ARC.cy} A${ARC.r} ${ARC.r} 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`;};

  const CSS = `
    :host{display:block;min-width:0;container:cc-host/inline-size;font-family:var(--ha-font-family-body,Roboto,Arial,sans-serif);font-size:var(--ha-font-size-m,14px)}
    *,*:before,*:after{box-sizing:border-box}button,input,select{font:inherit}button{cursor:pointer}button:disabled{cursor:not-allowed;opacity:.46}
    button:focus-visible,svg:focus-visible{outline:2px solid var(--cc-green);outline-offset:2px}
    ha-icon{width:19px;height:19px;--mdc-icon-size:19px;display:inline-flex;vertical-align:middle;flex:none}
    .root{--cc-bg:#fff;--cc-panel:#F1F3EF;--cc-text:#19221E;--cc-muted:#68716C;--cc-border:#E3E7E2;--cc-green:var(--edera-emerald-color,#0E6B52);--cc-heat:var(--edera-heat-color,#C76F4F);--cc-cool:var(--edera-cool-color,#4F8193);--cc-heatbg:#F8F0EA;--cc-coolbg:#EBF2F3;--cc-heat-on:#F6E5DB;--cc-cool-on:#E0EDF0;--cc-off:#858E89;--cc-surface:#F6F7F3;
      color:var(--cc-text);background:var(--cc-bg);border:1px solid var(--cc-border);border-radius:22px;padding:14px 15px;min-width:0;container:climate/inline-size}
    .root.dark{--cc-bg:#101211;--cc-panel:#191c1a;--cc-text:#f5f7f4;--cc-muted:#bbc5bd;--cc-border:#2b302c;--cc-green:var(--edera-emerald-color,#0E6B52);--cc-heat:var(--edera-heat-color,#E28763);--cc-cool:var(--edera-cool-color,#6FA9C0);--cc-heatbg:#241d1a;--cc-coolbg:#1c272b;--cc-heat-on:#34241e;--cc-cool-on:#263740;--cc-off:#8B918E;--cc-surface:#191c1a}
    .root.layer-root{background:transparent;border:0;border-radius:0;padding:0}
    .header{margin-bottom:11px}.header.without-eyebrow .title{margin-top:0}.eyebrow{font-size:11px;letter-spacing:2.4px;font-weight:650;color:var(--cc-muted)}.title{font-weight:780;letter-spacing:-1px;font-size:27px;margin:4px 0 0;line-height:1.1}.title b{color:var(--cc-green)}
    .heroes{display:grid;grid-template-columns:1fr;gap:8px}
    .hero{border-radius:18px;border:1px solid var(--cc-border);background:var(--cc-panel);padding:11px 12px;min-width:0;display:flex;flex-direction:column;gap:9px}
    .hero.heat{background:linear-gradient(135deg,var(--cc-panel),var(--cc-heatbg))}.hero.heat.is-active{background:linear-gradient(135deg,var(--cc-panel),var(--cc-heat-on))}
    .hero.ac{background:linear-gradient(135deg,var(--cc-panel),var(--cc-coolbg))}.hero.ac.is-active{background:linear-gradient(135deg,var(--cc-panel),var(--cc-cool-on))}
    .row{display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0}
    .kicker{font-size:11px;letter-spacing:1.8px;font-weight:650;color:var(--cc-muted);display:flex;align-items:center;gap:6px;min-width:0}.kicker ha-icon{width:16px;height:16px;--mdc-icon-size:16px}
    .pill{display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:650;padding:5px 9px;background:var(--cc-bg);border-radius:999px;color:var(--cc-muted);white-space:nowrap;border:0}.pill ha-icon{width:14px;height:14px;--mdc-icon-size:14px}.pill.heat{color:var(--cc-heat)}.pill.cool{color:var(--cc-cool)}.pill.on{color:var(--cc-green)}.pill.off{color:var(--cc-off)}
    button.pill{border:1px solid var(--cc-border);min-height:30px;padding:4px 11px 4px 8px;font-size:11px;color:var(--cc-text)}
    button.pill.on{color:#fff;border-color:transparent}button.pill.on.cool{background:var(--cc-cool)}button.pill.on.heat{background:var(--cc-heat)}button.pill.on.generic{background:var(--cc-green)}
    .hero-main{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;min-width:0}
    .caption{font-size:10px;letter-spacing:1.6px;text-transform:uppercase;font-weight:650;color:var(--cc-muted);display:block;margin-bottom:2px}
    .big{font-size:30px;font-weight:650;letter-spacing:-1px;line-height:1.1;font-variant-numeric:tabular-nums}
    .step{width:36px;height:36px;display:grid;place-items:center;border:1px solid var(--cc-border);border-radius:12px;background:var(--cc-panel);color:var(--cc-text);padding:0;flex:none}.step:not(:disabled):hover{border-color:var(--tone,var(--cc-green))}.step:not(:disabled):active{transform:scale(.94)}.step ha-icon{--mdc-icon-size:18px;width:18px;height:18px}.root.dark .step{background:#191C1A;border-color:#2B302C}
    .arc{position:relative;width:150px;height:86px;flex:none;color:var(--cc-text)}
    .arc .g{width:150px;height:86px;display:block;overflow:visible;touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab}.arc .g:active{cursor:grabbing}.arc .g[aria-disabled="true"]{cursor:not-allowed;opacity:.5}
    .arc .trk{fill:none;stroke:color-mix(in srgb,var(--tone) 18%,var(--cc-border));stroke-width:9;stroke-linecap:round}.arc .fil{fill:none;stroke:var(--tone);stroke-width:9;stroke-linecap:round}.arc .thumb{fill:var(--cc-bg);stroke:var(--tone);stroke-width:4}
    .arc .mid{position:absolute;left:50%;top:34px;transform:translateX(-50%);text-align:center;pointer-events:none;line-height:1.1}.arc .mid strong{display:block;font-size:18px;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}.arc .mid small,.rmid small{display:block;font-size:7px;letter-spacing:.9px;font-weight:700;color:var(--cc-muted);margin-top:2px;white-space:nowrap}
    .arc .step{position:absolute;bottom:0;width:30px;height:30px;border-radius:50%;background:var(--cc-bg)}.arc .step.l{left:1px}.arc .step.r{right:1px}.root.dark .arc .step{background:#0E100F}
    .ringc{display:inline-flex;align-items:center;gap:7px}
    .ring{position:relative;width:84px;height:84px;flex:none}.ring svg{width:84px;height:84px;transform:rotate(-90deg);display:block}.ring circle{fill:none;stroke-width:5;stroke-linecap:round}.ring .rt{stroke:color-mix(in srgb,var(--tone) 18%,var(--cc-border))}.ring .rf{stroke:var(--tone);transition:stroke-dashoffset .25s}
    .rmid{position:absolute;inset:9px;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1}.rmid strong{font-size:18px;font-weight:700;letter-spacing:-.4px;font-variant-numeric:tabular-nums;white-space:nowrap}
    .bigstep{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:5px;border-radius:999px;border:1px solid color-mix(in srgb,var(--tone) 45%,transparent);background:color-mix(in srgb,var(--tone) 12%,transparent)}.bigstep .step{width:40px;height:40px;border-radius:50%;background:var(--cc-bg)}.bigstep strong{font-size:24px;font-weight:650;letter-spacing:-.6px;font-variant-numeric:tabular-nums}
    .details{width:100%;min-height:38px;display:flex;align-items:center;justify-content:center;gap:8px;min-width:0;padding:0 12px;border-radius:999px;border:1px solid color-mix(in srgb,var(--cc-green) 45%,transparent);background:color-mix(in srgb,var(--cc-green) 12%,transparent);color:var(--cc-green);font-size:13px;font-weight:650}.details .lbl{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.details ha-icon{--mdc-icon-size:17px;width:17px;height:17px}.root.dark .details{color:var(--cc-text)}
    .main-error{margin:12px 0 0;padding:11px 12px;border:1px solid #A65347;border-radius:11px;background:rgba(166,83,71,.10);color:#F2A89B;font-size:12px;line-height:1.5}
    .section{margin-top:12px}.section-title{font-size:10px;letter-spacing:1.65px;font-weight:800;color:var(--cc-muted);margin:0 0 9px}.section-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
    .tabs{display:inline-flex;background:var(--cc-panel);border:1px solid var(--cc-border);border-radius:999px;padding:2px;gap:2px}.tabs button{border:0;border-radius:999px;padding:6px 11px;background:transparent;color:var(--cc-muted);font-size:11px;font-weight:650}.tabs button.active{background:var(--cc-bg);color:var(--cc-green);box-shadow:0 0 0 1px var(--cc-border)}.tabs.tabs-top{margin-bottom:9px}
    .stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.stat{border:1px solid var(--cc-border);border-radius:14px;background:var(--cc-panel);padding:9px 10px;min-width:0}.stat label{font-size:10.5px;color:var(--cc-muted);display:flex;align-items:center;gap:5px}.stat label ha-icon{--mdc-icon-size:15px;width:15px;height:15px}.stat strong{display:block;font-size:21px;letter-spacing:-.5px;font-weight:650;margin-top:4px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.stat small{font-size:9.5px;color:var(--cc-muted)}
    .zones{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr));gap:7px}.zone{border:1px solid var(--cc-border);background:var(--cc-panel);border-radius:14px;padding:9px 10px;min-width:0;display:flex;flex-direction:column;gap:6px}.zone-top{display:flex;align-items:center;justify-content:space-between;gap:6px}.zone-top ha-icon{color:var(--cc-heat)}.zone-name{font-size:12.5px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.zone-meta{font-size:10.5px;color:var(--cc-muted)}.zone-bottom{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-top:auto}.zone-bottom strong{font-size:21px;font-weight:650;letter-spacing:-.5px}.zone-bottom small{font-size:10px;color:var(--cc-muted);text-align:right}.zone .details{min-height:34px;font-size:11px}
    .panel{border:1px solid var(--cc-border);border-radius:14px;background:var(--cc-panel);padding:10px 12px;margin-top:7px}.season-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.season-card{border:1px solid var(--cc-border);background:var(--cc-bg);border-radius:13px;padding:11px 12px}.season-card strong{font-size:13px}.metric{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:7px 0}.metric span{font-size:11px;color:var(--cc-muted)}.metric strong{font-size:14px;font-weight:650;font-variant-numeric:tabular-nums}.hint{font-size:10.5px;color:var(--cc-muted);line-height:1.45;margin:8px 0 0}
    .aut-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--cc-border)}.aut-row:last-child{border-bottom:0}.aut-row strong{font-size:12.5px;font-weight:650}.aut-row small{font-size:10.5px;color:var(--cc-muted);display:block;margin-top:3px}.switch{border:1px solid var(--cc-border);border-radius:999px;padding:2px;width:40px;height:24px;background:var(--cc-panel);display:flex;justify-content:flex-start;flex:none}.switch.on{justify-content:flex-end;background:var(--cc-green);border-color:var(--cc-green)}.switch i{width:18px;height:18px;border-radius:50%;background:var(--cc-bg)}.footer{font-size:10px;color:var(--cc-muted);margin:10px 2px 0}
    .accordion-list{margin-top:9px;display:grid;grid-template-columns:1fr;gap:6px}.accordion-item{min-width:0}.accordion-item.is-open{grid-column:1/-1}
    .accordion-head{display:flex;align-items:center;width:100%;min-height:48px;padding:7px 11px;gap:10px;text-align:left;background:var(--cc-panel);color:var(--cc-text);border:1px solid var(--cc-border);border-radius:14px;transition:border-color .15s ease}
    .accordion-head:hover,.accordion-head[aria-expanded="true"]{border-color:color-mix(in srgb,var(--cc-green) 70%,var(--cc-border))}
    .acc-leading{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:var(--cc-bg);border:1px solid var(--cc-border);color:var(--cc-muted);flex:none}.acc-leading.heat{color:var(--cc-heat)}.acc-leading.green{color:var(--cc-green)}.acc-leading ha-icon{width:17px;height:17px;--mdc-icon-size:17px}
    .acc-label{flex:1;display:block;min-width:0}.acc-title{display:block;font-size:13.5px;font-weight:650;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.acc-summary{font-size:11px;color:var(--cc-muted);font-weight:500;line-height:1.3;margin-top:1px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .acc-end{display:flex;align-items:center;gap:6px;color:var(--cc-muted);font-size:11px;font-weight:650;white-space:nowrap}.acc-end .txt{display:none}.acc-end ha-icon{width:17px;height:17px;--mdc-icon-size:17px}
    .acc-panel{margin-top:5px;padding:10px;border:1px solid var(--cc-border);border-radius:14px;background:var(--cc-surface);min-width:0}.acc-panel[hidden]{display:none}
    .acc-panel > section.section{margin-top:0}.acc-panel > section.section > h3.section-title{display:none}.acc-panel > section.section > .section-row > h3.section-title{display:none}.acc-panel > section.section > .section-row:first-child{justify-content:flex-start}.acc-panel > section.section > .panel{margin-top:0}.acc-panel > section.section > .panel > .panel{background:var(--cc-bg)}
    .backdrop{position:fixed;inset:0;z-index:9999;background:#0008;display:grid;place-items:center;padding:max(16px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));overscroll-behavior:none;touch-action:none}
    .dialog{width:min(330px,100%);min-height:min(340px,72vh);min-height:min(340px,72dvh);max-height:min(72vh,500px);max-height:min(72dvh,500px);border:1px solid var(--cc-border);border-radius:20px;background:var(--cc-bg);color:var(--cc-text);box-shadow:0 20px 70px #0007;display:flex;flex-direction:column;overflow:hidden;touch-action:auto}
    .root.dark .dialog{--cc-bg:#0E100F;--cc-panel:#191C1A;--cc-text:#F5F7F4;--cc-muted:#BBC5BD;--cc-border:#2B302C;--cc-green:#52B995;background:#0E100F;color:#F5F7F4}
    .dialog-head{display:flex;align-items:center;justify-content:space-between;padding:9px 10px 9px 15px;gap:10px;background:var(--cc-bg);flex:none;border-bottom:1px solid var(--cc-border)}.dialog-head strong{font-size:15px;font-weight:650;display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .close{width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:var(--cc-panel);border:0;border-radius:50%;color:var(--cc-text);flex:none;padding:0}.close ha-icon{--mdc-icon-size:18px;width:18px;height:18px}
    .dialog-body{padding:10px 14px 14px;overflow-y:auto;overscroll-behavior:contain;touch-action:pan-y;-webkit-overflow-scrolling:touch}
    .modal-block{background:var(--cc-panel);border:1px solid var(--cc-border);border-radius:14px;padding:8px 11px;margin-bottom:8px}.modal-block strong{font-weight:650}.modal-block.setpoint-shell{background:transparent;border:0;padding:0}
    .modal-title{font-size:10px;letter-spacing:1.6px;font-weight:650;margin:12px 0 6px;color:var(--cc-muted)}.dialog-body > .modal-title:first-child{margin-top:2px}
    .in-use{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 6px;padding:7px 11px;border-radius:14px;background:var(--cc-panel);border:1px solid var(--cc-border);font-size:12px;color:var(--cc-muted)}.in-use strong{color:var(--cc-text);font-weight:700;text-align:right;overflow-wrap:anywhere}
    .mode-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.mode-grid.g3{grid-template-columns:repeat(3,minmax(0,1fr))}
    .mode-grid button{border:1px solid var(--cc-border);border-radius:12px;min-height:38px;padding:8px 6px;color:var(--cc-text);background:var(--cc-bg);font-size:12px;font-weight:650;display:flex;align-items:center;justify-content:center;gap:6px;overflow-wrap:anywhere}.mode-grid ha-icon{width:15px;height:15px;--mdc-icon-size:15px}
    .mode-grid button:disabled{opacity:1;color:var(--cc-muted);cursor:not-allowed}.mode-grid button.active{background:#0E6B52;border-color:#0E6B52;color:#fff}.mode-grid button.active ha-icon{color:#fff}
    .modal-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.modal-stats div{background:var(--cc-panel);border:1px solid var(--cc-border);padding:8px 4px;text-align:center;border-radius:12px}.modal-stats strong{font-size:14px;font-weight:650;display:block}.modal-stats small{font-size:10px;color:var(--cc-muted)}.error{font-size:11px;color:#e16c5b;margin-top:9px}
    @container cc-host (min-width:620px){
      .root{padding:15px 17px;border-radius:24px}.heroes{grid-template-columns:repeat(2,minmax(0,1fr));align-items:stretch}.hero > .details{margin-top:auto}.hero-main{min-height:86px}
      .accordion-list{grid-template-columns:repeat(2,minmax(0,1fr))}.acc-end .txt{display:inline}
    }
    @container cc-host (max-width:430px){
      .acc-panel .stats{grid-template-columns:repeat(2,minmax(0,1fr))}.season-cards{grid-template-columns:1fr}.stat strong{font-size:20px}
    }
    @container cc-host (max-width:359px){
      .root{padding:11px 12px;border-radius:20px}.big{font-size:26px}.stats,.acc-panel .stats{grid-template-columns:repeat(2,minmax(0,1fr))}.zones{grid-template-columns:repeat(2,minmax(0,1fr))}.details{font-size:12px;gap:6px}
    }
    @container cc-host (max-width:330px){.acc-panel .stats{grid-template-columns:1fr}.acc-title{font-size:13px}}
    @media(max-width:340px){.mode-grid.g3{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
  `;
  const LAYER_CSS=CSS.replace('container:cc-host/inline-size;','').replace(';container:climate/inline-size}','}');
  class ClimateControlCard extends HTMLElement {
    constructor(){
      super();this.attachShadow({mode:'open'});this._cfg=normalize();this._hass=null;
      this._period=0;this._season='winter';this._statTab='times';this._accOpen={valves:false,stats:false,automations:false};this._modal=null;
      this._pending=new Set();this._overrides=new Map();this._lastAcModes=new Map();this._pendingTemp=new Map();this._error='';this._lock=null;this._sig='';this._drag=null;this._layer=null;this._layerHtml='';
      this._media=typeof matchMedia==='function'?matchMedia('(prefers-color-scheme: dark)'):null;
      this._onKey=e=>{if(e.key==='Escape'&&this._modal)this._close()};
      const r=this.shadowRoot;
      r.addEventListener('click',e=>this._click(e));
      r.addEventListener('pointerdown',e=>this._arcDown(e));
      r.addEventListener('pointermove',e=>this._arcMove(e));
      r.addEventListener('pointerup',e=>this._arcUp(e));
      r.addEventListener('pointercancel',()=>this._arcCancel());
      r.addEventListener('keydown',e=>this._arcKey(e));
    }
    static getStubConfig(){return {title:'Clima Casa',theme_mode:'auto',controls_enabled:true,layout:'complete'}}
    static getConfigElement(){return document.createElement(EDITOR)}
    getCardSize(){return 5+Math.ceil(this._cfg.valves.length/3)}
    setConfig(c){this._cfg=normalize(c);this._sig='';this._render()}
    set hass(h){this._hass=h;this._render()}
    connectedCallback(){document.addEventListener('keydown',this._onKey);this._media?.addEventListener?.('change',this._onMedia=()=>this._render());this._sig='';this._render()}
    disconnectedCallback(){document.removeEventListener('keydown',this._onKey);if(this._onMedia)this._media?.removeEventListener?.('change',this._onMedia);this._drag=null;this._removeLayer();this._unlock()}
    _state(id){return id?this._hass?.states?.[id]:null}
    _dark(){return this._cfg.theme_mode==='dark'||(this._cfg.theme_mode==='auto'&&(this._hass?.themes?.darkMode ?? !!this._media?.matches))}
    _enabled(){return this._cfg.controls_enabled}
    _clock(){return this._hass?.config?.time_zone||Intl.DateTimeFormat().resolvedOptions().timeZone}
    _select(c){const e=this._state(c);return valid(e)&&Array.isArray(e.attributes?.options)?e.attributes.options.filter(x=>typeof x==='string'):[]}
    _heatPreset(){
      const id=this._cfg.heat_preset_entity||this._cfg.heat_entity;
      const entity=this._state(id);
      const modes=valid(entity)&&Array.isArray(entity.attributes?.preset_modes)
        ?entity.attributes.preset_modes.filter(mode=>typeof mode==='string'):[];
      return {id,entity,modes};
    }
    _shown(id,e){
      const t=target(e),p=this._pendingTemp.get(id);
      if(p){if(Date.now()>p.until||(t!==null&&Math.abs(t-p.value)<0.05))this._pendingTemp.delete(id);else return p.value;}
      if(t!==null){if(memGet(id).t!==t)memSet(id,{t});return t;}
      if(!valid(e))return null;
      const r=num(memGet(id).t);
      if(r===null)return null;
      const {min,max}=tempLimits(e,id===this._cfg.ac_entity?16:5,30);
      return clip(r,min,max);
    }
    _heatInUse(){
      const c=this._cfg,schedule=this._state(c.heat_schedule_entity),{entity,modes}=this._heatPreset();
      const active=valid(entity)&&modes.includes(entity.attributes?.preset_mode)?entity.attributes.preset_mode:'';
      const special=['away','frost_guard','boost'].includes(active)?active:'';
      return special?({away:'Assente',frost_guard:'Antigelo',boost:'Boost'}[special]):valid(schedule)?schedule.state:active==='schedule'?'Programmazione':'Non disponibile';
    }
    _tempCtrl(id,kind,compact=false){
      const e=this._state(id),v=this._shown(id,e),unit=this._hass?.config?.unit_system?.temperature||'°C';
      const {min,max,step}=tempLimits(e,kind==='ac'?16:5,30),enabled=this._enabled()&&v!==null&&(Number(e?.attributes?.supported_features||0)&1)!==0;
      const dis=enabled?'':'disabled',lab='Temperatura impostata',tone=`--tone:var(--cc-${kind==='ac'?'cool':'heat'})`;
      const btn=(dir,name,cls)=>`<button class="step ${cls}" data-action="adjust" data-id="${esc(id)}" data-dir="${dir}" ${dis} aria-label="${name}">${icon(dir<0?'minus':'plus')}</button>`;
      const minus=btn(-1,'Diminuisci temperatura','l'),plus=btn(1,'Aumenta temperatura','r');
      if(compact)return `<div class="bigstep" style="${tone}">${minus}<strong role="img" aria-label="${lab} ${temp(v,unit)}">${temp(v,unit)}</strong>${plus}</div>`;
      const f=v===null?0:clip((v-min)/Math.max(0.1,max-min),0,1);
      if(this._cfg.temperature_control==='ring'){
        const C=2*Math.PI*37,n=v===null?'—':`${v.toLocaleString('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1})}°`;
        return `<div class="ringc" style="${tone}">${minus}<div class="ring" role="img" aria-label="${lab} ${temp(v,unit)}"><svg viewBox="0 0 84 84" aria-hidden="true"><circle class="rt" cx="42" cy="42" r="37"/><circle class="rf" cx="42" cy="42" r="37" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C*(1-f)).toFixed(1)}"/></svg><div class="rmid"><strong>${n}</strong><small>IMPOSTATA</small></div></div>${plus}</div>`;
      }
      const [tx,ty]=arcPt(f);
      return `<div class="arc" style="${tone}"><svg class="g" viewBox="0 0 150 86" data-arc data-id="${esc(id)}" data-min="${min}" data-max="${max}" data-step="${step}" data-unit="${esc(unit)}" role="slider" tabindex="${enabled?0:-1}" aria-label="${lab}" aria-valuemin="${min}" aria-valuemax="${max}" aria-valuenow="${v??min}" aria-valuetext="${temp(v,unit)}" ${enabled?'':'aria-disabled="true"'}><path class="trk" d="M${ARC.cx-ARC.r} ${ARC.cy} A${ARC.r} ${ARC.r} 0 0 1 ${ARC.cx+ARC.r} ${ARC.cy}"/><path class="fil" d="${arcD(f)}"/><circle class="thumb" cx="${tx.toFixed(2)}" cy="${ty.toFixed(2)}" r="8"/></svg><div class="mid"><strong>${temp(v,unit)}</strong><small>IMPOSTATA</small></div>${minus}${plus}</div>`;
    }
    _heating(){
      const c=this._cfg,hasClimate=!!c.heat_entity,e=this._state(c.heat_entity),stat=actionStatus(e),isActive=hasClimate&&stat.state==='heat';
      const te=ambient(e),unit=this._hass?.config?.unit_system?.temperature||'°C';
      const {modes}=this._heatPreset(),hasPreset=!!(c.heat_schedule_entity||modes.length);
      return `<section class="hero heat ${isActive?'is-active':''}"><div class="row"><div class="kicker">${icon('radiator')} RISCALDAMENTO</div>${hasClimate?`<span class="pill ${stat.state==='heat'?'heat':stat.state==='off'?'off':'on'}">${stat.state==='heat'?icon('fire'):icon('thermostat')} ${esc(stat.label)}</span>`:''}</div>
        ${hasClimate?`<div class="hero-main"><div><span class="caption">Ambiente</span><div class="big">${temp(te,unit)}</div></div>${this._tempCtrl(c.heat_entity,'heat')}</div>`:''}
        ${hasPreset?`<button class="details" data-action="open-program" aria-haspopup="dialog" aria-label="Preset riscaldamento" ${(this._select(c.heat_schedule_entity).length||modes.length)?'':'disabled'}><span class="lbl">Preset</span>${icon('chevron-right')}</button>`:''}</section>`;
    }
    _aircon(){
      const c=this._cfg,e=this._state(c.ac_entity),stat=actionStatus(e),modes=valid(e)&&Array.isArray(e.attributes?.hvac_modes)?e.attributes.hvac_modes:[],unit=this._hass?.config?.unit_system?.temperature||'°C';
      const isOn=valid(e)&&e.state!=='off',isActive=['cool','heat'].includes(stat.state);
      const opts=modes.filter(x=>x!=='off');
      if(isOn&&modes.includes(e.state)){this._lastAcModes.set(c.ac_entity,e.state);if(memGet(c.ac_entity).m!==e.state)memSet(c.ac_entity,{m:e.state});}
      const features=Number(e?.attributes?.supported_features||0);
      const canPower=valid(e)&&(modes.includes('off')||(!isOn&&(features&256)!==0)||(isOn&&(features&128)!==0));
      const presets=valid(e)&&Array.isArray(e.attributes?.preset_modes)?e.attributes.preset_modes:[];
      const hasMenu=!!(opts.length||presets.length||c.ac_program_entity);
      const tone=stat.state==='cool'?'cool':stat.state==='heat'?'heat':stat.state==='off'?'off':'on';
      const badge=(canPower&&this._enabled())
        ?`<button class="pill ${isOn?`on ${tone==='heat'?'heat':tone==='cool'?'cool':'generic'}`:''}" data-action="power-ac" data-id="${esc(c.ac_entity)}" aria-pressed="${isOn}" aria-label="${isOn?'Spegni':'Accendi'} climatizzatore">${icon('power')} ${esc(stat.label)}</button>`
        :`<span class="pill ${tone}">${icon(stat.state==='off'?'power-off':mdiMode(e?.state))} ${esc(stat.label)}</span>`;
      return `<section class="hero ac ${isActive?'is-active':''}"><div class="row"><div class="kicker">${icon('air-conditioner')} CLIMATIZZATORE</div>${badge}</div>
        <div class="hero-main"><div><span class="caption">Ambiente</span><div class="big">${temp(ambient(e),unit)}</div></div>${this._tempCtrl(c.ac_entity,'ac')}</div>
        ${hasMenu?`<button class="details" data-action="open-ac" aria-haspopup="dialog" aria-label="Preset climatizzatore"><span class="lbl">Preset</span>${icon('chevron-right')}</button>`:''}</section>`;
    }
    _stats(){const c=this._cfg,p=['today','week','month'][this._period],heat=isShown(c,'heat')&&!!c.heat_entity,ac=isShown(c,'ac')&&!!c.ac_entity,zones=isShown(c,'valves')&&c.valves.length;
      const demands=c.valves.map(v=>{
        const s=this._state(v.activity_entity||v.entity);
        if(!valid(s))return null;
        if(v.activity_entity)return s.state==='on'?true:s.state==='off'?false:null;
        const action=s.attributes?.hvac_action;
        return action==='heating'?true:['idle','off'].includes(action)?false:null;
      });
      const active=demands.filter(x=>x===true).length;
      const measured=demands.filter(x=>x!==null).length;
      const data=[];
      if(zones){data.push({name:'Valvole attive',value:measured===c.valves.length?`${active} / ${c.valves.length}`:'N/D',foot:'Richiesta calore · ora',icon:'radiator',color:'heat'})}
      if(heat)data.push({name:'Riscaldamento',value:formatDuration(this._state(c[`heat_${p}`])),foot:'Durata dal sensore',icon:'fire',color:'heat'});
      if(ac)data.push({name:'Climatizzatore',value:formatDuration(this._state(c[`ac_${p}`])),foot:'Durata dal sensore',icon:'snowflake',color:'cool'});
      if(!data.length)return '';
      return `<section class="section"><div class="section-row" style="margin-bottom:10px"><h3 class="section-title" style="margin:0">TEMPI DI FUNZIONAMENTO</h3><div class="tabs">${['Oggi','Settimana','Mese'].map((x,i)=>`<button data-action="period" data-index="${i}" class="${i===this._period?'active':''}">${x}</button>`).join('')}</div></div><div class="stats" style="grid-template-columns:repeat(${Math.min(3,data.length)},minmax(0,1fr))">${data.map(d=>`<div class="stat"><label>${icon(d.icon)} ${esc(d.name)}</label><strong>${esc(d.value)}</strong><small>${d.foot}</small></div>`).join('')}</div></section>`;
    }
    _valves(){const c=this._cfg;if(!c.valves.length)return '';
      return `<section class="section"><h3 class="section-title">VALVOLE TERMOSTATICHE</h3><div class="zones">${c.valves.map((v,i)=>{
        const e=this._state(v.entity),s=actionStatus(e),name=v.name||friendly(this._hass,v.entity,`Valvola ${i+1}`);
        const current=ambient(e),t=this._shown(v.entity,e),period=['today','week','month'][this._period],dur=formatDuration(this._state(v[period]));
        return `<div class="zone"><div class="zone-top">${icon('radiator')}<span class="pill ${s.state==='heat'?'heat':'off'}">${esc(s.label)}</span></div><div><div class="zone-name">${esc(name)}</div><div class="zone-meta">Ambiente ${temp(current)}</div></div><div class="zone-bottom"><strong role="img" aria-label="Temperatura impostata ${temp(t)}">${temp(t)}</strong><small>${esc(dur)}<br>${['oggi','settimana','mese'][this._period]}</small></div><button class="details" data-action="open-valve" data-index="${i}" aria-haspopup="dialog"><span class="lbl">Dettagli e stato</span>${icon('chevron-right')}</button></div>`;
      }).join('')}</div></section>`;
    }
    _seasons(){const c=this._cfg,choices=[];if(isShown(c,'heat')&&c.heat_entity)choices.push(['winter','Inverno']);if(isShown(c,'ac')&&c.ac_entity)choices.push(['summer','Estate']);if(!choices.length)return '';
      const chosen=choices.some(x=>x[0]===this._season)?this._season:choices[0][0];if(this._season!==chosen)this._season=chosen;
      return `<section class="section"><div class="panel"><div class="section-row"><span class="caption" style="margin:0">CONFRONTO PER STAGIONE</span><div class="tabs">${choices.map(([s,n])=>`<button class="${chosen===s?'active':''}" data-action="season" data-value="${s}" aria-pressed="${chosen===s}">${n}</button>`).join('')}</div></div>${this._seasonCards()}</div></section>`;
    }
    _statsBody(hasT,hasS){
      const tab=hasT&&hasS?this._statTab:(hasT?'times':'seasons');
      const tabs=hasT&&hasS?`<div class="tabs tabs-top">${[['times','Tempi'],['seasons','Stagioni']].map(([k,n])=>`<button class="${tab===k?'active':''}" data-action="stat-tab" data-value="${k}" aria-pressed="${tab===k}">${n}</button>`).join('')}</div>`:'';
      return tabs+(tab==='times'?this._stats():this._seasons());
    }
    _automations(){const c=this._cfg;return `<section class="section"><div class="panel">${c.automations.length?c.automations.map((a,i)=>{
      const e=this._state(a.entity),known=valid(e),on=known&&e.state==='on';return `<div class="aut-row"><div><strong>${esc(a.name||friendly(this._hass,a.entity,`Automazione ${i+1}`))}</strong><small>${!known?'Non disponibile':on?'Abilitata':'Disabilitata'}</small></div><button class="switch ${on?'on':''}" data-action="automation" data-index="${i}" role="switch" aria-label="${on?'Disabilita':'Abilita'} automazione" aria-checked="${on}" ${this._enabled()&&known&&!this._pending.has(JSON.stringify(['automation',on?'turn_off':'turn_on',undefined]))?'':'disabled'}><i></i></button></div>`;
    }).join(''):`<p class="hint" style="margin:0">Configura automazioni nell'editor della card.</p>`}</div></section>`;}
    _popup(){if(!this._modal)return '';
      const c=this._cfg,en=this._enabled()?'':'disabled';
      const mk=(act,val,label,on)=>`<button data-action="${act}" data-value="${esc(val)}" class="${on?'active':''}" ${en}>${on?icon('check'):''}${esc(label)}</button>`;
      const kind=this._modal.kind;let name='',body='';
      if(kind==='valve'){
        const i=this._modal.index,v=c.valves[i];if(!v)return '';
        const e=this._state(v.entity),t=this._shown(v.entity,e),mode=actionStatus(e),restore=v.restore_method==='netatmo'||v.restore_method==='script'&&!!v.restore_script;
        const canOff=Array.isArray(e?.attributes?.hvac_modes)&&e.attributes.hvac_modes.includes('off');
        const o=this._overrides.get(v.entity);
        name=v.name||friendly(this._hass,v.entity,`Valvola ${i+1}`);
        body=`<div class="modal-block"><div class="row"><span class="caption" style="margin:0">Temperatura ambiente</span><strong>${temp(ambient(e))}</strong></div><div class="row" style="margin-top:8px"><span class="caption" style="margin:0">Stato</span><span class="pill ${mode.state==='heat'?'heat':'off'}">${esc(mode.label)}</span></div></div>
          <div class="modal-block setpoint-shell">${this._tempCtrl(v.entity,'heat',true)}</div>
          <h3 class="modal-title">GESTIONE VALVOLA</h3><div class="mode-grid g3"><button data-action="manual" data-index="${i}" ${this._enabled()&&t!==null?'':'disabled'}>${icon('thermometer-plus')} Manuale</button><button data-action="valve-off" data-index="${i}" ${this._enabled()&&canOff?'':'disabled'}>${icon('power')} Spegni</button><button data-action="restore" data-index="${i}" ${this._enabled()&&restore?'':'disabled'}>${icon('calendar-check')} Programma</button></div>
          <p class="hint">${o?`Ultimo comando dalla card: ${esc(o.mode)} (${esc(new Intl.DateTimeFormat('it-IT',{hour:'2-digit',minute:'2-digit'}).format(new Date(o.time)))})`:'Modalità manuale e stato del programma dipendono dall’integrazione configurata.'}</p>
          <h3 class="modal-title">TEMPO DI FUNZIONAMENTO</h3><div class="modal-stats">${[['Oggi','today'],['Settimana','week'],['Mese','month']].map(([n,k])=>`<div><strong>${formatDuration(this._state(v[k]))}</strong><small>${n}</small></div>`).join('')}</div>
          <p class="hint">La richiesta di calore non coincide necessariamente con l'apertura fisica della valvola. I tempi sono quelli dei sensori selezionati.</p>`;
      }else if(kind==='heat-program'){
        const selectId=c.heat_schedule_entity,{entity,modes}=this._heatPreset(),current=valid(entity)?entity.attributes?.preset_mode:'';
        const options=this._select(selectId),chosen=this._state(selectId)?.state,overridden=['away','frost_guard','boost'].includes(current);
        const modeLabels={away:'Assente',frost_guard:'Antigelo',schedule:'Programmazione',boost:'Boost'};
        name='Riscaldamento';
        body=`<h3 class="modal-title">PRESET</h3><div class="in-use"><span>In uso</span><strong>${esc(this._heatInUse())}</strong></div>
          ${selectId?`<h3 class="modal-title">PROGRAMMA</h3><div class="mode-grid">${options.length?options.map(o=>mk('choose-program',o,o,o===chosen&&!overridden)).join(''):'<p class="hint">Nessun programma disponibile.</p>'}</div>`:''}
          <h3 class="modal-title">MODALITÀ</h3>
          ${modes.length?`<div class="mode-grid">${modes.map(m=>mk('choose-heat-preset',m,modeLabels[m]||m,m===current)).join('')}</div><p class="hint">Le modalità disponibili dipendono dall’entità termostato configurata.</p>`:`<p class="hint">Per visualizzare Assente e le altre modalità, seleziona nell’editor un’entità climate.* che esponga tali preset. I programmi select.* non includono necessariamente Assente.</p>`}`;
      }else if(kind==='ac'){
        const e=this._state(c.ac_entity),modes=valid(e)&&Array.isArray(e.attributes?.hvac_modes)?e.attributes.hvac_modes:[],opts=modes.filter(x=>x!=='off');
        const presets=valid(e)&&Array.isArray(e.attributes?.preset_modes)?e.attributes.preset_modes:[],sel=this._state(c.ac_program_entity),isOn=valid(e)&&e.state!=='off';
        const label=m=>({cool:'Freddo',heat:'Caldo',dry:'Deum.',auto:'Auto',fan_only:'Ventola',heat_cool:'Auto caldo/freddo'})[m]||m;
        name=`Climatizzatore · ${valid(e)?(isOn?'Acceso':'Spento'):'Non disponibile'}`;
        body=`${opts.length?`<h3 class="modal-title">MODALITÀ</h3><div class="mode-grid g3">${opts.map(m=>`<button data-action="hvac" data-id="${esc(c.ac_entity)}" data-value="${esc(m)}" class="${e?.state===m?'active':''}" ${en}>${icon(mdiMode(m))}${esc(label(m))}</button>`).join('')}</div>`:''}
          ${presets.length?`<h3 class="modal-title">PRESET</h3><div class="in-use"><span>In uso</span><strong>${esc(e.attributes.preset_mode||'—')}</strong></div><div class="mode-grid">${presets.map(p=>mk('choose-ac-preset',p,p,p===e.attributes.preset_mode)).join('')}</div>`:''}
          ${c.ac_program_entity?`<h3 class="modal-title">PROGRAMMA</h3><div class="in-use"><span>In uso</span><strong>${valid(sel)?esc(sel.state):'Non disponibile'}</strong></div><div class="mode-grid">${this._select(c.ac_program_entity).map(o=>mk('choose-program',o,o,o===sel?.state)).join('')||'<p class="hint">Nessun programma disponibile.</p>'}</div>`:''}`;
      }else return '';
      return `<div class="backdrop" data-backdrop="1"><section class="dialog" role="dialog" aria-modal="true" aria-label="${esc(name)}"><header class="dialog-head"><strong>${esc(name)}</strong><button class="close" data-action="close" aria-label="Chiudi">${icon('close')}</button></header><div class="dialog-body">${body}${this._error?`<p class="error">${esc(this._error)}</p>`:''}</div></section></div>`;
    }
    _renderLayer(){
      if(!this._modal||typeof document==='undefined'){this._removeLayer();return;}
      const html=`<style>${LAYER_CSS}</style><div class="root layer-root ${this._dark()?'dark':''}">${this._popup()}</div>`;
      if(!this._layer){
        const host=document.createElement('div');host.setAttribute('data-climate-control-card-layer','');host.attachShadow({mode:'open'});
        host.shadowRoot.addEventListener('click',e=>this._click(e));document.body.appendChild(host);this._layer=host;this._layerHtml='';
      }
      if(html!==this._layerHtml){
        const sr=this._layer.shadowRoot,scroll=sr.querySelector('.dialog-body')?.scrollTop||0;
        sr.innerHTML=html;this._layerHtml=html;const body=sr.querySelector('.dialog-body');if(body)body.scrollTop=scroll;
      }
      this._lockPage();
    }
    _removeLayer(){if(this._layer){this._layer.remove();this._layer=null;this._layerHtml='';}}
    _currentSig(){
      const c=this._cfg,h=this._hass,keys=[c.heat_entity,c.heat_schedule_entity,c.heat_preset_entity,c.heat_activity_entity,c.ac_entity,c.ac_program_entity,c.ac_activity_entity,...Object.keys(c).filter(k=>/_(today|week|month|last|previous)$/.test(k)).map(k=>c[k]),...c.valves.flatMap(v=>[v.entity,v.activity_entity,v.today,v.week,v.month]),...c.automations.map(a=>a.entity)];
      return JSON.stringify({c,dark:this._dark(),p:this._period,season:this._season,st:this._statTab,acc:this._accOpen,modal:this._modal,err:this._error,pending:[...this._pending],override:[...this._overrides],temps:[...this._pendingTemp],data:[...new Set(keys.filter(Boolean))].map(id=>{const e=h.states[id];return [id,e?.state,e?.attributes?.temperature,e?.attributes?.current_temperature,e?.attributes?.hvac_action,e?.attributes?.hvac_modes,e?.attributes?.options,e?.attributes?.preset_modes,e?.attributes?.preset_mode,e?.attributes?.unit_of_measurement,e?.attributes?.friendly_name]})});
    }
    _accordionTile(id,title,summary,iconName,body,tone=''){
      const open=!!this._accOpen[id];
      return `<div class="accordion-item ${open?'is-open':''}"><button type="button" class="accordion-head" id="cc-head-${id}" data-action="toggle-accordion" data-section="${id}" aria-expanded="${open}" aria-controls="cc-panel-${id}"><span class="acc-leading ${tone}">${icon(iconName)}</span><span class="acc-label"><span class="acc-title">${esc(title)}</span><span class="acc-summary">${esc(summary)}</span></span><span class="acc-end"><span class="txt">${open?'Chiudi':'Apri'}</span>${icon(open?'chevron-up':'chevron-right')}</span></button><div class="acc-panel" id="cc-panel-${id}" role="region" aria-labelledby="cc-head-${id}" ${open?'':'hidden'}>${open?body:''}</div></div>`;
    }
    _render(){if(!this.isConnected||!this._hass||this._drag)return;
      const c=this._cfg;
      const sig=this._currentSig();
      if(sig===this._sig)return;this._sig=sig;
      const outerScroll=this._outerScroll();
      const active=this.shadowRoot.activeElement,focusArc=active?.dataset?.arc!==undefined?active.dataset.id:null;
      let html=`<style>${CSS}</style><div class="root ${this._dark()?'dark':''}">`;
      if(c.show_eyebrow||c.show_title)html+=`<header class="header ${c.show_eyebrow?'':'without-eyebrow'}">${c.show_eyebrow?`<div class="eyebrow">${esc(c.eyebrow)}</div>`:''}${c.show_title?`<h2 class="title">${esc(c.title)}<b>.</b></h2>`:''}</header>`;
      const heroes=[isShown(c,'heat')&&(c.heat_entity||c.heat_schedule_entity||c.heat_preset_entity)?this._heating():'',isShown(c,'ac')&&c.ac_entity?this._aircon():''].filter(Boolean);
      if(heroes.length)html+=`<div class="heroes">${heroes.join('')}</div>`;
      if(!heroes.length&&!(isShown(c,'valves')&&c.valves.length))html+=`<p class="hint">Configura almeno un termostato, un programma, un climatizzatore o una valvola nell'editor visuale.</p>`;
      const accordion=[];
      if(isShown(c,'valves')&&c.valves.length)accordion.push(this._accordionTile('valves','Valvole termostatiche',`${c.valves.length} valvole configurate`,'radiator',this._accOpen.valves?this._valves():'','heat'));
      const hasT=isShown(c,'stats')&&!!this._stats(),hasS=isShown(c,'seasons')&&!!this._seasons();
      if(hasT||hasS)accordion.push(this._accordionTile('stats','Statistiche',hasT&&hasS?'Tempi · Confronto stagionale':hasT?'Tempi di funzionamento':'Confronto stagionale','chart-bar',this._accOpen.stats?this._statsBody(hasT,hasS):'','green'));
      if(isShown(c,'automations'))accordion.push(this._accordionTile('automations',`Automazioni associate (${c.automations.length})`,'Gestisci le automazioni Home Assistant','cog-outline',this._accOpen.automations?this._automations():'','green'));
      if(accordion.length)html+=`<div class="accordion-list" aria-label="Sezioni espandibili">${accordion.join('')}</div>`;
      if(!c.controls_enabled)html+='<p class="footer">Modalità sola lettura: abilita i comandi nell’editor quando hai verificato le entità.</p>';
      if(this._error&&!this._modal)html+=`<p class="main-error" role="alert">${esc(this._error)}</p>`;
      html+='</div>';
      this.shadowRoot.innerHTML=html;
      outerScroll.forEach(([el,y])=>{if(el.isConnected&&el.scrollTop!==y)el.scrollTop=y});
      if(focusArc)this.shadowRoot.querySelector(`[data-arc][data-id="${focusArc}"]`)?.focus({preventScroll:true});
      this._renderLayer();
    }
    _rerender(selector){this._sig='';this._render();this.shadowRoot.querySelector(selector)?.focus({preventScroll:true});}
    _open(v){this._error='';this._modal=v;this._lockPage();this._sig='';this._render();this._layer?.shadowRoot.querySelector('.close')?.focus()}
    _close(){this._modal=null;this._error='';this._sig='';this._render();this._removeLayer();this._unlock()}
    _seasonCards(){const c=this._cfg,season=this._season,k=season==='winter'?'winter':'summer';
      if((k==='winter'&&!isShown(c,'heat'))||(k==='summer'&&!isShown(c,'ac')))return `<div class="hint">Nessuna sorgente disponibile per questa modalità.</div>`;
      const prev=numericHours(this._state(c[`${k}_previous`]));const last=numericHours(this._state(c[`${k}_last`]));
      const forecast=prev!==null&&last!==null?(prev+last)/2:null;
      const months=c[`${k}_months`].map(m=>MONTHS[m-1]).join(' · ')||'Nessun mese selezionato';
      return `<div class="panel"><div class="row"><strong>${k==='winter'?'Inverno · Riscaldamento':'Estate · Climatizzatore'}</strong><span class="caption">${esc(months)}</span></div>
        <div class="metric"><span>Stagione precedente</span><strong>${hours(prev)}</strong></div><div class="metric"><span>Ultima stagione</span><strong>${hours(last)}</strong></div>
        <div class="metric"><span title="Scenario illustrativo: media delle ultime due stagioni, non previsione meteorologica">Scenario successivo</span><strong>${forecast!==null?`≈ ${hours(forecast)}`:'N/D'}</strong></div>
        </div>`;
    }
    _outerScroll(){
      const saved=[];
      for(let el=this;el;el=el.parentNode||el.host){
        if(el.nodeType===1&&el.scrollHeight>el.clientHeight+1&&el.scrollTop>0)saved.push([el,el.scrollTop]);
      }
      const doc=document.scrollingElement;
      if(doc&&doc.scrollTop>0&&!saved.some(([el])=>el===doc))saved.push([doc,doc.scrollTop]);
      return saved;
    }
    _lockPage(){if(this._lock||typeof document==='undefined')return;
      const b=document.body,y=window.scrollY;this._lock={y,position:b.style.position,top:b.style.top,left:b.style.left,right:b.style.right,width:b.style.width,overflow:b.style.overflow};
      Object.assign(b.style,{position:'fixed',top:`-${y}px`,left:'0',right:'0',width:'100%',overflow:'hidden'});
    }
    _unlock(){if(!this._lock||typeof document==='undefined')return;const b=document.body,l=this._lock;this._lock=null;
      for(const k of ['position','top','left','right','width','overflow'])b.style[k]=l[k];window.scrollTo(0,l.y);
    }
    async _call(domain,service,data,target){if(!this._enabled())return;
      const key=JSON.stringify([domain,service,target]);if(this._pending.has(key))return;
      this._pending.add(key);this._error='';this._sig='';this._render();
      try{if(!this._hass?.services?.[domain]?.[service])throw new Error(`Azione ${domain}.${service} non disponibile`);
        await this._hass.callService(domain,service,data,target);}
      catch(err){this._error=err?.message||'Comando non riuscito.';}
      finally{this._pending.delete(key);this._sig='';this._render();}
    }
    _actManual(i){const v=this._cfg.valves[i],e=this._state(v?.entity),t=target(e);if(t===null)return;
      this._overrides.set(v.entity,{mode:'Manuale',time:Date.now()});return this._call('climate','set_temperature',{entity_id:v.entity,temperature:t});}
    _setTemp(id,value){
      const e=this._state(id);if(!this._enabled()||!valid(e))return;
      if(this._cfg.valves.some(v=>v.entity===id))this._overrides.set(id,{mode:'Manuale',time:Date.now()});
      this._pendingTemp.set(id,{value,until:Date.now()+8000});memSet(id,{t:value});
      clearTimeout(this._pendTimer);this._pendTimer=setTimeout(()=>{this._sig='';this._render()},8200);
      return this._call('climate','set_temperature',{entity_id:id,temperature:value}).then(()=>{if(this._error)this._pendingTemp.delete(id)});
    }
    _adjust(id,dir){const e=this._state(id),n=this._shown(id,e);if(n===null||!valid(e))return;
      const {min,max,step}=tempLimits(e,id===this._cfg.ac_entity?16:5,30),value=clip(Math.round((n+step*dir)*100)/100,min,max);
      return this._setTemp(id,value);
    }
    async _restoreTemp(id){
      const e=this._state(id),t=num(memGet(id).t);
      if(t===null||!valid(e)||(Number(e.attributes?.supported_features||0)&1)===0)return;
      const {min,max}=tempLimits(e,16,30),v=clip(t,min,max),cur=target(e);
      if(cur!==null&&Math.abs(cur-v)<0.05)return;
      await this._setTemp(id,v);
    }
    _arcSet(e){
      const d=this._drag;if(!d)return;const g=d.g,r=g.getBoundingClientRect();if(!r.width)return;
      const k=r.width/150,x=(e.clientX-r.left)/k,y=(e.clientY-r.top)/k;
      let a=Math.atan2(ARC.cy-y,x-ARC.cx);if(a<0)a=x<ARC.cx?Math.PI:0;
      const min=Number(g.dataset.min),max=Number(g.dataset.max),step=Number(g.dataset.step)||0.5;
      const n=Math.round((min+clip(1-a/Math.PI,0,1)*(max-min)-min)/step),v=clip(Math.round((min+n*step)*100)/100,min,max);
      const f=(v-min)/Math.max(0.1,max-min),[tx,ty]=arcPt(f);
      g.querySelector('.fil')?.setAttribute('d',arcD(f));const th=g.querySelector('.thumb');th?.setAttribute('cx',tx.toFixed(2));th?.setAttribute('cy',ty.toFixed(2));
      const text=temp(v,g.dataset.unit||'°C'),strong=g.parentElement?.querySelector('.mid strong');if(strong)strong.textContent=text;
      g.setAttribute('aria-valuenow',String(v));g.setAttribute('aria-valuetext',text);d.v=v;
    }
    _arcDown(e){
      const g=e.target.closest?.('[data-arc]');if(!g||!this._enabled()||g.getAttribute('aria-disabled')==='true'||(e.button!==undefined&&e.button>0))return;
      e.preventDefault();this._drag={g,id:g.dataset.id,v:null};try{g.setPointerCapture(e.pointerId)}catch(_){/* pointer capture unavailable */}
      this._arcSet(e);
    }
    _arcMove(e){if(this._drag)this._arcSet(e)}
    _arcUp(e){
      const d=this._drag;if(!d)return;this._drag=null;
      try{d.g.releasePointerCapture(e.pointerId)}catch(_){/* already released */}
      if(d.v!==null)this._setTemp(d.id,d.v);else{this._sig='';this._render();}
    }
    _arcCancel(){if(!this._drag)return;this._drag=null;this._sig='';this._render();}
    _arcKey(e){
      const g=e.target.closest?.('[data-arc]');if(!g||!this._enabled())return;
      const d={ArrowUp:1,ArrowRight:1,ArrowDown:-1,ArrowLeft:-1}[e.key];if(!d)return;
      e.preventDefault();this._adjust(g.dataset.id,d);
    }
    _click(e){const el=e.target.closest('button[data-action]');if(!el){if(e.target.dataset?.backdrop)this._close();return;}
      const a=el.dataset.action,i=Number(el.dataset.index),id=el.dataset.id,value=el.dataset.value;
      if(a==='toggle-accordion'){
        const key=el.dataset.section;
        if(!Object.prototype.hasOwnProperty.call(this._accOpen,key))return;
        this._accOpen[key]=!this._accOpen[key];
        this._sig='';this._render();
        this.shadowRoot.querySelector(`button[data-action="toggle-accordion"][data-section="${key}"]`)?.focus({preventScroll:true});
        return;
      }
      if(a==='close'){this._close();return;}
      if(a==='period'){this._period=i;return this._rerender(`button[data-action="period"][data-index="${i}"]`);}
      if(a==='season'){if(!['winter','summer'].includes(value))return;this._season=value;return this._rerender(`button[data-action="season"][data-value="${value}"]`);}
      if(a==='stat-tab'){if(!['times','seasons'].includes(value))return;this._statTab=value;return this._rerender(`button[data-action="stat-tab"][data-value="${value}"]`);}
      if(a==='open-valve'){this._open({kind:'valve',index:i});return;}
      if(a==='open-program'){this._open({kind:'heat-program'});return;}
      if(a==='open-ac'){this._open({kind:'ac'});return;}
      if(!this._enabled())return;
      if(a==='adjust')return this._adjust(id,Number(el.dataset.dir));
      if(a==='hvac'){
        const climate=this._state(id),modes=climate?.attributes?.hvac_modes||[];
        if(!valid(climate)||!Array.isArray(modes)||!modes.includes(value)||value==='off')return;
        if(id===this._cfg.ac_entity){this._lastAcModes.set(id,value);memSet(id,{m:value});}
        return this._call('climate','set_hvac_mode',{entity_id:id,hvac_mode:value});
      }
      if(a==='power-ac'){
        const climate=this._state(this._cfg.ac_entity);if(!valid(climate)||id!==this._cfg.ac_entity)return;
        const modes=Array.isArray(climate.attributes?.hvac_modes)?climate.attributes.hvac_modes:[];
        const flags=Number(climate.attributes?.supported_features||0);
        if(climate.state==='off'){
          const afterOn=async p=>{await p;if(!this._error)await this._restoreTemp(id);};
          const preferred=this._lastAcModes.get(id)||memGet(id).m;
          if(preferred&&modes.includes(preferred)&&preferred!=='off')return afterOn(this._call('climate','set_hvac_mode',{entity_id:id,hvac_mode:preferred}));
          if((flags&256)!==0&&this._hass?.services?.climate?.turn_on)return afterOn(this._call('climate','turn_on',{entity_id:id}));
          const mode=['cool','heat_cool','auto','heat','dry','fan_only'].find(v=>modes.includes(v));
          if(mode)return afterOn(this._call('climate','set_hvac_mode',{entity_id:id,hvac_mode:mode}));
          this._error='Nessuna modalità di accensione supportata.';this._sig='';this._render();return;
        }
        if(modes.includes('off'))return this._call('climate','set_hvac_mode',{entity_id:id,hvac_mode:'off'});
        if((flags&128)!==0)return this._call('climate','turn_off',{entity_id:id});
        return;
      }
      if(a==='manual')return this._actManual(i);
      if(a==='valve-off'){
        const v=this._cfg.valves[i],modes=this._state(v?.entity)?.attributes?.hvac_modes||[];
        if(!modes.includes('off'))return;
        this._overrides.set(v.entity,{mode:'Spenta',time:Date.now()});return this._call('climate','set_hvac_mode',{entity_id:v.entity,hvac_mode:'off'});
      }
      if(a==='restore'){
        const v=this._cfg.valves[i];if(!v)return;
        if(v.restore_method==='netatmo'){this._overrides.set(v.entity,{mode:'Programma',time:Date.now()});return this._call('netatmo','clear_temperature_setting',{}, {entity_id:v.entity});}
        if(v.restore_method==='script'&&v.restore_script){this._overrides.set(v.entity,{mode:'Programma',time:Date.now()});return this._call('script','turn_on',{entity_id:v.restore_script});}
        return;
      }
      if(a==='choose-heat-preset'){
        if(this._modal?.kind!=='heat-program')return;
        const {id,entity,modes}=this._heatPreset();
        if(!id||!valid(entity)||!modes.includes(value))return;
        return this._call('climate','set_preset_mode',{entity_id:id,preset_mode:value});
      }
      if(a==='choose-ac-preset'){
        if(this._modal?.kind!=='ac')return;
        if(!this._state(this._cfg.ac_entity)?.attributes?.preset_modes?.includes(value))return;
        return this._call('climate','set_preset_mode',{entity_id:this._cfg.ac_entity,preset_mode:value});
      }
      if(a==='choose-program'){
        const ent=this._modal?.kind==='heat-program'?this._cfg.heat_schedule_entity:this._modal?.kind==='ac'?this._cfg.ac_program_entity:'';
        if(ent&&this._select(ent).includes(value))return this._call('select','select_option',{entity_id:ent,option:value});return;
      }
      if(a==='automation'){
        const o=this._cfg.automations[i],st=this._state(o?.entity);
        if(!valid(st))return;
        const service=st.state==='on'?'turn_off':'turn_on';
        if(service==='turn_off'&&this._cfg.confirm_automation_disable&&!confirm(`Disabilitare l'automazione “${o.name||friendly(this._hass,o.entity,o.entity)}”?`))return;
        return this._call('automation',service,{entity_id:o.entity});
      }
    }
  }
  const ECSS = `
    :host{display:block;font:14px var(--ha-font-family-body,Roboto,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif);color:var(--primary-text-color,#19221E)}
    *,*:before,*:after{box-sizing:border-box}button,input,select{font:inherit}button{cursor:pointer}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--edera-emerald-color,#0E6B52);outline-offset:2px}
    ha-icon{display:inline-flex;width:18px;height:18px;--mdc-icon-size:18px;vertical-align:middle}
    .ed{min-width:0}.tabs{display:flex;overflow-x:auto;gap:4px;border-bottom:1px solid var(--divider-color,#E3E7E2);padding-bottom:11px}.tabs button{border:0;border-radius:10px;background:transparent;color:var(--secondary-text-color,#68716C);padding:10px 11px;white-space:nowrap;font-size:12px}.tabs button.active{background:var(--secondary-background-color,#F1F3EF);font-weight:700;color:var(--primary-text-color,#19221E)}
    h3{font-size:19px;font-weight:650;margin:18px 0 6px}p.note{font-size:12px;line-height:1.5;color:var(--secondary-text-color,#68716C);margin:5px 0 17px}.field{margin:17px 0}.field label{font-size:12px;font-weight:700;display:block;margin-bottom:8px}.field .hint{font-size:11px;color:var(--secondary-text-color,#68716C);line-height:1.4;margin-top:7px}.input,.select{width:100%;min-height:43px;background:var(--secondary-background-color,#F1F3EF);color:var(--primary-text-color,#19221E);border:1px solid var(--divider-color,#E3E7E2);border-radius:11px;padding:10px 12px}.input::placeholder{color:var(--secondary-text-color,#68716C)}.input option{background:var(--card-background-color,#fff);color:var(--primary-text-color,#19221E)}
    .entityrow{display:flex;align-items:center;gap:7px;min-width:0}.entitybox{flex:1;min-width:0}.entitybox ha-selector{display:block;width:100%;--mdc-theme-primary:var(--edera-emerald-color,#0E6B52)}.remove{min-height:40px;min-width:40px;display:grid;place-items:center;background:var(--secondary-background-color,#F1F3EF);color:var(--primary-text-color,#19221E);border:1px solid var(--divider-color,#E3E7E2);border-radius:11px}
    .check{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 0;border-bottom:1px solid var(--divider-color,#E3E7E2);font-size:13px}.check input{width:18px;height:18px;accent-color:var(--edera-emerald-color,#0E6B52)}
    .block{background:var(--secondary-background-color,#F1F3EF);border:1px solid var(--divider-color,#E3E7E2);border-radius:14px;padding:13px;margin:13px 0}.blockhead{display:flex;align-items:center;justify-content:space-between;gap:8px}.blockhead strong{font-size:13px}.subtabs{display:flex;gap:4px;flex-wrap:wrap;margin:15px 0}.subtabs button{padding:9px 11px;border:1px solid var(--divider-color,#E3E7E2);border-radius:9px;color:var(--primary-text-color,#19221E);background:var(--secondary-background-color,#F1F3EF);font-size:12px}.subtabs button.active{color:#fff;background:var(--edera-emerald-color,#0E6B52)}
    .add{background:var(--edera-emerald-color,#0E6B52);color:white;border:0;border-radius:11px;padding:11px 13px;font-size:12px;font-weight:650;display:flex;align-items:center;gap:6px;margin:15px 0}.delete{background:transparent;border:0;color:var(--error-color,#B85D55);font-size:11px;display:flex;align-items:center;gap:4px}.months{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px;margin:12px 0}.month{font-size:11px;display:flex;align-items:center;justify-content:center;gap:3px;padding:8px 2px;border:1px solid var(--divider-color,#E3E7E2);background:var(--card-background-color,#fff);border-radius:9px;color:var(--primary-text-color,#19221E)}.month.on{border-color:var(--edera-emerald-color,#0E6B52);color:var(--edera-emerald-color,#0E6B52);font-weight:750}
    @media(max-width:390px){.months{grid-template-columns:repeat(4,minmax(0,1fr))}}
  `;
  const ENTITY_DOMAINS = {
    heat_entity:['climate'],heat_schedule_entity:['select'],heat_activity_entity:['binary_sensor','sensor','switch','input_boolean'],
    ac_entity:['climate'],ac_program_entity:['select'],ac_activity_entity:['binary_sensor','sensor','switch','input_boolean']
  };
  const ID_FIELDS = ['heat_today','heat_week','heat_month','ac_today','ac_week','ac_month','winter_last','winter_previous','summer_last','summer_previous'];
  class ClimateControlEditor extends HTMLElement {
    constructor(){super();this.attachShadow({mode:'open'});this._cfg=normalize();this._hass=null;this._tab='devices';this._sub='heat';this._season='winter';this._nativeReady=false;this._selectorAttempt=false;
      this.shadowRoot.addEventListener('click',e=>this._click(e));this.shadowRoot.addEventListener('change',e=>this._change(e));}
    connectedCallback(){this._render();void this._loadSelectors()}
    setConfig(c){this._cfg=normalize(c);this._render()}
    set hass(h){const first=!this._hass;this._hass=h;this.shadowRoot.querySelectorAll('ha-selector').forEach(el=>el.hass=h);if(first&&!this._nativeReady)this._render()}
    async _loadSelectors(){if(this._selectorAttempt)return;this._selectorAttempt=true;
      try{if(!customElements.get('ha-selector')){const helper=await window.loadCardHelpers?.();await helper?.importSelector?.();}}
      catch(_){/* Local fallback editor remains functional. */}
      this._nativeReady=!!customElements.get('ha-selector');this._render();
    }
    _save(next){this._cfg=normalize(next);this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...this._cfg}},bubbles:true,composed:true}));this._render()}
    _pathUpdate(path,value){const c={...this._cfg,valves:this._cfg.valves.map(x=>({...x})),automations:this._cfg.automations.map(x=>({...x}))},parts=path.split(':');
      if(parts.length===1)c[path]=value;
      else if(parts[0]==='valves'&&c.valves[+parts[1]])c.valves[+parts[1]][parts[2]]=value;
      else if(parts[0]==='automations'&&c.automations[+parts[1]])c.automations[+parts[1]][parts[2]]=value;
      this._save(c);
    }
    _text(path,label,hint='',placeholder=''){
      const parts=path.split(':'),v=parts.length===1?this._cfg[path]:this._cfg[parts[0]]?.[+parts[1]]?.[parts[2]];
      return `<div class="field"><label>${esc(label)}</label><input class="input" data-path="${esc(path)}" type="text" value="${esc(v)}" placeholder="${esc(placeholder)}" maxlength="120">${hint?`<div class="hint">${esc(hint)}</div>`:''}</div>`;
    }
    _entity(path,label,domains,hint=''){
      const parts=path.split(':'),v=parts.length===1?this._cfg[path]:this._cfg[parts[0]]?.[+parts[1]]?.[parts[2]];
      return `<div class="field"><label>${esc(label)}</label><div class="entityrow"><div class="entitybox" data-selector="${esc(path)}" data-domains="${domains.join(',')}">${!this._nativeReady?`<input class="input" list="cc-entities-${domains.join('-')}" data-path="${esc(path)}" value="${esc(v||'')}" placeholder="Seleziona o cerca entità">`:''}</div><button class="remove" data-clear="${esc(path)}" aria-label="Rimuovi entità" ${v?'':'disabled'}>${icon('close')}</button></div>${hint?`<div class="hint">${esc(hint)}</div>`:''}</div>`;
    }
    _select(path,label,choices,hint=''){
      const parts=path.split(':'),val=parts.length===1?this._cfg[path]:this._cfg[parts[0]]?.[+parts[1]]?.[parts[2]];
      return `<div class="field"><label>${esc(label)}</label><select class="input" data-path="${esc(path)}">${choices.map(([v,t])=>`<option value="${esc(v)}" ${v===val?'selected':''}>${esc(t)}</option>`).join('')}</select>${hint?`<div class="hint">${esc(hint)}</div>`:''}</div>`;
    }
    _check(path,label,hint=''){const val=this._cfg[path];return `<label class="check"><span>${esc(label)}${hint?`<small style="display:block;color:var(--secondary-text-color);margin-top:4px">${esc(hint)}</small>`:''}</span><input type="checkbox" data-check="${esc(path)}" ${val?'checked':''}></label>`}
    _nav(){return `<div class="tabs">${[['devices','Dispositivi'],['stats','Statistiche'],['automations','Automazioni'],['appearance','Aspetto'],['advanced','Avanzate']].map(([v,t])=>`<button data-tab="${v}" class="${this._tab===v?'active':''}">${t}</button>`).join('')}</div>`;}
    _devices(){const c=this._cfg;
      let text=`<h3>Dispositivi</h3><p class="note">Scegli le entità realmente presenti in Home Assistant. Puoi rimuoverle singolarmente.</p><div class="subtabs">${[['heat','Riscaldamento'],['ac','Climatizzatore'],['valves','Valvole']].map(([v,t])=>`<button data-sub="${v}" class="${v===this._sub?'active':''}">${t}</button>`).join('')}</div>`;
      if(this._sub==='heat')text+=this._entity('heat_schedule_entity','Programmi del termostato · select.*',['select'],'Seleziona qui l’entità dei programmi, anche se non hai un termostato climate.*. Le opzioni vengono lette da Home Assistant.')+this._entity('heat_preset_entity','Modalità termostato (es. Assente) · climate.*',['climate'],'Facoltativo. Scegli un’entità dello stesso impianto che esponga i preset (away, schedule, frost_guard). I comandi possono interessare l’intera abitazione, secondo l’integrazione.')+this._entity('heat_entity','Termostato temperatura (facoltativo) · climate.*',['climate'],'Se presente, mostra temperatura ambiente, setpoint e stato HVAC. Non inserire qui un’entità select.*.')+this._entity('heat_activity_entity','Stato riscaldamento / richiesta calore (facoltativo)',['binary_sensor','switch','input_boolean','sensor'],'Non rappresenta automaticamente l’accensione della caldaia.');
      if(this._sub==='ac')text+=this._entity('ac_entity','Climatizzatore',['climate'])+this._entity('ac_program_entity','Programma climatizzatore (facoltativo)',['select'],'Seleziona solo una vera entità di programma, se esiste.')+this._entity('ac_activity_entity','Sensore funzionamento climatizzatore (facoltativo)',['binary_sensor','switch','input_boolean','sensor']);
      if(this._sub==='valves')text+=c.valves.map((v,i)=>`<div class="block"><div class="blockhead"><strong>Valvola ${i+1}</strong><button class="delete" data-remove="valves:${i}">${icon('delete-outline')} Rimuovi</button></div>
        ${this._entity(`valves:${i}:entity`,'Entità valvola',['climate'])}
        ${this._text(`valves:${i}:name`,'Nome nella card (facoltativo)','Se vuoto, viene usato il nome assegnato in Home Assistant.')}
        ${this._entity(`valves:${i}:activity_entity`,'Richiesta calore (facoltativo)',['binary_sensor','sensor','switch','input_boolean'])}
        ${this._select(`valves:${i}:restore_method`,'Ripristina programma',[['none','Non configurato'],['netatmo','Azione Netatmo (per dispositivi compatibili)'],['script','Script Home Assistant personalizzato']], 'Seleziona esplicitamente il metodo compatibile con il tuo impianto.')}
        ${v.restore_method==='script'?this._entity(`valves:${i}:restore_script`,'Script ripristino',['script']):''}
        ${this._entity(`valves:${i}:today`,'Tempo oggi',['sensor'])}${this._entity(`valves:${i}:week`,'Tempo settimana',['sensor'])}${this._entity(`valves:${i}:month`,'Tempo mese',['sensor'])}</div>`).join('')+`<button class="add" data-add="valves">${icon('plus')} Aggiungi valvola</button>`;
      return text;
    }
    _stats(){let out=`<h3>Tempi di funzionamento</h3><p class="note">I sensori devono misurare la durata effettiva, con unità di tempo esplicita (h, min o s). Nessun valore viene inventato.</p>`;
      for(const [k,label] of [['heat','Riscaldamento'],['ac','Climatizzatore']]){
        out+=`<div class="block"><strong>${label}</strong>${[['today','Oggi'],['week','Settimana'],['month','Mese']].map(([p,n])=>this._entity(`${k}_${p}`,`Tempo ${n.toLowerCase()}`,['sensor'])).join('')}</div>`;
      }
      out+=`<h3>Confronti stagionali</h3><p class="note">Scegli i mesi di Inverno ed Estate. Configura sensori aggregati storici se disponibili.</p><div class="subtabs">${[['winter','Inverno'],['summer','Estate']].map(([v,n])=>`<button data-season-tab="${v}" class="${this._season===v?'active':''}">${n}</button>`).join('')}</div>`;
      const k=this._season;out+=`<div class="months">${MONTHS.map((m,i)=>`<button data-month="${i+1}" data-season="${k}" class="month ${this._cfg[`${k}_months`].includes(i+1)?'on':''}">${m}</button>`).join('')}</div>`;
      out+=this._entity(`${k}_previous`,'Ore stagione precedente',['sensor'])+this._entity(`${k}_last`,'Ore ultima stagione',['sensor']);
      out+='<p class="note">Scenario successivo: calcolato solo se entrambi i dati sono disponibili. La scelta dei mesi definisce il periodo; per le statistiche storiche occorrono comunque dati già aggregati per quei mesi.</p>';
      return out;
    }
    _automations(){const c=this._cfg;return `<h3>Automazioni associate</h3><p class="note">Aggiungi liberamente le automazioni. Se il nome personalizzato è vuoto, la card usa il nome originale di Home Assistant.</p>${c.automations.map((a,i)=>`<div class="block"><div class="blockhead"><strong>${esc(a.name||friendly(this._hass,a.entity,`Automazione ${i+1}`))}</strong><button class="delete" data-remove="automations:${i}">${icon('delete-outline')} Rimuovi</button></div>${this._entity(`automations:${i}:entity`,'Entità automazione',['automation'])}${this._text(`automations:${i}:name`,'Nome personalizzato (facoltativo)','Lascia vuoto per usare il friendly_name di Home Assistant.')}</div>`).join('')}<button class="add" data-add="automations">${icon('plus')} Aggiungi automazione</button>`}
    _appearance(){return `<h3>Identità Edera</h3>${this._check('show_eyebrow','Mostra intestazione superiore','Se disattivata rimane visibile soltanto il titolo principale con il punto.')}${this._cfg.show_eyebrow?this._text('eyebrow','Testo intestazione superiore'):''}${this._check('show_title','Mostra titolo card','Se disattivata il titolo e il punto verde non vengono mostrati.')}${this._cfg.show_title?this._text('title','Titolo card'):''}${this._select('theme_mode','Tema',[['auto','Automatico · Home Assistant'],['light','Edera Light'],['dark','Graphite Dark']])}
      ${this._select('layout','Modalità della card',[['complete','Completa'],['heat','Solo riscaldamento'],['ac','Solo climatizzatore'],['valves','Solo valvole'],['custom','Personalizzata']])}
      ${this._select('temperature_control','Regolazione temperatura',[['arc','Arco con − / +'],['ring','Anello con − / +']])}
      <h3>Sezioni visibili</h3>${[['heat','Riscaldamento'],['ac','Climatizzatore'],['valves','Valvole'],['stats','Statistiche · Tempi di funzionamento'],['seasons','Statistiche · Confronto stagionale'],['automations','Automazioni associate']].map(([k,n])=>this._check(`show_${k}`,n)).join('')}<p class="note">Le modalità Solo riscaldamento, Solo climatizzatore e Solo valvole nascondono automaticamente i dispositivi non pertinenti.</p>`;
    }
    _advanced(){return `<h3>Controlli e sicurezza</h3>${this._check('controls_enabled','Abilita comandi reali','Attivo per impostazione predefinita. Disattivalo per usare la card in sola lettura.')}${this._check('confirm_automation_disable','Conferma prima di disabilitare automazioni')}<p class="note">La card non concede permessi aggiuntivi rispetto a Home Assistant. Il ripristino del programma delle valvole usa il metodo configurato individualmente; se assente, il pulsante non invia comandi.</p>`}
    _click(e){const t=e.target.closest('button');if(!t)return;
      if(t.dataset.tab){this._tab=t.dataset.tab;this._render();return;}
      if(t.dataset.sub){this._sub=t.dataset.sub;this._render();return;}
      if(t.dataset.seasonTab){this._season=t.dataset.seasonTab;this._render();return;}
      if(t.dataset.clear){this._pathUpdate(t.dataset.clear,'');return;}
      if(t.dataset.add){const k=t.dataset.add;if(k==='valves')this._save({...this._cfg,valves:[...this._cfg.valves,{entity:'',name:'',restore_method:'none'}]});else this._save({...this._cfg,automations:[...this._cfg.automations,{entity:'',name:''}]});return;}
      if(t.dataset.remove){const [k,i]=t.dataset.remove.split(':');this._save({...this._cfg,[k]:this._cfg[k].filter((_,j)=>j!==+i)});return;}
      if(t.dataset.month){const k=t.dataset.season,value=+t.dataset.month,old=this._cfg[`${k}_months`],next=old.includes(value)?old.filter(x=>x!==value):[...old,value];this._save({...this._cfg,[`${k}_months`]:next});return;}
    }
    _change(e){const t=e.target;if(t.dataset.path!==undefined){const p=t.dataset.path,domains=this._domains(p),value=domains?safe(t.value,domains):t.value;this._pathUpdate(p,value);return;}
      if(t.dataset.check!==undefined)this._pathUpdate(t.dataset.check,t.checked);
    }
    _domains(path){const p=path.split(':');if(p.length===1){if(ENTITY_DOMAINS[path])return ENTITY_DOMAINS[path];if(ID_FIELDS.includes(path))return ['sensor'];return null;}
      if(p[0]==='valves'){if(p[2]==='entity')return ['climate'];if(['today','week','month'].includes(p[2]))return ['sensor'];if(p[2]==='restore_script')return ['script'];if(p[2]==='activity_entity')return ['binary_sensor','switch','sensor','input_boolean'];}
      if(p[0]==='automations'&&p[2]==='entity')return ['automation'];return null;
    }
    _render(){if(!this.isConnected)return;
      const content={devices:()=>this._devices(),stats:()=>this._stats(),automations:()=>this._automations(),appearance:()=>this._appearance(),advanced:()=>this._advanced()};
      this.shadowRoot.innerHTML=`<style>${ECSS}</style><div class="ed">${this._nav()}<main>${content[this._tab]()}</main></div>`;
      if(this._nativeReady){this.shadowRoot.querySelectorAll('[data-selector]').forEach(slot=>{
        const path=slot.dataset.selector,domains=slot.dataset.domains.split(','),parts=path.split(':'),value=parts.length===1?this._cfg[path]:this._cfg[parts[0]]?.[+parts[1]]?.[parts[2]];
        const el=document.createElement('ha-selector');el.hass=this._hass;el.selector={entity:{filter:domains.map(domain=>({domain}))}};el.value=value||'';
        el.addEventListener('value-changed',e=>{e.stopPropagation();const v=e.detail?.value||'';this._pathUpdate(path,safe(v,domains));});slot.append(el);
      });}
      else if(this._hass){
        const lists=new Set();
        this.shadowRoot.querySelectorAll('[data-selector]').forEach(slot=>{
          const domains=slot.dataset.domains.split(','),listId=`cc-entities-${domains.join('-')}`;
          if(lists.has(listId))return;lists.add(listId);
          const dl=document.createElement('datalist');dl.id=listId;
          for(const id of Object.keys(this._hass.states||{})){
            if(!ENTITY_RX.test(id)||!domains.includes(id.split('.')[0]))continue;
            const opt=document.createElement('option');opt.value=id;dl.append(opt);
          }
          this.shadowRoot.querySelector('.ed')?.append(dl);
        });
      }
    }
  }
  if(!customElements.get(TAG))customElements.define(TAG,ClimateControlCard);
  if(!customElements.get(EDITOR))customElements.define(EDITOR,ClimateControlEditor);
  window.customCards=window.customCards||[];
  if(!window.customCards.some(x=>x.type===TAG))window.customCards.push({type:TAG,name:'Climate Control Card',description:'Termostati, climatizzatori, valvole, programmi e statistiche nello stile Edera.',preview:true});
})();
