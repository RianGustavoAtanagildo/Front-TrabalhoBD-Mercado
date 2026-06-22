// ══════════════════════════════════════════
//  MERCADINHO BD — app.js
//  Cada função está comentada e pronta
//  para ser vinculada ao banco de dados
// ══════════════════════════════════════════

let produtos = JSON.parse(localStorage.getItem('mbd') || '[]');
let editandoId = null;

// ── SALVAR NO LOCALSTORAGE ──────────────────
// Quando vincular ao banco, substitua esta função
// por uma chamada à sua API (ex: fetch POST /produtos)
function save() {
  localStorage.setItem('mbd', JSON.stringify(produtos));
}

// ── NAVEGAÇÃO ───────────────────────────────
function ir(pagina) {
  document.querySelectorAll('.pag').forEach(x => x.classList.remove('on'));
  document.querySelectorAll('.nav-link').forEach(x => x.classList.remove('active'));

  document.getElementById('pag-' + pagina).classList.add('on');
  document.querySelector('[data-p="' + pagina + '"]').classList.add('active');

  // Carrega os dados ao entrar na página
  if (pagina === 'produtos') renderProds();
  if (pagina === 'editar')   { fecharEdicao(); renderEdit(); }
}

// ── TOAST (notificação) ─────────────────────
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('on'), 2500);
}

// ════════════════════════════════════════════
//  PÁGINA: ADICIONAR
//  Vincular ao banco: substitua o conteúdo
//  da função adicionar() por fetch POST
// ════════════════════════════════════════════
function adicionar() {
  const nome  = document.getElementById('a-nome').value.trim();
  const cat   = document.getElementById('a-cat').value;
  const preco = parseFloat(document.getElementById('a-preco').value);
  const estq  = parseInt(document.getElementById('a-estq').value);
  const cod   = document.getElementById('a-cod').value.trim();

  // Validação
  if (!nome || !cat || isNaN(preco) || isNaN(estq)) {
    toast('⚠️ Preencha todos os campos obrigatórios!');
    return;
  }

  // ── BANCO DE DADOS: substituir aqui ──
  // Exemplo futuro com API:
  // fetch('/api/produtos', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ nome, cat, preco, estoque: estq, cod })
  // }).then(() => { limparForm(); toast('✓ Produto adicionado!'); });

  // Por enquanto usa localStorage:
  produtos.push({
    id: Date.now(),
    nome,
    cat,
    preco,
    estoque: estq,
    cod
  });
  save();
  limparForm();
  toast('✓ Produto adicionado com sucesso!');
}

