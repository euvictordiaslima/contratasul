import { getApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, getDocsFromServer, addDoc, updateDoc, setDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const auth = getAuth(getApp());
const db = getFirestore(getApp());
const $ = id => document.getElementById(id);
const state = { candidates: [], companies: [], interviews: [], audit: [], jobs: [], settings: null };
const stages = ['Recebido', 'Em análise', 'Entrevista', 'Aprovado', 'Encerrado'];
const companyFields = ['name', 'cnpj', 'tradeName', 'status', 'openingDate', 'cnae', 'legalNature', 'size', 'email', 'phone', 'website', 'address', 'district', 'zip', 'city', 'state', 'notes'];
let subscriptions = [], authorized = false, candidateActiveIndex = -1, candidateResults = [];
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
const digits = value => String(value ?? '').replace(/\D/g, '');
const node = (tag, value = '', className = '') => { const el = document.createElement(tag); el.textContent = value; el.className = className; return el; };
const msg = message => { $('status').textContent = message; };
const card = (title, subtitle) => { const el = node('article', '', 'suite-item'); el.append(node('h3', title || 'Sem nome'), node('p', subtitle || '—')); return el; };
const dateFormat = value => { try { const d = value?.toDate?.() || new Date(value); return Number.isFinite(d.getTime()) ? d.toLocaleString('pt-BR') : '—'; } catch { return '—'; } };
const addButton = (label, fn, className = 'secondary') => { const el = node('button', label, className); el.type = 'button'; el.addEventListener('click', fn); return el; };
const clamp = (value, len) => String(value ?? '').trim().slice(0, len);
const friendlyError = error => error?.code === 'permission-denied' ? 'Operação bloqueada pelas regras do Firestore. Verifique as regras atualizadas.' : (error?.code || error?.message || 'Erro desconhecido');

// Dados ficam apenas no Firestore; nenhuma informação pessoal é divulgada no site público.
function listen(name, handler) {
  const key = { vagas: 'jobs', candidaturas: 'candidates', empresas: 'companies', entrevistas: 'interviews', historico: 'audit' }[name];
  subscriptions.push(onSnapshot(collection(db, name), snapshot => {
    state[key] = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    handler();
  }, error => msg(`Não foi possível carregar ${name}: ${friendlyError(error)}`)));
}
async function log(action, detail) {
  try { await addDoc(collection(db, 'historico'), { action: clamp(action, 100), detail: clamp(detail, 180), actor: auth.currentUser.uid, at: serverTimestamp() }); }
  catch (error) { console.warn('Histórico indisponível:', error.code); }
}
onAuthStateChanged(auth, async user => {
  subscriptions.forEach(unsubscribe => unsubscribe()); subscriptions = []; authorized = false;
  if (!user) { clearCandidatePicker(); return; }
  try {
    const marker = await getDoc(doc(db, 'admins', user.uid));
    if (!marker.exists() || marker.data().active !== true) return;
    authorized = true;
    listen('vagas', () => { renderDashboard(); renderCompanies(); });
    listen('candidaturas', () => { renderCandidates(); renderDashboard(); renderInterviews(); });
    listen('empresas', () => { renderCompanies(); renderDashboard(); });
    listen('entrevistas', () => { renderInterviews(); renderDashboard(); });
    listen('historico', () => { renderAudit(); renderDashboard(); });
    const content = await getDoc(doc(db, 'configuracoes', 'site'));
    if (content.exists()) { state.settings = content.data(); fillContent(); }
  } catch (error) { msg(`Erro ao inicializar os módulos administrativos: ${friendlyError(error)}`); }
});

// Indicadores e funil. Nunca apresenta estatísticas fictícias.
function renderDashboard() {
  const metrics = $('suite-metrics'); metrics.replaceChildren();
  const entries = [
    ['Vagas', state.jobs.length], ['Publicadas', state.jobs.filter(j => j.published).length],
    ['Candidaturas', state.candidates.length], ['Empresas', state.companies.length], ['Entrevistas', state.interviews.length]
  ];
  for (const [label, count] of entries) { const el = node('div', '', 'suite-metric'); el.append(node('span', label), node('strong', String(count))); metrics.append(el); }
  const funnel = $('suite-funnel'); funnel.replaceChildren();
  for (const stage of stages) {
    const count = state.candidates.filter(c => c.stage === stage).length;
    const row = node('div', '', 'suite-funnel-row'), bar = node('div', '', 'suite-funnel-bar');
    bar.style.width = state.candidates.length ? `${count / state.candidates.length * 100}%` : '0%';
    row.append(node('span', stage), bar, node('strong', String(count))); funnel.append(row);
  }
  const recent = $('suite-recent'); recent.replaceChildren();
  const recentTerm=normalize($('overview-activity-search')?.value||'');
  const recentRows=[...state.audit].filter(a=>normalize([a.action,a.detail,a.email].join(' ')).includes(recentTerm)).sort((a,b)=>(b.at?.seconds||0)-(a.at?.seconds||0));
  for (const a of recentRows.slice(0, 30)) recent.append(card(a.action, `${a.detail} · ${dateFormat(a.at)}`));
  if (!recentRows.length) recent.append(node('p', recentTerm?'Nenhuma atividade encontrada.':'Nenhuma atividade registrada.'));
  if (recentRows.length>30) recent.append(node('p','Exibindo 30 resultados. Refine a pesquisa.','filter-count'));
}

function renderCandidates() {
  const root = $('suite-kanban'), term = normalize($('candidate-search').value);
  const order = $('candidate-sort')?.value || 'new',stageFilter=$('candidate-stage-filter')?.value||'all'; root.replaceChildren();
  let total = 0;
  for (const stage of stages) {
    if(stageFilter!=='all'&&stage!==stageFilter)continue;
    const col = node('section', '', 'suite-stage');
    const filtered = state.candidates.filter(c => c.stage === stage && normalize([c.name, c.email, c.jobTitle, c.phone].join(' ')).includes(term));
    filtered.sort((a, b) => order === 'name' ? (a.name || '').localeCompare(b.name || '', 'pt-BR') : (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    total += filtered.length;
    col.append(node('h3', `${stage} · ${filtered.length}`));
    for (const c of filtered.slice(0, 45)) {
      const item = card(c.name, c.jobTitle || 'Vaga não informada');
      const phone=String(c.phone||'').replace(/\D/g,''),contactHint=c.contactPreference||'Não informada';
      item.append(node('small', `${c.email||'Sem e-mail'} · ${c.phone||'Sem telefone'} · Contato: ${contactHint}`));
      if(phone.length>=10&&phone.length<=13){const links=node('div','','rh-contact-actions');const tel=node('a','Ligar','suite-link');tel.href='tel:+'+(phone.length<=11?'55':'')+phone;const wa=node('a','WhatsApp','suite-link');wa.href='https://wa.me/'+(phone.length<=11?'55':'')+phone;wa.target='_blank';wa.rel='noopener noreferrer';links.append(tel,wa);item.append(links);}
      const stageSelect = node('select'); stageSelect.setAttribute('aria-label', `Etapa de ${c.name}`);
      for (const s of stages) stageSelect.add(new Option(s, s)); stageSelect.value = c.stage;
      stageSelect.addEventListener('change', async () => {
        stageSelect.disabled = true;
        try { await updateDoc(doc(db, 'candidaturas', c.id), { stage: stageSelect.value, updatedAt: serverTimestamp() }); await log('Etapa alterada', `${c.name} → ${stageSelect.value}`); }
        catch (error) { msg('Não foi possível alterar a etapa: ' + friendlyError(error)); stageSelect.value = c.stage; }
        finally { stageSelect.disabled = false; }
      });
      item.append(stageSelect);
      if (c.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email)) { const contact = node('a', 'Enviar e-mail', 'suite-link'); contact.href = `mailto:${encodeURIComponent(c.email)}`; item.append(contact); }
      col.append(item);
    }
    if (filtered.length > 45) col.append(node('p', `Exibindo 45 de ${filtered.length}. Use a pesquisa para encontrar outros candidatos.`, 'filter-count'));
    root.append(col);
  }
  $('candidate-total').textContent = `${total} candidato(s) encontrado(s)`;
}
$('candidate-search').addEventListener('input', renderCandidates);
$('candidate-sort').addEventListener('change', renderCandidates);
$('candidate-stage-filter')?.addEventListener('change',renderCandidates);

// CNPJ é opcional. Consulta sob demanda; a API é de terceiros e pode falhar ou limitar requisições.
function validCnpj(raw) {
  const value = digits(raw);
  if (!value) return true;
  if (!/^\d{14}$/.test(value) || /^(\d)\1+$/.test(value)) return false;
  const calculate = size => { let sum = 0, weight = size - 7; for (let i = 0; i < size; i++) { sum += Number(value[i]) * weight; weight = weight === 2 ? 9 : weight - 1; } const remainder = sum % 11; return remainder < 2 ? 0 : 11 - remainder; };
  return calculate(12) === Number(value[12]) && calculate(13) === Number(value[13]);
}
function maskCnpj(raw) { const value = digits(raw).slice(0, 14); return value.length === 14 ? value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : value; }
function clearCompany() { $('company-form').reset(); $('company-id').value = ''; $('cnpj-consult-status').textContent = 'Consulta pela BrasilAPI. Preenchimento manual disponível.'; $('company-save').textContent = 'Salvar empresa'; }
$('company-clear').addEventListener('click', clearCompany);
$('company-cnpj').addEventListener('blur', event => { if (digits(event.target.value).length === 14) event.target.value = maskCnpj(event.target.value); });
$('company-lookup').addEventListener('click', async () => {
  if (!authorized) return;
  const cnpj = digits($('company-cnpj').value), label = $('cnpj-consult-status'), button = $('company-lookup');
  if (!validCnpj(cnpj) || !cnpj) { label.textContent = 'Informe um CNPJ numérico válido com 14 dígitos.'; $('company-cnpj').focus(); return; }
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 9000);
  button.disabled = true; button.textContent = 'Consultando…'; label.textContent = 'Consultando dados públicos da empresa…';
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (response.status === 404) throw Error('CNPJ não encontrado. Você pode preencher os dados manualmente.');
    if (response.status === 429) throw Error('Muitas consultas no serviço público. Tente mais tarde ou preencha manualmente.');
    if (!response.ok) throw Error('Serviço indisponível. Os campos continuam disponíveis para preenchimento manual.');
    const data = await response.json();
    if (digits(data.cnpj) !== cnpj) throw Error('O serviço devolveu um CNPJ diferente. Nenhum campo foi preenchido.');
    const addr = [data.logradouro, data.numero, data.complemento].filter(Boolean).join(', ');
    const fields = {
      name: data.razao_social, tradeName: data.nome_fantasia, status: data.descricao_situacao_cadastral,
      openingDate: /^\d{4}-\d{2}-\d{2}$/.test(data.data_inicio_atividade || '') ? data.data_inicio_atividade : '',
      cnae: [data.cnae_fiscal, data.cnae_fiscal_descricao].filter(Boolean).join(' — '),
      legalNature: data.natureza_juridica, size: data.porte, email: data.email, phone: data.ddd_telefone_1,
      address: addr, district: data.bairro, zip: data.cep, city: data.municipio, state: data.uf
    };
    const populated = Object.keys(fields).some(key => $('company-' + key).value.trim());
    if (populated && !confirm('A consulta encontrou dados públicos. Substituir os campos já preenchidos?')) { label.textContent = 'Consulta concluída sem alterações. Seus dados foram preservados.'; return; }
    for (const [field, value] of Object.entries(fields)) {
      if (value != null && String(value).trim()) $('company-' + field).value = clamp(value, $('company-' + field).maxLength > 0 ? $('company-' + field).maxLength : 180);
    }
    $('company-cnpj').value = maskCnpj(cnpj);
    label.textContent = 'Dados preenchidos pela BrasilAPI. Confira as informações antes de salvar; podem estar desatualizadas.';
  } catch (error) {
    label.textContent = error.name === 'AbortError' ? 'Consulta demorou demais. Preencha manualmente ou tente novamente.' : (error.message === 'Failed to fetch' ? 'Não foi possível conectar à consulta de CNPJ. Preencha manualmente.' : error.message);
  } finally { clearTimeout(timeout); button.disabled = false; button.textContent = 'Consultar CNPJ'; }
});
const companyForm = $('company-form');
companyForm.addEventListener('submit', async event => {
  event.preventDefault(); if (!authorized) return;
  const data = {};
  for (const field of companyFields) data[field] = $('company-' + field).value.trim();
  if (!validCnpj(data.cnpj)) { msg('CNPJ inválido. Corrija ou deixe em branco.'); $('company-cnpj').focus(); return; }
  data.cnpj = digits(data.cnpj);
  if (data.zip) data.zip = digits(data.zip);
  if (data.state) data.state = data.state.toUpperCase();
  const id = $('company-id').value;
  if (data.cnpj && state.companies.some(company => company.id !== id && digits(company.cnpj) === data.cnpj)) {
    msg('Já existe uma empresa cadastrada com esse CNPJ. Abra o cadastro existente para editar.');
    return;
  }
  const button = $('company-save'); button.disabled = true;
  try {
    if (id) await updateDoc(doc(db, 'empresas', id), { ...data, updatedAt: serverTimestamp() });
    else await addDoc(collection(db, 'empresas'), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    clearCompany(); msg(id ? 'Empresa atualizada.' : 'Empresa cadastrada.'); await log(id ? 'Empresa atualizada' : 'Empresa cadastrada', data.name);
  } catch (error) { msg('Não foi possível salvar a empresa: ' + friendlyError(error)); }
  finally { button.disabled = false; }
});
function renderCompanies() {
  const list = $('companies-list'), term = normalize($('companies-search').value);
  const matches = state.companies.filter(c => normalize([c.name, c.tradeName, c.cnpj, c.city, c.cnae, c.email, c.state, c.phone].join(' ')).includes(term))
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR'));
  $('companies-count').textContent = `${matches.length} de ${state.companies.length} empresa(s)`;
  list.replaceChildren();
  for (const company of matches.slice(0, 100)) {
    const item = card(company.tradeName || company.name, [company.name && company.tradeName ? company.name : '', company.city, company.state].filter(Boolean).join(' · '));
    const meta = [company.cnpj && maskCnpj(company.cnpj), company.status, company.phone].filter(Boolean).join(' · ');
    if (meta) item.append(node('p', meta, 'item-meta'));
    item.append(addButton('Editar cadastro', () => {
      for (const field of companyFields) $('company-' + field).value = company[field] || '';
      $('company-cnpj').value = maskCnpj(company.cnpj || '');
      $('company-id').value = company.id; $('company-save').textContent = 'Salvar alterações';
      companyForm.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      $('company-name').focus({ preventScroll: true });
    }));
    item.append(addButton('Abrir central da empresa →', () => {
      const crmButton=document.getElementById('nav-tab-crm');crmButton?.click();
      const picker=document.getElementById('crm-company');if(picker){picker.value=company.id;picker.dispatchEvent(new Event('change',{bubbles:true}));}
      document.getElementById('crm-title')?.scrollIntoView({behavior:'smooth',block:'start'});
    }));
    list.append(item);
  }
  if (!matches.length) list.append(node('p', term ? 'Nenhuma empresa encontrada para essa pesquisa.' : 'Nenhuma empresa cadastrada.', 'empty-state'));
  if (matches.length > 100) list.append(node('p', 'Exibindo as primeiras 100 empresas. Refine a busca para encontrar outras.', 'filter-count'));
  const datalist = $('job-company-options'); if (datalist) {
    datalist.replaceChildren(); for (const company of state.companies) { const option = document.createElement('option'); option.value = company.name; datalist.append(option); }
  }
}
$('companies-search').addEventListener('input', renderCompanies);

// Seletor pesquisável: 20 sugestões, teclado, nomes duplicados distinguidos por e-mail/vaga.
const picker = $('candidate-picker'), search = $('interview-candidate-search'), results = $('interview-candidate-results'), chosenId = $('interview-candidate');
function clearCandidatePicker() { search.value = ''; chosenId.value = ''; results.replaceChildren(); results.hidden = true; search.setAttribute('aria-expanded', 'false'); search.removeAttribute('aria-activedescendant'); candidateResults = []; candidateActiveIndex = -1; }
function setSelectedCandidate(c) {
  chosenId.value = c.id; search.value = `${c.name || 'Sem nome'} — ${c.jobTitle || c.email || 'Sem vaga'}`;
  results.hidden = true; search.setAttribute('aria-expanded', 'false'); search.removeAttribute('aria-activedescendant'); candidateActiveIndex = -1;
}
function updateActiveCandidate(index) {
  candidateActiveIndex = Math.max(0, Math.min(index, candidateResults.length - 1));
  [...results.children].forEach((el, n) => { el.classList.toggle('is-active', n === candidateActiveIndex); el.setAttribute('aria-selected', String(n === candidateActiveIndex)); });
  search.setAttribute('aria-activedescendant', candidateResults.length ? `candidate-choice-${candidateActiveIndex}` : '');
  results.children[candidateActiveIndex]?.scrollIntoView({ block: 'nearest' });
}
function showCandidates() {
  const term = normalize(search.value);
  if (!authorized) { results.hidden = true; return; }
  candidateResults = state.candidates.filter(c => normalize([c.name, c.email, c.jobTitle, c.phone].join(' ')).includes(term))
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR')).slice(0, 20);
  results.replaceChildren(); candidateActiveIndex = -1;
  if (!candidateResults.length) { results.append(node('p', 'Nenhum candidato encontrado.', 'empty-state')); }
  else candidateResults.forEach((c, index) => {
    const option = node('button', '', 'candidate-option'); option.type = 'button'; option.id = `candidate-choice-${index}`; option.setAttribute('role', 'option'); option.setAttribute('aria-selected', 'false');
    option.append(node('strong', c.name || 'Sem nome'), node('small', [c.jobTitle, c.email].filter(Boolean).join(' · ')));
    option.addEventListener('mousedown', event => event.preventDefault());
    option.addEventListener('click', () => setSelectedCandidate(c));
    results.append(option);
  });
  results.hidden = false; search.setAttribute('aria-expanded', 'true');
}
search.addEventListener('input', () => { chosenId.value = ''; showCandidates(); });
search.addEventListener('focus', showCandidates);
search.addEventListener('keydown', event => {
  if (event.key === 'Escape') { results.hidden = true; search.setAttribute('aria-expanded', 'false'); return; }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault(); if (results.hidden) showCandidates();
    if (!candidateResults.length) return;
    updateActiveCandidate(candidateActiveIndex < 0 ? 0 : (candidateActiveIndex + (event.key === 'ArrowDown' ? 1 : -1) + candidateResults.length) % candidateResults.length);
  }
  if (event.key === 'Enter' && !results.hidden && candidateResults.length) { event.preventDefault(); setSelectedCandidate(candidateResults[Math.max(candidateActiveIndex, 0)]); }
});
document.addEventListener('pointerdown', event => { if (!picker.contains(event.target)) { results.hidden = true; search.setAttribute('aria-expanded', 'false'); } });

