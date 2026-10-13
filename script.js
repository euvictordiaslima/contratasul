(() => {

  // Carrossel automático: pausa em foco, hover e aba inativa.
  const carousel = document.getElementById('materials-carousel');
  if (carousel) {
    const track = carousel.querySelector('.carousel-track');
    const slides = [...track.querySelectorAll('.portfolio-item')];
    const dots = document.getElementById('carousel-dots');
    const pause = document.getElementById('carousel-pause');
    let index = 0, stopped = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let hover = false, focus = false, startX = null;
    const show = (n) => {
      index = (n + slides.length) % slides.length;
      const label = document.getElementById("carousel-index"); if(label) label.textContent = `${String(index+1).padStart(2,"0")} / ${String(slides.length).padStart(2,"0")}`;
      const fill = document.getElementById("carousel-progress-fill"); if(fill) fill.style.transform = `translateX(${index*100}%)`;
      track.style.transform = `translateX(-${index * 100}%)`;
      slides.forEach((slide,i) => { slide.tabIndex = i === index ? 0 : -1; slide.setAttribute('aria-hidden', String(i !== index)); });
      [...dots.children].forEach((dot,i) => dot.setAttribute('aria-current', String(i === index)));
    };
    slides.forEach((_,i) => { const b=document.createElement('button'); b.type='button'; b.setAttribute('aria-label',`Mostrar material ${i+1}`); b.addEventListener('click',()=>show(i)); dots.appendChild(b); });
    document.getElementById('carousel-prev').addEventListener('click',()=>show(index-1));
    document.getElementById('carousel-next').addEventListener('click',()=>show(index+1));
    pause.addEventListener('click',()=>{ stopped=!stopped; pause.textContent=stopped?'Reproduzir ▶':'Pausar ❚❚'; pause.setAttribute('aria-label',stopped?'Reproduzir carrossel':'Pausar carrossel'); });
    if(stopped){pause.textContent='Reproduzir ▶';pause.setAttribute('aria-label','Reproduzir carrossel');}
    carousel.addEventListener('mouseenter',()=>hover=true); carousel.addEventListener('mouseleave',()=>hover=false);
    carousel.addEventListener('focusin',()=>focus=true); carousel.addEventListener('focusout',e=>{if(!carousel.contains(e.relatedTarget))focus=false;});
    carousel.addEventListener('touchstart',e=>{startX=e.changedTouches[0].screenX;},{passive:true});
    carousel.addEventListener('touchend',e=>{if(startX!==null){const delta=e.changedTouches[0].screenX-startX;if(Math.abs(delta)>45)show(index+(delta<0?1:-1));startX=null;}},{passive:true});
    window.setInterval(()=>{if(!stopped&&!hover&&!focus&&!document.hidden)show(index+1);},3000);
    show(0);
  }

  const steps = {
    empresa: [
      ['Entendemos sua necessidade','Você conta sobre a vaga, o perfil buscado e os desafios da equipe.'],
      ['Alinhamos o processo','Conversamos sobre os critérios de seleção e os próximos passos.'],
      ['Acompanhamos a conexão','O objetivo é aproximar sua empresa de profissionais alinhados à oportunidade.']
    ],
    profissional: [
      ['Conhecemos seu momento','Você compartilha seus objetivos e o tipo de oportunidade que procura.'],
      ['Exploramos seus pontos fortes','Currículo, carreira e comportamento podem fazer parte da conversa.'],
      ['Planejamos os próximos passos','Orientação prática para você se apresentar com mais clareza.']
    ]
  };
  const processGrid = document.getElementById('process-grid');
  if(processGrid){
    const renderSteps = type => {
      processGrid.replaceChildren(...steps[type].map(([title,desc],i)=>{
        const card=document.createElement('article');card.className='process-step';
        const number=document.createElement('span');number.className='step-number';number.textContent=`ETAPA 0${i+1}`;
        const heading=document.createElement('h3');heading.textContent=title;
        const detail=document.createElement('p');detail.textContent=desc;
        card.append(number,heading,detail);return card;
      }));
      document.querySelectorAll('.audience-btn').forEach(b=>{const active=b.dataset.audience===type;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});
      const action=document.getElementById('process-action');action.innerHTML=type==='empresa'?'Conversar sobre uma contratação <span>↗</span>':'Conversar sobre minha carreira <span>↗</span>';
    };
    document.querySelectorAll('.audience-btn').forEach(b=>b.addEventListener('click',()=>renderSteps(b.dataset.audience)));
    renderSteps('empresa');
  }
  const header=document.querySelector('.site-header');
  window.addEventListener('scroll',()=>header?.classList.toggle('scrolled',window.scrollY>15),{passive:true});

  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Abrir menu');
    }));
  }

  document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav) { nav.classList.remove('open'); menuToggle?.setAttribute('aria-expanded','false'); } });
  document.addEventListener('click', event => { if (nav?.classList.contains('open') && !event.target.closest('.nav-wrap')) { nav.classList.remove('open'); menuToggle?.setAttribute('aria-expanded','false'); } });
  const links = [...document.querySelectorAll('.main-nav a[href^="#"]')];
  const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if(entry.isIntersecting) { links.forEach(a => { const active = a.getAttribute('href') === '#' + entry.target.id; a.classList.toggle('active', active); if(active) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current'); }); } }); }, {rootMargin:'-25% 0px -65% 0px'});
  document.querySelectorAll('main section[id]').forEach(section => observer.observe(section));
  document.querySelectorAll('[data-profile]').forEach(a => a.addEventListener('click', () => { document.getElementById('profile').value = a.dataset.profile; }));
  document.getElementById('copy-email')?.addEventListener('click', async () => { const status=document.getElementById('form-feedback'); try { await navigator.clipboard.writeText('contratasulselecao@gmail.com'); status.textContent='E-mail copiado.'; } catch { status.textContent='E-mail: contratasulselecao@gmail.com'; } });
  document.getElementById('contact-form')?.addEventListener('reset', () => { document.getElementById('form-feedback').textContent=''; });
  document.getElementById('year').textContent = new Date().getFullYear();

  document.querySelectorAll('[data-subject]').forEach(link => {
    link.addEventListener('click', () => {
      const subject = document.getElementById('subject');
      if (subject) subject.value = link.dataset.subject;
    });
  });

  const questions = [
    { title: 'Em um projeto novo, você costuma...', answers: [
      ['D', 'Assumir a frente e definir metas claras.'], ['I', 'Animar o grupo e compartilhar ideias.'], ['S', 'Ouvir as pessoas e buscar colaboração.'], ['C', 'Analisar os detalhes antes de começar.']
    ]},
    { title: 'Quando surge um problema inesperado, você...', answers: [
      ['D', 'Decide rapidamente e parte para a solução.'], ['I', 'Conversa com as pessoas e explora alternativas.'], ['S', 'Mantém a calma e ajuda o grupo a se organizar.'], ['C', 'Investiga as causas e verifica os dados.']
    ]},
    { title: 'Em uma equipe, você geralmente é quem...', answers: [
      ['D', 'Desafia o grupo a chegar ao objetivo.'], ['I', 'Conecta pessoas e estimula a participação.'], ['S', 'Oferece apoio e mantém a cooperação.'], ['C', 'Cuida da qualidade e dos procedimentos.']
    ]},
    { title: 'O ambiente de trabalho ideal para você tem...', answers: [
      ['D', 'Autonomia, desafios e decisões ágeis.'], ['I', 'Troca de ideias, interação e dinamismo.'], ['S', 'Previsibilidade, confiança e parceria.'], ['C', 'Critérios claros, organização e precisão.']
    ]},
    { title: 'Ao receber uma tarefa importante, você prefere...', answers: [
      ['D', 'Ter liberdade para atingir o resultado.'], ['I', 'Trocar ideias e construir uma solução criativa.'], ['S', 'Entender como contribuir com a equipe.'], ['C', 'Ter informações, etapas e critérios definidos.']
    ]},
    { title: 'O que mais costuma motivar você?', answers: [
      ['D', 'Superar desafios e alcançar resultados.'], ['I', 'Inspirar pessoas e ser ouvido.'], ['S', 'Contribuir e manter relações positivas.'], ['C', 'Fazer um trabalho bem feito e consistente.']
    ]}
  ];
  const profiles = {
    D: {name:'Dominância', subtitle:'Ação e foco em resultados', color:'#ed6a68', desc:'Você pode se identificar com iniciativa, objetividade e gosto por desafios. Em equipe, tende a valorizar autonomia e progresso. Como reflexão, vale reservar espaço para ouvir outras perspectivas e avaliar impactos antes de decidir.'},
    I: {name:'Influência', subtitle:'Comunicação e entusiasmo', color:'#e8b54e', desc:'Você pode se identificar com comunicação, energia e facilidade para mobilizar pessoas. Em equipe, tende a valorizar colaboração e troca de ideias. Como reflexão, vale transformar entusiasmo em prioridades e acompanhar os detalhes até a conclusão.'},
    S: {name:'Estabilidade', subtitle:'Cooperação e constância', color:'#4bb89a', desc:'Você pode se identificar com escuta, paciência e busca por harmonia. Em equipe, tende a valorizar confiança e consistência. Como reflexão, vale expressar suas próprias necessidades e sentir-se à vontade para lidar com mudanças.'},
    C: {name:'Conformidade', subtitle:'Análise e qualidade', color:'#5a9dd3', desc:'Você pode se identificar com análise, organização e atenção à qualidade. Em equipe, tende a valorizar critérios claros e informação confiável. Como reflexão, vale equilibrar a busca por precisão com flexibilidade e ação quando nem tudo está definido.'}
  };
  let current = 0;
  let selected = null;
  const scores = {D:0,I:0,S:0,C:0};
  const history = [];
  const previous = document.getElementById('previous-question');
  const title = document.getElementById('question-title');
  const answers = document.getElementById('answers');
  const next = document.getElementById('next-question');
  const count = document.getElementById('question-count');
  const percent = document.getElementById('progress-percent');
  const bar = document.getElementById('progress-bar');
  const quizContent = document.getElementById('quiz-content');
  const result = document.getElementById('quiz-result');

  function renderQuestion() {
    selected = history[current] || null;
    previous.hidden = current === 0;
    const q = questions[current];
    title.textContent = q.title;
    answers.innerHTML = '';
    q.answers.forEach(([key, text], index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'answer-option';
      button.innerHTML = `<span class="answer-letter">${key}</span><span>${text}</span>`;
      if (selected === key) button.classList.add('selected');
      button.addEventListener('click', () => {
        selected = key;
        answers.querySelectorAll('.answer-option').forEach(el => el.classList.remove('selected'));
        button.classList.add('selected');
        next.disabled = false;
      });
      answers.appendChild(button);
    });
    count.textContent = `PERGUNTA ${current + 1} DE ${questions.length}`;
    const p = Math.round(((current + 1) / questions.length) * 100);
    percent.textContent = `${p}%`;
    bar.style.width = `${p}%`;
    next.disabled = !selected;
    next.innerHTML = current === questions.length - 1 ? 'Ver resultado <span>↗</span>' : 'Próxima <span>→</span>';
  }
  function renderResult() {
    const max = Math.max(...Object.values(scores));
    const top = Object.keys(scores).filter(key => scores[key] === max);
    const key = top[0];
    const profile = profiles[key];
    quizContent.hidden = true;
    result.hidden = false;
    result.innerHTML = `<div class="result-profile"><span style="color:${profile.color}">●</span> SEU PERFIL EM DESTAQUE</div>
      <h3>${profile.name}</h3><p><strong>${profile.subtitle}</strong></p><p>${profile.desc}</p>
      <p class="result-note">Este resultado é apenas um exercício educativo de reflexão, baseado nas escolhas desta página. Não é avaliação psicológica, não determina sua personalidade e não deve ser usado isoladamente em decisões de contratação.</p>
      <button type="button" class="btn btn-gold" id="restart-quiz">Refazer exercício <span>↻</span></button>
      <a class="text-link" href="#contato" id="quiz-contact">Conversar sobre orientação profissional <span>↗</span></a>`;
    document.getElementById('restart-quiz').addEventListener('click', () => {
      current = 0;
      Object.keys(scores).forEach(k => scores[k] = 0);
      history.length = 0;
      result.hidden = true;
      quizContent.hidden = false;
      renderQuestion();
    });
    document.getElementById('quiz-contact').addEventListener('click', () => {
      const subject = document.getElementById('subject');
      if (subject) subject.value = 'Quero conversar sobre orientação profissional e perfil comportamental';
    });
  }
  previous.addEventListener('click', () => { if(current > 0) { current--; renderQuestion(); } });
  next.addEventListener('click', () => {
    if (!selected) return;
    history[current] = selected;
    Object.keys(scores).forEach(k => scores[k] = 0);
    history.forEach(k => { if(k) scores[k]++; });
    if (current < questions.length - 1) {
      current++;
      renderQuestion();
    } else {
      renderResult();
    }
  });
  renderQuestion();

  const form = document.getElementById('contact-form');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const profile = String(data.get('profile') || '').trim();
    const subject = String(data.get('subject') || '').trim() || 'Contato pelo site';
    const message = String(data.get('message') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    if (!name || !email || !profile || !message) {
      document.getElementById('form-feedback').textContent = 'Preencha os campos obrigatórios para continuar.';
      return;
    }
    const text = `Olá, Contrata Sul!\n\n*Nome:* ${name}\n*E-mail:* ${email}\n*Telefone:* ${phone || 'Não informado'}\n*Perfil:* ${profile}\n*Assunto:* ${subject}\n*Mensagem:* ${message}`;
    const url = `https://wa.me/5549988354130?text=${encodeURIComponent(text)}`;
    document.getElementById('form-feedback').textContent = 'Abrindo o WhatsApp para você revisar e enviar a mensagem...';
    window.open(url, '_blank', 'noopener,noreferrer');
  });
})();

