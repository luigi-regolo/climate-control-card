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
  // Languages: Italian, English, German and French. The language follows the Home Assistant user; English is the fallback.
  const LANGS = Object.freeze([['it','Italiano'],['en','English'],['de','Deutsch'],['fr','Français']]);
  const TR = {
    it: {
      tClima:'Clima', tMod:'Moduli', climaD:'Scegli il riscaldamento e il climatizzatore mostrati in alto nella card. Puoi rimuovere ogni entità singolarmente.', modD:'Le sezioni sotto la card: attiva solo quelle che ti servono. Un modulo spento sparisce dalla barra delle sezioni.', showIn:'Mostra nella card', hHeat:'Termostato, programmi e preset del riscaldamento.', hAc:'Climatizzatore con accensione, modalità e preset.', mValves:'Valvole termostatiche', hValves:'Una scheda per ogni valvola, con il popup «Dettagli e stato».',
      defTitle:'Clima Casa', na:'N/D', stNa:'Non disponibile', stHeating:'In funzione', stCooling:'Raffreddamento', stIdle:'In attesa', stOff:'Spento', stOn:'Acceso',
      pAway:'Assente', pFrost:'Antigelo', pBoost:'Boost', pSchedule:'Programmazione', pHome:'Casa', pEco:'Eco', pComfort:'Comfort', pSleep:'Notte', pNone:'Nessuno', pActivity:'Attività',
      mCool:'Freddo', mHeat:'Caldo', mDry:'Deum.', mAuto:'Auto', mFan:'Ventola', mHeatCool:'Auto caldo/freddo',
      setLbl:'Temperatura impostata', setShort:'IMPOSTATA', dec:'Diminuisci temperatura', inc:'Aumenta temperatura',
      heatingK:'RISCALDAMENTO', aircondK:'CLIMATIZZATORE', ambient:'Ambiente', preset:'Preset', presetHeatAria:'Preset riscaldamento', presetAcAria:'Preset climatizzatore',
      powerOn:'Accendi climatizzatore', powerOff:'Spegni climatizzatore',
      valvesActive:'Valvole attive', heatDemandNow:'Richiesta calore · ora', heating:'Riscaldamento', aircond:'Climatizzatore', fromSensor:'Durata dal sensore',
      runTimes:'TEMPI DI FUNZIONAMENTO', today:'Oggi', week:'Settimana', month:'Mese', todayL:'oggi', weekL:'settimana', monthL:'mese',
      valveN:'Valvola {n}', ambientT:'Ambiente {t}', details:'Dettagli e stato', winter:'Inverno', summer:'Estate', seasonCmp:'CONFRONTO PER STAGIONE', tabTimes:'Tempi', tabSeasons:'Stagioni',
      autN:'Automazione {n}', autOn:'Abilitata', autOff:'Disabilitata', autEnable:'Abilita automazione', autDisable:'Disabilita automazione', autEmpty:'Configura le automazioni nell’editor della card.',
      roomTemp:'Temperatura ambiente', status:'Stato', valveMgmt:'GESTIONE VALVOLA', manual:'Manuale', turnOff:'Spegni', program:'Programma',
      ovManual:'Manuale', ovOff:'Spenta', ovProgram:'Programma', lastCmd:'Ultimo comando dalla card: {m} ({t})',
      valveHint:'Modalità manuale e stato del programma dipendono dall’integrazione configurata.', runTime:'TEMPO DI FUNZIONAMENTO',
      demandHint:'La richiesta di calore non coincide necessariamente con l’apertura fisica della valvola. I tempi sono quelli dei sensori selezionati.',
      presetT:'PRESET', inUse:'In uso', programT:'PROGRAMMA', noProgram:'Nessun programma disponibile.', modesT:'MODALITÀ',
      modesHint:'Le modalità disponibili dipendono dall’entità termostato configurata.',
      modesNone:'Per visualizzare Assente e le altre modalità, seleziona nell’editor un’entità climate.* che esponga tali preset. I programmi select.* non includono necessariamente Assente.',
      close:'Chiudi', emptyCfg:'Configura almeno un termostato, un programma, un climatizzatore o una valvola nell’editor visuale.',
      secValves:'Valvole', secStats:'Statistiche', secAut:'Automazioni', secAria:'Sezioni della card',
      nValves1:'1 valvola', nValves:'{n} valvole', nAut1:'1 automazione', nAut:'{n} automazioni', noAut:'Nessuna automazione',
      valvesActiveOf:'{a} su {n} in funzione', autActiveOf:'Attive: {a} su {n}', statsBoth:'Tempi · Stagioni', statsTimes:'Tempi', statsSeasons:'Stagioni', statsToday:'Oggi {d}',
      readOnly:'Modalità sola lettura: abilita i comandi nell’editor quando hai verificato le entità.',
      noSource:'Nessuna sorgente disponibile per questa modalità.', noMonths:'Nessun mese selezionato', winterHeat:'Inverno · Riscaldamento', summerAc:'Estate · Climatizzatore',
      prevSeason:'Stagione precedente', lastSeason:'Ultima stagione', nextScenario:'Scenario successivo', scenarioT:'Scenario illustrativo: media delle ultime due stagioni, non previsione meteorologica',
      months:'Gen,Feb,Mar,Apr,Mag,Giu,Lug,Ago,Set,Ott,Nov,Dic',
      errSvc:'Azione {s} non disponibile', errCmd:'Comando non riuscito.', errPower:'Nessuna modalità di accensione supportata.', cfDisable:'Disabilitare l’automazione “{n}”?',
      secs:'Configurazione Climate Control Card', tLook:'Aspetto',             fSchedule:'Programmi del termostato · select.*', fScheduleH:'Seleziona qui l’entità dei programmi, anche se non hai un termostato climate.*. Le opzioni vengono lette da Home Assistant.',
      fPreset:'Modalità termostato (es. Assente) · climate.*', fPresetH:'Facoltativo. Scegli un’entità dello stesso impianto che esponga i preset (away, schedule, frost_guard). I comandi possono interessare l’intera abitazione, secondo l’integrazione.',
      fHeat:'Termostato temperatura (facoltativo) · climate.*', fHeatH:'Se presente, mostra temperatura ambiente, setpoint e stato HVAC. Non inserire qui un’entità select.*.',
      fHeatAct:'Stato riscaldamento / richiesta calore (facoltativo)', fHeatActH:'Non rappresenta automaticamente l’accensione della caldaia.',
      fAc:'Climatizzatore', fAcProg:'Programma climatizzatore (facoltativo)', fAcProgH:'Seleziona solo una vera entità di programma, se esiste.', fAcAct:'Sensore funzionamento climatizzatore (facoltativo)',
      remove:'Rimuovi', fValve:'Entità valvola', fName:'Nome nella card (facoltativo)', fNameH:'Se vuoto, viene usato il nome assegnato in Home Assistant.', fDemand:'Richiesta calore (facoltativo)',
      fRestore:'Ripristina programma', rsNone:'Non configurato', rsNetatmo:'Azione Netatmo (per dispositivi compatibili)', rsScript:'Script Home Assistant personalizzato',
      fRestoreH:'Seleziona esplicitamente il metodo compatibile con il tuo impianto.', fRestoreScript:'Script ripristino',
      fTimeToday:'Tempo oggi', fTimeWeek:'Tempo settimana', fTimeMonth:'Tempo mese', addValve:'Aggiungi valvola', entPh:'Seleziona o cerca entità', rmEntity:'Rimuovi entità',
      statsH:'Tempi di funzionamento', statsD:'I sensori devono misurare la durata effettiva, con unità di tempo esplicita (h, min o s). Nessun valore viene inventato.',
      seasonsH:'Confronti stagionali', seasonsD:'Scegli i mesi di Inverno ed Estate. Configura sensori aggregati storici se disponibili.',
      fPrevH:'Ore stagione precedente', fLastH:'Ore ultima stagione',
      scenarioD:'Scenario successivo: calcolato solo se entrambi i dati sono disponibili. La scelta dei mesi definisce il periodo; per le statistiche storiche occorrono comunque dati già aggregati per quei mesi.',
      autH:'Automazioni associate', autD:'Aggiungi liberamente le automazioni. Se il nome personalizzato è vuoto, la card usa il nome originale di Home Assistant.',
      fAut:'Entità automazione', fAutName:'Nome personalizzato (facoltativo)', fAutNameH:'Lascia vuoto per usare il friendly_name di Home Assistant.', addAut:'Aggiungi automazione',
      ckEye:'Mostra intestazione superiore', ckEyeH:'Se disattivata rimane visibile soltanto il titolo principale con il punto.', fEye:'Testo intestazione superiore',
      ckTitle:'Mostra titolo card', ckTitleH:'Se disattivata il titolo e il punto verde non vengono mostrati.', fTitle:'Titolo card', fTitleH:'Se vuoto, viene usato il titolo predefinito nella lingua della card.',
      fTheme:'Tema', thAuto:'Automatico · Home Assistant', thLight:'Edera Light', thDark:'Graphite Dark',
      fMode:'Modalità della card', lyComplete:'Completa', lyHeat:'Solo riscaldamento', lyAc:'Solo climatizzatore', lyValves:'Solo valvole', lyCustom:'Personalizzata',
      fCtrl:'Regolazione temperatura', ctArc:'Arco con − / +', ctRing:'Anello con − / +',
            visD:'Le modalità Solo riscaldamento, Solo climatizzatore e Solo valvole nascondono automaticamente i dispositivi non pertinenti.',
      lang:'Lingua', langAuto:'Automatica (Home Assistant)', langH:'Automatica segue la lingua dell’utente in Home Assistant. Se la lingua non è disponibile si usa l’inglese.',
      advH:'Controlli e sicurezza', ckCtl:'Abilita comandi reali', ckCtlH:'Attivo per impostazione predefinita. Disattivalo per usare la card in sola lettura.',
      ckConfirm:'Conferma prima di disabilitare automazioni',
      advD:'La card non concede permessi aggiuntivi rispetto a Home Assistant. Il ripristino del programma delle valvole usa il metodo configurato individualmente; se assente, il pulsante non invia comandi.'
    },
    en: {
      tClima:'Climate', tMod:'Modules', climaD:'Choose the heating and air conditioner shown at the top of the card. You can remove each entity one by one.', modD:'The sections below the card: turn on only the ones you need. A module that is off disappears from the section bar.', showIn:'Show on the card', hHeat:'Heating thermostat, schedules and presets.', hAc:'Air conditioner with power, modes and presets.', mValves:'Thermostatic valves', hValves:'One tile per valve, with the “Details and status” popup.',
      defTitle:'Home climate', na:'N/A', stNa:'Unavailable', stHeating:'Heating', stCooling:'Cooling', stIdle:'Idle', stOff:'Off', stOn:'On',
      pAway:'Away', pFrost:'Frost guard', pBoost:'Boost', pSchedule:'Schedule', pHome:'Home', pEco:'Eco', pComfort:'Comfort', pSleep:'Sleep', pNone:'None', pActivity:'Activity',
      mCool:'Cool', mHeat:'Heat', mDry:'Dry', mAuto:'Auto', mFan:'Fan', mHeatCool:'Heat/cool',
      setLbl:'Target temperature', setShort:'TARGET', dec:'Decrease temperature', inc:'Increase temperature',
      heatingK:'HEATING', aircondK:'AIR CONDITIONER', ambient:'Room', preset:'Presets', presetHeatAria:'Heating presets', presetAcAria:'Air conditioner presets',
      powerOn:'Turn on air conditioner', powerOff:'Turn off air conditioner',
      valvesActive:'Active valves', heatDemandNow:'Heat demand · now', heating:'Heating', aircond:'Air conditioner', fromSensor:'Duration from sensor',
      runTimes:'RUN TIMES', today:'Today', week:'Week', month:'Month', todayL:'today', weekL:'week', monthL:'month',
      valveN:'Valve {n}', ambientT:'Room {t}', details:'Details and status', winter:'Winter', summer:'Summer', seasonCmp:'SEASON COMPARISON', tabTimes:'Times', tabSeasons:'Seasons',
      autN:'Automation {n}', autOn:'Enabled', autOff:'Disabled', autEnable:'Enable automation', autDisable:'Disable automation', autEmpty:'Add automations in the card editor.',
      roomTemp:'Room temperature', status:'Status', valveMgmt:'VALVE CONTROL', manual:'Manual', turnOff:'Turn off', program:'Schedule',
      ovManual:'Manual', ovOff:'Off', ovProgram:'Schedule', lastCmd:'Last command from the card: {m} ({t})',
      valveHint:'Manual mode and schedule status depend on the configured integration.', runTime:'RUN TIME',
      demandHint:'Heat demand does not necessarily match the physical opening of the valve. Times come from the selected sensors.',
      presetT:'PRESETS', inUse:'In use', programT:'SCHEDULE', noProgram:'No schedule available.', modesT:'MODES',
      modesHint:'Available modes depend on the configured thermostat entity.',
      modesNone:'To show Away and the other modes, select a climate.* entity that exposes these presets in the editor. select.* schedules do not necessarily include Away.',
      close:'Close', emptyCfg:'Set up at least one thermostat, schedule, air conditioner or valve in the visual editor.',
      secValves:'Valves', secStats:'Statistics', secAut:'Automations', secAria:'Card sections',
      nValves1:'1 valve', nValves:'{n} valves', nAut1:'1 automation', nAut:'{n} automations', noAut:'No automations',
      valvesActiveOf:'{a} of {n} heating', autActiveOf:'{a} of {n} enabled', statsBoth:'Times · Seasons', statsTimes:'Times', statsSeasons:'Seasons', statsToday:'Today {d}',
      readOnly:'Read-only mode: enable controls in the editor once you have checked the entities.',
      noSource:'No source available for this mode.', noMonths:'No months selected', winterHeat:'Winter · Heating', summerAc:'Summer · Air conditioner',
      prevSeason:'Previous season', lastSeason:'Last season', nextScenario:'Next scenario', scenarioT:'Illustrative scenario: average of the last two seasons, not a weather forecast',
      months:'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec',
      errSvc:'Action {s} not available', errCmd:'Command failed.', errPower:'No supported power-on mode.', cfDisable:'Disable the automation “{n}”?',
      secs:'Climate Control Card settings', tLook:'Appearance',             fSchedule:'Thermostat schedules · select.*', fScheduleH:'Select the schedule entity here, even without a climate.* thermostat. Options are read from Home Assistant.',
      fPreset:'Thermostat modes (e.g. Away) · climate.*', fPresetH:'Optional. Choose an entity of the same system that exposes the presets (away, schedule, frost_guard). Depending on the integration, commands may affect the whole home.',
      fHeat:'Temperature thermostat (optional) · climate.*', fHeatH:'If set, shows room temperature, setpoint and HVAC status. Do not enter a select.* entity here.',
      fHeatAct:'Heating status / heat demand (optional)', fHeatActH:'Does not automatically mean the boiler is on.',
      fAc:'Air conditioner', fAcProg:'Air conditioner schedule (optional)', fAcProgH:'Only select a real schedule entity, if one exists.', fAcAct:'Air conditioner running sensor (optional)',
      remove:'Remove', fValve:'Valve entity', fName:'Name on the card (optional)', fNameH:'If empty, the name set in Home Assistant is used.', fDemand:'Heat demand (optional)',
      fRestore:'Restore schedule', rsNone:'Not configured', rsNetatmo:'Netatmo action (for compatible devices)', rsScript:'Custom Home Assistant script',
      fRestoreH:'Explicitly choose the method compatible with your system.', fRestoreScript:'Restore script',
      fTimeToday:'Time today', fTimeWeek:'Time this week', fTimeMonth:'Time this month', addValve:'Add valve', entPh:'Select or search an entity', rmEntity:'Remove entity',
      statsH:'Run times', statsD:'Sensors must measure the actual duration, with an explicit time unit (h, min or s). No values are made up.',
      seasonsH:'Season comparisons', seasonsD:'Choose the Winter and Summer months. Set up historical aggregated sensors if available.',
      fPrevH:'Previous season hours', fLastH:'Last season hours',
      scenarioD:'Next scenario: calculated only when both values are available. The chosen months set the period; historical statistics still need data already aggregated for those months.',
      autH:'Linked automations', autD:'Add any automations you like. If the custom name is empty, the card uses the original Home Assistant name.',
      fAut:'Automation entity', fAutName:'Custom name (optional)', fAutNameH:'Leave empty to use the Home Assistant friendly_name.', addAut:'Add automation',
      ckEye:'Show upper label', ckEyeH:'When off, only the main title with the dot stays visible.', fEye:'Upper label text',
      ckTitle:'Show card title', ckTitleH:'When off, the title and the green dot are hidden.', fTitle:'Card title', fTitleH:'If empty, the default title in the card language is used.',
      fTheme:'Theme', thAuto:'Automatic · Home Assistant', thLight:'Edera Light', thDark:'Graphite Dark',
      fMode:'Card mode', lyComplete:'Full', lyHeat:'Heating only', lyAc:'Air conditioner only', lyValves:'Valves only', lyCustom:'Custom',
      fCtrl:'Temperature control', ctArc:'Arc with − / +', ctRing:'Ring with − / +',
            visD:'Heating only, Air conditioner only and Valves only modes automatically hide unrelated devices.',
      lang:'Language', langAuto:'Automatic (Home Assistant)', langH:'Automatic follows the user’s language in Home Assistant. If the language is not available, English is used.',
      advH:'Controls and safety', ckCtl:'Enable real controls', ckCtlH:'On by default. Turn it off to use the card in read-only mode.',
      ckConfirm:'Confirm before disabling automations',
      advD:'The card grants no permissions beyond those of Home Assistant. Restoring a valve schedule uses the method configured for each valve; if none is set, the button sends no command.'
    },
    de: {
      tClima:'Klima', tMod:'Module', climaD:'Wähle Heizung und Klimaanlage für den oberen Kartenbereich. Jede Entität lässt sich einzeln entfernen.', modD:'Die Bereiche unter der Karte: aktiviere nur die, die du brauchst. Ein ausgeschaltetes Modul verschwindet aus der Bereichsleiste.', showIn:'Auf der Karte anzeigen', hHeat:'Thermostat, Zeitpläne und Presets der Heizung.', hAc:'Klimaanlage mit Ein/Aus, Modi und Presets.', mValves:'Thermostatventile', hValves:'Eine Kachel pro Ventil, mit dem Popup „Details und Status“.',
      defTitle:'Raumklima', na:'k. A.', stNa:'Nicht verfügbar', stHeating:'Heizt', stCooling:'Kühlt', stIdle:'Bereit', stOff:'Aus', stOn:'An',
      pAway:'Abwesend', pFrost:'Frostschutz', pBoost:'Boost', pSchedule:'Zeitplan', pHome:'Zuhause', pEco:'Eco', pComfort:'Komfort', pSleep:'Schlafen', pNone:'Keiner', pActivity:'Aktivität',
      mCool:'Kühlen', mHeat:'Heizen', mDry:'Entf.', mAuto:'Auto', mFan:'Lüfter', mHeatCool:'Heizen/Kühlen',
      setLbl:'Solltemperatur', setShort:'SOLL', dec:'Temperatur senken', inc:'Temperatur erhöhen',
      heatingK:'HEIZUNG', aircondK:'KLIMAANLAGE', ambient:'Raum', preset:'Presets', presetHeatAria:'Heizungs-Presets', presetAcAria:'Klimaanlagen-Presets',
      powerOn:'Klimaanlage einschalten', powerOff:'Klimaanlage ausschalten',
      valvesActive:'Aktive Ventile', heatDemandNow:'Wärmebedarf · jetzt', heating:'Heizung', aircond:'Klimaanlage', fromSensor:'Dauer laut Sensor',
      runTimes:'LAUFZEITEN', today:'Heute', week:'Woche', month:'Monat', todayL:'heute', weekL:'Woche', monthL:'Monat',
      valveN:'Ventil {n}', ambientT:'Raum {t}', details:'Details und Status', winter:'Winter', summer:'Sommer', seasonCmp:'SAISONVERGLEICH', tabTimes:'Zeiten', tabSeasons:'Saisons',
      autN:'Automation {n}', autOn:'Aktiviert', autOff:'Deaktiviert', autEnable:'Automation aktivieren', autDisable:'Automation deaktivieren', autEmpty:'Füge Automationen im Karteneditor hinzu.',
      roomTemp:'Raumtemperatur', status:'Status', valveMgmt:'VENTILSTEUERUNG', manual:'Manuell', turnOff:'Aus', program:'Zeitplan',
      ovManual:'Manuell', ovOff:'Aus', ovProgram:'Zeitplan', lastCmd:'Letzter Befehl der Karte: {m} ({t})',
      valveHint:'Manueller Modus und Zeitplanstatus hängen von der konfigurierten Integration ab.', runTime:'LAUFZEIT',
      demandHint:'Wärmebedarf entspricht nicht unbedingt der tatsächlichen Ventilöffnung. Die Zeiten stammen von den gewählten Sensoren.',
      presetT:'PRESETS', inUse:'Aktiv', programT:'ZEITPLAN', noProgram:'Kein Zeitplan verfügbar.', modesT:'MODI',
      modesHint:'Die verfügbaren Modi hängen von der konfigurierten Thermostat-Entität ab.',
      modesNone:'Um Abwesend und die anderen Modi anzuzeigen, wähle im Editor eine climate.*-Entität, die diese Presets bereitstellt. select.*-Zeitpläne enthalten nicht unbedingt Abwesend.',
      close:'Schließen', emptyCfg:'Richte im visuellen Editor mindestens ein Thermostat, einen Zeitplan, eine Klimaanlage oder ein Ventil ein.',
      secValves:'Ventile', secStats:'Statistiken', secAut:'Automationen', secAria:'Kartenbereiche',
      nValves1:'1 Ventil', nValves:'{n} Ventile', nAut1:'1 Automation', nAut:'{n} Automationen', noAut:'Keine Automationen',
      valvesActiveOf:'{a} von {n} aktiv', autActiveOf:'{a} von {n} aktiviert', statsBoth:'Zeiten · Saisons', statsTimes:'Zeiten', statsSeasons:'Saisons', statsToday:'Heute {d}',
      readOnly:'Nur-Lesen-Modus: Aktiviere die Steuerung im Editor, nachdem du die Entitäten geprüft hast.',
      noSource:'Keine Quelle für diesen Modus verfügbar.', noMonths:'Keine Monate ausgewählt', winterHeat:'Winter · Heizung', summerAc:'Sommer · Klimaanlage',
      prevSeason:'Vorherige Saison', lastSeason:'Letzte Saison', nextScenario:'Nächstes Szenario', scenarioT:'Veranschaulichendes Szenario: Durchschnitt der letzten zwei Saisons, keine Wettervorhersage',
      months:'Jan,Feb,Mär,Apr,Mai,Jun,Jul,Aug,Sep,Okt,Nov,Dez',
      errSvc:'Aktion {s} nicht verfügbar', errCmd:'Befehl fehlgeschlagen.', errPower:'Kein unterstützter Einschaltmodus.', cfDisable:'Automation „{n}“ deaktivieren?',
      secs:'Einstellungen der Climate Control Card', tLook:'Darstellung',             fSchedule:'Thermostat-Zeitpläne · select.*', fScheduleH:'Wähle hier die Zeitplan-Entität, auch ohne climate.*-Thermostat. Die Optionen werden aus Home Assistant gelesen.',
      fPreset:'Thermostat-Modi (z. B. Abwesend) · climate.*', fPresetH:'Optional. Wähle eine Entität derselben Anlage, die die Presets bereitstellt (away, schedule, frost_guard). Je nach Integration können Befehle das ganze Zuhause betreffen.',
      fHeat:'Temperatur-Thermostat (optional) · climate.*', fHeatH:'Falls gesetzt, werden Raumtemperatur, Sollwert und HVAC-Status angezeigt. Hier keine select.*-Entität eintragen.',
      fHeatAct:'Heizstatus / Wärmebedarf (optional)', fHeatActH:'Bedeutet nicht automatisch, dass der Kessel läuft.',
      fAc:'Klimaanlage', fAcProg:'Zeitplan der Klimaanlage (optional)', fAcProgH:'Wähle nur eine echte Zeitplan-Entität, falls vorhanden.', fAcAct:'Betriebssensor der Klimaanlage (optional)',
      remove:'Entfernen', fValve:'Ventil-Entität', fName:'Name auf der Karte (optional)', fNameH:'Wenn leer, wird der Name aus Home Assistant verwendet.', fDemand:'Wärmebedarf (optional)',
      fRestore:'Zeitplan wiederherstellen', rsNone:'Nicht konfiguriert', rsNetatmo:'Netatmo-Aktion (für kompatible Geräte)', rsScript:'Eigenes Home Assistant-Skript',
      fRestoreH:'Wähle ausdrücklich die Methode, die zu deiner Anlage passt.', fRestoreScript:'Wiederherstellungs-Skript',
      fTimeToday:'Zeit heute', fTimeWeek:'Zeit diese Woche', fTimeMonth:'Zeit diesen Monat', addValve:'Ventil hinzufügen', entPh:'Entität wählen oder suchen', rmEntity:'Entität entfernen',
      statsH:'Laufzeiten', statsD:'Die Sensoren müssen die tatsächliche Dauer mit einer klaren Zeiteinheit (h, min oder s) messen. Es werden keine Werte erfunden.',
      seasonsH:'Saisonvergleiche', seasonsD:'Wähle die Winter- und Sommermonate. Richte historische aggregierte Sensoren ein, falls vorhanden.',
      fPrevH:'Stunden vorherige Saison', fLastH:'Stunden letzte Saison',
      scenarioD:'Nächstes Szenario: wird nur berechnet, wenn beide Werte verfügbar sind. Die gewählten Monate legen den Zeitraum fest; historische Statistiken brauchen dennoch bereits aggregierte Daten dieser Monate.',
      autH:'Verknüpfte Automationen', autD:'Füge beliebige Automationen hinzu. Ist der eigene Name leer, verwendet die Karte den Originalnamen aus Home Assistant.',
      fAut:'Automations-Entität', fAutName:'Eigener Name (optional)', fAutNameH:'Leer lassen, um den friendly_name aus Home Assistant zu verwenden.', addAut:'Automation hinzufügen',
      ckEye:'Obere Beschriftung anzeigen', ckEyeH:'Wenn aus, bleibt nur der Haupttitel mit dem Punkt sichtbar.', fEye:'Text der oberen Beschriftung',
      ckTitle:'Kartentitel anzeigen', ckTitleH:'Wenn aus, werden Titel und grüner Punkt ausgeblendet.', fTitle:'Kartentitel', fTitleH:'Wenn leer, wird der Standardtitel in der Kartensprache verwendet.',
      fTheme:'Design', thAuto:'Automatisch · Home Assistant', thLight:'Edera Light', thDark:'Graphite Dark',
      fMode:'Kartenmodus', lyComplete:'Vollständig', lyHeat:'Nur Heizung', lyAc:'Nur Klimaanlage', lyValves:'Nur Ventile', lyCustom:'Benutzerdefiniert',
      fCtrl:'Temperaturregelung', ctArc:'Bogen mit − / +', ctRing:'Ring mit − / +',
            visD:'Die Modi Nur Heizung, Nur Klimaanlage und Nur Ventile blenden nicht passende Geräte automatisch aus.',
      lang:'Sprache', langAuto:'Automatisch (Home Assistant)', langH:'Automatisch folgt der Sprache des Benutzers in Home Assistant. Ist die Sprache nicht verfügbar, wird Englisch verwendet.',
      advH:'Steuerung und Sicherheit', ckCtl:'Echte Steuerung aktivieren', ckCtlH:'Standardmäßig an. Ausschalten, um die Karte nur lesend zu nutzen.',
      ckConfirm:'Vor dem Deaktivieren von Automationen bestätigen',
      advD:'Die Karte gewährt keine Rechte über die von Home Assistant hinaus. Die Wiederherstellung des Ventil-Zeitplans nutzt die je Ventil konfigurierte Methode; ist keine gesetzt, sendet die Schaltfläche keinen Befehl.'
    },
    fr: {
      tClima:'Climat', tMod:'Modules', climaD:'Choisissez le chauffage et le climatiseur affichés en haut de la carte. Chaque entité peut être supprimée séparément.', modD:'Les sections sous la carte : activez seulement celles dont vous avez besoin. Un module désactivé disparaît de la barre des sections.', showIn:'Afficher sur la carte', hHeat:'Thermostat, programmes et préréglages du chauffage.', hAc:'Climatiseur avec marche/arrêt, modes et préréglages.', mValves:'Vannes thermostatiques', hValves:'Une tuile par vanne, avec la fenêtre « Détails et état ».',
      defTitle:'Climat maison', na:'N/D', stNa:'Indisponible', stHeating:'En chauffe', stCooling:'Refroidit', stIdle:'En attente', stOff:'Éteint', stOn:'Allumé',
      pAway:'Absent', pFrost:'Hors-gel', pBoost:'Boost', pSchedule:'Programmation', pHome:'Maison', pEco:'Éco', pComfort:'Confort', pSleep:'Nuit', pNone:'Aucun', pActivity:'Activité',
      mCool:'Froid', mHeat:'Chaud', mDry:'Déshum.', mAuto:'Auto', mFan:'Ventilation', mHeatCool:'Chaud/froid',
      setLbl:'Température de consigne', setShort:'CONSIGNE', dec:'Baisser la température', inc:'Augmenter la température',
      heatingK:'CHAUFFAGE', aircondK:'CLIMATISEUR', ambient:'Pièce', preset:'Préréglages', presetHeatAria:'Préréglages du chauffage', presetAcAria:'Préréglages du climatiseur',
      powerOn:'Allumer le climatiseur', powerOff:'Éteindre le climatiseur',
      valvesActive:'Vannes actives', heatDemandNow:'Demande de chaleur · maintenant', heating:'Chauffage', aircond:'Climatiseur', fromSensor:'Durée du capteur',
      runTimes:'DURÉES DE FONCTIONNEMENT', today:'Aujourd’hui', week:'Semaine', month:'Mois', todayL:'aujourd’hui', weekL:'semaine', monthL:'mois',
      valveN:'Vanne {n}', ambientT:'Pièce {t}', details:'Détails et état', winter:'Hiver', summer:'Été', seasonCmp:'COMPARAISON SAISONNIÈRE', tabTimes:'Durées', tabSeasons:'Saisons',
      autN:'Automatisation {n}', autOn:'Activée', autOff:'Désactivée', autEnable:'Activer l’automatisation', autDisable:'Désactiver l’automatisation', autEmpty:'Ajoutez des automatisations dans l’éditeur de la carte.',
      roomTemp:'Température de la pièce', status:'État', valveMgmt:'COMMANDE DE LA VANNE', manual:'Manuel', turnOff:'Éteindre', program:'Programme',
      ovManual:'Manuel', ovOff:'Éteinte', ovProgram:'Programme', lastCmd:'Dernière commande de la carte : {m} ({t})',
      valveHint:'Le mode manuel et l’état du programme dépendent de l’intégration configurée.', runTime:'DURÉE DE FONCTIONNEMENT',
      demandHint:'La demande de chaleur ne correspond pas forcément à l’ouverture physique de la vanne. Les durées proviennent des capteurs sélectionnés.',
      presetT:'PRÉRÉGLAGES', inUse:'En cours', programT:'PROGRAMME', noProgram:'Aucun programme disponible.', modesT:'MODES',
      modesHint:'Les modes disponibles dépendent de l’entité thermostat configurée.',
      modesNone:'Pour afficher Absent et les autres modes, sélectionnez dans l’éditeur une entité climate.* qui expose ces préréglages. Les programmes select.* n’incluent pas forcément Absent.',
      close:'Fermer', emptyCfg:'Configurez au moins un thermostat, un programme, un climatiseur ou une vanne dans l’éditeur visuel.',
      secValves:'Vannes', secStats:'Statistiques', secAut:'Automatisations', secAria:'Sections de la carte',
      nValves1:'1 vanne', nValves:'{n} vannes', nAut1:'1 automatisation', nAut:'{n} automatisations', noAut:'Aucune automatisation',
      valvesActiveOf:'{a} sur {n} en chauffe', autActiveOf:'Activées : {a} sur {n}', statsBoth:'Durées · Saisons', statsTimes:'Durées', statsSeasons:'Saisons', statsToday:'Auj. {d}',
      readOnly:'Mode lecture seule : activez les commandes dans l’éditeur après avoir vérifié les entités.',
      noSource:'Aucune source disponible pour ce mode.', noMonths:'Aucun mois sélectionné', winterHeat:'Hiver · Chauffage', summerAc:'Été · Climatiseur',
      prevSeason:'Saison précédente', lastSeason:'Dernière saison', nextScenario:'Scénario suivant', scenarioT:'Scénario indicatif : moyenne des deux dernières saisons, pas une prévision météo',
      months:'Janv,Févr,Mars,Avr,Mai,Juin,Juil,Août,Sept,Oct,Nov,Déc',
      errSvc:'Action {s} indisponible', errCmd:'La commande a échoué.', errPower:'Aucun mode d’allumage pris en charge.', cfDisable:'Désactiver l’automatisation « {n} » ?',
      secs:'Paramètres de la Climate Control Card', tLook:'Apparence',             fSchedule:'Programmes du thermostat · select.*', fScheduleH:'Sélectionnez ici l’entité des programmes, même sans thermostat climate.*. Les options sont lues depuis Home Assistant.',
      fPreset:'Modes du thermostat (ex. Absent) · climate.*', fPresetH:'Facultatif. Choisissez une entité de la même installation qui expose les préréglages (away, schedule, frost_guard). Selon l’intégration, les commandes peuvent concerner tout le logement.',
      fHeat:'Thermostat de température (facultatif) · climate.*', fHeatH:'Si défini, affiche la température de la pièce, la consigne et l’état HVAC. N’indiquez pas ici une entité select.*.',
      fHeatAct:'État du chauffage / demande de chaleur (facultatif)', fHeatActH:'Ne signifie pas automatiquement que la chaudière est allumée.',
      fAc:'Climatiseur', fAcProg:'Programme du climatiseur (facultatif)', fAcProgH:'Sélectionnez uniquement une vraie entité de programme, si elle existe.', fAcAct:'Capteur de fonctionnement du climatiseur (facultatif)',
      remove:'Supprimer', fValve:'Entité de la vanne', fName:'Nom sur la carte (facultatif)', fNameH:'Si vide, le nom défini dans Home Assistant est utilisé.', fDemand:'Demande de chaleur (facultatif)',
      fRestore:'Rétablir le programme', rsNone:'Non configuré', rsNetatmo:'Action Netatmo (appareils compatibles)', rsScript:'Script Home Assistant personnalisé',
      fRestoreH:'Choisissez explicitement la méthode compatible avec votre installation.', fRestoreScript:'Script de rétablissement',
      fTimeToday:'Durée aujourd’hui', fTimeWeek:'Durée cette semaine', fTimeMonth:'Durée ce mois-ci', addValve:'Ajouter une vanne', entPh:'Sélectionner ou rechercher une entité', rmEntity:'Supprimer l’entité',
      statsH:'Durées de fonctionnement', statsD:'Les capteurs doivent mesurer la durée réelle, avec une unité de temps explicite (h, min ou s). Aucune valeur n’est inventée.',
      seasonsH:'Comparaisons saisonnières', seasonsD:'Choisissez les mois d’hiver et d’été. Configurez des capteurs agrégés historiques si disponibles.',
      fPrevH:'Heures saison précédente', fLastH:'Heures dernière saison',
      scenarioD:'Scénario suivant : calculé uniquement si les deux valeurs sont disponibles. Les mois choisis définissent la période ; les statistiques historiques nécessitent toutefois des données déjà agrégées pour ces mois.',
      autH:'Automatisations associées', autD:'Ajoutez librement des automatisations. Si le nom personnalisé est vide, la carte utilise le nom d’origine de Home Assistant.',
      fAut:'Entité d’automatisation', fAutName:'Nom personnalisé (facultatif)', fAutNameH:'Laissez vide pour utiliser le friendly_name de Home Assistant.', addAut:'Ajouter une automatisation',
      ckEye:'Afficher l’étiquette supérieure', ckEyeH:'Si désactivée, seul le titre principal avec le point reste visible.', fEye:'Texte de l’étiquette supérieure',
      ckTitle:'Afficher le titre de la carte', ckTitleH:'Si désactivé, le titre et le point vert sont masqués.', fTitle:'Titre de la carte', fTitleH:'Si vide, le titre par défaut dans la langue de la carte est utilisé.',
      fTheme:'Thème', thAuto:'Automatique · Home Assistant', thLight:'Edera Light', thDark:'Graphite Dark',
      fMode:'Mode de la carte', lyComplete:'Complète', lyHeat:'Chauffage seul', lyAc:'Climatiseur seul', lyValves:'Vannes seules', lyCustom:'Personnalisée',
      fCtrl:'Réglage de la température', ctArc:'Arc avec − / +', ctRing:'Anneau avec − / +',
            visD:'Les modes Chauffage seul, Climatiseur seul et Vannes seules masquent automatiquement les appareils non concernés.',
      lang:'Langue', langAuto:'Automatique (Home Assistant)', langH:'Automatique suit la langue de l’utilisateur dans Home Assistant. Si la langue n’est pas disponible, l’anglais est utilisé.',
      advH:'Commandes et sécurité', ckCtl:'Activer les commandes réelles', ckCtlH:'Activé par défaut. Désactivez-le pour utiliser la carte en lecture seule.',
      ckConfirm:'Confirmer avant de désactiver des automatisations',
      advD:'La carte n’accorde aucune autorisation au-delà de celles de Home Assistant. Le rétablissement du programme des vannes utilise la méthode configurée pour chaque vanne ; sans méthode, le bouton n’envoie aucune commande.'
    }
  };
  function tr(lang,key,vars){
    let t=TR[lang]?.[key];if(t==null)t=TR.en[key];if(t==null)return key;
    return vars?t.replace(/\{(\w+)\}/g,(m,x)=>vars[x]!=null?vars[x]:m):t;
  }
  function baseLang(hass){const l=hass&&((hass.locale&&hass.locale.language)||hass.language);return typeof l==='string'?l.toLowerCase().split(/[-_]/)[0]:'en';}
  function pickLang(cfgLang,hass){const l=cfgLang&&cfgLang!=='auto'?cfgLang:baseLang(hass);return TR[l]?l:'en';}
  const PRESET_KEYS={away:'pAway',frost_guard:'pFrost',boost:'pBoost',schedule:'pSchedule',home:'pHome',eco:'pEco',comfort:'pComfort',sleep:'pSleep',none:'pNone',activity:'pActivity'};
  const HVAC_KEYS={cool:'mCool',heat:'mHeat',dry:'mDry',auto:'mAuto',fan_only:'mFan',heat_cool:'mHeatCool'};
  const ENTITY_RX = /^(climate|select|sensor|binary_sensor|switch|automation|script|input_boolean)\.[a-z0-9_]+$/;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safe = (v, domains) => { const s = String(v ?? '').trim(); return ENTITY_RX.test(s) && domains.includes(s.split('.')[0]) ? s : ''; };
  const txt = (v, n=70) => String(v ?? '').trim().slice(0,n);
  const icon = (mdi) => `<ha-icon icon="mdi:${mdi}" aria-hidden="true"></ha-icon>`;
  const valid = e => !!e && !['unknown','unavailable',''].includes(e.state);
  const num = v => (v === null || v === undefined || String(v).trim() === '' || !Number.isFinite(Number(v))) ? null : Number(v);
  const fmt = (lang,n,min,max) => n.toLocaleString(lang,{minimumFractionDigits:min,maximumFractionDigits:max});
  const temp = (lang,n,unit='°C') => Number.isFinite(n) ? `${fmt(lang,n,1,1)}${esc(unit)}` : tr(lang,'na');
  const clip = (v,min,max) => Math.min(max,Math.max(min,v));
  const bool = v => v === true;
  const defaults = Object.freeze({
    type:`custom:${TAG}`, title:null, language:'auto', eyebrow:'CLIMATE CONTROL CARD', show_eyebrow:true, show_title:true, theme_mode:'auto', layout:'complete', temperature_control:'arc',
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
    c.title=txt(c.title,60)||null; c.eyebrow=txt(c.eyebrow,65)||defaults.eyebrow; c.show_eyebrow=c.show_eyebrow!==false; c.show_title=c.show_title!==false;
    c.language=LANGS.some(l=>l[0]===c.language)?c.language:'auto';
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
  // Saved config without the optional title when it is only the translated default.
  const outConfig = c => { const o={...c}; if(o.title==null) delete o.title; return o; };
  const isShown=(c,k)=>{
    if (c.layout==='custom'||c.layout==='complete') return c[`show_${k}`]!==false;
    if(k==='stats'||k==='seasons'||k==='automations')return c[`show_${k}`]!==false;
    return (c.layout==='heat'&&k==='heat')||(c.layout==='ac'&&k==='ac')||(c.layout==='valves'&&k==='valves');
  };
  const actionStatus = (lang,e) => {
    if(!valid(e))return {label:tr(lang,'stNa'),state:'off'};
    if(e.attributes?.hvac_action==='heating')return {label:tr(lang,'stHeating'),state:'heat'};
    if(e.attributes?.hvac_action==='cooling')return {label:tr(lang,'stCooling'),state:'cool'};
    if(e.attributes?.hvac_action==='idle')return {label:tr(lang,'stIdle'),state:'off'};
    if(e.state==='off')return {label:tr(lang,'stOff'),state:'off'};
    return {label:tr(lang,'stOn'),state:e.state==='heat'?'heat':e.state==='cool'?'cool':'on'};
  };
  const presetLabel = (lang,m) => PRESET_KEYS[m]?tr(lang,PRESET_KEYS[m]):m;
  const hvacLabel = (lang,m) => HVAC_KEYS[m]?tr(lang,HVAC_KEYS[m]):m;
  const friendly = (h,id,fallback)=> txt(h?.states?.[id]?.attributes?.friendly_name,65)||fallback;
  function formatDuration(lang,e) {
    if(!valid(e))return tr(lang,'na');
    let value=num(e.state);
    const unit=String(e.attributes?.unit_of_measurement??'').trim().toLowerCase();
    if(value!==null&&value>=0){
      let minutes=null;
      if(['h','hr','hrs','hour','hours','ore'].includes(unit))minutes=value*60;
      else if(['min','mins','minute','minutes','m'].includes(unit))minutes=value;
      else if(['s','sec','seconds','secondi'].includes(unit))minutes=value/60;
      if(minutes!==null){minutes=Math.round(minutes);return `${Math.floor(minutes/60)}h ${String(minutes%60).padStart(2,'0')}m`;}
      if(unit)return `${fmt(lang,value,0,1)} ${esc(e.attributes.unit_of_measurement)}`;
    }
    if(/^\d{1,4}:\d{2}(?::\d{2})?$/.test(String(e.state))) return esc(e.state);
    return tr(lang,'na');
  }
  function numericHours(e){
    if(!valid(e))return null;const v=num(e.state),u=String(e.attributes?.unit_of_measurement??'').toLowerCase();
    if(v===null||v<0)return null;
    if(['h','hr','hrs','hours','hour','ore'].includes(u))return v;
    if(['min','mins','minutes','minute','m'].includes(u))return v/60;
    if(['s','sec','seconds','secondi'].includes(u))return v/3600;
    return null;
  }
  const hours = (lang,n) => n===null?tr(lang,'na'):`${fmt(lang,n,0,1)}h`;
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
    .secbar{margin-top:9px;display:grid;grid-template-columns:repeat(var(--n,3),minmax(0,1fr));gap:6px}
    .sec{display:flex;align-items:center;gap:9px;width:100%;min-width:0;min-height:50px;padding:7px 10px;text-align:left;background:var(--cc-panel);color:var(--cc-text);border:1px solid var(--cc-border);border-radius:14px;transition:border-color .15s ease,background-color .15s ease}
    .sec:hover{border-color:color-mix(in srgb,var(--cc-green) 55%,var(--cc-border))}.sec[aria-expanded="true"]{border-color:var(--cc-green);background:color-mix(in srgb,var(--cc-green) 9%,var(--cc-panel))}
    .sec-ic{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:var(--cc-bg);border:1px solid var(--cc-border);color:var(--cc-green);flex:none}.sec-ic.heat{color:var(--cc-heat)}.sec-ic ha-icon{width:17px;height:17px;--mdc-icon-size:17px}
    .sec-txt{flex:1;display:block;min-width:0}.sec-name{display:block;font-size:13px;font-weight:650;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sec-sub{display:block;font-size:11px;color:var(--cc-muted);line-height:1.3;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
    .sec-chev{display:grid;place-items:center;color:var(--cc-muted);flex:none}.sec-chev ha-icon{width:18px;height:18px;--mdc-icon-size:18px}.sec[aria-expanded="true"] .sec-chev{color:var(--cc-green)}
    .sec-panel{margin-top:6px;padding:10px;border:1px solid var(--cc-border);border-radius:14px;background:var(--cc-surface);min-width:0}
    .sec-panel > section.section{margin-top:0}.sec-panel > section.section > h3.section-title{display:none}.sec-panel > section.section > .section-row > h3.section-title{display:none}.sec-panel > section.section > .section-row:first-child{justify-content:flex-start}.sec-panel > section.section > .panel{margin-top:0}.sec-panel > section.section > .panel > .panel{background:var(--cc-bg)}
    .backdrop{position:fixed;inset:0;z-index:9999;background:#0008;display:grid;place-items:center;padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));overscroll-behavior:none;touch-action:none}
    .dialog{width:min(390px,100%);height:min(calc(100vh - 40px),680px);height:min(calc(100dvh - 40px),680px);border:1px solid var(--cc-border);border-radius:20px;background:var(--cc-bg);color:var(--cc-text);box-shadow:0 20px 70px #0007;display:flex;flex-direction:column;overflow:hidden;touch-action:auto}
    .root.dark .dialog{--cc-bg:#0E100F;--cc-panel:#191C1A;--cc-text:#F5F7F4;--cc-muted:#BBC5BD;--cc-border:#2B302C;--cc-green:#52B995;background:#0E100F;color:#F5F7F4}
    .dialog-head{display:flex;align-items:center;justify-content:space-between;padding:9px 10px 9px 15px;gap:10px;background:var(--cc-bg);flex:none;border-bottom:1px solid var(--cc-border)}.dialog-head strong{font-size:15px;font-weight:650;display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .close{width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:var(--cc-panel);border:0;border-radius:50%;color:var(--cc-text);flex:none;padding:0}.close ha-icon{--mdc-icon-size:18px;width:18px;height:18px}
    .dialog-body{flex:1 1 auto;min-height:0;padding:10px 14px 14px;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;touch-action:pan-y;-webkit-overflow-scrolling:touch}
    .root.wide .dialog{width:min(1120px,100%);height:min(80vh,560px);height:min(80dvh,560px)}
    .root.wide .dialog-body{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:4px 22px;align-content:start;padding:12px 22px 22px}
    .pg{min-width:0}.pg.full{grid-column:1/-1}
    .modal-block{background:var(--cc-panel);border:1px solid var(--cc-border);border-radius:14px;padding:8px 11px;margin-bottom:8px}.modal-block strong{font-weight:650}.modal-block.setpoint-shell{background:transparent;border:0;padding:0}
    .modal-title{font-size:10px;letter-spacing:1.6px;font-weight:650;margin:12px 0 6px;color:var(--cc-muted)}.pg:first-child > .modal-title:first-child{margin-top:2px}.root.wide .pg > .modal-title:first-child{margin-top:2px}
    .in-use{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 6px;padding:7px 11px;border-radius:14px;background:var(--cc-panel);border:1px solid var(--cc-border);font-size:12px;color:var(--cc-muted)}.in-use strong{color:var(--cc-text);font-weight:700;text-align:right;overflow-wrap:anywhere}
    .mode-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.mode-grid.g3{grid-template-columns:repeat(3,minmax(0,1fr))}
    .mode-grid button{border:1px solid var(--cc-border);border-radius:12px;min-height:38px;padding:8px 6px;color:var(--cc-text);background:var(--cc-bg);font-size:12px;font-weight:650;display:flex;align-items:center;justify-content:center;gap:6px;overflow-wrap:anywhere}.mode-grid ha-icon{width:15px;height:15px;--mdc-icon-size:15px}
    .mode-grid button:disabled{opacity:1;color:var(--cc-muted);cursor:not-allowed}.mode-grid button.active{background:#0E6B52;border-color:#0E6B52;color:#fff}.mode-grid button.active ha-icon{color:#fff}
    .modal-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.modal-stats div{background:var(--cc-panel);border:1px solid var(--cc-border);padding:8px 4px;text-align:center;border-radius:12px}.modal-stats strong{font-size:14px;font-weight:650;display:block}.modal-stats small{font-size:10px;color:var(--cc-muted)}.error{font-size:11px;color:#e16c5b;margin-top:9px}
    @container cc-host (min-width:620px){
      .root{padding:15px 17px;border-radius:24px}.heroes{grid-template-columns:repeat(2,minmax(0,1fr));align-items:stretch}.hero > .details{margin-top:auto}.hero-main{min-height:86px}
    }
    @container cc-host (max-width:619px){
      .secbar.n3 .sec{flex-direction:column;align-items:center;text-align:center;gap:4px;padding:8px 5px;min-height:76px}.secbar.n3 .sec-txt{flex:none;width:100%}.secbar.n3 .sec-chev{display:none}.secbar.n3 .sec-name{font-size:12px}.secbar.n3 .sec-sub{font-size:10.5px}
    }
    @container cc-host (max-width:430px){
      .sec-panel .stats{grid-template-columns:repeat(2,minmax(0,1fr))}.season-cards{grid-template-columns:1fr}.stat strong{font-size:20px}
    }
    @container cc-host (max-width:359px){
      .root{padding:11px 12px;border-radius:20px}.big{font-size:26px}.stats,.sec-panel .stats{grid-template-columns:repeat(2,minmax(0,1fr))}.zones{grid-template-columns:repeat(2,minmax(0,1fr))}.details{font-size:12px;gap:6px}
      .secbar.n2 .sec{flex-direction:column;align-items:center;text-align:center;gap:4px;padding:8px 5px;min-height:76px}.secbar.n2 .sec-txt{flex:none;width:100%}.secbar.n2 .sec-chev{display:none}
    }
    @container cc-host (max-width:330px){.sec-panel .stats{grid-template-columns:1fr}}
    @media(max-width:340px){.mode-grid.g3{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
  `;
  const LAYER_CSS=CSS.replace('container:cc-host/inline-size;','').replace(';container:climate/inline-size}','}');
  const SECTIONS=['valves','stats','automations'];
  class ClimateControlCard extends HTMLElement {
    constructor(){
      super();this.attachShadow({mode:'open'});this._cfg=normalize();this._hass=null;
      this._period=0;this._season='winter';this._statTab='times';this._section=null;this._modal=null;
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
    static getStubConfig(){return {theme_mode:'auto',controls_enabled:true,layout:'complete'}}
    static getConfigElement(){return document.createElement(EDITOR)}
    getCardSize(){return 5+(this._section==='valves'?Math.ceil(this._cfg.valves.length/3):0)}
    setConfig(c){this._cfg=normalize(c);this._sig='';this._render()}
    set hass(h){this._hass=h;this._render()}
    connectedCallback(){document.addEventListener('keydown',this._onKey);this._media?.addEventListener?.('change',this._onMedia=()=>this._render());this._sig='';this._render()}
    disconnectedCallback(){document.removeEventListener('keydown',this._onKey);if(this._onResize){window.removeEventListener('resize',this._onResize);this._onResize=null;}if(this._onMedia)this._media?.removeEventListener?.('change',this._onMedia);this._drag=null;this._removeLayer();this._unlock()}
    _lang(){return pickLang(this._cfg.language,this._hass)}
    _t(k,v){return tr(this._lang(),k,v)}
    _temp(n,unit){return temp(this._lang(),n,unit)}
    _state(id){return id?this._hass?.states?.[id]:null}
    _dark(){return this._cfg.theme_mode==='dark'||(this._cfg.theme_mode==='auto'&&(this._hass?.themes?.darkMode ?? !!this._media?.matches))}
    _enabled(){return this._cfg.controls_enabled}
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
      return special?presetLabel(this._lang(),special):valid(schedule)?schedule.state:active==='schedule'?this._t('pSchedule'):this._t('stNa');
    }
    _tempCtrl(id,kind,compact=false){
      const e=this._state(id),v=this._shown(id,e),unit=this._hass?.config?.unit_system?.temperature||'°C';
      const {min,max,step}=tempLimits(e,kind==='ac'?16:5,30),enabled=this._enabled()&&v!==null&&(Number(e?.attributes?.supported_features||0)&1)!==0;
      const dis=enabled?'':'disabled',lab=this._t('setLbl'),tone=`--tone:var(--cc-${kind==='ac'?'cool':'heat'})`,shown=this._temp(v,unit);
      const btn=(dir,name,cls)=>`<button class="step ${cls}" data-action="adjust" data-id="${esc(id)}" data-dir="${dir}" ${dis} aria-label="${esc(name)}">${icon(dir<0?'minus':'plus')}</button>`;
      const minus=btn(-1,this._t('dec'),'l'),plus=btn(1,this._t('inc'),'r');
      if(compact)return `<div class="bigstep" style="${tone}">${minus}<strong role="img" aria-label="${esc(lab)} ${shown}">${shown}</strong>${plus}</div>`;
      const f=v===null?0:clip((v-min)/Math.max(0.1,max-min),0,1);
      if(this._cfg.temperature_control==='ring'){
        const C=2*Math.PI*37,n=v===null?'—':`${fmt(this._lang(),v,1,1)}°`;
        return `<div class="ringc" style="${tone}">${minus}<div class="ring" role="img" aria-label="${esc(lab)} ${shown}"><svg viewBox="0 0 84 84" aria-hidden="true"><circle class="rt" cx="42" cy="42" r="37"/><circle class="rf" cx="42" cy="42" r="37" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C*(1-f)).toFixed(1)}"/></svg><div class="rmid"><strong>${n}</strong><small>${esc(this._t('setShort'))}</small></div></div>${plus}</div>`;
      }
      const [tx,ty]=arcPt(f);
      return `<div class="arc" style="${tone}"><svg class="g" viewBox="0 0 150 86" data-arc data-id="${esc(id)}" data-min="${min}" data-max="${max}" data-step="${step}" data-unit="${esc(unit)}" role="slider" tabindex="${enabled?0:-1}" aria-label="${esc(lab)}" aria-valuemin="${min}" aria-valuemax="${max}" aria-valuenow="${v??min}" aria-valuetext="${shown}" ${enabled?'':'aria-disabled="true"'}><path class="trk" d="M${ARC.cx-ARC.r} ${ARC.cy} A${ARC.r} ${ARC.r} 0 0 1 ${ARC.cx+ARC.r} ${ARC.cy}"/><path class="fil" d="${arcD(f)}"/><circle class="thumb" cx="${tx.toFixed(2)}" cy="${ty.toFixed(2)}" r="8"/></svg><div class="mid"><strong>${shown}</strong><small>${esc(this._t('setShort'))}</small></div>${minus}${plus}</div>`;
    }
    _heating(){
      const c=this._cfg,L=this._lang(),hasClimate=!!c.heat_entity,e=this._state(c.heat_entity),stat=actionStatus(L,e),isActive=hasClimate&&stat.state==='heat';
      const te=ambient(e),unit=this._hass?.config?.unit_system?.temperature||'°C';
      const {modes}=this._heatPreset(),hasPreset=!!(c.heat_schedule_entity||modes.length);
      return `<section class="hero heat ${isActive?'is-active':''}"><div class="row"><div class="kicker">${icon('radiator')} ${esc(this._t('heatingK'))}</div>${hasClimate?`<span class="pill ${stat.state==='heat'?'heat':stat.state==='off'?'off':'on'}">${stat.state==='heat'?icon('fire'):icon('thermostat')} ${esc(stat.label)}</span>`:''}</div>
        ${hasClimate?`<div class="hero-main"><div><span class="caption">${esc(this._t('ambient'))}</span><div class="big">${this._temp(te,unit)}</div></div>${this._tempCtrl(c.heat_entity,'heat')}</div>`:''}
        ${hasPreset?`<button class="details" data-action="open-program" aria-haspopup="dialog" aria-label="${esc(this._t('presetHeatAria'))}" ${(this._select(c.heat_schedule_entity).length||modes.length)?'':'disabled'}><span class="lbl">${esc(this._t('preset'))}</span>${icon('chevron-right')}</button>`:''}</section>`;
    }
    _aircon(){
      const c=this._cfg,L=this._lang(),e=this._state(c.ac_entity),stat=actionStatus(L,e),modes=valid(e)&&Array.isArray(e.attributes?.hvac_modes)?e.attributes.hvac_modes:[],unit=this._hass?.config?.unit_system?.temperature||'°C';
      const isOn=valid(e)&&e.state!=='off',isActive=['cool','heat'].includes(stat.state);
      const opts=modes.filter(x=>x!=='off');
      if(isOn&&modes.includes(e.state)){this._lastAcModes.set(c.ac_entity,e.state);if(memGet(c.ac_entity).m!==e.state)memSet(c.ac_entity,{m:e.state});}
      const features=Number(e?.attributes?.supported_features||0);
      const canPower=valid(e)&&(modes.includes('off')||(!isOn&&(features&256)!==0)||(isOn&&(features&128)!==0));
      const presets=valid(e)&&Array.isArray(e.attributes?.preset_modes)?e.attributes.preset_modes:[];
      const hasMenu=!!(opts.length||presets.length||c.ac_program_entity);
      const tone=stat.state==='cool'?'cool':stat.state==='heat'?'heat':stat.state==='off'?'off':'on';
      const badge=(canPower&&this._enabled())
        ?`<button class="pill ${isOn?`on ${tone==='heat'?'heat':tone==='cool'?'cool':'generic'}`:''}" data-action="power-ac" data-id="${esc(c.ac_entity)}" aria-pressed="${isOn}" aria-label="${esc(this._t(isOn?'powerOff':'powerOn'))}">${icon('power')} ${esc(stat.label)}</button>`
        :`<span class="pill ${tone}">${icon(stat.state==='off'?'power-off':mdiMode(e?.state))} ${esc(stat.label)}</span>`;
      return `<section class="hero ac ${isActive?'is-active':''}"><div class="row"><div class="kicker">${icon('air-conditioner')} ${esc(this._t('aircondK'))}</div>${badge}</div>
        <div class="hero-main"><div><span class="caption">${esc(this._t('ambient'))}</span><div class="big">${this._temp(ambient(e),unit)}</div></div>${this._tempCtrl(c.ac_entity,'ac')}</div>
        ${hasMenu?`<button class="details" data-action="open-ac" aria-haspopup="dialog" aria-label="${esc(this._t('presetAcAria'))}"><span class="lbl">${esc(this._t('preset'))}</span>${icon('chevron-right')}</button>`:''}</section>`;
    }
    _demands(){
      return this._cfg.valves.map(v=>{
        const s=this._state(v.activity_entity||v.entity);
        if(!valid(s))return null;
        if(v.activity_entity)return s.state==='on'?true:s.state==='off'?false:null;
        const action=s.attributes?.hvac_action;
        return action==='heating'?true:['idle','off'].includes(action)?false:null;
      });
    }
    _stats(){const c=this._cfg,L=this._lang(),p=['today','week','month'][this._period],heat=isShown(c,'heat')&&!!c.heat_entity,ac=isShown(c,'ac')&&!!c.ac_entity,zones=isShown(c,'valves')&&c.valves.length;
      const demands=this._demands(),active=demands.filter(x=>x===true).length,measured=demands.filter(x=>x!==null).length;
      const data=[];
      if(zones){data.push({name:this._t('valvesActive'),value:measured===c.valves.length?`${active} / ${c.valves.length}`:this._t('na'),foot:this._t('heatDemandNow'),icon:'radiator'})}
      if(heat)data.push({name:this._t('heating'),value:formatDuration(L,this._state(c[`heat_${p}`])),foot:this._t('fromSensor'),icon:'fire'});
      if(ac)data.push({name:this._t('aircond'),value:formatDuration(L,this._state(c[`ac_${p}`])),foot:this._t('fromSensor'),icon:'snowflake'});
      if(!data.length)return '';
      return `<section class="section"><div class="section-row" style="margin-bottom:10px"><h3 class="section-title" style="margin:0">${esc(this._t('runTimes'))}</h3><div class="tabs">${['today','week','month'].map((x,i)=>`<button data-action="period" data-index="${i}" class="${i===this._period?'active':''}">${esc(this._t(x))}</button>`).join('')}</div></div><div class="stats" style="grid-template-columns:repeat(${Math.min(3,data.length)},minmax(0,1fr))">${data.map(d=>`<div class="stat"><label>${icon(d.icon)} ${esc(d.name)}</label><strong>${esc(d.value)}</strong><small>${esc(d.foot)}</small></div>`).join('')}</div></section>`;
    }
    _valves(){const c=this._cfg,L=this._lang();if(!c.valves.length)return '';
      return `<section class="section"><div class="zones">${c.valves.map((v,i)=>{
        const e=this._state(v.entity),s=actionStatus(L,e),name=v.name||friendly(this._hass,v.entity,this._t('valveN',{n:i+1}));
        const current=ambient(e),t=this._shown(v.entity,e),period=['today','week','month'][this._period],dur=formatDuration(L,this._state(v[period]));
        return `<div class="zone"><div class="zone-top">${icon('radiator')}<span class="pill ${s.state==='heat'?'heat':'off'}">${esc(s.label)}</span></div><div><div class="zone-name">${esc(name)}</div><div class="zone-meta">${esc(this._t('ambientT',{t:this._temp(current)}))}</div></div><div class="zone-bottom"><strong role="img" aria-label="${esc(this._t('setLbl'))} ${this._temp(t)}">${this._temp(t)}</strong><small>${esc(dur)}<br>${esc(this._t(['todayL','weekL','monthL'][this._period]))}</small></div><button class="details" data-action="open-valve" data-index="${i}" aria-haspopup="dialog"><span class="lbl">${esc(this._t('details'))}</span>${icon('chevron-right')}</button></div>`;
      }).join('')}</div></section>`;
    }
    _seasons(){const c=this._cfg,choices=[];if(isShown(c,'heat')&&c.heat_entity)choices.push(['winter',this._t('winter')]);if(isShown(c,'ac')&&c.ac_entity)choices.push(['summer',this._t('summer')]);if(!choices.length)return '';
      const chosen=choices.some(x=>x[0]===this._season)?this._season:choices[0][0];if(this._season!==chosen)this._season=chosen;
      return `<section class="section"><div class="panel"><div class="section-row"><span class="caption" style="margin:0">${esc(this._t('seasonCmp'))}</span><div class="tabs">${choices.map(([s,n])=>`<button class="${chosen===s?'active':''}" data-action="season" data-value="${s}" aria-pressed="${chosen===s}">${esc(n)}</button>`).join('')}</div></div>${this._seasonCards()}</div></section>`;
    }
    _statsBody(hasT,hasS){
      const tab=hasT&&hasS?this._statTab:(hasT?'times':'seasons');
      const tabs=hasT&&hasS?`<div class="tabs tabs-top">${[['times',this._t('tabTimes')],['seasons',this._t('tabSeasons')]].map(([k,n])=>`<button class="${tab===k?'active':''}" data-action="stat-tab" data-value="${k}" aria-pressed="${tab===k}">${esc(n)}</button>`).join('')}</div>`:'';
      return tabs+(tab==='times'?this._stats():this._seasons());
    }
    _automations(){const c=this._cfg;return `<section class="section"><div class="panel">${c.automations.length?c.automations.map((a,i)=>{
      const e=this._state(a.entity),known=valid(e),on=known&&e.state==='on';return `<div class="aut-row"><div><strong>${esc(a.name||friendly(this._hass,a.entity,this._t('autN',{n:i+1})))}</strong><small>${esc(this._t(!known?'stNa':on?'autOn':'autOff'))}</small></div><button class="switch ${on?'on':''}" data-action="automation" data-index="${i}" role="switch" aria-label="${esc(this._t(on?'autDisable':'autEnable'))}" aria-checked="${on}" ${this._enabled()&&known&&!this._pending.has(JSON.stringify(['automation',on?'turn_off':'turn_on',undefined]))?'':'disabled'}><i></i></button></div>`;
    }).join(''):`<p class="hint" style="margin:0">${esc(this._t('autEmpty'))}</p>`}</div></section>`;}
    _popup(){if(!this._modal)return '';
      const c=this._cfg,L=this._lang(),en=this._enabled()?'':'disabled';
      const mk=(act,val,label,on)=>`<button data-action="${act}" data-value="${esc(val)}" class="${on?'active':''}" ${en}>${on?icon('check'):''}${esc(label)}</button>`;
      const kind=this._modal.kind;let name='',body='';
      if(kind==='valve'){
        const i=this._modal.index,v=c.valves[i];if(!v)return '';
        const e=this._state(v.entity),t=this._shown(v.entity,e),mode=actionStatus(L,e),restore=v.restore_method==='netatmo'||v.restore_method==='script'&&!!v.restore_script;
        const canOff=Array.isArray(e?.attributes?.hvac_modes)&&e.attributes.hvac_modes.includes('off');
        const o=this._overrides.get(v.entity);
        name=v.name||friendly(this._hass,v.entity,this._t('valveN',{n:i+1}));
        body=`<div class="pg"><div class="modal-block"><div class="row"><span class="caption" style="margin:0">${esc(this._t('roomTemp'))}</span><strong>${this._temp(ambient(e))}</strong></div><div class="row" style="margin-top:8px"><span class="caption" style="margin:0">${esc(this._t('status'))}</span><span class="pill ${mode.state==='heat'?'heat':'off'}">${esc(mode.label)}</span></div></div>
          <div class="modal-block setpoint-shell">${this._tempCtrl(v.entity,'heat',true)}</div></div>
          <div class="pg"><h3 class="modal-title">${esc(this._t('valveMgmt'))}</h3><div class="mode-grid g3"><button data-action="manual" data-index="${i}" ${this._enabled()&&t!==null?'':'disabled'}>${icon('thermometer-plus')} ${esc(this._t('manual'))}</button><button data-action="valve-off" data-index="${i}" ${this._enabled()&&canOff?'':'disabled'}>${icon('power')} ${esc(this._t('turnOff'))}</button><button data-action="restore" data-index="${i}" ${this._enabled()&&restore?'':'disabled'}>${icon('calendar-check')} ${esc(this._t('program'))}</button></div>
          <p class="hint">${o?esc(this._t('lastCmd',{m:this._t(o.mode),t:new Intl.DateTimeFormat(L,{hour:'2-digit',minute:'2-digit'}).format(new Date(o.time))})):esc(this._t('valveHint'))}</p></div>
          <div class="pg"><h3 class="modal-title">${esc(this._t('runTime'))}</h3><div class="modal-stats">${[['today','today'],['week','week'],['month','month']].map(([n,k])=>`<div><strong>${formatDuration(L,this._state(v[k]))}</strong><small>${esc(this._t(n))}</small></div>`).join('')}</div>
          <p class="hint">${esc(this._t('demandHint'))}</p></div>`;
      }else if(kind==='heat-program'){
        const selectId=c.heat_schedule_entity,{entity,modes}=this._heatPreset(),current=valid(entity)?entity.attributes?.preset_mode:'';
        const options=this._select(selectId),chosen=this._state(selectId)?.state,overridden=['away','frost_guard','boost'].includes(current);
        name=this._t('heating');
        body=`<div class="pg"><h3 class="modal-title">${esc(this._t('presetT'))}</h3><div class="in-use"><span>${esc(this._t('inUse'))}</span><strong>${esc(this._heatInUse())}</strong></div></div>
          ${selectId?`<div class="pg"><h3 class="modal-title">${esc(this._t('programT'))}</h3><div class="mode-grid">${options.length?options.map(o=>mk('choose-program',o,o,o===chosen&&!overridden)).join(''):`<p class="hint">${esc(this._t('noProgram'))}</p>`}</div></div>`:''}
          <div class="pg"><h3 class="modal-title">${esc(this._t('modesT'))}</h3>
          ${modes.length?`<div class="mode-grid">${modes.map(m=>mk('choose-heat-preset',m,presetLabel(L,m),m===current)).join('')}</div><p class="hint">${esc(this._t('modesHint'))}</p>`:`<p class="hint">${esc(this._t('modesNone'))}</p>`}</div>`;
      }else if(kind==='ac'){
        const e=this._state(c.ac_entity),modes=valid(e)&&Array.isArray(e.attributes?.hvac_modes)?e.attributes.hvac_modes:[],opts=modes.filter(x=>x!=='off');
        const presets=valid(e)&&Array.isArray(e.attributes?.preset_modes)?e.attributes.preset_modes:[],sel=this._state(c.ac_program_entity),isOn=valid(e)&&e.state!=='off';
        name=`${this._t('aircond')} · ${this._t(valid(e)?(isOn?'stOn':'stOff'):'stNa')}`;
        body=`${opts.length?`<div class="pg"><h3 class="modal-title">${esc(this._t('modesT'))}</h3><div class="mode-grid g3">${opts.map(m=>`<button data-action="hvac" data-id="${esc(c.ac_entity)}" data-value="${esc(m)}" class="${e?.state===m?'active':''}" ${en}>${icon(mdiMode(m))}${esc(hvacLabel(L,m))}</button>`).join('')}</div></div>`:''}
          ${presets.length?`<div class="pg"><h3 class="modal-title">${esc(this._t('presetT'))}</h3><div class="in-use"><span>${esc(this._t('inUse'))}</span><strong>${esc(e.attributes.preset_mode?presetLabel(L,e.attributes.preset_mode):'—')}</strong></div><div class="mode-grid">${presets.map(p=>mk('choose-ac-preset',p,presetLabel(L,p),p===e.attributes.preset_mode)).join('')}</div></div>`:''}
          ${c.ac_program_entity?`<div class="pg"><h3 class="modal-title">${esc(this._t('programT'))}</h3><div class="in-use"><span>${esc(this._t('inUse'))}</span><strong>${valid(sel)?esc(sel.state):esc(this._t('stNa'))}</strong></div><div class="mode-grid">${this._select(c.ac_program_entity).map(o=>mk('choose-program',o,o,o===sel?.state)).join('')||`<p class="hint">${esc(this._t('noProgram'))}</p>`}</div></div>`:''}`;
      }else return '';
      return `<div class="backdrop" data-backdrop="1"><section class="dialog" role="dialog" aria-modal="true" aria-label="${esc(name)}"><header class="dialog-head"><strong>${esc(name)}</strong><button class="close" data-action="close" aria-label="${esc(this._t('close'))}">${icon('close')}</button></header><div class="dialog-body">${body}${this._error?`<p class="error pg full">${esc(this._error)}</p>`:''}</div></section></div>`;
    }
    _renderLayer(){
      if(!this._modal||typeof document==='undefined'){this._removeLayer();return;}
      const html=`<style>${LAYER_CSS}</style><div class="root layer-root ${this._dark()?'dark':''} ${this._wide()?'wide':''}">${this._popup()}</div>`;
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
    // Popup size as in the standard (§7): smartphones always get the tall narrow popup; tablets and desktops the wide one.
    _wide(){if(typeof window==='undefined')return false;const sc=window.screen,phone=Math.min(sc?sc.width:9999,sc?sc.height:9999)<600;return !phone&&!!window.matchMedia?.('(min-width:640px) and (min-height:600px)').matches;}
    _removeLayer(){if(this._layer){this._layer.remove();this._layer=null;this._layerHtml='';}}
    _currentSig(){
      const c=this._cfg,h=this._hass,keys=[c.heat_entity,c.heat_schedule_entity,c.heat_preset_entity,c.heat_activity_entity,c.ac_entity,c.ac_program_entity,c.ac_activity_entity,...Object.keys(c).filter(k=>/_(today|week|month|last|previous)$/.test(k)).map(k=>c[k]),...c.valves.flatMap(v=>[v.entity,v.activity_entity,v.today,v.week,v.month]),...c.automations.map(a=>a.entity)];
      return JSON.stringify({c,lang:this._lang(),dark:this._dark(),p:this._period,season:this._season,st:this._statTab,sec:this._section,modal:this._modal,err:this._error,pending:[...this._pending],override:[...this._overrides],temps:[...this._pendingTemp],data:[...new Set(keys.filter(Boolean))].map(id=>{const e=h.states[id];return [id,e?.state,e?.attributes?.temperature,e?.attributes?.current_temperature,e?.attributes?.hvac_action,e?.attributes?.hvac_modes,e?.attributes?.options,e?.attributes?.preset_modes,e?.attributes?.preset_mode,e?.attributes?.unit_of_measurement,e?.attributes?.friendly_name]})});
    }
    // Section bar: one tile per optional section; the open section is shown full width below the bar.
    _sectionTiles(){
      const c=this._cfg,L=this._lang(),tiles=[],detail=true;
      if(isShown(c,'valves')&&c.valves.length){
        const n=c.valves.length,d=this._demands(),measured=d.every(x=>x!==null),active=d.filter(x=>x===true).length;
        const sub=detail&&measured?this._t('valvesActiveOf',{a:active,n}):this._t(n===1?'nValves1':'nValves',{n});
        tiles.push({id:'valves',name:this._t('secValves'),sub,icon:'radiator',tone:'heat',body:()=>this._valves()});
      }
      const hasT=isShown(c,'stats')&&!!this._stats(),hasS=isShown(c,'seasons')&&!!this._seasons();
      if(hasT||hasS){
        let sub=this._t(hasT&&hasS?'statsBoth':hasT?'statsTimes':'statsSeasons');
        if(detail&&hasT){const id=isShown(c,'heat')&&c.heat_today?c.heat_today:isShown(c,'ac')&&c.ac_today?c.ac_today:'';const e=this._state(id);if(valid(e)){const d=formatDuration(L,e);if(d!==this._t('na'))sub=this._t('statsToday',{d});}}
        tiles.push({id:'stats',name:this._t('secStats'),sub,icon:'chart-bar',tone:'',body:()=>this._statsBody(hasT,hasS)});
      }
      if(isShown(c,'automations')){
        const n=c.automations.length,st=c.automations.map(a=>this._state(a.entity)),known=st.every(valid),on=st.filter(e=>valid(e)&&e.state==='on').length;
        const sub=!n?this._t('noAut'):detail&&known?this._t('autActiveOf',{a:on,n}):this._t(n===1?'nAut1':'nAut',{n});
        tiles.push({id:'automations',name:this._t('secAut'),sub,icon:'cog-outline',tone:'',body:()=>this._automations()});
      }
      return tiles;
    }
    _sectionBar(){
      const tiles=this._sectionTiles();if(!tiles.length)return '';
      if(this._section&&!tiles.some(t=>t.id===this._section))this._section=null;
      const open=tiles.find(t=>t.id===this._section);
      const bar=tiles.map(t=>{const on=t.id===this._section;return `<button type="button" class="sec" id="cc-sec-${t.id}" data-action="toggle-section" data-section="${t.id}" aria-expanded="${on}" aria-controls="cc-panel"><span class="sec-ic ${t.tone}">${icon(t.icon)}</span><span class="sec-txt"><span class="sec-name">${esc(t.name)}</span><span class="sec-sub">${esc(t.sub)}</span></span><span class="sec-chev">${icon(on?'chevron-up':'chevron-down')}</span></button>`;}).join('');
      return `<div class="secbar n${tiles.length}" style="--n:${tiles.length}" role="group" aria-label="${esc(this._t('secAria'))}">${bar}</div>${open?`<div class="sec-panel" id="cc-panel" role="region" aria-labelledby="cc-sec-${open.id}">${open.body()}</div>`:''}`;
    }
    _render(){if(!this.isConnected||!this._hass||this._drag)return;
      const c=this._cfg;
      const sig=this._currentSig();
      if(sig===this._sig)return;this._sig=sig;
      const outerScroll=this._outerScroll();
      const active=this.shadowRoot.activeElement,focusArc=active?.dataset?.arc!==undefined?active.dataset.id:null;
      let html=`<style>${CSS}</style><div class="root ${this._dark()?'dark':''}">`;
      if(c.show_eyebrow||c.show_title)html+=`<header class="header ${c.show_eyebrow?'':'without-eyebrow'}">${c.show_eyebrow?`<div class="eyebrow">${esc(c.eyebrow)}</div>`:''}${c.show_title?`<h2 class="title">${esc(c.title==null?this._t('defTitle'):c.title)}<b>.</b></h2>`:''}</header>`;
      const heroes=[isShown(c,'heat')&&(c.heat_entity||c.heat_schedule_entity||c.heat_preset_entity)?this._heating():'',isShown(c,'ac')&&c.ac_entity?this._aircon():''].filter(Boolean);
      if(heroes.length)html+=`<div class="heroes">${heroes.join('')}</div>`;
      if(!heroes.length&&!(isShown(c,'valves')&&c.valves.length))html+=`<p class="hint">${esc(this._t('emptyCfg'))}</p>`;
      html+=this._sectionBar();
      if(!c.controls_enabled)html+=`<p class="footer">${esc(this._t('readOnly'))}</p>`;
      if(this._error&&!this._modal)html+=`<p class="main-error" role="alert">${esc(this._error)}</p>`;
      html+='</div>';
      this.shadowRoot.innerHTML=html;
      outerScroll.forEach(([el,y])=>{if(el.isConnected&&el.scrollTop!==y)el.scrollTop=y});
      if(focusArc)this.shadowRoot.querySelector(`[data-arc][data-id="${focusArc}"]`)?.focus({preventScroll:true});
      this._renderLayer();
    }
    _rerender(selector){this._sig='';this._render();this.shadowRoot.querySelector(selector)?.focus({preventScroll:true});}
    _open(v){this._error='';this._modal=v;this._lockPage();if(!this._onResize){this._onResize=()=>this._renderLayer();window.addEventListener('resize',this._onResize);}this._sig='';this._render();this._layer?.shadowRoot.querySelector('.close')?.focus()}
    _close(){this._modal=null;this._error='';if(this._onResize){window.removeEventListener('resize',this._onResize);this._onResize=null;}this._sig='';this._render();this._removeLayer();this._unlock()}
    _seasonCards(){const c=this._cfg,L=this._lang(),season=this._season,k=season==='winter'?'winter':'summer';
      if((k==='winter'&&!isShown(c,'heat'))||(k==='summer'&&!isShown(c,'ac')))return `<div class="hint">${esc(this._t('noSource'))}</div>`;
      const prev=numericHours(this._state(c[`${k}_previous`]));const last=numericHours(this._state(c[`${k}_last`]));
      const forecast=prev!==null&&last!==null?(prev+last)/2:null,names=this._t('months').split(',');
      const months=c[`${k}_months`].map(m=>names[m-1]).join(' · ')||this._t('noMonths');
      return `<div class="panel"><div class="row"><strong>${esc(this._t(k==='winter'?'winterHeat':'summerAc'))}</strong><span class="caption">${esc(months)}</span></div>
        <div class="metric"><span>${esc(this._t('prevSeason'))}</span><strong>${hours(L,prev)}</strong></div><div class="metric"><span>${esc(this._t('lastSeason'))}</span><strong>${hours(L,last)}</strong></div>
        <div class="metric"><span title="${esc(this._t('scenarioT'))}">${esc(this._t('nextScenario'))}</span><strong>${forecast!==null?`≈ ${hours(L,forecast)}`:esc(this._t('na'))}</strong></div>
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
      try{if(!this._hass?.services?.[domain]?.[service])throw new Error(this._t('errSvc',{s:`${domain}.${service}`}));
        await this._hass.callService(domain,service,data,target);}
      catch(err){this._error=err?.message||this._t('errCmd');}
      finally{this._pending.delete(key);this._sig='';this._render();}
    }
    _actManual(i){const v=this._cfg.valves[i],e=this._state(v?.entity),t=target(e);if(t===null)return;
      this._overrides.set(v.entity,{mode:'ovManual',time:Date.now()});return this._call('climate','set_temperature',{entity_id:v.entity,temperature:t});}
    _setTemp(id,value){
      const e=this._state(id);if(!this._enabled()||!valid(e))return;
      if(this._cfg.valves.some(v=>v.entity===id))this._overrides.set(id,{mode:'ovManual',time:Date.now()});
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
      const text=this._temp(v,g.dataset.unit||'°C'),strong=g.parentElement?.querySelector('.mid strong');if(strong)strong.textContent=text;
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
      if(a==='toggle-section'){
        const key=el.dataset.section;if(!SECTIONS.includes(key))return;
        this._section=this._section===key?null:key;
        return this._rerender(`button[data-action="toggle-section"][data-section="${key}"]`);
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
          this._error=this._t('errPower');this._sig='';this._render();return;
        }
        if(modes.includes('off'))return this._call('climate','set_hvac_mode',{entity_id:id,hvac_mode:'off'});
        if((flags&128)!==0)return this._call('climate','turn_off',{entity_id:id});
        return;
      }
      if(a==='manual')return this._actManual(i);
      if(a==='valve-off'){
        const v=this._cfg.valves[i],modes=this._state(v?.entity)?.attributes?.hvac_modes||[];
        if(!modes.includes('off'))return;
        this._overrides.set(v.entity,{mode:'ovOff',time:Date.now()});return this._call('climate','set_hvac_mode',{entity_id:v.entity,hvac_mode:'off'});
      }
      if(a==='restore'){
        const v=this._cfg.valves[i];if(!v)return;
        if(v.restore_method==='netatmo'){this._overrides.set(v.entity,{mode:'ovProgram',time:Date.now()});return this._call('netatmo','clear_temperature_setting',{}, {entity_id:v.entity});}
        if(v.restore_method==='script'&&v.restore_script){this._overrides.set(v.entity,{mode:'ovProgram',time:Date.now()});return this._call('script','turn_on',{entity_id:v.restore_script});}
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
        if(service==='turn_off'&&this._cfg.confirm_automation_disable&&!confirm(this._t('cfDisable',{n:o.name||friendly(this._hass,o.entity,o.entity)})))return;
        return this._call('automation',service,{entity_id:o.entity});
      }
    }
  }
  const ECSS = `
    :host{display:block;color:var(--primary-text-color,#19221E);font-family:var(--ha-font-family-body,Roboto,Arial,sans-serif)}
    *,*:before,*:after{box-sizing:border-box}
    .ed{font-size:14px;min-width:0}
    button,input,select{font:inherit;color:inherit}button{cursor:pointer}
    button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--edera-emerald-color,#0E6B52);outline-offset:2px}
    ha-icon{display:inline-flex;width:18px;height:18px;--mdc-icon-size:18px;vertical-align:middle}
    .tabs{display:flex;gap:5px;overflow-x:auto;padding-bottom:14px;border-bottom:1px solid var(--divider-color,#E1E5E1)}
    .tab{border:0;background:none;color:var(--secondary-text-color,#68716C);border-radius:13px;padding:10px 13px;white-space:nowrap}
    .tab[aria-pressed="true"]{color:var(--primary-text-color,#19221E);background:var(--secondary-background-color,#F1F3EF);font-weight:650}
    .heading{font-size:21px;font-weight:500;margin:25px 0 9px}
    .desc{color:var(--secondary-text-color,#68716C);font-size:13px;line-height:1.5;margin-bottom:20px}
    .field{display:block;margin:18px 0}
    .label{font-size:14px;margin-bottom:10px}
    .input{display:block;width:100%;background:var(--secondary-background-color,#F1F3EF);color:var(--primary-text-color,#19221E);border:0;border-bottom:1px solid var(--divider-color,#E1E5E1);padding:14px 13px;min-height:50px;border-radius:11px 11px 0 0}
    .input::placeholder{color:var(--secondary-text-color,#68716C)}.input option{background:var(--card-background-color,#fff);color:var(--primary-text-color,#19221E)}
    .tiny{font-size:11px;line-height:1.45;color:var(--secondary-text-color,#68716C);margin:9px 0}
    .muted{font-size:12px;line-height:1.5;color:var(--secondary-text-color,#68716C)}
    .row{border-bottom:1px solid var(--divider-color,#E1E5E1);padding:13px 0;display:flex;align-items:center;justify-content:space-between;gap:15px}
    .row label{flex:1;min-width:0}
    .row input[type=checkbox],.chk input{width:18px;height:18px;accent-color:var(--primary-color,#064E3B);flex:none}
    .mod{border-bottom:1px solid var(--divider-color,#E1E5E1);padding:16px 0}
    .mh{display:flex;align-items:center;gap:10px}.mh .nm{flex:1;min-width:0;font-weight:600;font-size:15px}
    .mb{margin-top:10px}
    .chk{display:flex;align-items:center;gap:10px;margin:8px 0;font-size:13px}
    .entityrow{display:flex;align-items:center;gap:7px;min-width:0}.entitybox{flex:1;min-width:0}.entitybox ha-selector{display:block;width:100%}
    .action{display:grid;place-items:center;background:var(--secondary-background-color,#F1F3EF);border:1px solid var(--divider-color,#E1E5E1);color:var(--primary-text-color,#19221E);min-width:40px;min-height:40px;border-radius:10px;padding:0}
    .action:disabled{opacity:.45;cursor:not-allowed}
    .item{border:1px solid var(--divider-color,#E1E5E1);border-radius:14px;padding:4px 13px 2px;margin:12px 0;background:var(--card-background-color,transparent)}
    .item-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:10px}.item-head strong{font-size:13.5px;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .delete{background:transparent;border:0;color:var(--error-color,#B85D55);font-size:12px;display:flex;align-items:center;gap:4px;padding:6px 0;flex:none}
    .add{background:var(--edera-emerald-color,#0E6B52);color:#fff;border:0;border-radius:11px;padding:11px 13px;font-size:12.5px;font-weight:650;display:flex;align-items:center;gap:6px;margin:12px 0 4px}
    .sub{font-size:13px;font-weight:600;margin:16px 0 0}
    .seg{display:flex;gap:4px;flex-wrap:wrap;margin:12px 0}.seg button{padding:9px 12px;border:1px solid var(--divider-color,#E1E5E1);border-radius:10px;background:var(--secondary-background-color,#F1F3EF);font-size:12.5px}.seg button[aria-pressed="true"]{color:#fff;background:var(--edera-emerald-color,#0E6B52);border-color:var(--edera-emerald-color,#0E6B52)}
    .months{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px;margin:12px 0}.month{font-size:11.5px;display:flex;align-items:center;justify-content:center;padding:9px 2px;border:1px solid var(--divider-color,#E1E5E1);background:var(--card-background-color,#fff);border-radius:9px;color:var(--primary-text-color,#19221E)}.month[aria-pressed="true"]{border-color:var(--edera-emerald-color,#0E6B52);color:var(--edera-emerald-color,#0E6B52);font-weight:750}
    @media(max-width:390px){.months{grid-template-columns:repeat(4,minmax(0,1fr))}}
  `;
  const ENTITY_DOMAINS = {
    heat_entity:['climate'],heat_preset_entity:['climate'],heat_schedule_entity:['select'],heat_activity_entity:['binary_sensor','sensor','switch','input_boolean'],
    ac_entity:['climate'],ac_program_entity:['select'],ac_activity_entity:['binary_sensor','sensor','switch','input_boolean']
  };
  const ID_FIELDS = ['heat_today','heat_week','heat_month','ac_today','ac_week','ac_month','winter_last','winter_previous','summer_last','summer_previous'];
  // Visual editor in three tabs, as in Alarm Keeper Card: Climate (top of the card), Modules (sections below), Appearance.
  class ClimateControlEditor extends HTMLElement {
    constructor(){super();this.attachShadow({mode:'open'});this._cfg=normalize();this._hass=null;this._tab='clima';this._season='winter';this._nativeReady=false;this._selectorAttempt=false;this._renderedLang='';
      this.shadowRoot.addEventListener('click',e=>this._click(e));this.shadowRoot.addEventListener('change',e=>this._change(e));}
    connectedCallback(){this._render();void this._loadSelectors()}
    setConfig(c){this._cfg=normalize(c);this._render()}
    // The Home Assistant object tells which language the user speaks: redraw when it changes the texts.
    set hass(h){const first=!this._hass;this._hass=h;if((first&&!this._nativeReady)||this._renderedLang!==this._lang()){this._render();return;}this.shadowRoot.querySelectorAll('ha-selector').forEach(el=>el.hass=h)}
    _lang(){return pickLang(this._cfg.language,this._hass)}
    _t(k,v){return tr(this._lang(),k,v)}
    async _loadSelectors(){if(this._selectorAttempt)return;this._selectorAttempt=true;
      try{if(!customElements.get('ha-selector')){const helper=await window.loadCardHelpers?.();await helper?.importSelector?.();}}
      catch(_){/* Local fallback editor remains functional. */}
      this._nativeReady=!!customElements.get('ha-selector');this._render();
    }
    _save(next,redraw=true){this._cfg=normalize(next);this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:outConfig(this._cfg)},bubbles:true,composed:true}));if(redraw)this._render()}
    _value(path){const p=path.split(':');return p.length===1?this._cfg[path]:this._cfg[p[0]]?.[+p[1]]?.[p[2]];}
    _pathUpdate(path,value,redraw=true){const c={...this._cfg,valves:this._cfg.valves.map(x=>({...x})),automations:this._cfg.automations.map(x=>({...x}))},parts=path.split(':');
      if(parts.length===1)c[path]=value;
      else if(parts[0]==='valves'&&c.valves[+parts[1]])c.valves[+parts[1]][parts[2]]=value;
      else if(parts[0]==='automations'&&c.automations[+parts[1]])c.automations[+parts[1]][parts[2]]=value;
      this._save(c,redraw);
    }
    _field(label,inner,help=''){return `<div class="field"><div class="label">${esc(label)}</div>${inner}${help?`<div class="tiny">${esc(help)}</div>`:''}</div>`;}
    _text(path,label,help='',placeholder=''){return this._field(label,`<input class="input" data-path="${esc(path)}" type="text" value="${esc(this._value(path)??'')}" placeholder="${esc(placeholder)}" maxlength="120">`,help);}
    _entity(path,label,domains,help=''){
      const v=this._value(path);
      return this._field(label,`<div class="entityrow"><div class="entitybox" data-selector="${esc(path)}" data-domains="${domains.join(',')}">${!this._nativeReady?`<input class="input" list="cc-entities-${domains.join('-')}" data-path="${esc(path)}" value="${esc(v||'')}" placeholder="${esc(this._t('entPh'))}">`:''}</div><button type="button" class="action" data-clear="${esc(path)}" aria-label="${esc(this._t('rmEntity'))}" ${v?'':'disabled'}>${icon('close')}</button></div>`,help);
    }
    _select(path,label,choices,help=''){const val=this._value(path);return this._field(label,`<select class="input" data-path="${esc(path)}">${choices.map(([v,t])=>`<option value="${esc(v)}" ${v===val?'selected':''}>${esc(t)}</option>`).join('')}</select>`,help);}
    _check(path,label,help=''){const id=`ck-${path}`;return `<div class="row"><label for="${id}">${esc(label)}${help?`<div class="muted">${esc(help)}</div>`:''}</label><input type="checkbox" id="${id}" data-check="${esc(path)}" ${this._cfg[path]?'checked':''}></div>`;}
    // A module block: name, short help, «Show on the card» switch; its settings appear only when it is on.
    _mod(key,name,help,body){const on=this._cfg[`show_${key}`]!==false,id=`on-${key}`;
      return `<div class="mod"><div class="mh"><div class="nm">${esc(name)}</div></div><div class="muted" style="margin-top:6px">${esc(help)}</div><div class="mb"><div class="chk"><input type="checkbox" id="${id}" data-check="show_${key}" ${on?'checked':''}><label for="${id}">${esc(this._t('showIn'))}</label></div>${on?body():''}</div></div>`;}
    _clima(){const t=(k,v)=>this._t(k,v);
      return `<div class="heading">${esc(t('tClima'))}</div><div class="desc">${esc(t('climaD'))}</div>`+
        this._mod('heat',t('heating'),t('hHeat'),()=>this._entity('heat_schedule_entity',t('fSchedule'),['select'],t('fScheduleH'))+this._entity('heat_preset_entity',t('fPreset'),['climate'],t('fPresetH'))+this._entity('heat_entity',t('fHeat'),['climate'],t('fHeatH'))+this._entity('heat_activity_entity',t('fHeatAct'),['binary_sensor','switch','input_boolean','sensor'],t('fHeatActH')))+
        this._mod('ac',t('aircond'),t('hAc'),()=>this._entity('ac_entity',t('fAc'),['climate'])+this._entity('ac_program_entity',t('fAcProg'),['select'],t('fAcProgH'))+this._entity('ac_activity_entity',t('fAcAct'),['binary_sensor','switch','input_boolean','sensor']))+
        `<div class="heading">${esc(t('advH'))}</div>`+this._check('controls_enabled',t('ckCtl'),t('ckCtlH'))+`<div class="tiny">${esc(t('advD'))}</div>`;
    }
    _moduli(){const c=this._cfg,t=(k,v)=>this._t(k,v);
      const valves=()=>c.valves.map((v,i)=>`<div class="item"><div class="item-head"><strong>${esc(v.name||friendly(this._hass,v.entity,t('valveN',{n:i+1})))}</strong><button type="button" class="delete" data-remove="valves:${i}">${icon('delete-outline')} ${esc(t('remove'))}</button></div>
        ${this._entity(`valves:${i}:entity`,t('fValve'),['climate'])}
        ${this._text(`valves:${i}:name`,t('fName'),t('fNameH'))}
        ${this._entity(`valves:${i}:activity_entity`,t('fDemand'),['binary_sensor','sensor','switch','input_boolean'])}
        ${this._select(`valves:${i}:restore_method`,t('fRestore'),[['none',t('rsNone')],['netatmo',t('rsNetatmo')],['script',t('rsScript')]],t('fRestoreH'))}
        ${v.restore_method==='script'?this._entity(`valves:${i}:restore_script`,t('fRestoreScript'),['script']):''}
        ${this._entity(`valves:${i}:today`,t('fTimeToday'),['sensor'])}${this._entity(`valves:${i}:week`,t('fTimeWeek'),['sensor'])}${this._entity(`valves:${i}:month`,t('fTimeMonth'),['sensor'])}</div>`).join('')+`<button type="button" class="add" data-add="valves">${icon('plus')} ${esc(t('addValve'))}</button>`;
      const times=()=>[['heat','heating'],['ac','aircond']].map(([k,label])=>`<div class="sub">${esc(t(label))}</div>${[['today','fTimeToday'],['week','fTimeWeek'],['month','fTimeMonth']].map(([p,n])=>this._entity(`${k}_${p}`,t(n),['sensor'])).join('')}`).join('');
      const seasons=()=>{const k=this._season,names=t('months').split(',');
        return `<div class="seg">${[['winter','winter'],['summer','summer']].map(([v,n])=>`<button type="button" data-season-tab="${v}" aria-pressed="${this._season===v}">${esc(t(n))}</button>`).join('')}</div><div class="months">${names.map((m,i)=>`<button type="button" data-month="${i+1}" data-season="${k}" class="month" aria-pressed="${c[`${k}_months`].includes(i+1)}">${esc(m)}</button>`).join('')}</div>`+
          this._entity(`${k}_previous`,t('fPrevH'),['sensor'])+this._entity(`${k}_last`,t('fLastH'),['sensor'])+`<div class="tiny">${esc(t('scenarioD'))}</div>`;};
      const auts=()=>c.automations.map((a,i)=>`<div class="item"><div class="item-head"><strong>${esc(a.name||friendly(this._hass,a.entity,t('autN',{n:i+1})))}</strong><button type="button" class="delete" data-remove="automations:${i}">${icon('delete-outline')} ${esc(t('remove'))}</button></div>${this._entity(`automations:${i}:entity`,t('fAut'),['automation'])}${this._text(`automations:${i}:name`,t('fAutName'),t('fAutNameH'))}</div>`).join('')+`<button type="button" class="add" data-add="automations">${icon('plus')} ${esc(t('addAut'))}</button>`+this._check('confirm_automation_disable',t('ckConfirm'));
      return `<div class="heading">${esc(t('tMod'))}</div><div class="desc">${esc(t('modD'))}</div>`+
        this._mod('valves',t('mValves'),t('hValves'),valves)+
        this._mod('stats',t('statsH'),t('statsD'),times)+
        this._mod('seasons',t('seasonsH'),t('seasonsD'),seasons)+
        this._mod('automations',t('autH'),t('autD'),auts);
    }
    _aspetto(){const c=this._cfg,t=(k,v)=>this._t(k,v);
      return `<div class="heading">${esc(t('tLook'))}</div>`+
        this._text('eyebrow',t('fEye'))+this._text('title',t('fTitle'),t('fTitleH'),t('defTitle'))+
        this._check('show_eyebrow',t('ckEye'),t('ckEyeH'))+this._check('show_title',t('ckTitle'),t('ckTitleH'))+
        this._select('theme_mode',t('fTheme'),[['auto',t('thAuto')],['light',t('thLight')],['dark',t('thDark')]])+
        this._select('language',t('lang'),[['auto',t('langAuto')],...LANGS],t('langH'))+
        this._select('layout',t('fMode'),[['complete',t('lyComplete')],['heat',t('lyHeat')],['ac',t('lyAc')],['valves',t('lyValves')],['custom',t('lyCustom')]],t('visD'))+
        this._select('temperature_control',t('fCtrl'),[['arc',t('ctArc')],['ring',t('ctRing')]]);
    }
    _click(e){const b=e.target.closest('button');if(!b)return;
      if(b.dataset.tab){this._tab=b.dataset.tab;this._render();return;}
      if(b.dataset.seasonTab){this._season=b.dataset.seasonTab;this._render();return;}
      if(b.dataset.clear){this._pathUpdate(b.dataset.clear,'');return;}
      if(b.dataset.add){const k=b.dataset.add;if(k==='valves')this._save({...this._cfg,valves:[...this._cfg.valves,{entity:'',name:'',restore_method:'none'}]});else this._save({...this._cfg,automations:[...this._cfg.automations,{entity:'',name:''}]});return;}
      if(b.dataset.remove){const [k,i]=b.dataset.remove.split(':');this._save({...this._cfg,[k]:this._cfg[k].filter((_,j)=>j!==+i)});return;}
      if(b.dataset.month){const k=b.dataset.season,value=+b.dataset.month,old=this._cfg[`${k}_months`],next=old.includes(value)?old.filter(x=>x!==value):[...old,value];this._save({...this._cfg,[`${k}_months`]:next});return;}
    }
    _change(e){const el=e.target;
      if(el.dataset.path!==undefined){const p=el.dataset.path,domains=this._domains(p),value=domains?safe(el.value,domains):el.value;this._pathUpdate(p,value,el.tagName==='SELECT'||!!domains);return;}
      if(el.dataset.check!==undefined)this._pathUpdate(el.dataset.check,el.checked);
    }
    _domains(path){const p=path.split(':');if(p.length===1){if(ENTITY_DOMAINS[path])return ENTITY_DOMAINS[path];if(ID_FIELDS.includes(path))return ['sensor'];return null;}
      if(p[0]==='valves'){if(p[2]==='entity')return ['climate'];if(['today','week','month'].includes(p[2]))return ['sensor'];if(p[2]==='restore_script')return ['script'];if(p[2]==='activity_entity')return ['binary_sensor','switch','sensor','input_boolean'];}
      if(p[0]==='automations'&&p[2]==='entity')return ['automation'];return null;
    }
    _render(){if(!this.isConnected)return;
      this._renderedLang=this._lang();
      const act=this.shadowRoot.activeElement?.id||'';
      const tabs=[['clima','tClima'],['moduli','tMod'],['aspetto','tLook']];
      const body=this._tab==='moduli'?this._moduli():this._tab==='aspetto'?this._aspetto():this._clima();
      this.shadowRoot.innerHTML=`<style>${ECSS}</style><div class="ed"><div class="tabs" role="group" aria-label="${esc(this._t('secs'))}">${tabs.map(([v,k])=>`<button type="button" class="tab" id="t-${v}" data-tab="${v}" aria-pressed="${this._tab===v}">${esc(this._t(k))}</button>`).join('')}</div>${body}</div>`;
      if(this._nativeReady){this.shadowRoot.querySelectorAll('[data-selector]').forEach(slot=>{
        const path=slot.dataset.selector,domains=slot.dataset.domains.split(',');
        const el=document.createElement('ha-selector');el.hass=this._hass;el.selector={entity:{filter:domains.map(domain=>({domain}))}};el.value=this._value(path)||'';
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
      if(act){const el=this.shadowRoot.getElementById(act);if(el&&!el.disabled)el.focus({preventScroll:true});}
    }
  }
  if(!customElements.get(TAG))customElements.define(TAG,ClimateControlCard);
  if(!customElements.get(EDITOR))customElements.define(EDITOR,ClimateControlEditor);
  window.customCards=window.customCards||[];
  if(!window.customCards.some(x=>x.type===TAG))window.customCards.push({type:TAG,name:'Climate Control Card',description:'Edera climate card for thermostats, air conditioners, valves, schedules and statistics.',preview:true});
})();
