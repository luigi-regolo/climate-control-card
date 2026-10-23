/**
 * Climate Control Card — custom Home Assistant dashboard card.
 * Copyright (c) 2026 luigi-regolo. SPDX-License-Identifier: GPL-3.0-only.
 * Local Home Assistant states/actions only. No telemetry, remote scripts, assets or credentials.
 * Development build — local validation required before publication.
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
    type:`custom:${TAG}`, title:'Clima Casa', eyebrow:'CLIMATE CONTROL CARD', theme_mode:'auto', layout:'complete', temperature_control:'step',
    show_heat:true,show_ac:true,show_valves:true,show_stats:true,show_seasons:true,show_automations:true,
    controls_enabled:false, confirm_automation_disable:false,
    heat_entity:'', heat_schedule_entity:'',heat_activity_entity:'',
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
    c.title=txt(c.title,60)||defaults.title; c.eyebrow=txt(c.eyebrow,65)||defaults.eyebrow;
    c.theme_mode=THEMES.includes(c.theme_mode)?c.theme_mode:'auto';
    c.layout=MODES.includes(c.layout)?c.layout:'complete';
    c.temperature_control=['step','slider'].includes(c.temperature_control)?c.temperature_control:'step';
    for(const k of ['show_heat','show_ac','show_valves','show_stats','show_seasons','show_automations']) c[k]=c[k]!==false;
    c.controls_enabled=bool(c.controls_enabled);c.confirm_automation_disable=bool(c.confirm_automation_disable);
    for(const k of ['heat_entity','ac_entity']) c[k]=safe(c[k],['climate']);
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

  const CSS = `
    :host{display:block;min-width:0;container:cc-host/inline-size;font-family:var(--ha-font-family-body,Roboto,Arial,sans-serif);font-size:var(--ha-font-size-m,14px)}
    *,*:before,*:after{box-sizing:border-box}button,input,select{font:inherit}button{cursor:pointer}button:disabled{cursor:not-allowed;opacity:.46}
    button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--cc-green);outline-offset:2px}
    ha-icon{width:19px;height:19px;--mdc-icon-size:19px;display:inline-flex;vertical-align:middle;flex:none}
    .root{--cc-bg:#fff;--cc-panel:#F1F3EF;--cc-text:#19221E;--cc-muted:#68716C;--cc-border:#E3E7E2;--cc-green:var(--edera-emerald-color,#0E6B52);--cc-heat:var(--edera-heat-color,#C76F4F);--cc-cool:var(--edera-cool-color,#4F8193);--cc-heatbg:#F8F0EA;--cc-coolbg:#EBF2F3;--cc-heat-on:#F6E5DB;--cc-cool-on:#E0EDF0;--cc-off:#858E89;--cc-surface:#F6F7F3;
      color:var(--cc-text);background:var(--cc-bg);border:1px solid var(--cc-border);border-radius:26px;padding:17px 19px;min-width:0;container:climate/inline-size}
    .root.dark{--cc-bg:#101211;--cc-panel:#191c1a;--cc-text:#f5f7f4;--cc-muted:#bbc5bd;--cc-border:#2b302c;--cc-green:var(--edera-emerald-color,#0E6B52);--cc-heat:var(--edera-heat-color,#E28763);--cc-cool:var(--edera-cool-color,#6FA9C0);--cc-heatbg:#241d1a;--cc-coolbg:#1c272b;--cc-heat-on:#34241e;--cc-cool-on:#263740;--cc-off:#8B918E;--cc-surface:#191c1a}
    .header{margin-bottom:13px}.eyebrow{font-size:10px;letter-spacing:1.7px;font-weight:750;color:var(--cc-muted)}.title{font-weight:780;letter-spacing:-.7px;font-size:25px;margin:6px 0 0;line-height:1.2}.title b{color:var(--cc-green)}
    .heroes{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:10px}.hero{border-radius:20px;border:1px solid var(--cc-border);background:var(--cc-panel);padding:13px 15px;min-width:0}
    .hero.heat{background:linear-gradient(135deg,var(--cc-panel),var(--cc-heatbg))}.hero.heat.is-active{background:linear-gradient(135deg,var(--cc-panel),var(--cc-heat-on))}
    .hero.ac{background:linear-gradient(135deg,var(--cc-panel),var(--cc-coolbg))}.hero.ac.is-active{background:linear-gradient(135deg,var(--cc-panel),var(--cc-cool-on))}
    .row{display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0}.wrap{flex-wrap:wrap}.kicker{font-size:10px;letter-spacing:1.1px;font-weight:780;color:var(--cc-muted);display:flex;align-items:center;gap:5px}.kicker ha-icon{width:16px;height:16px;--mdc-icon-size:16px}.pill{display:flex;align-items:center;gap:7px;font-size:10px;font-weight:600;padding:6px 9px;background:var(--cc-bg);border-radius:999px;color:var(--cc-muted);white-space:nowrap}.pill.heat{color:var(--cc-heat)}.pill.cool{color:var(--cc-cool)}.pill.on{color:var(--cc-green)}.pill.off{color:var(--cc-off)}
    .hero-main{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:14px 0}.caption{font-size:11px;color:var(--cc-muted)}.big{font-size:29px;font-weight:650;letter-spacing:-.7px;line-height:1.15;font-variant-numeric:tabular-nums}.big small{font-size:18px;letter-spacing:0}.orb{width:67px;height:67px;border:7px solid var(--cc-bg);border-radius:50%;display:grid;place-items:center;background:var(--cc-heatbg);color:var(--cc-heat);flex:none}.orb.ac{background:var(--cc-coolbg);color:var(--cc-cool)}.orb ha-icon{width:28px;height:28px;--mdc-icon-size:28px}
    .setpoint{border:1px solid var(--cc-border);border-radius:13px;background:var(--cc-bg);padding:9px 12px;display:flex;justify-content:space-between;gap:9px;align-items:center}.setpoint strong{display:block;font-size:17px;font-weight:650;margin-top:2px}.root.dark .setpoint.ac-setpoint{background:#0E100F;border-color:#2B302C}.root.dark .setpoint.ac-setpoint .step{background:#191C1A;border-color:#2B302C}.root.dark .setpoint.ac-setpoint .step:not(:disabled):hover{background:#242825}.steps{display:flex;align-items:center;gap:6px}.step{width:36px;height:36px;display:grid;place-items:center;border:1px solid var(--cc-border);border-radius:11px;background:var(--cc-panel);color:var(--cc-text)}.step ha-icon{--mdc-icon-size:18px}
    .slider-control{width:100%}.slider-head{display:flex;justify-content:space-between;gap:9px;align-items:center}.slider-head strong{font-size:17px;font-weight:650;color:var(--slider-color)}.slider-control input{appearance:none;-webkit-appearance:none;width:100%;height:27px;background:transparent;margin:4px 0 0;touch-action:pan-y;cursor:pointer}.slider-control input::-webkit-slider-runnable-track{height:9px;border-radius:20px;background:linear-gradient(90deg,var(--slider-color) var(--fill,0%),var(--cc-panel) var(--fill,0%));border:1px solid var(--cc-border)}.slider-control input::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:24px;height:24px;border-radius:50%;border:5px solid var(--cc-bg);background:var(--slider-color);box-shadow:0 0 0 2px var(--slider-color),0 2px 7px #0003;margin-top:-9px}.slider-control input::-moz-range-track{height:9px;background:var(--cc-panel);border-radius:20px}.slider-control input::-moz-range-thumb{width:15px;height:15px;border-radius:50%;background:var(--slider-color);border:4px solid var(--cc-bg)}
    .inline-options{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-top:10px}.option{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:1px solid var(--cc-border);border-radius:10px;padding:7px 10px;background:var(--cc-bg);color:var(--cc-muted);font-size:11px;font-weight:600;min-height:34px;line-height:1.25}.option ha-icon{width:16px;height:16px;--mdc-icon-size:16px}.option.active{color:var(--cc-green);border-color:var(--cc-green)}.option.cool.active{color:var(--cc-cool);border-color:var(--cc-cool)}.power{margin-left:auto;min-width:36px;min-height:35px;background:var(--cc-bg);border:1px solid var(--cc-border);border-radius:10px;color:var(--cc-muted)}.power.active{background:var(--cc-cool);color:white;border-color:var(--cc-cool)}
    .main-error{margin:12px 0 0;padding:11px 12px;border:1px solid #A65347;border-radius:11px;background:rgba(166,83,71,.10);color:#F2A89B;font-size:12px;line-height:1.5}
    .control-note{display:flex;align-items:center;gap:7px;margin-top:9px;font-size:10px;line-height:1.5;color:var(--cc-muted)}.control-note ha-icon{width:14px;height:14px;--mdc-icon-size:14px;flex:none}
    .small-program{margin-top:9px;display:flex;align-items:center;gap:7px;flex-wrap:wrap}.small-program .caption{font-weight:600}.small-program button{display:inline-flex;gap:8px;align-items:center;border:1px solid var(--cc-border);border-radius:9px;background:var(--cc-bg);color:var(--cc-text);padding:8px 11px;font-size:11px;font-weight:600;max-width:100%}.small-program button span{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.small-program ha-icon{width:15px;height:15px;--mdc-icon-size:15px;flex:none}.small-program.ac-preset .preset-trigger{background:#0E100F;color:#F5F7F4;border-color:#2B302C;min-height:36px}.small-program.ac-preset .preset-trigger:hover{border-color:#637169}.small-program.ac-preset .preset-trigger:focus-visible{outline-color:#58B99A}
    .section{margin-top:17px}.section-title{font-size:10px;letter-spacing:1.65px;font-weight:800;color:var(--cc-muted);margin:0 0 9px}.section-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.tabs{display:inline-flex;background:var(--cc-panel);border:1px solid var(--cc-border);border-radius:13px;padding:3px;gap:2px}.tabs button{border:0;border-radius:10px;padding:8px 11px;background:transparent;color:var(--cc-muted);font-size:11px;font-weight:600}.tabs button.active{background:var(--cc-bg);color:var(--cc-green)}
    .stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.stat{border:1px solid var(--cc-border);border-radius:16px;background:var(--cc-panel);padding:10px 11px;min-width:0}.stat label{font-size:11px;color:var(--cc-muted);display:flex;align-items:center;gap:5px}.stat label ha-icon{--mdc-icon-size:16px;width:16px;height:16px}.stat strong{display:block;font-size:22px;letter-spacing:-.5px;font-weight:650;margin-top:6px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.stat small{font-size:10px;color:var(--cc-muted)}
    .zones{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:8px}.zone{border:1px solid var(--cc-border);background:var(--cc-panel);border-radius:16px;padding:11px 12px;min-width:0;display:flex;flex-direction:column}.zone-top{display:flex;align-items:center;justify-content:space-between;gap:6px}.zone-top ha-icon{color:var(--cc-heat)}.zone-name{font-size:13px;font-weight:600;margin:9px 0 3px}.zone-meta{font-size:11px;color:var(--cc-muted)}.zone-bottom{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:11px 0 9px;margin-top:auto;padding-top:7px}.zone-bottom strong{font-size:21px;font-weight:650;letter-spacing:-.4px}.zone-bottom small{font-size:10px;color:var(--cc-muted)}.details{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;text-align:left;background:var(--cc-green);border:0;color:white;border-radius:11px;padding:11px;font-size:11px;font-weight:600}.details ha-icon{--mdc-icon-size:17px;width:17px;height:17px}
    .fold{width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;text-align:left;background:var(--cc-panel);border:1px solid var(--cc-border);border-radius:14px;color:var(--cc-text);font-size:12px;font-weight:600;padding:12px 14px;min-height:54px}.fold .fold-label{display:inline-flex;align-items:center;gap:11px;min-width:0}.fold .fold-label ha-icon{width:19px;height:19px;--mdc-icon-size:19px;flex-shrink:0}.fold .fold-title{line-height:1.4}.fold .fold-tail{display:inline-flex;gap:9px;align-items:center;flex-shrink:0;color:var(--cc-muted);font-size:11px;font-weight:650}.fold .fold-tail ha-icon{width:17px;height:17px;--mdc-icon-size:17px;flex-shrink:0}.fold:hover{border-color:var(--cc-green)}.panel{border:1px solid var(--cc-border);border-radius:15px;background:var(--cc-panel);padding:12px 13px;margin-top:7px}.season-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.season-card{border:1px solid var(--cc-border);background:var(--cc-bg);border-radius:13px;padding:11px 12px}.season-card strong{font-size:13px}.metric{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px 0}.metric span{font-size:11px;color:var(--cc-muted)}.metric strong{font-size:15px;font-weight:650;font-variant-numeric:tabular-nums}.hint{font-size:11px;color:var(--cc-muted);line-height:1.5}.aut-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid var(--cc-border)}.aut-row:last-child{border-bottom:0}.aut-row strong{font-size:12px;font-weight:600}.aut-row small{font-size:10px;color:var(--cc-muted);display:block;margin-top:3px}.switch{border:1px solid var(--cc-border);border-radius:999px;padding:5px;width:44px;background:var(--cc-panel);display:flex;justify-content:flex-start;flex:none}.switch.on{justify-content:flex-end;background:var(--cc-green);border-color:var(--cc-green)}.switch i{width:18px;height:18px;border-radius:50%;background:var(--cc-bg)}.footer{font-size:10px;color:var(--cc-muted);margin-top:12px}
    .backdrop{position:fixed;inset:0;z-index:9999;background:#000a;display:grid;place-items:center;padding:max(16px,env(safe-area-inset-top)) 14px max(16px,env(safe-area-inset-bottom));overscroll-behavior:none;touch-action:none}.dialog{width:min(420px,100%);max-height:min(84dvh,720px);border:1px solid var(--cc-border);border-radius:25px;background:var(--cc-bg);color:var(--cc-text);box-shadow:0 20px 70px #0007;display:flex;flex-direction:column;overflow:hidden;touch-action:auto}.root.dark .dialog{--cc-bg:#0E100F;--cc-panel:#191C1A;--cc-text:#F5F7F4;--cc-muted:#BBC5BD;--cc-border:#2B302C;--cc-green:#52B995;background:#0E100F;color:#F5F7F4}.dialog-head{display:flex;align-items:center;justify-content:space-between;padding:17px 18px 12px;gap:10px;background:var(--cc-bg);flex:none;border-bottom:1px solid var(--cc-border)}.dialog-head strong{font-size:17px;font-weight:650;display:block}.close{width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:var(--cc-panel);border:0;border-radius:50%;color:var(--cc-text);flex:none}.close ha-icon{--mdc-icon-size:18px;width:18px;height:18px}.dialog-body{padding:16px 18px 20px;overflow-y:auto;overscroll-behavior:contain;touch-action:pan-y;-webkit-overflow-scrolling:touch}.dialog .mode-grid button{min-height:52px;padding:10px 12px;border-radius:12px;background:var(--cc-bg);font-size:12px;overflow-wrap:anywhere}.dialog .mode-grid button:disabled{opacity:1;color:var(--cc-muted);cursor:not-allowed}.dialog .mode-grid button.active{background:#0E6B52;border-color:#0E6B52;color:#fff}.dialog .mode-grid button.active ha-icon{color:#fff}.dialog .dialog-note{font-size:11px;line-height:1.5;color:var(--cc-muted);margin:0 0 13px}.modal-block strong{font-weight:650}.modal-block{background:var(--cc-panel);border:1px solid var(--cc-border);border-radius:14px;padding:13px;margin-bottom:12px}.modal-title{font-size:10px;letter-spacing:1.2px;font-weight:750;margin:15px 0 9px;color:var(--cc-muted)}.mode-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}.mode-grid button{border:1px solid var(--cc-border);border-radius:10px;min-height:42px;padding:8px 4px;color:var(--cc-text);background:var(--cc-bg);font-size:10px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:5px}.mode-grid button.active{border-color:var(--cc-green);color:var(--cc-green)}.mode-grid ha-icon{width:14px;height:14px;--mdc-icon-size:14px}.modal-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.modal-stats div{background:var(--cc-panel);border:1px solid var(--cc-border);padding:10px 4px;text-align:center;border-radius:11px}.modal-stats strong{font-size:14px;font-weight:650;display:block}.modal-stats small{font-size:10px;color:var(--cc-muted)}.error{font-size:11px;color:#e16c5b;margin-top:9px}
    @container cc-host (max-width:430px){.root{padding:13px 14px}.big{font-size:29px}.zones{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.zone{padding:8px 9px;border-radius:14px}.zone-top{gap:4px}.zone-top ha-icon{width:16px;height:16px;--mdc-icon-size:16px}.zone-top .pill{font-size:9px;padding:5px 6px;line-height:1.2;white-space:normal;text-align:right;overflow-wrap:anywhere}.zone-name{font-size:12px;line-height:1.3;overflow-wrap:anywhere;margin:7px 0 3px}.zone-meta{font-size:10px;line-height:1.45;overflow-wrap:anywhere}.zone-bottom{gap:4px;flex-wrap:wrap;align-items:baseline;margin:9px 0 9px;margin-top:auto}.zone-bottom strong{font-size:19px}.zone-bottom small{font-size:9px}.details{font-size:10px;gap:4px;padding:9px 7px;min-height:38px;line-height:1.2}.details ha-icon{width:14px;height:14px;--mdc-icon-size:14px;flex:none}.stats{grid-template-columns:repeat(2,minmax(0,1fr))}.stat strong{font-size:20px}.season-cards{grid-template-columns:1fr}.hero-main{margin:11px 0}.orb{height:58px;width:58px}}@container cc-host (max-width:330px){.stats{grid-template-columns:1fr}.mode-grid{grid-template-columns:1fr}}
    @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
  `;
  class ClimateControlCard extends HTMLElement {
    constructor(){
      super();this.attachShadow({mode:'open'});this._cfg=normalize();this._hass=null;
      this._period=0;this._season='winter';this._seasonOpen=false;this._autoOpen=false;this._modal=null;
      this._pending=new Set();this._overrides=new Map();this._lastAcModes=new Map();this._error='';this._lock=null;this._sig='';
      this._media=typeof matchMedia==='function'?matchMedia('(prefers-color-scheme: dark)'):null;
      this._onKey=e=>{if(e.key==='Escape'&&this._modal)this._close()};
      this.shadowRoot.addEventListener('click',e=>this._click(e));
      this.shadowRoot.addEventListener('input',e=>this._slide(e));
      this.shadowRoot.addEventListener('change',e=>this._change(e));
    }
    static getStubConfig(){return {title:'Clima Casa',theme_mode:'auto',controls_enabled:false,layout:'complete'}}
    static getConfigElement(){return document.createElement(EDITOR)}
    getCardSize(){return 5+Math.ceil(this._cfg.valves.length/3)}
    setConfig(c){this._cfg=normalize(c);this._sig='';this._render()}
    set hass(h){this._hass=h;this._render()}
    connectedCallback(){document.addEventListener('keydown',this._onKey);this._media?.addEventListener?.('change',this._onMedia=()=>this._render());this._render()}
    disconnectedCallback(){document.removeEventListener('keydown',this._onKey);if(this._onMedia)this._media?.removeEventListener?.('change',this._onMedia);this._unlock()}
    _state(id){return id?this._hass?.states?.[id]:null}
    _dark(){return this._cfg.theme_mode==='dark'||(this._cfg.theme_mode==='auto'&&(this._hass?.themes?.darkMode ?? !!this._media?.matches))}
    _enabled(){return this._cfg.controls_enabled}
    _clock(){return this._hass?.config?.time_zone||Intl.DateTimeFormat().resolvedOptions().timeZone}
    _select(c){const e=this._state(c);return valid(e)&&Array.isArray(e.attributes?.options)?e.attributes.options.filter(x=>typeof x==='string'):[]}
    _tempCtrl(id,kind){
      const e=this._state(id),v=target(e),unit=this._hass?.config?.unit_system?.temperature||'°C';
      const {min,max,step}=tempLimits(e,kind==='ac'?16:5,30),enabled=this._enabled()&&v!==null&&(Number(e?.attributes?.supported_features||0)&1)!==0;
      if(this._cfg.temperature_control==='slider'){
        const fill=v===null?0:clip((v-min)/Math.max(0.1,max-min)*100,0,100);
        return `<div class="setpoint ${kind==='ac'?'ac-setpoint':''}"><div class="slider-control" style="--slider-color:var(--cc-${kind==='ac'?'cool':'heat'})"><div class="slider-head"><span class="caption">Setpoint ${kind==='ac'?'climatizzatore':'termostato'}</span><strong data-slider-value>${temp(v,unit)}</strong></div><input type="range" min="${min}" max="${max}" step="${step}" value="${v??min}" data-temp="${esc(id)}" style="--fill:${fill}%" ${enabled?'':'disabled'} aria-label="Regola temperatura"></div></div>`;
      }
      return `<div class="setpoint ${kind==='ac'?'ac-setpoint':''}"><div><span class="caption">Setpoint ${kind==='ac'?'climatizzatore':'termostato'}</span><strong>${temp(v,unit)}</strong></div><div class="steps"><button class="step" data-action="adjust" data-id="${esc(id)}" data-dir="-1" ${enabled?'':'disabled'} aria-label="Diminuisci temperatura">${icon('minus')}</button><button class="step" data-action="adjust" data-id="${esc(id)}" data-dir="1" ${enabled?'':'disabled'} aria-label="Aumenta temperatura">${icon('plus')}</button></div></div>`;
    }
    _heating(){
      const c=this._cfg,hasClimate=!!c.heat_entity,e=this._state(c.heat_entity),stat=actionStatus(e),isActive=hasClimate&&stat.state==='heat';
      const te=ambient(e),unit=this._hass?.config?.unit_system?.temperature||'°C';
      const schedule=this._state(c.heat_schedule_entity);
      return `<section class="hero heat ${isActive?'is-active':''}"><div class="row"><div class="kicker">${icon('radiator')} RISCALDAMENTO</div>${hasClimate?`<span class="pill ${stat.state==='heat'?'heat':stat.state==='off'?'off':'on'}">${stat.state==='heat'?icon('fire'):icon('thermostat')} ${esc(stat.label)}</span>`:`<span class="pill on">${icon('calendar-clock')} Programmi</span>`}</div>
        ${hasClimate?`<div class="hero-main"><div><div class="caption">Temperatura ambiente</div><div class="big">${temp(te,unit)}</div></div><span class="orb">${icon('thermometer')}</span></div>
        ${this._tempCtrl(c.heat_entity,'heat')}`:''}
        ${c.heat_schedule_entity?`<div class="small-program"><span class="caption">Programma termostato</span><button data-action="open-program" ${this._select(c.heat_schedule_entity).length?'':'disabled'}>${icon('calendar-clock')} <span>${valid(schedule)?esc(schedule.state):'Non disponibile'}</span>${icon('chevron-right')}</button></div>`:''}</section>`;
    }
    _aircon(){
      const c=this._cfg,e=this._state(c.ac_entity),stat=actionStatus(e),modes=valid(e)&&Array.isArray(e.attributes?.hvac_modes)?e.attributes.hvac_modes:[],unit=this._hass?.config?.unit_system?.temperature||'°C';
      const isOn=valid(e)&&e.state!=='off',isActive=['cool','heat'].includes(stat.state);
      const opts=modes.filter(x=>x!=='off');
      if(isOn&&modes.includes(e.state))this._lastAcModes.set(c.ac_entity,e.state);
      const features=Number(e?.attributes?.supported_features||0);
      const canPower=valid(e)&&(modes.includes('off')||(!isOn&&(features&256)!==0)||(isOn&&(features&128)!==0));
      const presets=valid(e)&&Array.isArray(e.attributes?.preset_modes)?e.attributes.preset_modes:[];
      const sel=this._state(c.ac_program_entity);
      return `<section class="hero ac ${isActive?'is-active':''}"><div class="row"><div class="kicker">${icon('air-conditioner')} CLIMATIZZATORE</div><span class="pill ${stat.state==='cool'?'cool':stat.state==='heat'?'heat':stat.state==='off'?'off':'on'}">${icon(stat.state==='off'?'power-off':mdiMode(e?.state))} ${esc(stat.label)}</span></div>
        <div class="hero-main"><div><div class="caption">Temperatura ambiente</div><div class="big">${temp(ambient(e),unit)}</div></div><span class="orb ac">${icon(mdiMode(e?.state))}</span></div>
        ${this._tempCtrl(c.ac_entity,'ac')}
        <div class="inline-options">${opts.map(m=>`<button class="option cool ${e?.state===m?'active':''}" data-action="hvac" data-id="${esc(c.ac_entity)}" data-value="${esc(m)}" ${this._enabled()?'':'disabled'}>${icon(mdiMode(m))} ${esc(({cool:'Freddo',heat:'Caldo',dry:'Deum.',auto:'Auto',fan_only:'Ventola',heat_cool:'Auto caldo/freddo'})[m]||m)}</button>`).join('')}
        ${canPower?`<button class="power ${isOn?'active':''}" data-action="power-ac" data-id="${esc(c.ac_entity)}" ${this._enabled()?'':'disabled'} aria-label="${isOn?'Spegni':'Accendi'} climatizzatore">${icon('power')}</button>`:''}</div>
        ${!this._enabled()?`<div class="control-note">${icon('lock-outline')} Comandi disattivati · Editor → Avanzate → Abilita comandi reali</div>`:''}
        ${(presets.length||c.ac_program_entity)?`<div class="small-program ${presets.length?'ac-preset':''}"><span class="caption">${presets.length?'Preset':'Programma'}</span>${presets.length?`<button class="preset-trigger" data-action="open-ac-preset">${icon('tune')} <span>${esc(e.attributes.preset_mode||'Seleziona')}</span>${icon('chevron-right')}</button>`:c.ac_program_entity?`<button data-action="open-ac-select" ${this._select(c.ac_program_entity).length?'':'disabled'}>${icon('calendar-clock')} <span>${valid(sel)?esc(sel.state):'Non disponibile'}</span>${icon('chevron-right')}</button>`:''}</div>`:''}
      </section>`;
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
        const current=ambient(e),t=target(e),period=['today','week','month'][this._period],dur=formatDuration(this._state(v[period]));
        return `<div class="zone"><div class="zone-top">${icon('radiator')}<span class="pill ${s.state==='heat'?'heat':'off'}">${esc(s.label)}</span></div><div class="zone-name">${esc(name)}</div><div class="zone-meta">Ambiente ${temp(current)} · Setpoint ${temp(t)}</div><div class="zone-bottom"><strong>${temp(t)}</strong><small>${esc(dur)}<br>${['oggi','settimana','mese'][this._period]}</small></div><button class="details" data-action="open-valve" data-index="${i}">Dettagli e stato ${icon('chevron-right')}</button></div>`;
      }).join('')}</div></section>`;
    }
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
    _seasons(){const choices=[];if(isShown(this._cfg,'heat')&&this._cfg.heat_entity)choices.push(['winter','Inverno']);if(isShown(this._cfg,'ac')&&this._cfg.ac_entity)choices.push(['summer','Estate']);if(!choices.length)return '';const chosen=choices.some(x=>x[0]===this._season)?this._season:choices[0][0];if(this._season!==chosen)this._season=chosen;return `<section class="section"><button class="fold" data-action="toggle-seasons" aria-expanded="${this._seasonOpen}"><span class="fold-label">${icon('chart-bar')}<span class="fold-title">Dettagli e statistiche</span></span><span class="fold-tail">${this._seasonOpen?'Chiudi':'Apri'} ${icon(this._seasonOpen?'chevron-up':'chevron-right')}</span></button>${this._seasonOpen?`<div class="panel"><div class="section-row"><span class="caption">CONFRONTO PER STAGIONE</span><div class="tabs">${choices.map(([s,n])=>`<button class="${chosen===s?'active':''}" data-action="season" data-value="${s}">${n}</button>`).join('')}</div></div>${this._seasonCards()}</div>`:''}</section>`;}
    _automations(){const c=this._cfg;return `<section class="section"><button class="fold" data-action="toggle-automations" aria-expanded="${this._autoOpen}"><span class="fold-label">${icon('cog-outline')}<span class="fold-title">Automazioni associate (${c.automations.length})</span></span><span class="fold-tail">${this._autoOpen?'Chiudi':'Apri'} ${icon(this._autoOpen?'chevron-up':'chevron-right')}</span></button>${this._autoOpen?`<div class="panel">${c.automations.length?c.automations.map((a,i)=>{
      const e=this._state(a.entity),known=valid(e),on=known&&e.state==='on';return `<div class="aut-row"><div><strong>${esc(a.name||friendly(this._hass,a.entity,`Automazione ${i+1}`))}</strong><small>${!known?'Non disponibile':on?'Abilitata':'Disabilitata'}</small></div><button class="switch ${on?'on':''}" data-action="automation" data-index="${i}" role="switch" aria-label="${on?'Disabilita':'Abilita'} automazione" aria-checked="${on}" ${this._enabled()&&known&&!this._pending.has(JSON.stringify(['automation',on?'turn_off':'turn_on',undefined]))?'':'disabled'}><i></i></button></div>`;
    }).join(''):`<p class="hint">Configura automazioni nell'editor della card.</p>`}</div>`:''}</section>`;}
    _popup(){if(!this._modal)return '';
      let name='',body='';
      if(this._modal.kind==='valve'){
        const i=this._modal.index,v=this._cfg.valves[i];if(!v)return '';
        const e=this._state(v.entity),t=target(e),mode=actionStatus(e),restore=v.restore_method==='netatmo'||v.restore_method==='script'&&!!v.restore_script;
        const canOff=Array.isArray(e?.attributes?.hvac_modes)&&e.attributes.hvac_modes.includes('off');
        const o=this._overrides.get(v.entity);
        name=v.name||friendly(this._hass,v.entity,`Valvola ${i+1}`);
        body=`<div class="modal-block"><div class="row"><span class="caption">Temperatura ambiente</span><strong>${temp(ambient(e))}</strong></div><div class="row" style="margin-top:8px"><span class="caption">Stato</span><span class="pill ${mode.state==='heat'?'heat':'off'}">${esc(mode.label)}</span></div></div>
          <div class="modal-block">${this._tempCtrl(v.entity,'heat')}</div>
          <h3 class="modal-title">GESTIONE VALVOLA</h3><div class="mode-grid"><button data-action="manual" data-index="${i}" ${this._enabled()&&t!==null?'':'disabled'}>${icon('thermometer-plus')} Manuale</button><button data-action="valve-off" data-index="${i}" ${this._enabled()&&canOff?'':'disabled'}>${icon('power')} Spegni</button><button data-action="restore" data-index="${i}" ${this._enabled()&&restore?'':'disabled'}>${icon('calendar-check')} Programma</button></div>
          <p class="hint">${o?`Ultimo comando dalla card: ${esc(o.mode)} (${esc(new Intl.DateTimeFormat('it-IT',{hour:'2-digit',minute:'2-digit'}).format(new Date(o.time)))})`:'Modalità manuale e stato del programma dipendono dall’integrazione configurata.'}</p>
          <h3 class="modal-title">TEMPO DI FUNZIONAMENTO</h3><div class="modal-stats">${[['Oggi','today'],['Settimana','week'],['Mese','month']].map(([n,k])=>`<div><strong>${formatDuration(this._state(v[k]))}</strong><small>${n}</small></div>`).join('')}</div>
          <p class="hint">La richiesta di calore non coincide necessariamente con l'apertura fisica della valvola. I tempi sono quelli dei sensori selezionati.</p>`;
      }else{
        const isHeat=this._modal.kind==='heat-program';const selectId=isHeat?this._cfg.heat_schedule_entity:this._cfg.ac_program_entity;
        const climateId=this._cfg.ac_entity,e=this._state(climateId);
        const preset=this._modal.kind==='ac-preset';
        name=isHeat?'Programma termostato':preset?'Preset climatizzatore':'Programma climatizzatore';
        const options=preset?(Array.isArray(e?.attributes?.preset_modes)?e.attributes.preset_modes:[]):this._select(selectId);
        const chosen=preset?e?.attributes?.preset_mode:this._state(selectId)?.state;
        body=`<p class="dialog-note">Opzioni disponibili in Home Assistant</p><div class="mode-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">${options.length?options.map(opt=>`<button data-action="choose-program" data-value="${esc(opt)}" class="${opt===chosen?'active':''}" ${this._enabled()?'':'disabled'}>${opt===chosen?icon('check'):''}${esc(opt)}</button>`).join(''):`<p class="hint">Nessun programma disponibile.</p>`}</div>`;
      }
      const eyebrow=this._modal.kind==='valve'?'DETTAGLI E STATO':this._modal.kind==='heat-program'?'PROGRAMMA TERMOSTATO':this._modal.kind==='ac-preset'?'PRESET CLIMATIZZATORE':'PROGRAMMA CLIMATIZZATORE';
      return `<div class="backdrop" data-backdrop="1"><section class="dialog" role="dialog" aria-modal="true" aria-label="${esc(name)}"><header class="dialog-head"><div><span class="eyebrow">${eyebrow}</span>${this._modal.kind==='valve'?`<strong>${esc(name)}</strong>`:''}</div><button class="close" data-action="close" aria-label="Chiudi">${icon('close')}</button></header><div class="dialog-body">${body}${this._error?`<p class="error">${esc(this._error)}</p>`:''}</div></section></div>`;
    }
    _refreshPeriod(){
      const stats=this.shadowRoot.querySelector('.stats');
      if(stats){
        const t=document.createElement('template');t.innerHTML=this._stats();
        const next=t.content.querySelector('.stats');
        if(next)stats.replaceChildren(...next.childNodes);
        stats.closest('.section')?.querySelectorAll('.tabs button').forEach((button,i)=>{
          button.classList.toggle('active',i===this._period);
          button.setAttribute('aria-pressed',String(i===this._period));
        });
      }
      const zones=this.shadowRoot.querySelector('.zones');
      if(zones){
        const t=document.createElement('template');t.innerHTML=this._valves();
        const newItems=t.content.querySelectorAll('.zone-bottom small');
        zones.querySelectorAll('.zone-bottom small').forEach((old,i)=>{
          if(newItems[i])old.innerHTML=newItems[i].innerHTML;
        });
      }
    }
    _refreshFold(action){
      const button=this.shadowRoot.querySelector(`button[data-action="${action}"]`);
      if(!button)return;
      const t=document.createElement('template');
      t.innerHTML=action==='toggle-seasons'?this._seasons():this._automations();
      const updated=t.content.querySelector(`button[data-action="${action}"]`);
      if(!updated)return;
      button.setAttribute('aria-expanded',updated.getAttribute('aria-expanded'));
      const tail=button.querySelector('.fold-tail'),nextTail=updated.querySelector('.fold-tail');
      if(tail&&nextTail)tail.innerHTML=nextTail.innerHTML;
      const section=button.closest('.section');
      section?.querySelector(':scope > .panel')?.remove();
      const newPanel=updated.closest('.section')?.querySelector(':scope > .panel');
      if(newPanel&&section)section.append(newPanel);
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
    _currentSig(){
      const c=this._cfg,h=this._hass,keys=[c.heat_entity,c.heat_schedule_entity,c.heat_activity_entity,c.ac_entity,c.ac_program_entity,c.ac_activity_entity,...Object.keys(c).filter(k=>/_(today|week|month|last|previous)$/.test(k)).map(k=>c[k]),...c.valves.flatMap(v=>[v.entity,v.activity_entity,v.today,v.week,v.month]),...c.automations.map(a=>a.entity)];
      return JSON.stringify({c,dark:this._dark(),p:this._period,season:this._season,so:this._seasonOpen,ao:this._autoOpen,modal:this._modal,err:this._error,pending:[...this._pending],override:[...this._overrides],data:[...new Set(keys.filter(Boolean))].map(id=>{const e=h.states[id];return [id,e?.state,e?.attributes?.temperature,e?.attributes?.current_temperature,e?.attributes?.hvac_action,e?.attributes?.hvac_modes,e?.attributes?.options,e?.attributes?.preset_modes,e?.attributes?.preset_mode,e?.attributes?.unit_of_measurement,e?.attributes?.friendly_name]})});
    }
    _render(){if(!this.isConnected||!this._hass)return;
      const c=this._cfg;
      const sig=this._currentSig();
      if(sig===this._sig)return;this._sig=sig;
      const scroll=this.shadowRoot.querySelector('.dialog-body')?.scrollTop||0;const outerScroll=this._outerScroll();
      let html=`<style>${CSS}</style><div class="root ${this._dark()?'dark':''}"><header class="header"><div class="eyebrow">${esc(c.eyebrow)}</div><h2 class="title">${esc(c.title)}<b>.</b></h2></header>`;
      const heroes=[isShown(c,'heat')&&(c.heat_entity||c.heat_schedule_entity)?this._heating():'',isShown(c,'ac')&&c.ac_entity?this._aircon():''].filter(Boolean);
      if(heroes.length)html+=`<div class="heroes">${heroes.join('')}</div>`;
      if(!heroes.length&&!(isShown(c,'valves')&&c.valves.length))html+=`<p class="hint">Configura almeno un termostato, un programma, un climatizzatore o una valvola nell'editor visuale.</p>`;
      if(isShown(c,'stats'))html+=this._stats();
      if(isShown(c,'valves'))html+=this._valves();
      if(isShown(c,'seasons'))html+=this._seasons();
      if(isShown(c,'automations'))html+=this._automations();
      if(!c.controls_enabled)html+='<p class="footer">Modalità sola lettura: abilita i comandi nell’editor quando hai verificato le entità.</p>';
      if(this._error&&!this._modal)html+=`<p class="main-error" role="alert">${esc(this._error)}</p>`;
      html+=(this._modal?this._popup():'')+'</div>';
      this.shadowRoot.innerHTML=html;const body=this.shadowRoot.querySelector('.dialog-body');if(body)body.scrollTop=scroll;outerScroll.forEach(([el,y])=>{if(el.isConnected&&el.scrollTop!==y)el.scrollTop=y});
    }
    _open(v){this._error='';this._modal=v;this._lockPage();this._sig='';this._render();this.shadowRoot.querySelector('.close')?.focus()}
    _close(){this._modal=null;this._error='';this._sig='';this._render();this._unlock()}
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
    _adjust(id,dir){const e=this._state(id),n=target(e);if(n===null)return;
      const {min,max,step}=tempLimits(e),value=clip(Math.round((n+step*dir)*100)/100,min,max);
      if(this._cfg.valves.some(v=>v.entity===id))this._overrides.set(id,{mode:'Manuale',time:Date.now()});
      return this._call('climate','set_temperature',{entity_id:id,temperature:value});
    }
    _click(e){const el=e.target.closest('button[data-action]');if(!el){if(e.target.dataset?.backdrop)this._close();return;}
      const a=el.dataset.action,i=Number(el.dataset.index),id=el.dataset.id,value=el.dataset.value;
      if(a==='close'){this._close();return;}if(a==='period'){this._period=i;this._refreshPeriod();this._sig=this._currentSig();return;}
      if(a==='toggle-seasons'){this._seasonOpen=!this._seasonOpen;this._refreshFold('toggle-seasons');this._sig=this._currentSig();return;}
      if(a==='season'){this._season=value;this._refreshFold('toggle-seasons');this._sig=this._currentSig();return;}
      if(a==='toggle-automations'){this._autoOpen=!this._autoOpen;this._refreshFold('toggle-automations');this._sig=this._currentSig();return;}
      if(a==='open-valve'){this._open({kind:'valve',index:i});return;}
      if(a==='open-program'){this._open({kind:'heat-program'});return;}
      if(a==='open-ac-preset'){this._open({kind:'ac-preset'});return;}
      if(a==='open-ac-select'){this._open({kind:'ac-select'});return;}
      if(!this._enabled())return;
      if(a==='adjust')return this._adjust(id,Number(el.dataset.dir));
      if(a==='hvac'){
        const climate=this._state(id),modes=climate?.attributes?.hvac_modes||[];
        if(!valid(climate)||!Array.isArray(modes)||!modes.includes(value)||value==='off')return;
        if(id===this._cfg.ac_entity)this._lastAcModes.set(id,value);
        return this._call('climate','set_hvac_mode',{entity_id:id,hvac_mode:value});
      }
      if(a==='power-ac'){
        const climate=this._state(this._cfg.ac_entity);if(!valid(climate)||id!==this._cfg.ac_entity)return;
        const modes=Array.isArray(climate.attributes?.hvac_modes)?climate.attributes.hvac_modes:[];
        const flags=Number(climate.attributes?.supported_features||0);
        if(climate.state==='off'){
          if((flags&256)!==0&&this._hass?.services?.climate?.turn_on)return this._call('climate','turn_on',{entity_id:id});
          const preferred=this._lastAcModes.get(id);
          const mode=(preferred&&modes.includes(preferred)?preferred:null)||['cool','heat_cool','auto','heat','dry','fan_only'].find(v=>modes.includes(v));
          if(mode)return this._call('climate','set_hvac_mode',{entity_id:id,hvac_mode:mode});
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
      if(a==='choose-program'){
        if(this._modal?.kind==='ac-preset'){
          if(!this._state(this._cfg.ac_entity)?.attributes?.preset_modes?.includes(value))return;
          return this._call('climate','set_preset_mode',{entity_id:this._cfg.ac_entity,preset_mode:value});
        }
        const ent=this._modal?.kind==='heat-program'?this._cfg.heat_schedule_entity:this._cfg.ac_program_entity;
        if(this._select(ent).includes(value))return this._call('select','select_option',{entity_id:ent,option:value});return;
      }
      if(a==='automation'){
        const o=this._cfg.automations[i],st=this._state(o?.entity);
        if(!valid(st))return;
        const service=st.state==='on'?'turn_off':'turn_on';
        if(service==='turn_off'&&this._cfg.confirm_automation_disable&&!confirm(`Disabilitare l'automazione “${o.name||friendly(this._hass,o.entity,o.entity)}”?`))return;
        return this._call('automation',service,{entity_id:o.entity});
      }
    }
    _slide(e){const el=e.target;if(el?.dataset?.temp===undefined)return;
      const display=el.parentElement?.querySelector('[data-slider-value]');if(display)display.textContent=temp(Number(el.value));
      const min=Number(el.min),max=Number(el.max);el.style.setProperty('--fill',`${clip((Number(el.value)-min)/(max-min)*100,0,100)}%`);
    }
    _change(e){const el=e.target;if(el?.dataset?.temp===undefined)return;
      const id=el.dataset.temp,val=Number(el.value),entity=this._state(id);if(!this._enabled()||!Number.isFinite(val)||!valid(entity))return;
      const {min,max}=tempLimits(entity);if(val<min||val>max)return;
      if(this._cfg.valves.some(v=>v.entity===id))this._overrides.set(id,{mode:'Manuale',time:Date.now()});
      this._call('climate','set_temperature',{entity_id:id,temperature:val});
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
      if(this._sub==='heat')text+=this._entity('heat_schedule_entity','Programmi del termostato · select.*',['select'],'Seleziona qui l’entità dei programmi, anche se non hai un termostato climate.*. Le opzioni vengono lette da Home Assistant.')+this._entity('heat_entity','Termostato temperatura (facoltativo) · climate.*',['climate'],'Se presente, mostra temperatura ambiente, setpoint e stato HVAC. Non inserire qui un’entità select.*.')+this._entity('heat_activity_entity','Stato riscaldamento / richiesta calore (facoltativo)',['binary_sensor','switch','input_boolean','sensor'],'Non rappresenta automaticamente l’accensione della caldaia.');
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
    _appearance(){return `<h3>Identità Edera</h3>${this._text('eyebrow','Intestazione superiore')}${this._text('title','Titolo card')}${this._select('theme_mode','Tema',[['auto','Automatico · Home Assistant'],['light','Edera Light'],['dark','Graphite Dark']])}
      ${this._select('layout','Modalità della card',[['complete','Completa'],['heat','Solo riscaldamento'],['ac','Solo climatizzatore'],['valves','Solo valvole'],['custom','Personalizzata']])}
      ${this._select('temperature_control','Regolazione temperatura',[['step','Pulsanti − / +'],['slider','Slider temperatura']])}
      <h3>Sezioni visibili</h3>${[['heat','Riscaldamento'],['ac','Climatizzatore'],['valves','Valvole'],['stats','Tempi di funzionamento'],['seasons','Dettagli e statistiche'],['automations','Automazioni associate']].map(([k,n])=>this._check(`show_${k}`,n)).join('')}<p class="note">Le modalità Solo riscaldamento, Solo climatizzatore e Solo valvole nascondono automaticamente i dispositivi non pertinenti.</p>`;
    }
    _advanced(){return `<h3>Controlli e sicurezza</h3>${this._check('controls_enabled','Abilita comandi reali','Disattivato per impostazione predefinita.')}${this._check('confirm_automation_disable','Conferma prima di disabilitare automazioni')}<p class="note">La card non concede permessi aggiuntivi rispetto a Home Assistant. Il ripristino del programma delle valvole usa il metodo configurato individualmente; se assente, il pulsante non invia comandi.</p>`}
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