// Barras animadas do cartão empresarial: visualização puramente ilustrativa.
(() => {
  const chart = document.querySelector('.decorative-bars');
  if (!chart) return;
  const bars = [...chart.querySelectorAll('i')];
  const initial = [27,50,40,76,60,92,68];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  bars.forEach((bar, i) => bar.style.setProperty('--h', initial[i] + '%'));
  let timer;
  const update = () => {
    if (document.hidden || reduced.matches) return;
    bars.forEach((bar, i) => {
      const next = Math.max(18, Math.min(96, initial[i] + (Math.random() - .5) * 65));
      bar.style.setProperty('--h', next.toFixed(0) + '%');
    });
  };
  const stop = () => { if (timer) clearInterval(timer); timer = null; };
  const sync = () => {
    stop();
    if (!document.hidden && !reduced.matches) {
      update();
      timer = setInterval(update, 1600);
    }
  };
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  sync();
})();

// Tema claro/escuro persistido no navegador.
(()=>{const b=document.getElementById('theme-toggle');let saved=null;try{saved=localStorage.getItem('cs-theme')}catch{}function set(d){document.body.classList.toggle('dark-mode',d);b.textContent=d?'☀':'☾';b.setAttribute('aria-label',d?'Ativar modo claro':'Ativar modo escuro');b.setAttribute('title',d?'Ativar modo claro':'Ativar modo escuro');b.setAttribute('aria-pressed',String(d))}set(saved?saved==='dark':matchMedia('(prefers-color-scheme:dark)').matches);b.addEventListener('click',()=>{const d=!document.body.classList.contains('dark-mode');set(d);try{localStorage.setItem('cs-theme',d?'dark':'light')}catch{}})})();
// Segundo carrossel, com controle manual, pausa e suporte a toque.
(()=>{const t=document.getElementById('show-track'),v=document.getElementById('show-window'),dots=document.getElementById('show-dots'),p=document.getElementById('show-pause');if(!t)return;let n=0,timer=null,paused=false,x=null;const count=t.children.length,reduced=matchMedia('(prefers-reduced-motion:reduce)');for(let i=0;i<count;i++){const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Ir ao destaque '+(i+1));b.addEventListener('click',()=>{go(i);sync()});dots.append(b)}function go(i){n=(i+count)%count;t.style.transform=`translateX(-${n*100}%)`;[...dots.children].forEach((b,j)=>b.setAttribute('aria-current',String(j===n)))}function stop(){clearInterval(timer);timer=null}function sync(){stop();if(!paused&&!document.hidden&&!reduced.matches)timer=setInterval(()=>go(n+1),3000)}document.getElementById('show-prev').addEventListener('click',()=>{go(n-1);sync()});document.getElementById('show-next').addEventListener('click',()=>{go(n+1);sync()});p.addEventListener('click',()=>{paused=!paused;p.textContent=paused?'Reproduzir ▶':'Pausar ❚❚';p.setAttribute('aria-pressed',String(paused));sync()});v.addEventListener('mouseenter',stop);v.addEventListener('mouseleave',sync);v.addEventListener('focusin',stop);v.addEventListener('focusout',e=>{if(!v.contains(e.relatedTarget))sync()});v.addEventListener('touchstart',e=>x=e.touches[0].clientX,{passive:true});v.addEventListener('touchend',e=>{if(x===null)return;let d=e.changedTouches[0].clientX-x;if(Math.abs(d)>45){go(n+(d<0?1:-1));sync()}x=null},{passive:true});document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);go(0);sync()})();

// Pesquisa da página inicial reaproveita os filtros de vagas já existentes.
(() => {
 const form=document.getElementById('quick-jobs-form');
 if(!form)return;
 form.addEventListener('submit',event=>{
  event.preventDefault();
  const role=document.getElementById('quick-role').value.trim();
  const city=document.getElementById('quick-city').value.trim();
  const mainSearch=document.getElementById('job-search');
  const mainCity=document.getElementById('job-city');
  if(mainSearch){mainSearch.value=role;mainSearch.dispatchEvent(new Event('input',{bubbles:true}));}
  if(mainCity){mainCity.value=city;mainCity.dispatchEvent(new Event('input',{bubbles:true}));mainCity.dispatchEvent(new Event('change',{bubbles:true}));}
  document.getElementById('vagas')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 });
})();
