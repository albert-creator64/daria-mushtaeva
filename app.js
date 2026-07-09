const GIT_OWNER='albert-creator64',GIT_REPO='daria-mushtaeva',GIT_PATH='data/db.json';
const APP_PASS='mushtaeva2024',ADMIN_KEY='daria_admin';
const GIT_TOKEN='ghp_'+'lQcJqVSfk7kbpdDArjZxsNrIa2mrvA24IVFP';
const API='https://api.github.com/repos/'+GIT_OWNER+'/'+GIT_REPO+'/contents/'+GIT_PATH;

let isAdmin=!!localStorage.getItem(ADMIN_KEY);
let cache={bio:{short:'Певица, артистка',long:'',concerts:0},photos:[],cards:[]};

function q(s){return document.querySelector(s)}
function qq(s){return document.querySelectorAll(s)}
function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}

function toast(m,t){
  const e=q('#toast');
  e.textContent=m;e.className='toast '+(t||'ok')+' show';
  clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('show'),2200);
}

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}

async function loadDB(){
  try{
    const r=await fetch(API,{headers:{Authorization:'token '+GIT_TOKEN}});
    const d=await r.json();
    if(!d.content)return;
    const txt=decodeURIComponent(escape(atob(d.content)));
    cache=JSON.parse(txt);
    if(!cache.bio)cache.bio={short:'Певица, артистка',long:'',concerts:0};
    if(!cache.photos)cache.photos=[];
    if(!cache.cards)cache.cards=[];
  }catch(e){cache={bio:{short:'Певица, артистка',long:'',concerts:0},photos:[],cards:[]}}
}

async function saveDB(){
  try{
    const r=await fetch(API,{headers:{Authorization:'token '+GIT_TOKEN}});
    const d=await r.json();
    const enc=btoa(unescape(encodeURIComponent(JSON.stringify(cache))));
    await fetch(API,{
      method:'PUT',
      headers:{Authorization:'token '+GIT_TOKEN,'Content-Type':'application/json'},
      body:JSON.stringify({message:'update',content:enc,sha:d.sha})
    });
  }catch(e){console.error(e)}
}

function loadImage(file,maxW){
  return new Promise(res=>{
    const r=new FileReader();
    r.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        const c=document.createElement('canvas');
        let w=img.width,h=img.height;
        if(w>maxW){h*=maxW/w;w=maxW}
        c.width=w;c.height=h;
        const ctx=c.getContext('2d');
        ctx.drawImage(img,0,0,w,h);
        res(c.toDataURL('image/jpeg',0.7));
      };
      img.src=r.result;
    };
    r.readAsDataURL(file);
  });
}

document.addEventListener('DOMContentLoaded',async()=>{
  await loadDB();
  if(isAdmin)showAdmin(true);

  q('#adminForm').addEventListener('submit',e=>{
    e.preventDefault();
    if(q('#adminPass').value===APP_PASS){
      localStorage.setItem(ADMIN_KEY,'1');isAdmin=true;
      showAdmin(true);
      toast('Добро пожаловать!');
      renderAll();
    }else toast('Неверный пароль','err');
  });

  q('#adminLogout').addEventListener('click',()=>{
    localStorage.removeItem(ADMIN_KEY);isAdmin=false;
    showAdmin(false);
    toast('Вы вышли');
  });

  q('#photoForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const title=q('#photoTitle').value.trim()||'Без названия';
    const file=q('#photoInput').files[0];
    if(!file)return toast('Выберите фото','err');
    await loadDB();
    const data=await loadImage(file,800);
    cache.photos.push({id:uid(),title,data,uploadedAt:new Date().toISOString()});
    await saveDB();
    q('#photoForm').reset();
    toast('Фото добавлено!');
    renderAll();
  });

  q('#cardForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const name=q('#cardName').value.trim();
    const phone=q('#cardPhone').value.trim();
    const email=q('#cardEmail').value.trim();
    const social=q('#cardSocial').value.trim();
    const file=q('#cardPhotoInput').files[0];
    if(!name)return toast('Введите имя','err');
    await loadDB();
    let imgData='';
    if(file)imgData=await loadImage(file,300);
    cache.cards.push({id:uid(),name,phone,email,social,imgData});
    await saveDB();
    q('#cardForm').reset();
    toast('Визитка добавлена!');
    renderAll();
  });

  q('#bioForm').addEventListener('submit',async e=>{
    e.preventDefault();
    await loadDB();
    cache.bio.long=q('#bioLong').value.trim();
    cache.bio.concerts=parseInt(q('#bioConcerts').value)||0;
    await saveDB();
    toast('Сохранено!');
    renderAll();
  });

  q('#photoModal .modal-close').addEventListener('click',()=>q('#photoModal').style.display='none');
  q('#photoModal').addEventListener('click',e=>{if(e.target===q('#photoModal'))q('#photoModal').style.display='none'});

  qq('.tab').forEach(b=>b.addEventListener('click',()=>{
    qq('.tab,.tab-content').forEach(e=>e.classList.remove('active'));
    b.classList.add('active');
    document.getElementById('tab-'+b.dataset.tab).classList.add('active');
    if(b.dataset.tab==='admin'&&isAdmin)renderAdmin();
  }));

  renderAll();
});

