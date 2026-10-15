// Customer presentation only: existing inputs and handlers remain the source of answers.
export function setupCustomerControls({showStep,catalog,getQuick,cancelInspection,estimateKey,canReuseEstimate,resetEstimatePresentation}) {
  const main=document.querySelector('main'),result=document.getElementById('result'),history=document.getElementById('chat-history'),form=history.closest('.card');
  const soft=text=>String(text).replace(/\b(?:is|was|got)\s+(?:visibly\s+)?damaged\b/gi,'needs fixing').replace(/\b(?:are|were)\s+damaged\b/gi,'need fixing').replace(/\bvisibly damaged parts\b/gi,'parts with visible issues').replace(/\bdamaged parts\b/gi,'parts that need fixing').replace(/\bdamaged\b/gi,'needs fixing').replace(/\bdamage\b/gi,'issues');
  const configs={
    'chat-help':{label:'How can we help with your car?',options:['Something needs fixing','I got a garage quote'],multi:false},
    'chat-story':{label:'What needs fixing? (optional)',options:['Scratch','Dent','Broken part','Part hanging','Glass','Lights','Mileage','Engine noise','AC','Brakes','Battery','Service'],multi:true},
    'car-model':{label:'Which model is your car?',options:[],multi:false},
    'customer-city':{label:'Where will you get it fixed?',options:['Pune','Mumbai','Delhi','Bengaluru','Hyderabad','Chennai'],multi:false},
    'estimate-concern':{label:'What would you like us to look at again?',options:['A part looks fine','A part is missing','The repair work seems wrong','The price seems high','The price seems low'],multi:true},
    'garage-area':{label:'Which area should we look in?',options:['Kharadi','Viman Nagar','Hadapsar','Kothrud','Hinjewadi','Wakad'],multi:false},
    'quote-year':{label:'Which year is your car? (optional)',options:Array.from({length:17},(_,i)=>String(new Date().getFullYear()-i)),multi:false,optional:true}
  };
  const groups=new Map(),snapshots=new Map(),trail=[];let current='',restoring=false,lastEstimateKey='',pending=false;
  const savedInputs=new Map();
  const inputKey=input=>input.id || (input.closest('[data-quote-form]') ? 'quote-'+input.name : '');
  const rememberInputs=()=>main.querySelectorAll('input:not([type=file])').forEach(input=>{const key=inputKey(input);if(key)savedInputs.set(key,input.value);});
  const back=document.createElement('button');back.id='customer-back';back.className='secondary customer-back';back.type='button';back.textContent='Back';back.hidden=true;document.querySelector('.hero').after(back);
  const snap=stage=>{if(!stage)return;rememberInputs();snapshots.set(stage,{nodes:[...result.childNodes],historyNodes:[...history.childNodes],hidden:[...result.querySelectorAll('[hidden],#result > *,[data-quote-fields],[data-quote-followup]')].map(el=>[el,el.hidden]),resultHidden:result.hidden});};
  const visibleStage=()=>result.querySelector('.model-choice')?.getClientRects().length ? 'model-choice' : document.body.dataset.flowStage;
  const question={name:'What’s your name?',help:'How can we help with your car?',story:'What happened? (optional)',car:'Choose your car and version.',city:'Where will you get it fixed?',photos:'Share a close-up and a wider photo of the spot you’re worried about.'};
  const restore=stage=>{
    restoring=true;cancelInspection();getQuick()?.resumeStep(stage);
    const saved=snapshots.get(stage);if(saved){result.replaceChildren(...saved.nodes);for(const [el,hidden]of saved.hidden)el.hidden=hidden;result.hidden=saved.resultHidden;}
    document.body.classList.remove('has-garage-quotes','quote-open');
    if(['name','help','story','brand','car','city','photos','quick-upload'].includes(stage)){
      result.hidden=true;showStep(stage);if(stage==='quick-upload'){getQuick()?.returnToUpload();form.hidden=true;}else{form.hidden=false;if(saved?.historyNodes.length)history.replaceChildren(...saved.historyNodes);else{history.replaceChildren();const bubble=document.createElement('div');bubble.className='chat-bubble app-bubble';bubble.textContent=question[stage];history.append(bubble);}}
    }else{
      document.body.dataset.flowStage=stage;form.hidden=true;result.hidden=false;
      if(stage==='model-choice')result.querySelectorAll('[data-car-choice]').forEach(button=>button.disabled=false);
      if(stage==='estimate')result.querySelectorAll(':scope > *').forEach(el=>{el.hidden=['garage-discovery','quote-prompt','garage-quote-bar'].includes(el.id);});
      if(stage==='garages'){result.querySelectorAll(':scope > *').forEach(el=>{el.hidden=!['garage-discovery','garage-quote-bar'].includes(el.id);});document.body.classList.add('has-garage-quotes');}
    }
    current=stage;window.scrollTo({top:0,behavior:'smooth'});restoring=false;schedule();
  };
  back.addEventListener('click',()=>{snap(current);if(document.body.dataset.flowStage==='loading'){restore(trail.at(-1));return;}if(trail.length>1){trail.pop();restore(trail.at(-1));}});
  // Capture a screen before its existing handler hides or rebuilds it.
  document.addEventListener('click',event=>{if(event.target.closest('#customer-back'))return;snap(current);if(event.target.closest('[data-car-choice]')&&canReuseEstimate())resetEstimatePresentation();},true);
  document.addEventListener('input',rememberInputs,true);document.addEventListener('change',rememberInputs,true);
  document.getElementById('analyze').addEventListener('click',event=>{
    if(!canReuseEstimate() || !snapshots.has('estimate') || lastEstimateKey!==estimateKey())return;
    event.preventDefault();event.stopImmediatePropagation();if(trail.at(-1)!=='estimate')trail.push('estimate');restore('estimate');
  },true);
  function install(input,id,config){
    if(input.dataset.tapReady)return;
    input.dataset.tapReady='true';const saved=savedInputs.get(id);if(saved!==undefined && !input.value)input.value=saved;
    const label=main.querySelector('label[for="'+id+'"]') || input.closest('label');
    if(label){for(const node of [...label.childNodes])if(node.nodeType===Node.TEXT_NODE)node.textContent=config.label;}
    const container=document.createElement('div');container.className='tap-question';container.dataset.tapQuestion=id;
    container.setAttribute('role','group');container.setAttribute('aria-label',config.label);
    const choices=document.createElement('div');choices.className='tap-options';container.append(choices);
    if(config.multi){const note=document.createElement('p');note.className='tap-note';note.textContent='Choose any that fit.';container.prepend(note);}
    const other=document.createElement('button');other.type='button';other.className='tap-other';other.textContent='Other, type it';other.setAttribute('aria-expanded','false');container.append(other);
    const wrapper=input.closest('.model-search') || input;wrapper.before(container);wrapper.hidden=true;input.hidden=wrapper===input;
    const state={input,config,container,choices,other,wrapper,selected:new Set(),custom:'',customOpen:false,lastValue:input.value};groups.set(id,state);
    const write=()=>{
      const words=[...state.selected];if(state.customOpen&&state.custom.trim())words.push(state.custom.trim());
      let value=words.join('; ');if(id==='car-model'&&value&&container.dataset.brand&&!value.toLowerCase().startsWith(container.dataset.brand.toLowerCase()+' '))value=container.dataset.brand+' '+value;
      if(input.value!==value){state.writing=true;input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));state.writing=false;}
      const suggestions=wrapper.querySelector?.('[role=listbox]');if(suggestions&&!state.customOpen)suggestions.hidden=true;
      input.setAttribute('aria-expanded','false');savedInputs.set(id,input.value);state.lastValue=input.value;
      if(config.multi&&state.customOpen)setTimeout(()=>{if(input.value===value){input.value=state.custom;state.lastValue=input.value;}},0);
    };
    const addChoice=(word,parent=choices)=>{
      if([...container.querySelectorAll('[data-tap-value]')].some(button=>button.dataset.tapValue===word))return;
      const option=document.createElement('button');option.type='button';option.className='tap-choice';option.textContent=word;option.dataset.tapValue=word;option.setAttribute('aria-pressed','false');parent.append(option);
      option.addEventListener('click',()=>{
        if(config.multi){if(state.selected.has(word))state.selected.delete(word);else state.selected.add(word);}else{state.selected.clear();state.selected.add(word);state.custom='';state.customOpen=false;wrapper.hidden=true;input.hidden=wrapper===input;other.setAttribute('aria-expanded','false');}
        write();for(const b of container.querySelectorAll('[data-tap-value]'))b.setAttribute('aria-pressed',String(state.selected.has(b.dataset.tapValue)));
      });
    };
    config.options.forEach(word=>addChoice(word));
    if(config.optional){addChoice('Not sure');const b=choices.lastElementChild;b.addEventListener('click',()=>{input.value='';state.lastValue='';savedInputs.set(id,'');});}
    if(input.value){const words=input.value.split('; '),matching=config.options.filter(word=>words.includes(word));matching.forEach(word=>state.selected.add(word));const remaining=words.filter(word=>!matching.includes(word));if(remaining.length){state.custom=remaining.join('; ');state.customOpen=true;if(config.multi&&matching.length){input.value=state.custom;state.lastValue=input.value;}wrapper.hidden=false;input.hidden=false;other.setAttribute('aria-expanded','true');}}
    for(const b of container.querySelectorAll('[data-tap-value]'))b.setAttribute('aria-pressed',String(state.selected.has(b.dataset.tapValue)));
    other.addEventListener('click',()=>{state.customOpen=!state.customOpen;if(state.customOpen&&!config.multi){state.selected.clear();for(const b of container.querySelectorAll('[data-tap-value]'))b.setAttribute('aria-pressed','false');}other.setAttribute('aria-expanded',String(state.customOpen));wrapper.hidden=!state.customOpen;input.hidden=!state.customOpen;if(state.customOpen){input.value=state.custom;input.focus();}else write();});
    // The typed exception is merged into the very same existing field before Continue/refine/search/submit.
    input.addEventListener('input',()=>{if(state.customOpen&&!state.writing){state.custom=input.value;state.lastValue=input.value;}});
    document.addEventListener('click',event=>{if(event.target.closest('.tap-question'))return;if(state.customOpen&&event.target.closest('button'))write();},true);
    input.addEventListener('keydown',event=>{if(event.key==='Enter'&&state.customOpen)write();},true);
    if(id==='car-model')catalog.then(data=>{
      // The brand/model buttons replace the old unfiltered suggestion dropdown,
      // including when a customer types an uncommon model or version.
      input.addEventListener('input',()=>{const suggestions=wrapper.querySelector('[role=listbox]');if(suggestions)suggestions.hidden=true;input.setAttribute('aria-expanded','false');});
      const brandStep=document.createElement('div');brandStep.dataset.chatStep='brand';brandStep.hidden=true;
      brandStep.innerHTML='<label>Which brand is your car?</label><div class="tap-options" data-brand-options></div><button class="tap-other" type="button" data-other-brand>Other, type it</button><label hidden data-custom-brand-label>Car brand<input type="text" data-custom-brand autocomplete="off" /></label><button class="cta" type="button" hidden data-brand-continue>Continue</button>';
      input.closest('[data-chat-step]').before(brandStep);
      const brands=['Maruti','Hyundai','Tata','Mahindra','Honda','Toyota','Kia','Volkswagen'];
      const answersByBrand=new Map();
      const chooseBrand=brand=>{
        if(container.dataset.brand)answersByBrand.set(container.dataset.brand,input.value);
        if(container.dataset.brand && container.dataset.brand!==brand){input.value=answersByBrand.get(brand)||'';state.lastValue=input.value;savedInputs.set(id,input.value);}
        const popular={Maruti:['Swift','Alto K10','Wagon R','Baleno','Dzire','Ertiga','Brezza','Fronx']};
        const models=data.models.filter(model=>model.make.toLowerCase()===brand.toLowerCase());
        const ordered=popular[brand] ? popular[brand].map(name=>models.find(model=>model.model===name)).filter(Boolean) : models.slice(0,8);
        choices.replaceChildren();for(const model of ordered){addChoice(model.name);choices.lastElementChild.textContent=model.model;}
        const known=data.models.find(model=>model.name===input.value || data.variants.some(v=>v.name===input.value&&v.make===model.make&&v.model===model.model));
        state.selected.clear();if(known&&known.make.toLowerCase()===brand.toLowerCase())state.selected.add(known.name);
        state.customOpen=false;wrapper.hidden=true;input.hidden=wrapper===input;other.setAttribute('aria-expanded','false');
        if(!choices.children.length || (input.value&&!Array.from(choices.children).some(b=>b.dataset.tapValue===input.value))){state.customOpen=true;state.custom=input.value || brand+' ';input.value=state.custom;state.lastValue=input.value;wrapper.hidden=false;input.hidden=false;other.setAttribute('aria-expanded','true');}
        for(const b of choices.children)b.setAttribute('aria-pressed',String(state.selected.has(b.dataset.tapValue)));
        container.dataset.brand=brand;showStep('car');history.replaceChildren();const bubble=document.createElement('div');bubble.className='chat-bubble app-bubble';bubble.textContent='Which '+brand+' model is your car?';history.append(bubble);
      };
      for(const brand of brands){const button=document.createElement('button');button.type='button';button.className='tap-choice';button.textContent=brand;button.dataset.brand=brand;brandStep.querySelector('[data-brand-options]').append(button);button.addEventListener('click',()=>chooseBrand(brand));}
      brandStep.querySelector('[data-other-brand]').addEventListener('click',()=>{brandStep.querySelector('[data-custom-brand-label]').hidden=false;brandStep.querySelector('[data-brand-continue]').hidden=false;brandStep.querySelector('input').focus();});
      brandStep.querySelector('[data-brand-continue]').addEventListener('click',()=>{const brand=brandStep.querySelector('input').value.trim();if(brand)chooseBrand(brand);});
      if(document.body.dataset.flowStage==='brand')brandStep.hidden=false;
    });
    if(id==='customer-city')catalog.then(data=>{const more=document.createElement('details');more.className='tap-more';const title=document.createElement('summary');title.textContent='More cities';more.append(title);const options=document.createElement('div');options.className='tap-options';more.append(options);for(const city of data.cities)addChoice(city,options);other.before(more);});
    if(id==='garage-area'&&document.getElementById('customer-city').value.trim()!=='Pune'){choices.replaceChildren();addChoice(document.getElementById('customer-city').value.trim());}
  }
  function refresh(){pending=false;
    for(const input of result.querySelectorAll('[data-quote-form] input'))if(!input.dataset.retainedReady){const saved=savedInputs.get(inputKey(input));if(saved!==undefined&&!input.value)input.value=saved;input.dataset.retainedReady='true';}
    const year=result.querySelector('[name=year]');if(year){year.id='quote-year';year.closest('label')?.setAttribute('for','quote-year');}
    for(const [id,config]of Object.entries(configs)){const input=document.getElementById(id);if(input)install(input,id,config);}
    for(const state of groups.values())if(state.input.isConnected&&state.input.value!==state.lastValue){
      state.lastValue=state.input.value;
      if(state.customOpen)state.custom=state.input.value;
      else if(!state.config.multi){state.selected.clear();const match=[...state.container.querySelectorAll('[data-tap-value]')].find(b=>b.dataset.tapValue===state.input.value);if(match)state.selected.add(state.input.value);else if(state.input.value){state.custom=state.input.value;state.customOpen=true;state.wrapper.hidden=false;state.input.hidden=false;state.other.setAttribute('aria-expanded','true');}
        for(const b of state.container.querySelectorAll('[data-tap-value]'))b.setAttribute('aria-pressed',String(state.selected.has(b.dataset.tapValue)));}
    }
    const stage=visibleStage();if(stage==='model-choice'&&document.body.dataset.flowStage!==stage)document.body.dataset.flowStage=stage;if(stage && !restoring && stage!==current){if(stage==='loading'){current=stage;}else{if(current==='loading'&&stage==='estimate')lastEstimateKey=estimateKey();if(trail.at(-1)!==stage)trail.push(stage);current=stage;snap(stage);}}
    if(stage==='estimate'){lastEstimateKey=estimateKey();snap(stage);}
    const hideBack=stage==='loading' ? !trail.length : trail.length<2;if(back.hidden!==hideBack)back.hidden=hideBack;
    // User-entered values are never rewritten. Only displayed customer copy is softened.
    const walker=document.createTreeWalker(main,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){if(node.parentElement.closest('script,style,.admin-request,.garage-review,.garage-photo-credit,.garage-name-rating h3'))continue;const safe=soft(node.textContent);if(safe!==node.textContent)node.textContent=safe;}
    for(const el of main.querySelectorAll('[placeholder],[aria-label],[title]'))for(const attr of ['placeholder','aria-label','title'])if(el.hasAttribute(attr)){const old=el.getAttribute(attr),safe=soft(old);if(old!==safe)el.setAttribute(attr,safe);}
  }
  function schedule(){if(pending)return;pending=true;queueMicrotask(refresh);}
  new MutationObserver(schedule).observe(main,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden']});
  new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['data-flow-stage']});refresh();
}
