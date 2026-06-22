let produtos = JSON.parse(localStorage.getItem('mbd') || '[]');
let compras  = JSON.parse(localStorage.getItem('mbd_compras') || '[]');
let editandoId = null;
let carrinho = [];

compras = normalizarCompras(compras);

function salvarLocal() {
  localStorage.setItem('mbd', JSON.stringify(produtos));
  localStorage.setItem('mbd_compras', JSON.stringify(compras));
}

// ── TOAST ──────────────────────────────────
function toast(msg) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(el._t);
  el._t = setTimeout(function() { el.classList.remove('on'); }, 2500);
}

function fmtData(ts) {
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function fmtMoeda(valor) {
  return 'R$ ' + Number(valor || 0).toFixed(2);
}

function normalizarCompras(lista) {
  return (lista || []).map(function(compra, indice) {
    if (compra && Array.isArray(compra.itens)) {
      compra.total = typeof compra.total === 'number' ? compra.total : totalizarItens(compra.itens);
      compra.numNota = compra.numNota || gerarNumeroNota(indice);
      return compra;
    }

    var qtd = Number(compra && compra.qtd ? compra.qtd : 1);
    var preco = Number(compra && compra.preco ? compra.preco : 0);
    var item = {
      produtoId: compra ? compra.produtoId : null,
      nomeProduto: compra ? compra.nomeProduto : 'Produto',
      preco: preco,
      qtd: qtd,
      total: preco * qtd
    };

    return {
      id: compra && compra.id ? compra.id : Date.now() + indice,
      numNota: compra && compra.numNota ? compra.numNota : gerarNumeroNota(indice),
      data: compra && compra.data ? compra.data : Date.now(),
      itens: [item],
      total: compra && typeof compra.total === 'number' ? compra.total : item.total
    };
  });
}

function totalizarItens(itens) {
  return (itens || []).reduce(function(soma, item) {
    return soma + Number(item.total || (Number(item.preco || 0) * Number(item.qtd || 0)));
  }, 0);
}

function gerarNumeroNota(indiceBase) {
  var numero = typeof indiceBase === 'number' ? indiceBase + 1 : 1;
  return 'NF-' + String(numero).padStart(4, '0');
}

function proximaNumeroNota() {
  var maior = 0;

  compras.forEach(function(compra) {
    var match = String(compra.numNota || '').match(/(\d+)$/);
    if (!match) return;
    var atual = parseInt(match[1], 10);
    if (!isNaN(atual) && atual > maior) maior = atual;
  });

  return 'NF-' + String(maior + 1).padStart(4, '0');
}

function obterCarrinhoResumo() {
  return carrinho.reduce(function(total, item) {
    return total + item.qtd;
  }, 0);
}

// ══════════════════════════════════════════
//  PRODUTOS
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

  // TODO: fetch POST /api/produtos
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

function renderProdutos() {
  var busca = document.getElementById('busca-prod') ? document.getElementById('busca-prod').value.toLowerCase() : '';
  // TODO: fetch GET /api/produtos
  var lista = produtos.filter(function(p) {
    return p.nome.toLowerCase().includes(busca) ||
           p.cat.toLowerCase().includes(busca) ||
           (p.cod && p.cod.toLowerCase().includes(busca));
  });

  var tbody = document.getElementById('tbody-produtos');
  var vazio = document.getElementById('vazio-produtos');

  if (!lista.length) { tbody.innerHTML = ''; vazio.style.display = 'block'; return; }
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
// ══════════════════════════════════════════
function renderEditar() {
  var busca = document.getElementById('busca-edit') ? document.getElementById('busca-edit').value.toLowerCase() : '';
  // TODO: fetch GET /api/produtos
  var lista = produtos.filter(function(p) {
    return p.nome.toLowerCase().includes(busca) || p.cat.toLowerCase().includes(busca);
  });

  var tbody = document.getElementById('tbody-edit');
  var vazio = document.getElementById('vazio-edit');

  if (!lista.length) { tbody.innerHTML = ''; vazio.style.display = 'block'; return; }
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

  // TODO: fetch PUT /api/produtos/:id
  var idx = produtos.findIndex(function(x) { return x.id === editandoId; });
  produtos[idx] = { id: editandoId, nome, cat, preco, estoque: estq, cod };

  salvarLocal();
  fecharEdicao();
  renderEditar();
  toast('✓ Produto atualizado!');
}

function fecharEdicao() {
  editandoId = null;
  document.getElementById('painel-edicao').style.display = 'none';
}

function excluir(id) {
  var p = produtos.find(function(x) { return x.id === id; });
  if (!p) return;
  if (!confirm('Excluir "' + p.nome + '"?')) return;

  // TODO: fetch DELETE /api/produtos/:id
  produtos = produtos.filter(function(x) { return x.id !== id; });
  salvarLocal();
  renderEditar();
  toast('🗑️ Produto excluído');
}

// ══════════════════════════════════════════
//  COMPRAS
// ══════════════════════════════════════════
function carregarSelectProdutos() {
  renderCompras();
}

function renderProdutosCompra() {
  var container = document.getElementById('lista-produtos-compra');
  if (!container) return;

  if (!produtos.length) {
    container.innerHTML = '<div class="vazio compra-vazio"><span>📦</span><p>Nenhum produto cadastrado para montar a compra.</p></div>';
    return;
  }

  container.innerHTML = produtos.map(function(p) {
    var semEstoque = p.estoque <= 0;
    return '<div class="produto-card">' +
      '<div class="produto-card-top">' +
        '<div>' +
          '<span class="produto-card-cat">' + p.cat + '</span>' +
          '<h4>' + p.nome + '</h4>' +
        '</div>' +
        '<strong>' + fmtMoeda(p.preco) + '</strong>' +
      '</div>' +
      '<div class="produto-card-info">' +
        '<span>Estoque: ' + (semEstoque ? 'Sem estoque' : p.estoque) + '</span>' +
        '<span>' + (p.cod || 'Sem código') + '</span>' +
      '</div>' +
      '<div class="produto-card-qtd">' +
        '<button type="button" class="qtd-btn" onclick="alterarQtdCard(' + p.id + ',-1)">−</button>' +
        '<input id="qtd-card-' + p.id + '" class="qtd-inp" type="number" min="1" value="' + (semEstoque ? 0 : 1) + '" max="' + p.estoque + '" ' + (semEstoque ? 'disabled' : '') + '/>' +
        '<button type="button" class="qtd-btn" onclick="alterarQtdCard(' + p.id + ',1)" ' + (semEstoque ? 'disabled' : '') + '>+</button>' +
      '</div>' +
      '<button type="button" class="btn-add btn-card" onclick="adicionarAoCarrinho(' + p.id + ')" ' + (semEstoque ? 'disabled' : '') + '>' + (semEstoque ? 'Sem estoque' : 'Adicionar ao carrinho') + '</button>' +
    '</div>';
  }).join('');
}

function alterarQtdCard(id, delta) {
  var p = produtos.find(function(x) { return x.id === id; });
  var input = document.getElementById('qtd-card-' + id);
  if (!p || !input) return;

  var atual = parseInt(input.value, 10);
  if (isNaN(atual) || atual < 1) atual = 1;

  var novo = atual + delta;
  if (novo < 1) novo = 1;
  if (novo > p.estoque) novo = p.estoque;
  input.value = novo;
}

function adicionarAoCarrinho(prodId) {
  var p = produtos.find(function(x) { return x.id === prodId; });
  if (!p) return;

  var input = document.getElementById('qtd-card-' + prodId);
  var qtd = input ? parseInt(input.value, 10) : 1;
  if (isNaN(qtd) || qtd <= 0) {
    toast('⚠️ Informe uma quantidade válida!');
    return;
  }

  var existente = carrinho.find(function(item) { return item.produtoId === prodId; });
  var qtdAtual = existente ? existente.qtd : 0;

  if (qtdAtual + qtd > p.estoque) {
    toast('⚠️ Quantidade maior do que o estoque disponível!');
    return;
  }

  if (existente) {
    existente.qtd += qtd;
    existente.total = existente.qtd * existente.preco;
  } else {
    carrinho.push({
      produtoId: p.id,
      nomeProduto: p.nome,
      preco: p.preco,
      qtd: qtd,
      total: p.preco * qtd
    });
  }

  input.value = 1;
  renderCarrinhoCompra();
  toast('✓ Produto adicionado ao carrinho!');
}

function alterarQtdCarrinho(prodId, delta) {
  var item = carrinho.find(function(x) { return x.produtoId === prodId; });
  var p = produtos.find(function(x) { return x.id === prodId; });
  if (!item || !p) return;

  var novaQtd = item.qtd + delta;
  if (novaQtd <= 0) {
    removerDoCarrinho(prodId);
    return;
  }

  if (novaQtd > p.estoque) {
    toast('⚠️ Não dá para passar do estoque disponível!');
    return;
  }

  item.qtd = novaQtd;
  item.total = item.qtd * item.preco;
  renderCarrinhoCompra();
}

function removerDoCarrinho(prodId) {
  carrinho = carrinho.filter(function(item) {
    return item.produtoId !== prodId;
  });
  renderCarrinhoCompra();
}

function limparCarrinho() {
  carrinho = [];
  renderCarrinhoCompra();
}

function renderCarrinhoCompra() {
  var lista = document.getElementById('carrinho-itens');
  var vazio = document.getElementById('carrinho-vazio');
  var totalEl = document.getElementById('carrinho-total');
  if (!lista || !vazio || !totalEl) return;

  if (!carrinho.length) {
    lista.innerHTML = '';
    vazio.style.display = 'block';
    totalEl.textContent = fmtMoeda(0);
    return;
  }

  vazio.style.display = 'none';
  lista.innerHTML = carrinho.map(function(item) {
    return '<div class="carrinho-item">' +
      '<div class="carrinho-item-info">' +
        '<strong>' + item.nomeProduto + '</strong>' +
        '<span>' + fmtMoeda(item.preco) + ' cada</span>' +
      '</div>' +
      '<div class="carrinho-item-qtd">' +
        '<button type="button" class="qtd-btn" onclick="alterarQtdCarrinho(' + item.produtoId + ',-1)">−</button>' +
        '<span>' + item.qtd + '</span>' +
        '<button type="button" class="qtd-btn" onclick="alterarQtdCarrinho(' + item.produtoId + ',1)">+</button>' +
      '</div>' +
      '<div class="carrinho-item-total">' + fmtMoeda(item.total) + '</div>' +
      '<button type="button" class="btn-cancel btn-remover-item" onclick="removerDoCarrinho(' + item.produtoId + ')">Remover</button>' +
    '</div>';
  }).join('');

  totalEl.textContent = fmtMoeda(totalizarItens(carrinho));
}

function registrarCompra() {
  if (!carrinho.length) {
    toast('⚠️ Adicione pelo menos um produto ao carrinho!');
    return;
  }

  var itensCompra = [];
  var compraInvalida = false;

  carrinho.forEach(function(item) {
    var produto = produtos.find(function(x) { return x.id === item.produtoId; });
    if (!produto) {
      compraInvalida = true;
      return;
    }

    if (item.qtd > produto.estoque) {
      toast('⚠️ O produto ' + produto.nome + ' ficou sem estoque suficiente.');
      compraInvalida = true;
      return;
    }

    itensCompra.push({
      produtoId: produto.id,
      nomeProduto: produto.nome,
      preco: produto.preco,
      qtd: item.qtd,
      total: produto.preco * item.qtd
    });
  });

  if (compraInvalida || !itensCompra.length) {
    return;
  }

  if (!itensCompra.length) {
    toast('⚠️ Não foi possível registrar a compra.');
    return;
  }

  itensCompra.forEach(function(item) {
    var produto = produtos.find(function(x) { return x.id === item.produtoId; });
    if (produto) produto.estoque -= item.qtd;
  });

  var compra = {
    id: Date.now(),
    numNota: proximaNumeroNota(),
    data: Date.now()
  };

  compra.itens = itensCompra;
  compra.total = totalizarItens(itensCompra);

  compras.unshift(compra);
  carrinho = [];
  salvarLocal();

  renderProdutos();
  renderCompras();
  toast('✓ Compra registrada! Nota ' + compra.numNota + ' gerada.');
}

function renderCompras() {
  renderProdutosCompra();
  renderCarrinhoCompra();

  var tbody = document.getElementById('tbody-compras');
  var vazio = document.getElementById('vazio-compras');
  if (!tbody || !vazio) return;

  if (!compras.length) { tbody.innerHTML = ''; vazio.style.display = 'block'; return; }
  vazio.style.display = 'none';

  tbody.innerHTML = compras.map(function(c) {
    return '<tr>' +
      '<td class="nota-num">' + c.numNota + '</td>' +
      '<td style="color:var(--txt3)">' + fmtData(c.data) + '</td>' +
      '<td>' + c.itens.length + ' item(s)</td>' +
      '<td style="font-weight:600;color:#34c77b">' + fmtMoeda(c.total) + '</td>' +
      '<td class="text-center"><button class="btn-edit" onclick="abrirNota(' + c.id + ')">Abrir nota</button></td>' +
    '</tr>';
  }).join('');
}

// ══════════════════════════════════════════
//  NOTAS FISCAIS
// ══════════════════════════════════════════
function renderNotas() {
  var tbody = document.getElementById('tbody-notas');
  var vazio = document.getElementById('vazio-notas');
  if (!tbody || !vazio) return;

  if (!compras.length) { tbody.innerHTML = ''; vazio.style.display = 'block'; return; }
  vazio.style.display = 'none';

  tbody.innerHTML = compras.map(function(c) {
    return '<tr>' +
      '<td class="nota-num">' + c.numNota + '</td>' +
      '<td style="color:var(--txt3)">' + fmtData(c.data) + '</td>' +
      '<td>' + c.itens.length + ' item(s)</td>' +
      '<td style="font-weight:600;color:#34c77b">' + fmtMoeda(c.total) + '</td>' +
      '<td class="text-center"><button class="btn-edit" onclick="mostrarDetalheNota(' + c.id + ')">Abrir nota</button></td>' +
    '</tr>';
  }).join('');

  if (notaDetalheAbertaId !== null) {
    mostrarDetalheNota(notaDetalheAbertaId);
  }
}

let notaDetalheAbertaId = null;

function abrirNota(id) {
  document.querySelectorAll('.pag').forEach(function(p) { p.style.display = 'none'; });
  document.getElementById('pag-notas').style.display = 'block';
  document.querySelectorAll('.nav-link').forEach(function(n) { n.classList.remove('active'); });
  document.getElementById('nav-notas').classList.add('active');
  renderNotas();
  mostrarDetalheNota(id);
}

function mostrarDetalheNota(id) {
  var compra = compras.find(function(c) { return c.id === id; });
  var painel = document.getElementById('painel-nota-detalhe');
  var titulo = document.getElementById('nota-detalhe-titulo');
  var subtitulo = document.getElementById('nota-detalhe-sub');
  var itens = document.getElementById('nota-detalhe-itens');
  var total = document.getElementById('nota-detalhe-total');

  if (!compra || !painel || !titulo || !subtitulo || !itens || !total) return;

  notaDetalheAbertaId = id;
  titulo.textContent = compra.numNota;
  subtitulo.textContent = fmtData(compra.data) + ' · ' + compra.itens.length + ' item(s)';
  total.textContent = fmtMoeda(compra.total);

  itens.innerHTML = compra.itens.map(function(item) {
    return '<div class="nota-item">' +
      '<div>' +
        '<strong>' + item.nomeProduto + '</strong>' +
        '<span>' + item.qtd + ' x ' + fmtMoeda(item.preco) + '</span>' +
      '</div>' +
      '<strong>' + fmtMoeda(item.total) + '</strong>' +
    '</div>';
  }).join('');

  painel.style.display = 'block';
  painel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function fecharDetalheNota() {
  notaDetalheAbertaId = null;
  var painel = document.getElementById('painel-nota-detalhe');
  if (painel) painel.style.display = 'none';
}