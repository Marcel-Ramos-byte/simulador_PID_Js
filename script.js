const setpointInput = document.getElementById('setpointInput');
const kpInput = document.getElementById('kpInput');
const kiInput = document.getElementById('kiInput');
const kdInput = document.getElementById('kdInput');
const pCheck = document.getElementById('pCheck');
const iCheck = document.getElementById('iCheck');
const dCheck = document.getElementById('dCheck');
const agua = document.getElementById('agua');
const nivelText = document.getElementById('nivel');
const botao = document.getElementById('botaoControle');
const explicacao = document.getElementById('explicacao');

const ctx = document.getElementById('grafico').getContext('2d');
let nivel = 0;
let setpoint = 80;
let erroAnterior = 0;
let somaErro = 0;
let kp = 0.5, ki = 0.1, kd = 0.05;
let ativo = false;
let pausado = false;
let passo = 1;
let tempo = 0;
let dadosNivel = [], dadosErro = [];

const entrada = document.getElementById('entrada');
const controlador = document.getElementById('controlador');
const atuador = document.getElementById('atuador');
const processo = document.getElementById('processo');
const saida = document.getElementById('saida');
const feedback = document.getElementById('feedback');

function resetFluxo() {
  nivel = 0;
  erroAnterior = 0;
  somaErro = 0;
  tempo = 0;
  dadosNivel = [];
  dadosErro = [];
  ctx.clearRect(0, 0, 400, 200);
  atualizarTanque();
  document.querySelectorAll('.bloco').forEach(el => el.classList.remove('ativo'));
}

function guiaDePassos() {
  if (pausado) {
    pausado = false;
    botao.textContent = "Pausar";
    executarEtapa();
    return;
  }

  if (ativo) {
    pausado = true;
    botao.textContent = "Retomar";
    return;
  }

  switch (passo) {
    case 1:
      explicacao.textContent = "Defina o setpoint desejado.";
      botao.textContent = "Próximo: Escolha o tipo de controle";
      passo++;
      break;
    case 2:
      explicacao.textContent = "Marque pelo menos o controle P, e opcionalmente I e D.";
      botao.textContent = "Próximo: Defina os parâmetros Kp, Ki, Kd";
      passo++;
      break;
    case 3:
      explicacao.textContent = "Ajuste os valores dos ganhos do controlador.";
      botao.textContent = "Iniciar Demonstração";
      passo++;
      break;
    case 4:
      if (!pCheck.checked && !iCheck.checked && !dCheck.checked) {
        alert("Selecione pelo menos o controle P.");
        return;
      }

      setpoint = parseFloat(setpointInput.value);
      kp = pCheck.checked ? parseFloat(kpInput.value) : 0;
      ki = iCheck.checked ? parseFloat(kiInput.value) : 0;
      kd = dCheck.checked ? parseFloat(kdInput.value) : 0;

      resetFluxo();
      ativo = true;
      botao.textContent = "Pausar";
      explicacao.textContent = "Simulação em andamento...";
      executarEtapa();
      break;
  }
}

function executarEtapa() {
  if (!ativo || pausado) return;

  entrada.classList.add("ativo");
  setTimeout(() => {
    entrada.classList.remove("ativo");
    controlador.classList.add("ativo");
    bombaLiga();
  }, 1000);
}

function bombaLiga() {
  if (!ativo || pausado) return;

  let erro = setpoint - nivel;
  somaErro += erro;
  let derivada = erro - erroAnterior;
  erroAnterior = erro;

  let acao = kp * erro + ki * somaErro + kd * derivada;
  acao = Math.max(0, Math.min(acao, 100));

  setTimeout(() => {
    controlador.classList.remove("ativo");
    atuador.classList.add("ativo");

    setTimeout(() => {
      atuador.classList.remove("ativo");
      processo.classList.add("ativo");
      encherTanque(acao);
    }, 1000);
  }, 1000);
}

function encherTanque(acao) {
  if (!ativo || pausado) return;

  nivel += acao * 0.02;
  nivel = Math.min(nivel, 100);
  atualizarTanque();

  setTimeout(() => {
    processo.classList.remove("ativo");
    saida.classList.add("ativo");

    setTimeout(() => {
      saida.classList.remove("ativo");
      feedback.classList.add("ativo");

      setTimeout(() => {
        feedback.classList.remove("ativo");
        atualizarGrafico();
        if (Math.abs(setpoint - nivel) < 0.5 || tempo > 1000) {
          finalizar();
        } else {
          executarEtapa();
        }
      }, 1000);
    }, 1000);
  }, 500);
}

function atualizarTanque() {
  agua.style.height = nivel + "%";
  nivelText.textContent = `Nível: ${nivel.toFixed(1)}%`;
}

function atualizarGrafico() {
  dadosNivel.push(nivel);
  dadosErro.push(setpoint - nivel);
  tempo++;
  desenharGrafico();
}

function desenharGrafico() {
  ctx.clearRect(0, 0, 400, 200);
  ctx.beginPath();
  ctx.moveTo(0, 200 - dadosNivel[0] * 2);
  for (let i = 1; i < dadosNivel.length; i++) {
    ctx.lineTo(i, 200 - dadosNivel[i] * 2);
  }
  ctx.strokeStyle = "#2196f3";
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 100 - dadosErro[0]);
  for (let i = 1; i < dadosErro.length; i++) {
    ctx.lineTo(i, 100 - dadosErro[i]);
  }
  ctx.strokeStyle = "#f44336";
  ctx.stroke();
}

function finalizar() {
  ativo = false;
  pausado = false;
  botao.textContent = "Reiniciar Demonstração";
  explicacao.textContent = "Simulação finalizada. Você pode alterar os parâmetros e iniciar novamente.";
  passo = 1;
}

botao.addEventListener("click", guiaDePassos);
