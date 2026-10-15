// Entry-page presentation only. Inspection, estimate and garage handlers stay shared.
export function createQuickEntry({showStep,askMechanic,saveName}) {
  const input=document.getElementById('damage-photos');
  const hero=document.querySelector('.hero');
  const formCard=document.getElementById('chat-history').closest('.card');
  document.body.classList.add('quick-entry');
  const upload=document.createElement('button');
  upload.id='quick-upload';upload.className='cta';upload.type='button';
  upload.textContent=({en:'Upload photos of what needs fixing',hi:'जहाँ ठीक करवाना है उसकी तस्वीरें अपलोड करें',mr:'जे दुरुस्त करायचे आहे त्याचे फोटो अपलोड करा'})[window.i18n.language] || 'Upload photos of what needs fixing';
  document.getElementById('headline').after(upload);
  upload.addEventListener('click',()=>input.click());
  const fileList=document.getElementById('file-list'),clear=document.getElementById('clear-photos');
  upload.after(fileList,clear);
  showStep('quick-upload');formCard.hidden=true;
  let uploaded=false,cityConfirmed=false;
  const confirmCity=event=>{
    if(document.body.dataset.flowStage!=='city' || !document.getElementById('customer-city').value.trim() || !uploaded)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(cityConfirmed)return;
    cityConfirmed=true;
    window.trackAnalytics('chat_city_given');
    // Click the existing Inspect button: it uses the already-prepared selectedFiles.
    document.getElementById('analyze').click();
  };
  document.querySelector('[data-chat-next=city]').addEventListener('click',confirmCity,true);
  document.getElementById('customer-city').addEventListener('keydown',event=>{
    if(event.key==='Enter' && document.getElementById('city-suggestions').hidden)confirmCity(event);
  },true);
  const quoteOpened=()=>{
    const result=document.getElementById('result');
    const popup=result.querySelector('#quote-prompt'),form=result.querySelector('[data-quote-form]');
    if(!form || popup.hidden || form.dataset.quickName==='ready')return;
    form.dataset.quickName='ready';
    const name=form.elements.name;
    name.type='text';name.id='quick-quote-name';name.autocomplete='name';name.maxLength=100;name.required=true;
    const label=document.createElement('label');label.htmlFor=name.id;label.textContent=window.i18n.t('Your name');
    name.before(label);label.append(name);
    let tracked=false;
    name.addEventListener('change',()=>{if(!name.value.trim())return;saveName(name.value.trim());if(!tracked){tracked=true;window.trackAnalytics('chat_name_given');}});
  };
  new MutationObserver(quoteOpened).observe(document.getElementById('result'),{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  return {async photosReady(){
    if(document.body.dataset.flowStage!=='quick-upload')return;
    if(!fileList.querySelector('.photo-file') || fileList.querySelector('.photo-error,.photo-converting'))return;
    uploaded=true;
    const inspect=document.getElementById('analyze');inspect.before(fileList,clear);
    showStep('car');await askMechanic('car','What is your car’s make, model and variant?');
  }};
}
