// Quick replies write to the existing inputs and invoke their existing handlers.
// This module keeps conversation history in memory only; it never saves contact data.
export function setupChatQuestions() {
  const main=document.querySelector('main'),result=document.getElementById('result');
  const history=document.getElementById('chat-history'),form=history.closest('.card');
  const soft=text=>String(text).replace(/\b(?:is|was|got)\s+(?:visibly\s+)?damaged\b/gi,'needs fixing').replace(/\b(?:are|were)\s+damaged\b/gi,'need fixing').replace(/\bdamaged parts\b/gi,'parts that need fixing').replace(/\bdamaged\b/gi,'needs fixing').replace(/\bdamage\b/gi,'issues');
  const log=document.createElement('section');log.id='mechanic-conversation';log.className='conversation-log';log.setAttribute('aria-label','Our conversation');log.hidden=true;form.before(log);form.classList.add('conversation-form');
  const configs={
    'chat-help':{step:'help',question:'Hi! What can I help with?',options:['Body repair','Mechanical problem','I have a garage quote'],send:()=>document.querySelector('[data-chat-next=help]')},
    'chat-story':{step:'story',question:'Got it. What happened?',groups:[['Body (dent, scratch, broken, glass, lights)',['Dent','Scratch','Broken or hanging part','Glass','Lights']],['Mechanical (engine, AC, brakes, battery, service)',['Engine','AC','Brakes','Battery','Service']]],send:()=>document.querySelector('[data-chat-next=story]')},
    'estimate-concern':{step:'recheck',question:'What should I check again?',options:['A part is missing','A listed part looks fine','The suggested work seems wrong','The price seems high','The price seems low','Looks right'],send:()=>document.getElementById('recheck-estimate')},
    'garage-area':{step:'location',question:'Which area should I look in?',send:()=>document.getElementById('garage-search-button')}
  };
  let pending=false,previousStage=document.body.dataset.flowStage;const turns=[];
  function record(config,answer){
    const question=document.createElement('div');question.className='chat-bubble app-bubble conversation-question';
    const text=document.createElement('span');text.className='ai-text';text.textContent=window.mechanicQuestionCopy(config.step)||config.question||({car:'Which car is it?',city:'Which city?',photos:'Send a photo of what needs fixing.'}[config.step])||'';question.append(text);
    const reply=document.createElement('div');reply.className='chat-bubble conversation-answer ph-no-capture';reply.textContent=soft(answer);
    log.append(question,reply);log.hidden=false;turns.push({step:config.step,question:text.textContent,answer:soft(answer)});
    log.dispatchEvent(new CustomEvent('conversation-answer',{detail:{step:config.step}}));
    if(config.step==='recheck'||config.step==='location'){
      const acknowledgement=document.createElement('div');acknowledgement.className='chat-bubble app-bubble conversation-question';
      const text=document.createElement('span');text.className='ai-text';
      const replies={'The price seems high':"Okay, I'll check why the price feels high.",'The price seems low':"Okay, I'll check why the price feels low.",'A part is missing':"Okay, I'll check for the missing part.",'A listed part looks fine':"Okay, I'll check that part again.",'The suggested work seems wrong':"Okay, I'll check the suggested work again.",'Looks right':'Glad that looks right.'};
      text.textContent=config.step==='location'?'Okay, I’ll look for garages in '+soft(answer).slice(0,70)+'.':replies[answer]||'Okay, I’ll check: '+soft(answer).slice(0,70)+'.';acknowledgement.append(text);log.append(acknowledgement);
    }
  }
  function install(input,id,config){
    if(input.dataset.chatReplies)return;input.dataset.chatReplies='ready';
    const wrapper=input.closest('.garage-area-row')||input;
    const controls=document.createElement('div');controls.className='mechanic-replies';controls.dataset.quickReplies=id;controls.setAttribute('role','group');controls.setAttribute('aria-label',config.question);
    const inputLabel=main.querySelector('label[for="'+id+'"]');if(inputLabel)inputLabel.hidden=true;
    const send=config.send();send.dataset.replySend='true';send.hidden=true;wrapper.before(controls);wrapper.hidden=true;
    if(id==='chat-help')input.closest('[data-chat-step]').querySelector('.chat-chips').hidden=true;
    if(id==='estimate-concern'){
      const card=input.closest('.recheck-card');card.querySelector('h2').hidden=true;
      const introduction=result.querySelector(':scope > .app-bubble:not(.model-choice)');if(introduction){card.querySelector('p:first-of-type').textContent=window.mechanicQuestionCopy('estimate');introduction.remove();}
      const optional=document.createElement('p');optional.className='reply-optional';optional.textContent='You can also go straight to nearby garages.';controls.after(optional);
      if(turns.some(turn=>turn.step==='recheck')){
        card.hidden=true;const again=document.createElement('button');again.type='button';again.className='secondary chat-refine-again';again.textContent='Add more details to refine my estimate';card.before(again);
        again.addEventListener('click',()=>{card.hidden=false;again.hidden=true;card.scrollIntoView({block:'center',behavior:'smooth'});});
      }
    }
    const suggestions=input.getAttribute('aria-controls');
    const choose=(value,label=value)=>{
      if(send.disabled)return;
      input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
      if(suggestions){const list=document.getElementById(suggestions);if(list)list.hidden=true;input.setAttribute('aria-expanded','false');}
      record(config,label);controls.hidden=true;wrapper.hidden=true;send.hidden=true;
      if(id==='estimate-concern'){
        input.closest('.recheck-card').querySelector('p:first-of-type').hidden=true;
      }
      if(id==='garage-area')input.closest('.garage-controls').querySelector('h2').hidden=true;
      send.click();
    };
    const add=(label,value=label,parent=controls)=>{const button=document.createElement('button');button.type='button';button.className='mechanic-reply';button.dataset.replyValue=value;button.textContent=label;parent.append(button);button.addEventListener('click',()=>choose(value,button.textContent));};
    if(config.groups){for(const [index,[heading,options]]of config.groups.entries()){const group=document.createElement('div');group.className='reply-group';group.dataset.problemGroup=index===0?'body':'mechanical';const title=document.createElement('p');title.className='reply-group-title';title.textContent=heading;group.append(title);const buttons=document.createElement('div');buttons.className='reply-grid';group.append(buttons);controls.append(group);options.forEach(option=>add(option,option,buttons));}}
    else {const grid=document.createElement('div');grid.className='reply-grid';controls.append(grid);let options=config.options;if(id==='garage-area'){const city=document.getElementById('customer-city').value.trim();options=city.toLowerCase()==='pune'?['Kharadi','Viman Nagar','Hadapsar','Kothrud','Hinjewadi','Wakad']:[city];}options.forEach(option=>add(option,option,grid));}
    const other=document.createElement('button');other.type='button';other.className='mechanic-reply reply-other';other.textContent='Other, type it';other.setAttribute('aria-expanded','false');controls.append(other);
    other.addEventListener('click',()=>{wrapper.hidden=false;send.hidden=false;send.textContent='Send';other.setAttribute('aria-expanded','true');input.setAttribute('aria-label',config.question);input.placeholder='Tell me in your own words';input.focus();});
    // Typed exceptions, Enter and existing Skip/location buttons use the same history.
    send.addEventListener('click',()=>{if(!controls.hidden&&input.value.trim()){record(config,input.value.trim());controls.hidden=true;wrapper.hidden=true;send.hidden=true;}},true);
    input.addEventListener('keydown',event=>{if(event.key==='Enter'&&input.value.trim()&&!controls.hidden&&(!suggestions||document.getElementById(suggestions)?.hidden)){record(config,input.value.trim());controls.hidden=true;wrapper.hidden=true;send.hidden=true;}},true);
    if(id==='chat-story')document.querySelector('[data-chat-skip]').addEventListener('click',()=>{if(!controls.hidden)record(config,'Skip for now');},true);
    if(id==='garage-area'){
      input.addEventListener('input',()=>{if(wrapper.hidden&&suggestions)queueMicrotask(()=>{const list=document.getElementById(suggestions);if(list)list.hidden=true;});});
      document.getElementById('garage-location-button').addEventListener('click',()=>{if(!controls.hidden)record(config,'Use my location');},true);
    }
  }
  function refresh(){pending=false;
    const stage=document.body.dataset.flowStage;
    if(stage!==previousStage){
      if(previousStage==='car'&&stage==='city')record({step:'car'},document.getElementById('car-model').value);
      if(previousStage==='city'&&(stage==='photos'||stage==='loading'))record({step:'city'},document.getElementById('customer-city').value);
      if(previousStage==='quick-upload'&&stage==='car')record({step:'quick-photo',question:"Send me a photo and I'll suggest the repair."},'Photo sent');
      if(previousStage==='photos'&&stage==='loading')record({step:'photos'},'Photo sent');
      previousStage=stage;
    }
    for(const [id,config]of Object.entries(configs)){const input=document.getElementById(id);if(input)install(input,id,config);}
    const category=document.getElementById('chat-help').value.trim();
    for(const group of main.querySelectorAll('[data-problem-group]')){const hide=(category==='Body repair'&&group.dataset.problemGroup!=='body')||(category==='Mechanical problem'&&group.dataset.problemGroup!=='mechanical');if(group.hidden!==hide)group.hidden=hide;}
    const carLabel=main.querySelector('label[for="car-model"]');if(carLabel&&!carLabel.hidden)carLabel.hidden=true;
    // The garage invitation is an optional action, so it does not compete with
    // the one active refine question. Its search and quote handlers stay intact.
    const invite=result.querySelector('.garage-invite h2');if(invite&&invite.dataset.chatHeading!=='listening'){invite.dataset.aiStarted='true';invite.dataset.chatHeading='listening';invite.textContent='Shall I find garages near you?';const yes=document.getElementById('show-nearby-garages');yes.textContent='Find nearby garages';document.getElementById('decline-garages').hidden=true;}
    if(stage==='estimate'&&invite){const hidden=!result.querySelector('.recheck-card')?.hidden;if(invite.parentElement.hidden!==hidden)invite.parentElement.hidden=hidden;}
    // If a refine/search fails, keep its existing retry path and typed answer.
    for(const id of ['estimate-concern','garage-area']){const input=document.getElementById(id),config=configs[id];if(!input)continue;const send=config.send(),controls=input.parentElement.querySelector('[data-quick-replies="'+id+'"]')||input.closest('.recheck-card,.garage-controls')?.querySelector('[data-quick-replies="'+id+'"]');const status=document.getElementById(id==='estimate-concern'?'recheck-status':'garage-status');if(controls?.hidden&&!send.disabled&&status?.textContent&&/could not|couldn't|try again|failed|unavailable/i.test(status.textContent)){controls.hidden=false;input.closest('.recheck-card')?.querySelector('p:first-of-type')?.removeAttribute('hidden');}}
    const walker=document.createTreeWalker(main,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){if(node.parentElement.closest('script,style,.admin-request,.garage-review,.garage-photo-credit,.garage-name-rating h3'))continue;const text=soft(node.textContent);if(text!==node.textContent)node.textContent=text;}
    for(const el of main.querySelectorAll('[placeholder],[aria-label],[title]'))for(const attr of ['placeholder','aria-label','title'])if(el.hasAttribute(attr)){const old=el.getAttribute(attr),text=soft(old);if(old!==text)el.setAttribute(attr,text);}
  }
  function schedule(){if(!pending){pending=true;queueMicrotask(refresh);}}
  main.addEventListener('click',event=>{if(event.target.closest('#show-nearby-garages'))record({step:'garages',question:'Shall I find garages near you?'},'Find nearby garages');},true);
  new MutationObserver(schedule).observe(main,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden']});new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['data-flow-stage']});refresh();
}
