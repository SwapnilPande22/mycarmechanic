(() => {
  let language='en';try{const saved=localStorage.getItem('mycarmechanic-language');if(['en','hi','mr'].includes(saved))language=saved;}catch{}
  const catalog=window.UI_TRANSLATIONS || {hi:{},mr:{}};
  const originals=new WeakMap(),attributes=new WeakMap(),cache=new Map(),pending=new Set(),failed=new Set();
  let client,busy=false,timer;
  const t=text=>language==='en'?text:(catalog[language]?.[text] || cache.get(text) || text);
  const skip=el=>el.closest('script,style,svg,[translate="no"],.language-choice,.ai-text,.typing-dots,.model-suggestions,.city-suggestions,.garage-suggestions,.garage-card-body h3,.photo-file-name,.garage-photo-credit,.garage-name,.garage-review-text,.admin-customer-number,.admin-request-heading,.admin-damage,.admin-photos,.admin-received,.result-meta,#selected-car-summary,[data-request-number]') || el.matches('input,textarea,option');
  const eligible=text=>/[A-Za-z\u0900-\u097f]/.test(text)&&text.length<1600&&!/^(?:https?:|[\d₹+.,–\s/():%-]+$)/.test(text);
  function remember(node){const prev=originals.get(node);if(!prev||node.textContent!==prev.rendered){const value={source:node.textContent,rendered:node.textContent};originals.set(node,value);return value;}return prev;}
  function refresh(){
    document.documentElement.lang=language;
    if(location.pathname.replace(/\/$/,'')==='/admin')return; // Per-request copy language is independent.
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
    while(node=walker.nextNode()){
      if(skip(node.parentElement))continue;
      const record=remember(node),key=record.source.trim();if(!eligible(key))continue;
      const value=record.source.replace(key,t(key));record.rendered=value;if(node.textContent!==value)node.textContent=value;
      if(language!=='en'&&value===record.source&&!catalog[language]?.[key]&&!cache.has(key)&&!failed.has(key))pending.add(key);
    }
    document.querySelectorAll('[placeholder],[aria-label],[title]').forEach(el=>{
      if(el.closest('[translate="no"],.language-choice'))return;
      let record=attributes.get(el);if(!record){record={};attributes.set(el,record);}
      for(const attr of ['placeholder','aria-label','title']){if(!el.hasAttribute(attr))continue;const current=el.getAttribute(attr);if(!record[attr]||record[attr].rendered!==current)record[attr]={source:current,rendered:current};const key=record[attr].source,value=t(key);record[attr].rendered=value;if(current!==value)el.setAttribute(attr,value);if(language!=='en'&&eligible(key)&&value===key&&!catalog[language]?.[key]&&!cache.has(key)&&!failed.has(key))pending.add(key);}
    });
    clearTimeout(timer);if(pending.size&&!busy&&client)timer=setTimeout(flush,80);
  }
  async function flush(){
    if(busy||!client||!pending.size)return;busy=true;
    const texts=[...pending].slice(0,30);texts.forEach(text=>pending.delete(text));
    try{const values=await client.action('presentation:translate',{language,texts});texts.forEach((text,index)=>cache.set(text,values[index]));}
    catch{ // Keep fixed labels local; a failed explanation never changes inspection data.
      texts.forEach(text=>failed.add(text));
      document.querySelectorAll('.reason,.replacement-option,.summary-card').forEach(el=>{if(texts.some(text=>el.textContent.includes(text)))el.setAttribute('data-translation-failed','true');});
    }finally{busy=false;refresh();}
  }
  const fallbackMessages={
    hi:{name:'नमस्कार! आपका नाम क्या है?',help:'आज मैं आपकी कैसे मदद कर सकता हूँ?',story:'क्या हुआ, बताइए। थोड़ी जानकारी से आपकी चिंता समझने में मदद होगी।',car:'आपकी कार का ब्रांड, मॉडल और वेरिएंट क्या है?',city:'मरम्मत के अनुमान के लिए कौन सा शहर चुनें?',photos:'नुकसान की पास से और थोड़ी दूर से ली गई तस्वीर भेजें।',loading:'आराम से बैठिए, आपका AI मैकेनिक तस्वीरों की जाँच कर रहा है।',estimate:'जाँच के बाद मिला अनुमान नीचे देखें।',garages:'क्या आप पास के गैराज से कोटेशन चाहते हैं?',location:'किस इलाके में गैराज ढूँढें?',quotes:'क्या आप पास के गैराज से कोटेशन मँगवाना चाहते हैं?',phone:'टीम आपसे संपर्क कर सके, इसके लिए अपना WhatsApp नंबर बताइए।',thanks:'आपका अनुरोध सेव हो गया है। हमारी टीम आपसे संपर्क करेगी।',end:'हम पर भरोसा करने के लिए धन्यवाद। आशा है मदद मिली होगी।',recheck:'कौन सा पुर्जा या कीमत गलत लग रही है, बताइए।',retry:'कृपया कार की साफ़ तस्वीर पास से और थोड़ी दूर से भेजें।',clarify:'तस्वीरों में कौन सी कार है? नीचे सही मॉडल चुनें।'},
    mr:{name:'नमस्कार! तुमचे नाव काय आहे?',help:'आज मी तुम्हाला कशी मदत करू शकतो?',story:'काय झाले ते सांगा. थोड्या माहितीमुळे तुमची चिंता समजायला मदत होईल.',car:'तुमच्या कारचा ब्रँड, मॉडेल आणि व्हेरिएंट कोणता आहे?',city:'दुरुस्तीच्या अंदाजासाठी कोणते शहर निवडू?',photos:'नुकसानाचा जवळून आणि थोड्या दूरून घेतलेला फोटो पाठवा.',loading:'आरामात बसा, तुमचा AI मेकॅनिक फोटो तपासत आहे.',estimate:'तपासणीनंतर मिळालेला अंदाज खाली पाहा.',garages:'तुम्हाला जवळच्या गॅरेजकडून कोटेशन हवे आहे का?',location:'कोणत्या भागात गॅरेज शोधू?',quotes:'जवळच्या गॅरेजकडून कोटेशन मागवायचे आहे का?',phone:'आमची टीम संपर्क करू शकेल, यासाठी तुमचा WhatsApp क्रमांक सांगा.',thanks:'तुमची विनंती जतन झाली आहे. आमची टीम तुमच्याशी संपर्क करेल.',end:'आमच्यावर विश्वास ठेवल्याबद्दल धन्यवाद. तुम्हाला मदत झाली असेल अशी आशा आहे.',recheck:'कोणता भाग किंवा किंमत चुकीची वाटते ते सांगा.',retry:'कृपया कारचे स्पष्ट फोटो जवळून आणि थोड्या दूरून पाठवा.',clarify:'फोटोमध्ये कोणती कार आहे? खाली योग्य मॉडेल निवडा.'},
  };
  const fallback=(step,text)=>{const translated=t(text);return language==='en'||translated!==text?translated:(fallbackMessages[language]?.[step]||text);};
  window.i18n={language,t,fallback,refresh,connect:value=>{client=value;refresh();},settled:()=>!busy&&!pending.size};
  const picker=document.getElementById('language-choice');if(picker){picker.value=language;picker.addEventListener('change',()=>{try{localStorage.setItem('mycarmechanic-language',picker.value);}catch{}location.reload();});}
  new MutationObserver(()=>{clearTimeout(window.__languageRefresh);window.__languageRefresh=setTimeout(refresh,0);}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']});
  refresh();
})();