function limparForm() {
  ['a-nome', 'a-preco', 'a-estq', 'a-cod'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('a-cat').value = '';
}

// ════════════════════════════════════════════
//  PÁGINA: PRODUTOS
//  Vincular ao banco: substitua o array
//  local por um fetch GET /produtos
// ════════════════════════════════════════════
function renderProds() {
  const b = (document.getElementById('busca-prod')?.value || '').toLowerCase();

  // ── BANCO DE DADOS: substituir aqui ──
  // Exemplo futuro:
  // fetch('/api/produtos').then(r => r.json()).then(lista => { ... });

  const lista = produtos.filter(p =>
    p.nome.toLowerCase().includes(b) ||
    p.cat.toLowerCase().includes(b) ||
    (p.cod && p.cod.toLowerCase().includes(b))
  );

  const tbody = document.getElementById('tbody-produtos');
  const vazio = document.getElementById('vazio-produtos');

  if (!lista.length) {
    tbody.innerHTML = '';
    vazio.classList.remove('d-none');
    return;
  }

  vazio.classList.add('d-none');

  tbody.innerHTML = lista.map(p => {
    const [cls, txt] = p.estoque === 0
      ? ['bd', 'Sem estoque']
      : p.estoque <= 5
        ? ['bw', 'Baixo']
        : ['bk', 'Disponível'];

    return `
      <tr>
        <td style="color:var(--txt3)">${p.cod || '—'}</td>
        <td class="nm">${p.nome}</td>
        <td><span class="bc">${p.cat}</span></td>
        <td>R$ ${p.preco.toFixed(2)}</td>
        <td>${p.estoque} un.</td>
        <td><span class="${cls}">${txt}</span></td>
      </tr>
    `;
  }).join('');
}

// ════════════════════════════════════════════
//  PÁGINA: EDITAR / EXCLUIR
// ════════════════════════════════════════════
function renderEdit() {
  const b = (document.getElementById('busca-edit')?.value || '').toLowerCase();

  const lista = produtos.filter(p =>
    p.nome.toLowerCase().includes(b) ||
    p.cat.toLowerCase().includes(b)
  );

  const tbody = document.getElementById('tbody-edit');
  const vazio = document.getElementById('vazio-edit');

  if (!lista.length) {
    tbody.innerHTML = '';
    vazio.classList.remove('d-none');
    return;
  }

  vazio.classList.add('d-none');

  tbody.innerHTML = lista.map(p => `
    <tr>
      <td class="nm">${p.nome}</td>
      <td><span class="bc">${p.cat}</span></td>
      <td>R$ ${p.preco.toFixed(2)}</td>
      <td>${p.estoque} un.</td>
      <td class="text-center">
        <button class="btn-edit" onclick="abrirEdicao(${p.id})">✏️ Editar</button>
        <button class="btn-del"  onclick="excluir(${p.id})">🗑️ Excluir</button>
      </td>
    </tr>
  `).join('');
}

// ── ABRIR PAINEL DE EDIÇÃO ──────────────────
function abrirEdicao(id) {
  const p = produtos.find(p => p.id === id);
  if (!p) return;

  editandoId = id;
  document.getElementById('e-nome').value  = p.nome;
  document.getElementById('e-cat').value   = p.cat;
  document.getElementById('e-preco').value = p.preco;
  document.getElementById('e-estq').value  = p.estoque;
  document.getElementById('e-cod').value   = p.cod || '';
  document.getElementById('edit-titulo').textContent = 'Editando: ' + p.nome;

  const painel = document.getElementById('painel-edicao');
  painel.classList.remove('d-none');
  painel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── SALVAR EDIÇÃO ───────────────────────────
// Vincular ao banco: substitua por fetch PUT /produtos/:id
function salvarEdicao() {
  if (editandoId === null) return;

  const nome  = document.getElementById('e-nome').value.trim();
  const cat   = document.getElementById('e-cat').value;
  const preco = parseFloat(document.getElementById('e-preco').value);
  const estq  = parseInt(document.getElementById('e-estq').value);
  const cod   = document.getElementById('e-cod').value.trim();

  if (!nome || !cat || isNaN(preco) || isNaN(estq)) {
    toast('⚠️ Preencha todos os campos!');
    return;
  }

  // ── BANCO DE DADOS: substituir aqui ──
  // fetch(`/api/produtos/${editandoId}`, {
  //   method: 'PUT',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ nome, cat, preco, estoque: estq, cod })
  // }).then(() => { fecharEdicao(); renderEdit(); toast('✓ Produto atualizado!'); });

  const idx = produtos.findIndex(p => p.id === editandoId);
  produtos[idx] = { ...produtos[idx], nome, cat, preco, estoque: estq, cod };

  save();
  fecharEdicao();
  renderEdit();
  toast('✓ Produto atualizado!');
}

function fecharEdicao() {
  editandoId = null;
  document.getElementById('painel-edicao').classList.add('d-none');
}

// ── EXCLUIR ─────────────────────────────────
// Vincular ao banco: substitua por fetch DELETE /produtos/:id
function excluir(id) {
  const p = produtos.find(p => p.id === id);
  if (!p) return;
  if (!confirm(`Excluir "${p.nome}"? Esta ação não pode ser desfeita.`)) return;

  // ── BANCO DE DADOS: substituir aqui ──
  // fetch(`/api/produtos/${id}`, { method: 'DELETE' })
  //   .then(() => { renderEdit(); toast('🗑️ Produto excluído'); });

  produtos = produtos.filter(p => p.id !== id);
  save();
  renderEdit();
  toast('🗑️ Produto excluído');
}