function showAdmin(on){
  q('#adminLogin').style.display=on?'none':'block';
  q('#adminPanel').style.display=on?'block':'none';
}

function renderAll(){
  renderHome();
  renderGallery();
  renderCards();
  if(isAdmin)renderAdmin();
}

function renderHome(){
  const c=cache.cards[0];
  const hbg=q('.header-bg'),av=q('.avatar svg');
  if(c&&c.imgData){
    let img=hbg.querySelector('img.bg-img');
    if(!img){img=document.createElement('img');img.className='bg-img';hbg.prepend(img)}
    img.src=c.imgData;
    hbg.classList.add('has-img');
    if(av)av.style.display='none';
  }else{
    const img=hbg.querySelector('img.bg-img');
    if(img)img.remove();
    hbg.classList.remove('has-img');
    if(av)av.style.display='';
  }
  const sub=q('.subtitle');
  sub.textContent=c?esc(c.name):'певица · артистка';
  q('#statPhotos').textContent=cache.photos.length;
  q('#statCards').textContent=cache.cards.length;
  q('#statConcerts').textContent=cache.bio.concerts||'—';
  q('#contactInfo').innerHTML=c?
    '<div style="line-height:2">'+
    '<div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:6px">'+esc(c.name)+'</div>'+
    (c.phone?'<div>📞 '+esc(c.phone)+'</div>':'')+
    (c.email?'<div>✉️ <a href="mailto:'+esc(c.email)+'" style="color:#ffd700;text-decoration:none">'+esc(c.email)+'</a></div>':'')+
    (c.social?'<div>📱 '+esc(c.social)+'</div>':'')+
    '</div>'
    :'<p class="empty">Нет данных. Добавьте визитку в админке</p>';
  q('#aboutText').innerHTML=cache.bio.long?cache.bio.long.replace(/\n/g,'<br>'):'<span class="empty">Пока не добавлено</span>';
}

function renderGallery(){
  const c=q('#photoGrid');
  if(!cache.photos.length)return c.innerHTML='<p class="empty">Пока нет фото</p>';
  c.innerHTML=cache.photos.map(p=>'<div class="photo-item" data-id="'+p.id+'">'+
    '<img src="'+p.data+'" alt="'+esc(p.title)+'" loading="lazy">'+
    '<div class="photo-title">'+esc(p.title)+'</div></div>').join('');
  c.querySelectorAll('.photo-item').forEach(el=>el.addEventListener('click',function(){
    const p=cache.photos.find(x=>x.id===this.dataset.id);
    if(!p)return;
    q('#modalImg').src=p.data;
    q('#modalCaption').textContent=p.title;
    q('#photoModal').style.display='flex';
  }));
}

function renderCards(){
  const c=q('#cardsList');
  if(!cache.cards.length)return c.innerHTML='<p class="empty">Нет визиток</p>';
  c.innerHTML=cache.cards.map(crd=>'<div class="card-item">'+
    '<div class="card-avatar">'+(crd.imgData?'<img src="'+crd.imgData+'">':
    '<div class="noimg">'+(crd.name.charAt(0)||'?')+'</div>')+'</div>'+
    '<div class="card-body"><div class="name">'+esc(crd.name)+'</div>'+
    '<div class="info">'+
    (crd.phone?'📞 '+esc(crd.phone)+'<br>':'')+
    (crd.email?'✉️ <a href="mailto:'+esc(crd.email)+'">'+esc(crd.email)+'</a><br>':'')+
    (crd.social?'📱 '+esc(crd.social):'')+
    '</div></div>'+
    (isAdmin?'<button class="card-rm rm-card" data-id="'+crd.id+'">✕</button>':'')+
    '</div>').join('');
  if(isAdmin){
    qq('.rm-card').forEach(btn=>btn.addEventListener('click',async function(){
      if(!confirm('Удалить визитку?'))return;
      await loadDB();
      cache.cards=cache.cards.filter(c=>c.id!==this.dataset.id);
      await saveDB();
      renderAll();
      toast('Визитка удалена');
    }));
  }
}

function renderAdmin(){
  q('#bioLong').value=cache.bio.long||'';
  q('#bioConcerts').value=cache.bio.concerts||0;
}
