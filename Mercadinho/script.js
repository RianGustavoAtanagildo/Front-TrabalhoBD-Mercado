// ══════════════════════════════════════════
//  MERCADINHO BD — script.js
//  Pronto para vincular ao banco de dados
// ══════════════════════════════════════════

let produtos = JSON.parse(localStorage.getItem('mbd') || '[]');
let editandoId = null;

// Salva no localStorage (substitua por chamada à API quando tiver banco)
function salvarLocal() {
  localStorage.setItem('mbd', JSON.stringify(produtos));
}

// ── TOAST ──────────────────────────────────
function toast(msg) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(el._t);
  el._t = setTimeout(function() { el.classList.remove('on'); }, 2500);
}

// ══════════════════════════════════════════
//  ADICIONAR
//  Substitua o corpo desta função por:
//  fetch('/api/produtos', { method: 'POST', ... })
// ══════════════════════════════════════════
function adicionar() {
  var nome  = document.getElementById('a-nome').value.trim();
  var cat   = document.getElementById('a-cat').value;
  var preco = parseFloat(document.getElementById('a-preco').value);
  var estq  = parseInt(document.getElementById('a-estq').value);
  var cod   = document.getElementById('a-cod').value.trim();

  if (!nome || !cat || isNaN(preco) || isNaN(estq)) {
    toast('⚠️ Preencha todos os campos obrigatórios!');
    return;
  }

  produtos.push({ id: Date.now(), nome, cat, preco, estoque: estq, cod });
  salvarLocal();
  limparForm();
  toast('✓ Produto adicionado!');
}

function limparForm() {
  document.getElementById('a-nome').value  = '';
  document.getElementById('a-cat').value   = '';
  document.getElementById('a-preco').value = '';
  document.getElementById('a-estq').value  = '';
  document.getElementById('a-cod').value   = '';
}

// ══════════════════════════════════════════
//  LISTAR PRODUTOS
//  Substitua por: fetch('/api/produtos')
// ══════════════════════════════════════════
function renderProdutos() {
  var busca = document.getElementById('busca-prod') ? document.getElementById('busca-prod').value.toLowerCase() : '';

  var lista = produtos.filter(function(p) {
    return p.nome.toLowerCase().includes(busca) ||
           p.cat.toLowerCase().includes(busca) ||
           (p.cod && p.cod.toLowerCase().includes(busca));
  });

  var tbody = document.getElementById('tbody-produtos');
  var vazio = document.getElementById('vazio-produtos');

  if (!lista.length) {
    tbody.innerHTML = '';
    vazio.style.display = 'block';
    return;
  }

  vazio.style.display = 'none';
  tbody.innerHTML = lista.map(function(p) {
    return '<tr>' +
      '<td style="color:var(--txt3)">' + (p.cod || '—') + '</td>' +
      '<td class="nm">' + p.nome + '</td>' +
      '<td><span class="bc">' + p.cat + '</span></td>' +
      '<td>R$ ' + p.preco.toFixed(2) + '</td>' +
      '<td>' + p.estoque + ' un.</td>' +
    '</tr>';
  }).join('');
}

// ══════════════════════════════════════════
//  EDITAR / EXCLUIR
//  Substitua por: fetch('/api/produtos')
// ══════════════════════════════════════════
function renderEditar() {
  var busca = document.getElementById('busca-edit') ? document.getElementById('busca-edit').value.toLowerCase() : '';

  var lista = produtos.filter(function(p) {
    return p.nome.toLowerCase().includes(busca) || p.cat.toLowerCase().includes(busca);
  });

  var tbody = document.getElementById('tbody-edit');
  var vazio = document.getElementById('vazio-edit');

  if (!lista.length) {
    tbody.innerHTML = '';
    vazio.style.display = 'block';
    return;
  }

  vazio.style.display = 'none';
  tbody.innerHTML = lista.map(function(p) {
    return '<tr>' +
      '<td class="nm">' + p.nome + '</td>' +
      '<td><span class="bc">' + p.cat + '</span></td>' +
      '<td>R$ ' + p.preco.toFixed(2) + '</td>' +
      '<td>' + p.estoque + ' un.</td>' +
      '<td class="text-center">' +
        '<button class="btn-edit" onclick="abrirEdicao(' + p.id + ')">✏️ Editar</button>' +
        '<button class="btn-del"  onclick="excluir(' + p.id + ')">🗑️ Excluir</button>' +
      '</td>' +
    '</tr>';
  }).join('');
}

// ── ABRIR PAINEL DE EDIÇÃO ─────────────────
function abrirEdicao(id) {
  var p = produtos.find(function(x) { return x.id === id; });
  if (!p) return;

  editandoId = id;
  document.getElementById('e-nome').value  = p.nome;
  document.getElementById('e-cat').value   = p.cat;
  document.getElementById('e-preco').value = p.preco;
  document.getElementById('e-estq').value  = p.estoque;
  document.getElementById('e-cod').value   = p.cod || '';
  document.getElementById('edit-titulo').textContent = 'Editando: ' + p.nome;

  var painel = document.getElementById('painel-edicao');
  painel.style.display = 'block';
  painel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── SALVAR EDIÇÃO ──────────────────────────
//  Substitua por: fetch('/api/produtos/' + id, { method: 'PUT', ... })
function salvarEdicao() {
  if (editandoId === null) return;

  var nome  = document.getElementById('e-nome').value.trim();
  var cat   = document.getElementById('e-cat').value;
  var preco = parseFloat(document.getElementById('e-preco').value);
  var estq  = parseInt(document.getElementById('e-estq').value);
  var cod   = document.getElementById('e-cod').value.trim();

  if (!nome || !cat || isNaN(preco) || isNaN(estq)) {
    toast('⚠️ Preencha todos os campos!');
    return;
  }

  var idx = produtos.findIndex(function(x) { return x.id === editandoId; });
  produtos[idx] = { id: editandoId, nome, cat, preco, estoque: estq, cod };

  salvarLocal();
  fecharEdicao();
  renderEditar();
  toast('✓ Produto atualizado!');
}

// ── FECHAR PAINEL ──────────────────────────
function fecharEdicao() {
  editandoId = null;
  document.getElementById('painel-edicao').style.display = 'none';
}

// ── EXCLUIR ────────────────────────────────
//  Substitua por: fetch('/api/produtos/' + id, { method: 'DELETE' })
function excluir(id) {
  var p = produtos.find(function(x) { return x.id === id; });
  if (!p) return;
  if (!confirm('Excluir "' + p.nome + '"?')) return;

  produtos = produtos.filter(function(x) { return x.id !== id; });
  salvarLocal();
  renderEditar();
  toast('🗑️ Produto excluído');
}