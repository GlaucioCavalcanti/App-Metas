const { select, input, checkbox } = require('@inquirer/prompts');
const fs = require("fs").promises;

let mensagem = "Bem-vindo ao App de Metas";

let metas;

// Função para carregar as metas do arquivo JSON
const carregarMetas = async () => {
    try {
        const dados = await fs.readFile("metas.json", "utf-8");
        metas = JSON.parse(dados);
    } catch (erro) {
        metas = [];
    }
};

// Função para salvar as metas no arquivo JSON
const salvarMetas = async () => {
    await fs.writeFile("metas.json", JSON.stringify(metas, null, 2));
};

// Função para cadastrar uma nova meta
const cadastrarMeta = async () => {
    const meta = await input({ message: "Digite a meta:" });
    const prazo = await select({
        message: "Escolha o prazo para conclusão",
        choices: [
            { name: "Diária", value: 1 },
            { name: "Até 7 dias", value: 7 }
        ]
    });

    if (meta.length == 0) {
        mensagem = 'A meta não pode ser vazia.';
        return;
    }

    metas.push({
        value: meta,
        checked: false,
        prazo: prazo,
        dataCriacao: new Date().toISOString(),
        dataConclusao: null
    });

    mensagem = "Meta cadastrada com sucesso!";
};

// Função para listar e atualizar o status das metas
const listarMetas = async () => {
    if (metas.length == 0) {
        mensagem = "Não existem metas!";
        return;
    }

    const respostas = await checkbox({
        message: "Use as setas para mudar de meta, o espaço para marcar ou desmarcar e o Enter para finalizar essa etapa",
        choices: metas.map(meta => ({ name: meta.value, value: meta.value })),
        instructions: false,
    });

    metas.forEach((m) => {
        m.checked = false;
    });

    if (respostas.length == 0) {
        mensagem = "Nenhuma meta selecionada!";
        return;
    }

    respostas.forEach((resposta) => {
        const meta = metas.find((m) => m.value === resposta);
        meta.checked = true;
        meta.dataConclusao = new Date().toISOString();
    });

    mensagem = 'Meta(s) marcada(s) como concluída(s)';
};

// Função para mostrar as metas realizadas
const metasRealizadas = async () => {
    if (metas.length == 0) {
        mensagem = "Não existem metas!";
        return;
    }

    const realizadas = metas.filter((meta) => meta.checked);

    if (realizadas.length == 0) {
        mensagem = 'Não existem metas realizadas! :(';
        return;
    }

    await select({
        message: "Metas Realizadas: " + realizadas.length,
        choices: realizadas.map(meta => ({
            name: `${meta.value} - Concluída em ${new Date(meta.dataConclusao).toLocaleDateString()}`,
            value: meta.value
        }))
    });
};

// Função para mostrar as metas abertas
const metasAbertas = async () => {
    if (metas.length == 0) {
        mensagem = "Não existem metas!";
        return;
    }

    const abertas = metas.filter((meta) => !meta.checked);

    if (abertas.length == 0) {
        mensagem = "Não existem metas abertas! :)";
        return;
    }

    await select({
        message: "Metas Abertas: " + abertas.length,
        choices: abertas.map(meta => ({
            name: meta.value,
            value: meta.value
        }))
    });
};

// Função para deletar metas
const deletarMetas = async () => {
    if (metas.length == 0) {
        mensagem = "Não existem metas!";
        return;
    }

    const itemsADeletar = await checkbox({
        message: "Selecione item para deletar",
        choices: metas.map(meta => ({
            name: meta.value,
            value: meta.value
        })),
        instructions: false,
    });

    if (itemsADeletar.length == 0) {
        mensagem = "Nenhum item para deletar!";
        return;
    }

    metas = metas.filter((meta) => !itemsADeletar.includes(meta.value));

    mensagem = "Meta(s) deletada(s) com sucesso!";
};

// Função para mostrar mensagens para o usuário
const mostrarMensagem = () => {
    console.clear();
    if (mensagem != "") {
        console.log(mensagem);
        console.log("");
        mensagem = "";
    }
};

// Função principal que inicia o loop do menu
const start = async () => {
    await carregarMetas(); // Carrega as metas salvas ao iniciar o app

    const acoesMenu = {
        cadastrar: cadastrarMeta, // Ação de cadastrar uma meta
        listar: listarMetas, // Ação de listar metas
        realizadas: metasRealizadas, // Ação de mostrar metas realizadas
        abertas: metasAbertas, // Ação de mostrar metas abertas
        deletar: deletarMetas, // Ação de deletar metas
        sair: () => { console.log("Até a próxima!"); process.exit(); } // Ação para sair do app
    };

    while (true) { // Loop infinito para o menu
        mostrarMensagem(); // Exibe a mensagem ao usuário
        await salvarMetas(); // Salva as metas no arquivo após cada ação

        const opcao = await select({
            message: "Menu >", // Exibe o menu de opções
            choices: Object.keys(acoesMenu).map(key => ({ name: key.charAt(0).toUpperCase() + key.slice(1), value: key })), // Cria as opções do menu com base nas ações disponíveis
        });

        await acoesMenu[opcao](); // Executa a ação correspondente à escolha do usuário
    }
};

start(); // Inicia o programa