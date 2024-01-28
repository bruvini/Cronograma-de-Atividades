let atividadeEditando = null; // Variável para armazenar o índice da atividade em edição

// Função para adicionar ou editar uma atividade
function adicionarOuEditarAtividade() {
  const day = document.getElementById("day").value;
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;
  const description = document.getElementById("description").value;
  const activityType = document.getElementById("activityType").value;

  // Verificações
  if (startTime >= endTime) {
    alert("O horário de início deve ser anterior ao horário de término.");
    return;
  }

  const atividades = JSON.parse(localStorage.getItem("atividades")) || [];
  const conflito = atividades.some((atividade, index) => {
    if (atividadeEditando !== null && index === atividadeEditando) return false; // Ignorar a própria atividade ao editar
    return (
      atividade.day === day &&
      ((startTime >= atividade.startTime && startTime < atividade.endTime) ||
        (endTime > atividade.startTime && endTime <= atividade.endTime))
    );
  });

  if (conflito) {
    alert("Conflito de horários detectado!");
    return;
  }

  const atividade = { day, startTime, endTime, description, activityType };

  if (atividadeEditando !== null) {
    atividades[atividadeEditando] = atividade; // Atualizar atividade existente
    atividadeEditando = null; // Resetar a variável de edição
  } else {
    atividades.push(atividade); // Adicionar nova atividade
  }

  localStorage.setItem(
    "atividades",
    JSON.stringify(
      atividades.sort((a, b) => a.startTime.localeCompare(b.startTime))
    )
  );
  atualizarTabela(day);
  document.getElementById("activityForm").reset();
}

// Função para preencher o formulário para edição
function preencherFormularioParaEdicao(index) {
  const atividades = JSON.parse(localStorage.getItem("atividades")) || [];
  const atividade = atividades[index];
  document.getElementById("day").value = atividade.day;
  document.getElementById("startTime").value = atividade.startTime;
  document.getElementById("endTime").value = atividade.endTime;
  document.getElementById("description").value = atividade.description;
  document.getElementById("activityType").value = atividade.activityType;
  atividadeEditando = index; // Armazenar o índice da atividade que está sendo editada
}

// Função para atualizar a tabela
function atualizarTabela(diaSelecionado) {
  const atividades = JSON.parse(localStorage.getItem("atividades")) || [];
  const tabela = document.querySelector("#tabelaAtividades tbody");
  tabela.innerHTML = "";

  atividades
    .filter((atividade) => atividade.day === diaSelecionado)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .forEach((atividade, index) => {
      const linha = tabela.insertRow();
      linha.insertCell(
        0
      ).textContent = `${atividade.startTime} - ${atividade.endTime}`;
      linha.insertCell(1).textContent = atividade.description;
      const cellAcoes = linha.insertCell(2);
      cellAcoes.innerHTML = `<button onclick="preencherFormularioParaEdicao(${index})">Editar</button>
                       <button onclick="confirmarExclusao(${index})">Excluir</button>
                       <button onclick="marcarConcluida(${index}, event)">Concluir</button>`;

    });
}

// Função para excluir uma atividade com confirmação
function confirmarExclusao(index) {
  if (confirm("Tem certeza que deseja excluir esta atividade?")) {
    excluirAtividade(index);
  }
}

// Função para excluir uma atividade
function excluirAtividade(index) {
  let atividades = JSON.parse(localStorage.getItem("atividades")) || [];
  atividades.splice(index, 1);
  localStorage.setItem("atividades", JSON.stringify(atividades));
  atualizarTabela(document.getElementById("filtroDia").value);
}

// Função para marcar uma atividade como concluída
function marcarConcluida(index, event) {
    event.stopPropagation(); // Impede a propagação do evento

    const atividades = JSON.parse(localStorage.getItem('atividades')) || [];
    if (index < 0 || index >= atividades.length) return;

    const atividade = atividades[index];
    if (!atividade.concluida) {
        atividade.concluida = true;
        atividade.vezesConcluida = 1;
    } else {
        atividade.vezesConcluida += 1;
    }

    localStorage.setItem('atividades', JSON.stringify(atividades));
    atualizarRelatorio(atividades);
}



// Função para atualizar o relatório no localStorage
function atualizarRelatorio(atividades) {
    let relatorio = {};

    atividades.forEach(atividade => {
        if (!atividade.concluida || !atividade.vezesConcluida) return;
        const duracaoTotal = calcularDuracao(atividade.startTime, atividade.endTime) * atividade.vezesConcluida;
        if (!relatorio[atividade.day]) {
            relatorio[atividade.day] = {};
        }
        if (!relatorio[atividade.day][atividade.activityType]) {
            relatorio[atividade.day][atividade.activityType] = duracaoTotal;
        } else {
            relatorio[atividade.day][atividade.activityType] += duracaoTotal;
        }
    });

    localStorage.setItem('relatorio', JSON.stringify(relatorio));
}



// Função para baixar o relatório
function mostrarRelatorio() {
  const relatorio = JSON.parse(localStorage.getItem("relatorio")) || {};
  let relatorioTexto = "Relatório de Atividades:\n";

  Object.keys(relatorio).forEach((dia) => {
    let totalDia = 0;
    relatorioTexto += dia.charAt(0).toUpperCase() + dia.slice(1) + ":\n";
    Object.entries(relatorio[dia]).forEach(([tipo, duracao]) => {
      relatorioTexto += `  ${tipo}: ${formatarDuracao(duracao)}\n`;
      totalDia += duracao;
    });
    relatorioTexto += `  Total do Dia: ${formatarDuracao(totalDia)}\n\n`;
  });

  // Criar e exibir a janela modal com o relatório
  const modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.left = "50%";
  modal.style.top = "50%";
  modal.style.transform = "translate(-50%, -50%)";
  modal.style.backgroundColor = "#fff";
  modal.style.padding = "20px";
  modal.style.border = "1px solid #ddd";
  modal.style.zIndex = "1000";
  modal.innerHTML = `<div>${relatorioTexto}</div><button onclick="fecharModal()">Fechar</button>`;

  document.body.appendChild(modal);
}

// Função para fechar a janela modal
function fecharModal() {
  const modal = document.querySelector('div[style*="position: fixed"]');
  if (modal) {
    modal.remove();
  }
}

// Adicionar um botão para mostrar o relatório
document.addEventListener("DOMContentLoaded", function () {
  const botaoRelatorio = document.createElement("button");
  botaoRelatorio.textContent = "Mostrar Relatório";
  botaoRelatorio.onclick = mostrarRelatorio;
  document.getElementById("tabelaAtividades").appendChild(botaoRelatorio);
});

function calcularDuracao(startTime, endTime) {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  return endHours + endMinutes / 60 - (startHours + startMinutes / 60);
}

function formatarDuracao(duracao) {
  const horas = Math.floor(duracao);
  const minutos = Math.round((duracao - horas) * 60);
  return `${horas}h ${minutos}min`;
}

// Event listeners para o formulário e o filtro
document
  .getElementById("activityForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    adicionarOuEditarAtividade();
  });

document.getElementById("filtroDia").addEventListener("change", function () {
  atualizarTabela(this.value);
});

// Carregar a tabela com as atividades do dia atual ao inicializar a página
document.addEventListener("DOMContentLoaded", function () {
  const hoje = new Date()
    .toLocaleDateString("pt-BR", { weekday: "long" })
    .toLowerCase();
  document.getElementById("filtroDia").value = hoje;
  atualizarTabela(hoje);
});
