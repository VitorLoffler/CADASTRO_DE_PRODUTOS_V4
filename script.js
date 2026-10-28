//
// FASE 1: Modelagem dos dados (Classe Base)
//
class Produto {
    constructor(nome, preco, quantidade) {
        this.nome = nome;
        this.preco = parseFloat(preco);
        this.quantidade = parseInt(quantidade);
    }

    // Método que calcula o subtotal do produto
    calcularSubtotal() {
        return this.preco * this.quantidade;
    }
}

//
// FASE 2: Gerenciamento de Estado (Memória) + Estado de Edição
//
const listaDeProdutos = [];

// Variável de controle - null = Modo Cadastro, número = Modo Edição
let indiceEdicao = null;

//
// FASE 2.1: Persistência com localStorage
//
const CHAVE_STORAGE = "sistema_estoque_produtos";

function salvarNoLocalStorage() {
    const listaEmTexto = JSON.stringify(listaDeProdutos);
    localStorage.setItem(CHAVE_STORAGE, listaEmTexto);
}

function carregarDoLocalStorage() {
    const dadosSalvos = localStorage.getItem(CHAVE_STORAGE);
    if (dadosSalvos) {
        const produtosObjetos = JSON.parse(dadosSalvos);
        produtosObjetos.forEach((prod) => {
            const produtoInstanciado = new Produto(prod.nome, prod.preco, prod.quantidade);
            listaDeProdutos.push(produtoInstanciado);
        });
    }
}

//
// FASE 3: Captura de Elementos do DOM
//
const formProduto = document.getElementById("produto-form");
const btnLimparTudo = document.getElementById("limpar-tabela");
const totalEstoqueEl = document.getElementById("total-estoque");
const btnSubmit = document.querySelector(".btn-primary");

//NOVIDADE V4: Captura do novo elemento de input de busca

const campoBusca = document.querySelector("campo-busca");

//NOVIDADE V4: Função inteligente de filtragem (.filter())
//A função analisa oque foi digitado
//Produtos que correspondem ao filtro
function obterProdutosfiltrados(){

    //Sanitizar o termo de busca e converter para minúsculas
    const termo = campoBusca.value.trim().toLowerCase();

    //Se a busca estiver vazia, retorna a lista completa
    if(!termo){

        return listaDeProdutos;

    }

    //Usa método de alta performance .filter()
    return listaDeProdutos.filter(produto => produto.nome.toLowerCase().includes(termo));

}


//
// FASE 4: Escuta de Eventos - COM VALIDAÇÃO
//

// 1. Adicionar / Atualizar Produto pelo Formulário
formProduto.addEventListener("submit", function (event) {
    event.preventDefault();

    // Sanitização com .trim() + parse
    const nome = document.getElementById("nome").value.trim();
    const preco = parseFloat(document.getElementById("preco").value);
    const quantidade = parseInt(document.getElementById("quantidade").value);

    // Guard Clause - Retorno antecipado
    if (!nome) {
        alert("Por favor, informe um nome válido para o produto.");
        return;
    }

    if (isNaN(preco) || preco <= 0 || isNaN(quantidade) || quantidade <= 0) {
        alert("O preço e a quantidade devem ser valores numéricos maiores que zero.");
        return;
    }

    // Dados válidos: cria objeto
    const novoProduto = new Produto(nome, preco, quantidade);

    // Lógica de Atualização (Update)
    if (indiceEdicao === null) {
        // Modo Inclusão
        listaDeProdutos.push(novoProduto);
    } else {
        // Modo Edição - substitui elemento existente
        listaDeProdutos[indiceEdicao] = novoProduto;
    }

    // Restauração de Estado
    indiceEdicao = null;
    btnSubmit.textContent = "Adicionar Produto";

    // Persistência + Interface
    salvarNoLocalStorage();
    atualizarInterface();
    formProduto.reset();
});

// 2. Limpar toda a tabela
btnLimparTudo.addEventListener("click", function () {
    if (listaDeProdutos.length === 0) {
        alert("A tabela já está vazia!");
        return;
    }

    if (confirm("Tem certeza que deseja remover todos os produtos?")) {
        listaDeProdutos.length = 0;
        localStorage.removeItem(CHAVE_STORAGE);
        indiceEdicao = null;
        btnSubmit.textContent = "Adicionar Produto";
        atualizarInterface();
        formProduto.reset();
    }
});

//
// FASE 5: Funções de Atualização e Renderização
//

// Remove um único produto
function removerProduto(index) {
    listaDeProdutos.splice(index, 1);
    salvarNoLocalStorage();

    // Se estava editando o item removido, cancela edição
    if (indiceEdicao === index) {
        indiceEdicao = null;
        btnSubmit.textContent = "Adicionar Produto";
        formProduto.reset();
    }

    atualizarInterface();
}

// Preparar Edição
function prepararEdicao(index) {
    const produto = listaDeProdutos[index];

    // 1. Preenche os campos do formulário com dados existentes
    document.getElementById("nome").value = produto.nome;
    document.getElementById("preco").value = produto.preco;
    document.getElementById("quantidade").value = produto.quantidade;

    // 2. Transfere estado para Modo Edição e atualiza interface
    indiceEdicao = index;
    btnSubmit.textContent = "Salvar Alterações";

    // Foca no campo nome para melhor UX
    document.getElementById("nome").focus();
}

// Calcula total geral
function atualizarTotalEstoque() {
    const total = listaDeProdutos.reduce((acc, produto) => {
        return acc + produto.calcularSubtotal();
    }, 0);

    totalEstoqueEl.textContent = `Total em Estoque: R$ ${total.toFixed(2)}`;
}

// Renderizar com botão Editar - CORRIGIDO
function renderizarTabela() {
    const tabelaBody = document.querySelector("#tabela-produtos tbody");
    tabelaBody.innerHTML = "";

    listaDeProdutos.forEach((produto, index) => {
        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td>${produto.nome}</td>
            <td>R$ ${produto.preco.toFixed(2)}</td>
            <td>${produto.quantidade}</td>
            <td>R$ ${produto.calcularSubtotal().toFixed(2)}</td>
            <td>
                <button class="btn-editar">Editar</button>
                <button class="btn-remover">Remover</button>
            </td>
        `;

        // CORREÇÃO: primeiro busca os botões, depois adiciona o evento
        const btnEditar = linha.querySelector(".btn-editar");
        const btnRemover = linha.querySelector(".btn-remover");

        btnEditar.addEventListener("click", () => prepararEdicao(index));
        btnRemover.addEventListener("click", () => removerProduto(index));
        
        tabelaBody.appendChild(linha);
    });
}

// Sincroniza tela com dados
function atualizarInterface() {
    renderizarTabela();
    atualizarTotalEstoque();
}

//
// FASE 6: Inicialização
//
carregarDoLocalStorage();
atualizarInterface();