const interviewForm = $('interview-form');
function clearInterview() { interviewForm.reset(); $('interview-id').value = ''; clearCandidatePicker(); $('interview-save').textContent = 'Agendar entrevista'; }
$('interview-clear').addEventListener('click', clearInterview);
interviewForm.addEventListener('submit', async event => {
  event.preventDefault(); if (!authorized) return;
  const candidate = state.candidates.find(c => c.id === chosenId.value);
  if (!candidate) { msg('Selecione um candidato nos resultados da pesquisa.'); search.focus(); showCandidates(); return; }
  const date = new Date($('interview-when').value);
  if (!Number.isFinite(date.getTime())) { msg('Informe uma data e horário válidos.'); return; }
  const data = {
    candidateId: candidate.id, candidateName: candidate.name || '', when: date.toISOString(),
    location: $('interview-location').value.trim(), notes: $('interview-notes').value.trim(),
    duration: $('interview-duration').value, modality: $('interview-modality').value,
    interviewer: $('interview-interviewer').value.trim()
  };
  const id = $('interview-id').value;
  const conflict = state.interviews.find(existing => existing.id !== id && existing.candidateId === candidate.id && existing.status !== 'Cancelada' && Math.abs(Date.parse(existing.when) - date.getTime()) < 30*60*1000);
  if (conflict && !confirm('Já existe uma entrevista próxima deste horário para este candidato. Deseja continuar mesmo assim?')) return;
  const button = $('interview-save'); button.disabled = true;
  try {
    if (id) await updateDoc(doc(db, 'entrevistas', id), data);
    else await addDoc(collection(db, 'entrevistas'), { ...data, status: 'Agendada', createdAt: serverTimestamp() });
    await log(id ? 'Entrevista atualizada' : 'Entrevista agendada', candidate.name);
    clearInterview(); msg(id ? 'Entrevista atualizada com sucesso.' : 'Entrevista agendada.');
  } catch (error) { msg('Não foi possível salvar a entrevista: ' + friendlyError(error)); }
  finally { button.disabled = false; }
});
async function updateInterviewStatus(interview, status, button) {
  if (!authorized) return;
  button.disabled = true;
  try { await updateDoc(doc(db, 'entrevistas', interview.id), { status }); await log('Situação da entrevista', `${interview.candidateName} → ${status}`); msg('Situação atualizada.'); }
  catch (error) { msg('Não foi possível alterar a entrevista: ' + friendlyError(error)); }
  finally { button.disabled = false; }
}
function renderInterviews() {
  const term = normalize($('interviews-search').value), status = $('interviews-status').value;
  const filtered = state.interviews.filter(i => (status === 'all' || status === i.status) && normalize([i.candidateName, i.interviewer, i.location, i.when, i.modality].join(' ')).includes(term))
    .sort((a, b) => String(a.when || '').localeCompare(String(b.when || '')));
  $('interviews-count').textContent = `${filtered.length} de ${state.interviews.length} entrevista(s)`;
  const root = $('interviews-list'); root.replaceChildren();
  for (const i of filtered.slice(0, 120)) {
    const info = [dateFormat(i.when), i.location, i.modality, i.duration && `${i.duration} min`].filter(Boolean).join(' · ');
    const item = card(i.candidateName, info); item.append(node('span', i.status || 'Agendada', `interview-badge status-${normalize(i.status || 'Agendada').replace(/\s/g, '-')}`));
    if (i.interviewer) item.append(node('p', `Responsável: ${i.interviewer}`, 'item-meta'));
    if (i.notes) item.append(node('p', i.notes, 'item-meta'));
    const actions = node('div', '', 'actions');
    actions.append(addButton('Editar', () => {
      $('interview-id').value = i.id;
      const candidate = state.candidates.find(c => c.id === i.candidateId);
      if (candidate) setSelectedCandidate(candidate); else { chosenId.value = ''; search.value = i.candidateName || ''; }
      const when = new Date(i.when);
      // Local datetime-local without UTC shift.
      if (Number.isFinite(when.getTime())) {
        const local = new Date(when.getTime() - when.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        $('interview-when').value = local;
      }
      $('interview-location').value = i.location || '';
      $('interview-notes').value = i.notes || '';
      $('interview-duration').value = i.duration || '';
      $('interview-modality').value = i.modality || '';
      $('interview-interviewer').value = i.interviewer || '';
      $('interview-save').textContent = 'Salvar alterações';
      interviewForm.scrollIntoView({ behavior: 'smooth' }); search.focus({ preventScroll: true });
    }));
    if (i.status !== 'Concluída') actions.append(addButton('Concluir', event => updateInterviewStatus(i, 'Concluída', event.currentTarget)));
    if (i.status !== 'Cancelada') actions.append(addButton('Cancelar', event => updateInterviewStatus(i, 'Cancelada', event.currentTarget), 'outline-danger'));
    if (i.status !== 'Agendada') actions.append(addButton('Reabrir', event => updateInterviewStatus(i, 'Agendada', event.currentTarget)));
    item.append(actions); root.append(item);
  }
  if (!filtered.length) root.append(node('p', term ? 'Nenhuma entrevista corresponde aos filtros.' : 'Nenhuma entrevista agendada.', 'empty-state'));
  if (filtered.length > 120) root.append(node('p', 'Exibindo 120 entrevistas. Refine a pesquisa para localizar outras.', 'filter-count'));
}
$('interviews-search').addEventListener('input', renderInterviews);
$('interviews-status').addEventListener('change', renderInterviews);

function fillContent() { if (!state.settings) return; for (const key of ['title', 'description', 'whatsapp']) $('content-' + key).value = state.settings[key] || ''; }
$('content-form').addEventListener('submit', async event => {
  event.preventDefault(); if (!authorized) return;
  const data = {}; for (const field of ['title', 'description', 'whatsapp']) data[field] = $('content-' + field).value.trim();
  data.whatsapp = digits(data.whatsapp);
  if (!/^\d{10,15}$/.test(data.whatsapp)) { msg('WhatsApp deve conter de 10 a 15 dígitos.'); return; }
  try { await setDoc(doc(db, 'configuracoes', 'site'), { ...data, updatedAt: serverTimestamp() }, { merge: true }); await log('Conteúdo atualizado', 'Informações institucionais'); msg('Conteúdo atualizado.'); }
  catch (error) { msg('Não foi possível salvar o conteúdo: ' + friendlyError(error)); }
});
function renderAudit() {
  const root = $('audit-list'); root.replaceChildren();
  const term = normalize($('history-search').value);
  const matches = state.audit.filter(a => normalize([a.action, a.detail, a.actor].join(' ')).includes(term))
    .sort((a, b) => (b.at?.seconds || 0) - (a.at?.seconds || 0));
  $('history-count').textContent = `${matches.length} de ${state.audit.length} registro(s)`;
  for (const a of matches.slice(0, 100)) root.append(card(a.action, `${a.detail} · ${dateFormat(a.at)}`));
  if (!matches.length) root.append(node('p', term ? 'Nenhuma atividade corresponde à pesquisa.' : 'Nenhuma atividade registrada.', 'empty-state'));
  if (matches.length > 100) root.append(node('p', 'Exibindo 100 atividades. Refine a pesquisa para encontrar outras.', 'filter-count'));
}
$('history-search').addEventListener('input', renderAudit);

// Exportação completa sob demanda (com dados pessoais): apenas após autorização administrativa.
const exportButton = addButton('Baixar backup de todas as coleções (.json)', async () => {
  if (!authorized) return;
  exportButton.disabled = true;
  try {
    const names = ['vagas', 'empresas', 'candidaturas', 'entrevistas', 'historico', 'configuracoes'];
    const data = {};
    for (const name of names) {
      const snapshot = await getDocsFromServer(collection(db, name));
      data[name] = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    const json = JSON.stringify({ format: 'contrata-sul-suite', version: 1, projectId: 'contrata-sul', exportedAt: new Date().toISOString(), collections: data },
      (key, value) => value && typeof value === 'object' && typeof value.seconds === 'number' && typeof value.nanoseconds === 'number' ? { __timestamp: value.seconds, nanoseconds: value.nanoseconds } : value, 2);
    const blob = new Blob([json], { type: 'application/json' }), url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `contrata-sul-completo-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    msg('Backup completo exportado. Contém dados pessoais de candidatos: guarde o arquivo em local seguro.');
  } catch (error) { msg('Falha no backup: ' + friendlyError(error)); }
  finally { exportButton.disabled = false; }
});
$('tab-backup').querySelector('.backup-grid .panel').append(exportButton);

$('overview-activity-search')?.addEventListener('input',renderDashboard);
// CSV disponível somente em sessão administrativa. Nunca expõe candidatos no site público.
$('candidate-export')?.addEventListener('click',()=>{
 if(!authorized||!auth.currentUser)return;
 const term=normalize($('candidate-search').value||'');
 const rows=state.candidates.filter(c=>normalize([c.name,c.email,c.phone,c.jobTitle,c.stage].join(' ')).includes(term));
 const headers=['Nome','Telefone','Contato preferido','E-mail','Vaga','Etapa','Data'];
 const safeCell=v=>{let s=String(v??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
 const csv='\uFEFF'+[headers,...rows.map(c=>[c.name,c.phone,c.contactPreference||'Não informada',c.email,c.jobTitle,c.stage,c.createdAt?.toDate?.()?.toLocaleDateString('pt-BR')||''])].map(row=>row.map(safeCell).join(';')).join('\r\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download='contrata-sul-candidaturas-'+new Date().toISOString().slice(0,10)+'.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
 msg(`${rows.length} candidato(s) exportado(s). Guarde o CSV com acesso restrito.`);
});
