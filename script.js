// --- SÍNTESE DE ÁUDIO & SOM DE CHUVA AMBIENTE NOIR VIA WEB AUDIO API ---
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.rainGain = null;
        this.rainNode = null;
        this.isRainPlaying = false;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playClick() {
        if (!this.enabled) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    playSuccess() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.1);
        osc.frequency.setValueAtTime(659.25, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + 0.4);
    }

    playError() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.setValueAtTime(100, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + 0.3);
    }

    toggleRain() {
        this.init();
        if (this.isRainPlaying) {
            if (this.rainNode) this.rainNode.stop();
            this.isRainPlaying = false;
            return false;
        } else {
            const bufferSize = 2 * this.ctx.sampleRate;
            const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            this.rainNode = this.ctx.createBufferSource();
            this.rainNode.buffer = noiseBuffer;
            this.rainNode.loop = true;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, this.ctx.currentTime);

            this.rainGain = this.ctx.createGain();
            this.rainGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

            this.rainNode.connect(filter);
            filter.connect(this.rainGain);
            this.rainGain.connect(this.ctx.destination);

            this.rainNode.start();
            this.isRainPlaying = true;
            return true;
        }
    }
}

const audio = new SoundEngine();

// --- ESTADO DO JOGO E PERSISTÊNCIA ---
let gameState = {
    unlockedCases: ["caso_001"],
    solvedCases: [],
    caseStars: {},
    hintsAvailable: 3,
    currentCaseId: null
};

let caseTimer = {
    seconds: 0,
    interval: null
};

function startTimer() {
    stopTimer();
    caseTimer.seconds = 0;
    updateTimerDisplay();
    caseTimer.interval = setInterval(() => {
        caseTimer.seconds++;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (caseTimer.interval) {
        clearInterval(caseTimer.interval);
        caseTimer.interval = null;
    }
}

function updateTimerDisplay() {
    const mins = Math.floor(caseTimer.seconds / 60).toString().padStart(2, '0');
    const secs = (caseTimer.seconds % 60).toString().padStart(2, '0');
    const timerElem = document.getElementById("case-timer-display");
    if (timerElem) timerElem.innerText = `⏱️ ${mins}:${secs}`;
}

function loadProgress() {
    const saved = localStorage.getItem("arquivo_criminal_progress_v5");
    if (saved) {
        try {
            gameState = JSON.parse(saved);
        } catch (e) {
            console.error("Erro ao carregar progresso", e);
        }
    }
}

function saveProgress() {
    localStorage.setItem("arquivo_criminal_progress_v5", JSON.stringify(gameState));
    updateHeaderStats();
}

function updateHeaderStats() {
    const hintsElem = document.getElementById("hints-count-display");
    if (hintsElem) hintsElem.innerText = `💡 Lupas: ${gameState.hintsAvailable}`;

    const solvedCount = gameState.solvedCases.length;
    let rankText = "DETETIVE NOVATO";
    if (solvedCount >= 12) rankText = "DETETIVE CHEFE";
    else if (solvedCount >= 8) rankText = "AGENTE ESPECIAL";
    else if (solvedCount >= 4) rankText = "INVESTIGADOR DE CAMPO";

    const rankElem = document.getElementById("player-rank-display");
    if (rankElem) rankElem.innerText = rankText;
}

// --- MODAL CENTRALIZADO ---
function showModal(title, message, type = "warning", onConfirm = null) {
    const modal = document.getElementById("custom-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalMessage = document.getElementById("modal-message");
    const modalStamp = document.getElementById("modal-stamp");
    const modalActions = document.getElementById("modal-actions");

    modalTitle.innerText = title;
    modalMessage.innerText = message;
    modalStamp.innerText = type === "success" ? "SUCESSO" : (type === "error" ? "ERRO" : "AVISO");
    modalStamp.className = `modal-stamp ${type === 'success' ? 'success' : ''}`;

    modalActions.innerHTML = "";
    
    if (onConfirm) {
        const btnYes = document.createElement("button");
        btnYes.className = "btn-primary";
        btnYes.innerText = "SIM, APAGAR";
        btnYes.onclick = () => {
            closeModal();
            onConfirm();
        };

        const btnNo = document.createElement("button");
        btnNo.className = "btn-sec";
        btnNo.innerText = "CANCELAR";
        btnNo.onclick = closeModal;

        modalActions.appendChild(btnYes);
        modalActions.appendChild(btnNo);
    } else {
        const btnOk = document.createElement("button");
        btnOk.className = "btn-primary";
        btnOk.innerText = "ENTENDIDO";
        btnOk.onclick = closeModal;
        modalActions.appendChild(btnOk);
    }

    modal.classList.add("active");
}

function closeModal() {
    document.getElementById("custom-modal").classList.remove("active");
}

function resetFormFields() {
    const motiveInput = document.getElementById("motive-input");
    if (motiveInput) motiveInput.value = "";

    const cipherInput = document.getElementById("cipher-input");
    if (cipherInput) cipherInput.value = "";

    const suspectSelect = document.getElementById("suspect-select");
    if (suspectSelect) suspectSelect.selectedIndex = 0;

    const board = document.getElementById("evidence-board");
    if (board) board.classList.remove("uv-active");
    
    const uvBtn = document.getElementById("btn-toggle-uv");
    if (uvBtn) {
        uvBtn.classList.remove("active");
        uvBtn.innerText = "💡 Ativar Luz UV";
    }

    // Reset controles de impressões digitais
    const fpAngle = document.getElementById("fp-angle");
    const fpZoom = document.getElementById("fp-zoom");
    if (fpAngle) fpAngle.value = 45;
    if (fpZoom) fpZoom.value = 15;
    updateFPTransform();
}

// --- MINIGAME DE PERÍCIA DIGITAL ---
function updateFPTransform() {
    const angle = document.getElementById("fp-angle").value;
    const zoom = (document.getElementById("fp-zoom").value / 10).toFixed(1);

    document.getElementById("angle-val").innerText = `${angle}°`;
    document.getElementById("zoom-val").innerText = `${zoom}x`;

    const userLayer = document.getElementById("fp-user");
    if (userLayer) {
        userLayer.style.transform = `rotate(${angle}deg) scale(${zoom})`;
    }
}

// --- BANCO DE DADOS COMPLETO DOS 12 CASOS ---
const CASES_DATA = [
    {
        id: "caso_001",
        number: "CASO #001",
        title: "O Enigma da Partitura",
        description: "Um renomado maestro foi encontrado desacordado em seu camarim trancado no Teatro Municipal.",
        crimeReport: "O Maestro Victor foi atingido na cabeça durante o intervalo do espetáculo. A porta estava trancada por dentro e a única janela dava para o beco. No chão, havia uma partitura rasgada com notas musicais destacadas em vermelho e um relógio quebrado marcando 21:15.",
        headline: "CRIME NO TEATRO: MAESTRO É ATACADO EM CAMARIM TRANCADO!",
        evidences: [
            { icon: "🎼", title: "Partitura Rasgada", desc: "Notas circuladas em vermelho: MI - LÁ - RÉ - SI.", uvDetail: "🔍 UV: Há uma digital com resíduo de batom vermelho na borda rasgada." },
            { icon: "⌚", title: "Relógio Parado", desc: "Vidro trincado, parado exatamente às 21:15.", uvDetail: "🔍 UV: Fios de fibra sintética presos na fivela de couro." },
            { icon: "🍷", title: "Taça de Vinho", desc: "Duas taças na mesa. Uma limpa e outra com batom vermelho.", uvDetail: "🔍 UV: O batom na taça contém os mesmos pigmentos da pauta musical." }
        ],
        cipherType: "text",
        cipherTitle: "CÓDIGO DE NOTAS MUSICAIS",
        cipherDesc: "As notas na partitura (MI, LÁ, RÉ, SI) correspondem à cifra de letras (E-A-D-B). Qual palavra de 4 letras as notas formam ao reordenar?",
        cipherAnswer: "BEAD",
        secretClue: "💡 DICA DESCOBERTA: A análise da partitura revela que o batom na taça e o relógio parado às 21:15 coincidem com a saída da primeira cantora.",
        suspects: [
            { 
                id: "s1", name: "Helena (Soprano)", role: "Primeira Cantora", 
                questions: [
                    { q: "Onde você estava às 21:15?", a: "Eu estava no palco até às 21:10 e depois fui retocar a maquiagem." },
                    { q: "Este batom vermelho na taça é seu?", a: "Sim, tomei um gole com o maestro antes do show, mas saí antes das 21:00!" }
                ] 
            },
            { 
                id: "s2", name: "Roberto (Pianista)", role: "Músico Auxiliar", 
                questions: [
                    { q: "Você esteve no camarim do maestro?", a: "Não! Estava afinando o piano no fosso das 21:00 às 21:30." },
                    { q: "Viu alguém no corredor?", a: "Ouvi passos apressados de salto alto por volta das 21:15." }
                ] 
            },
            { 
                id: "s3", name: "Carlos (Zelador)", role: "Manutenção", 
                questions: [
                    { q: "A porta do camarim estava trancada?", a: "Sim, passei limpando às 21:15 e vi Helena saindo apressada." },
                    { q: "O relógio do camarim já estava quebrado?", a: "Ainda estava funcionando quando passei às 21:00." }
                ] 
            }
        ],
        correctCulprit: "s1",
        solutionSummary: "Helena mentiu sobre o horário. O batom na taça e o relógio parado às 21:15 provam que ela esteve no camarim antes de ir ao palco, colidindo com o depoimento do zelador."
    },
    {
        id: "caso_002",
        number: "CASO #002",
        title: "A Mímica do Culpado",
        description: "O Diamante Negro foi roubado da Galeria de Arte. As câmeras registraram o ladrão fazendo gestos estranhos.",
        crimeReport: "A joia desapareceu durante o blackout das 22:00. A câmera de segurança com bateria de emergência gravou o suspeito sem som antes do alarme tocar. Ele fez gestos com as mãos imitando objetos específicos.",
        headline: "O ROUBO DA DÉCADA: DIAMANTE NEGRO SUME DA GALERIA!",
        evidences: [
            { icon: "💎", title: "Pedestal Vazio", desc: "Vidro cortado com precisão a laser.", uvDetail: "🔍 UV: Marcas amarelas luminescentes no pedestal." },
            { icon: "📹", title: "Gravação Silenciosa", desc: "O suspeito faz gestos: primeiro imita 'VOLANTE', depois 'TESOURA' e por fim 'LIVRO'.", uvDetail: "🔍 UV: Reflexo amarelado nos óculos do suspeito." },
            { icon: "🧤", title: "Luva de Pelica", desc: "Encontrada no duto de ventilação com resíduos de tinta amarela.", uvDetail: "🔍 UV: Tinta fresca de restauração de quadros." }
        ],
        cipherType: "mimic",
        cipherTitle: "ANÁLISE MÍMICA DO LÁDRÃO",
        cipherDesc: "Identifique o significado dos 3 gestos em sequência gravados pela câmera de segurança. Sem vírgula",
        mimicIcon: "🚗 ✂️ 📖",
        cipherAnswer: "DIRIGIR CORTAR LER",
        secretClue: "💡 DICA DESCOBERTA: A mímica comprova que o autor do crime domina técnicas de corte de precisão e manuseio de tintas de restauração.",
        suspects: [
            { 
                id: "s1", name: "Marcos (Pintor)", role: "Restaurador de Arte", 
                questions: [
                    { q: "O que é essa tinta nas suas mãos?", a: "Estava restaurando o quadro da recepção às 21:30 com tinta amarela." },
                    { q: "Sabe cortar vidros?", a: "Como restaurador, uso estiletes de precisão para cortar telas e quadros." }
                ] 
            },
            { 
                id: "s2", name: "Lucas (Segurança)", role: "Vigilante Noturno", 
                questions: [
                    { q: "Onde estava no blackout?", a: "Estava na sala de controle tentando religar os disjuntores." },
                    { q: "Entende de mímica?", a: "Não entendo nada de arte ou mímica." }
                ] 
            },
            { 
                id: "s3", name: "Sônia (Colecionadora)", role: "Visitante VIP", 
                questions: [
                    { q: "O que fazia no saguão?", a: "Estava apenas lendo o catálogo da exposição com a lanterna do celular." },
                    { q: "Viu o restaurador?", a: "Vi Marcos perto dos dutos de ar antes da luz apagar." }
                ] 
            }
        ],
        correctCulprit: "s1",
        solutionSummary: "Marcos usou o conhecimento de corte e tinta amarela encontrada nas luvas. Os gestos indicavam o plano de fuga de quem conhecia a estrutura da galeria."
    },
    {
        id: "caso_003",
        number: "CASO #003",
        title: "A Última Jogada",
        description: "O mestre de xadrez Igor Petrov foi envenenado durante uma partida decisiva.",
        crimeReport: "Petrov caiu sobre o tabuleiro durante o movimento 34. Na mesa havia um copo de chá pela metade, um bispo preto caído fora da casa e um bilhete escrito em código numérico.",
        headline: "TRAGÉDIA NO TABULEIRO: ENXADRISTA CAMPEÃO É ENVENENADO!",
        evidences: [
            { icon: "♟️", title: "Tabuleiro de Xadrez", desc: "O Rei branco estava sob xeque-mate iminente.", uvDetail: "🔍 UV: O bispo preto contém pozinho de adoçante industrial." },
            { icon: "🍵", title: "Xícara de Chá", desc: "Continha vestígios de amêndoas amargas (cianeto).", uvDetail: "🔍 UV: Resíduos químicos concentrados na borda da xícara." },
            { icon: "📜", title: "Bilhete em Código", desc: "Números anotados: 05 - 18 - 18 - 05.", uvDetail: "🔍 UV: Letra compatível com o caderno de treinos do técnico." }
        ],
        cipherType: "text",
        cipherTitle: "DECODIFICAÇÃO NUMÉRICA (A=1, B=2...)",
        cipherDesc: "Converta os números 05 - 18 - 18 - 05 para letras do alfabeto e descubra a palavra.",
        cipherAnswer: "ERRO",
        secretClue: "💡 DICA DESCOBERTA: O bilhete numérico aponta falhas críticas no preparo do chá, inocentando os árbitros e culpando quem teve contato direto prévio com a xícara.",
        suspects: [
            { 
                id: "s1", name: "Dmitri (Oponente)", role: "Enxadrista Rival", 
                questions: [
                    { q: "Você tocou no chá dele?", a: "Nunca! Ele mesmo serviu da própria garrafa térmica." },
                    { q: "Vocês estavam brigando?", a: "Apenas disputando o título no tabuleiro!" }
                ] 
            },
            { 
                id: "s2", name: "Olga (Garçom/Juíza)", role: "Árbitra da Partida", 
                questions: [
                    { q: "Quem brought a garrafa de água?", a: "Eu trouxe a água quente lacrada a pedido do Petrov às 20:00." },
                    { q: "Viu alguém mexer no chá?", a: "O técnico dele colocou as gotas de adoçante como sempre faz." }
                ] 
            },
            { 
                id: "s3", name: "Viktor (Técnico)", role: "Treinador de Petrov", 
                questions: [
                    { q: "O que você colocou no chá dele?", a: "Apenas adoçante comum antes da partida começar!" },
                    { q: "Por que você escreveu no bilhete?", a: "Estava anotando lances da partida..." }
                ] 
            }
        ],
        correctCulprit: "s3",
        solutionSummary: "Viktor tinha acesso direto ao chá antes da partida e usou o adoçante para camuflar o gosto do cianeto."
    },
    {
        id: "caso_004",
        number: "CASO #004",
        title: "O Cofre do Banqueiro",
        description: "Um cofre blindado foi aberto sem arrombamento na mansão do financista Arthur Vance.",
        crimeReport: "Nenhum alarme disparou e a senha de 4 dígitos foi digitada corretamente. Na mesa do escritório havia um livro de matemática aberto na página 42 com um marcador de texto.",
        headline: "MANSÃO INVASÃO: COFRE BLINDADO É LIMPO SEM ARROMBAMENTO!",
        evidences: [
            { icon: "📖", title: "Livro de Matemática", desc: "Página 42 destacando os números primos: 2, 3, 5, 7.", uvDetail: "🔍 UV: Impressão digital de óleo térmico de servidor." },
            { icon: "💻", title: "Terminal do Cofre", desc: "Último acesso remoto via rede local às 02:00.", uvDetail: "🔍 UV: IP interno correspondente ao departamento de TI." },
            { icon: "☕", title: "Caneca Térmica", desc: "Ainda fumegante, com resíduos de café forte.", uvDetail: "🔍 UV: Batom de café especial usado pela equipe da madrugada." }
        ],
        cipherType: "text",
        cipherTitle: "SENHA NUMÉRICA DO COFRE",
        cipherDesc: "A senha consiste na soma dos quatro primeiros números primos destacados no livro. Qual é o resultado numérico?",
        cipherAnswer: "17",
        secretClue: "💡 DICA DESCOBERTA: A senha calculada valida o padrão numérico de acesso que apenas operadores com privilégios avançados de rede conheciam.",
        suspects: [
            { 
                id: "s1", name: "Bernardo (Sócio)", role: "Vice-Presidente", 
                questions: [
                    { q: "Onde estava às 02:00?", a: "Estava em casa dormindo quando o alarme silencioso foi acionado." },
                    { q: "Sabe a senha do cofre?", a: "Apenas o Arthur sabia a combinação física." }
                ] 
            },
            { 
                id: "s2", name: "Clara (Filha)", role: "Herdeira", 
                questions: [
                    { q: "Estava estudando matemática?", a: "Sim, tenho prova na universidade amanhã cedo." },
                    { q: "Acessou o computador do pai?", a: "Não tenho permissão na rede do escritório." }
                ] 
            },
            { 
                id: "s3", name: "Daniel (TI da Empresa)", role: "Engenheiro de Redes", 
                questions: [
                    { q: "Por que acessou os servidores às 02:00?", a: "Estava fazendo manutenção remota de rotina na rede." },
                    { q: "Acessou o terminal do cofre?", a: "Apenas monitorei a estabilidade dos cabos!" }
                ] 
            }
        ],
        correctCulprit: "s3",
        solutionSummary: "Daniel alegou manutenção de rede às 02:00, horário exato do acesso remoto ao cofre, usando seu conhecimento técnico."
    },
    {
        id: "caso_005",
        number: "CASO #005",
        title: "Silêncio no Laboratório",
        description: "O cientista chefe foi encontrado desmaiado após o roubo da fórmula do antídoto.",
        crimeReport: "O laboratório foi invadido. O cientista acordou com amnésia parcial, mas lembrava que o intruso usava uma máscara de gás e gesticulava muito antes de aplicar o sedativo.",
        headline: "FÓRMULA SECRETA ROUBADA DO LABORATORIO DA UNIVERSIDADE!",
        evidences: [
            { icon: "🧪", title: "Bureta Quebrada", desc: "Líquido azul espalhado na bancada.", uvDetail: "🔍 UV: Escamas de peixe brilhantes presas nos estilhaços." },
            { icon: "📹", title: "Câmera de Segurança", desc: "O intruso fez mímica de 'PESCAR', 'CORRER' e 'SILÊNCIO' antes de cortar os fios.", uvDetail: "🔍 UV: Silhueta idêntica ao uniforme do vigilante noturno." },
            { icon: "🥾", title: "Pegada de Lama", desc: "Terra vermelha típica do canteiro de obras externo.", uvDetail: "🔍 UV: Resíduos de barro de beira de lago." }
        ],
        cipherType: "mimic",
        cipherTitle: "MÍMICA DO INTRUSO",
        cipherDesc: "Descreva os três verbos gesticulados pelo invasor separados por espaço (Ex: PESCAR CORRER SILENCIAR).",
        mimicIcon: "🎣 🏃 🤫",
        cipherAnswer: "PESCAR CORRER SILENCIAR",
        secretClue: "💡 DICA DESCOBERTA: A mímica desmascara o álibi falso, pois os gestos revelam um hobby específico praticado fora do expediente institucional.",
        suspects: [
            { 
                id: "s1", name: "Dr. Hélio", role: "Pesquisador Sênior", 
                questions: [
                    { q: "Qual era seu trabalho à noite?", a: "Fiquei no laboratório B testando compostos químicos." },
                    { q: "Gosta de pescar?", a: "Não, tenho alergia a frutos do mar e peixes." }
                ] 
            },
            { 
                id: "s2", name: "Júlio (Segurança do Setor)", role: "Vigilante", 
                questions: [
                    { q: "Onde estava às 23:00?", a: "Fui pescar no lago da universidade no meu horário de folga." },
                    { q: "Por que há escamas de peixe no laboratório?", a: "Minhas botas deviam estar sujas da pescaria..." }
                ] 
            },
            { 
                id: "s3", name: "Beatriz (Estagiária)", role: "Assistente", 
                questions: [
                    { q: "Viu a invasão?", a: "Estava no dormitório estudando para a prova de química." },
                    { q: "Tinha a chave do antídoto?", a: "Não, apenas os pesquisadores e o chefe tínhamos." }
                ] 
            }
        ],
        correctCulprit: "s2",
        solutionSummary: "Júlio usou a desculpa de pescar, o que coincidiu perfeitamente com a mímica de pesca feita na câmera de segurança."
    },
    {
        id: "caso_006",
        number: "CASO #006",
        title: "O Relíquia do Museu",
        description: "Uma estatueta egípcia sumiu da vitrine principal durante a visitação pública.",
        crimeReport: "A sala estava cheia de turistas. Ninguém viu a peça sair, mas um bilhete cifrado foi deixado no pedestal vazio.",
        headline: "MISTÉRIO NO MUSEU: ESTATUETA EGÍPCIA DESAPARECE EM PLENA LUZ DO DIA!",
        evidences: [
            { icon: "🗿", title: "Pedestal Vazio", desc: "Área limpa de poeira.", uvDetail: "🔍 UV: Tinta invisível usada em canetas de turismo internacional." },
            { icon: "📜", title: "Bilhete Cifrado", desc: "Mensagem codificada com deslocamento César (+3): 'KHOO'.", uvDetail: "🔍 UV: Marca d'água de passaporte estrangeiro." },
            { icon: "🎫", title: "Ingresso Rasgado", desc: "Pertencente ao último grupo de visitantes guiados.", uvDetail: "🔍 UV: Horário impresso: 16:45." }
        ],
        cipherType: "text",
        cipherTitle: "CIFRA DE CÉSAR (DESLOCAMENTO +3)",
        cipherDesc: "Decodifique a palavra 'KHOO' voltando 3 letras no alfabeto (K->H, H->E, etc.). Qual é a palavra?",
        cipherAnswer: "HELL",
        secretClue: "💡 DICA DESCOBERTA: A decodificação da mensagem em idioma estrangeiro aponta diretamente para o perfil de visitantes fluentes em línguas ocidentais específicas.",
        suspects: [
            { 
                id: "s1", name: "Professor Bruno", role: "Historiador", 
                questions: [
                    { q: "Onde estava durante o roubo?", a: "Estava guiando o grupo 3 de visitantes na ala romana." },
                    { q: "Escreveu o bilhete?", a: "Minhas cifras de estudo são acadêmicas, não uso gírias em inglês." }
                ] 
            },
            { 
                id: "s2", name: "Amanda", role: "Turista Estrangeira", 
                questions: [
                    { q: "Fala inglês fluente?", a: "Yes, sou professora de idiomas na Califórnia." },
                    { q: "Por que estava perto do pedestal?", a: "Estava tirando fotos com a minha câmera profissional." }
                ] 
            },
            { 
                id: "s3", name: "Paulo", role: "Guarda da Galeria", 
                questions: [
                    { q: "Viu alguém suspeito?", a: "Fiquei postado na entrada principal e ninguém saiu com bolsas grandes." },
                    { q: "Sabe decifrar códigos?", a: "Não faço ideia do que 'KHOO' significa." }
                ] 
            }
        ],
        correctCulprit: "s2",
        solutionSummary: "Amanda utilizou termos em inglês na cifra deixada para despistar a polícia, revelando seu domínio de códigos linguísticos."
    },
    {
        id: "caso_007",
        number: "CASO #007",
        title: "O Apagão no Hotel",
        description: "Um colar de pérolas foi levado do cofre do quarto 502 durante um blecaute repentino.",
        crimeReport: "As luzes do hotel apagaram por exatamente 3 minutos. Quando voltaram, o colar sumiu. A porta não foi forçada.",
        headline: "FURTO NO QUARTO 502: JOIAS SUMIRAM DURANTE BLECAUTE NO HOTEL!",
        evidences: [
            { icon: "🔑", title: "Chave Magnética", desc: "O registro do cartão mostra acesso às 21:05 usando a chave mestre da gerência.", uvDetail: "🔍 UV: Código de barras exclusivo do escritório do gerente." },
            { icon: "🔦", title: "Lanterna Tática", desc: "Encontrada com impressões digitais parciais no carpete.", uvDetail: "🔍 UV: Número de série pertence ao almoxarifado do hotel." },
            { icon: "📝", title: "Anotação Rasgada", desc: "Contém números binários: 01000011.", uvDetail: "🔍 UV: Caractere impresso 'C' correspondente a Central." }
        ],
        cipherType: "text",
        cipherTitle: "CONVERSÃO BINÁRIA PARA CARACTERE",
        cipherDesc: "O código binário '01000011' representa qual letra maiúscula no formato ASCII?",
        cipherAnswer: "C",
        secretClue: "💡 DICA DESCOBERTA: O caractere binário decodificado confirma que o acesso digital foi gerado nos terminais administrativos centrais.",
        suspects: [
            { 
                id: "s1", name: "Renato (Gerente)", role: "Administrador", 
                questions: [
                    { q: "Onde estava a chave mestre?", a: "No cofre da recepção, sob minha supervisão pessoal." },
                    { q: "Por que a chave mestre registrou acesso às 21:05?", a: "Pode ter sido um erro do sistema eletrônico!" }
                ] 
            },
            { 
                id: "s2", name: "Camila (Hóspede)", role: "Empresária", 
                questions: [
                    { q: "O que fez no apagão?", a: "Fiquei no meu quarto escuro usando o celular." },
                    { q: "Conhece a vítima?", a: "Apenas de vista nas reuniões do hotel." }
                ] 
            },
            { 
                id: "s3", name: "Fábio (Eletricista)", role: "Manutenção", 
                questions: [
                    { q: "O que causou o blecaute?", a: "O disjuntor principal no subsolo desarmou por sobrecarga." },
                    { q: "Tinha acesso à chave mestre?", a: "Não, eletricistas usam apenas cartões de serviço comuns." }
                ] 
            }
        ],
        correctCulprit: "s1",
        solutionSummary: "Apenas o gerente possuía a chave mestre registrada no sistema eletrônico para abrir o quarto sem arrombamento."
    },
    {
        id: "caso_008",
        number: "CASO #008",
        title: "A Última Transmissão",
        description: "Um operador de rádio clandestino foi silenciado em seu estúdio isolado.",
        crimeReport: "A transmissão foi interrompida no meio da frase. No painel de controle, restou uma sequência de pontos e traços gravada no gravador de fita.",
        headline: "RÁDIO CORREDOR SILENCIADA: OPERADOR É INTERROMPIDO NO AR!",
        evidences: [
            { icon: "📻", title: "Rádio Transmissor", desc: "Superaquecido por uso contínuo.", uvDetail: "🔍 UV: Lacre oficial de apreensão de telecomunicações pisotado." },
            { icon: "📼", title: "Fita Cassete", desc: "Áudio final com código Morse: '... --- ...'.", uvDetail: "🔍 UV: Frequência oficial do órgão regulador gravada em fundo." },
            { icon: "☕", title: "Xícara Quebrada", desc: "Estilhaços espalhados perto da mesa de som.", uvDetail: "🔍 UV: Impressões de luvas de carimbo oficial." }
        ],
        cipherType: "text",
        cipherTitle: "CÓDIGO MORSE UNIVERSAL",
        cipherDesc: "O código Morse '... --- ...' é o sinal internacional universal de socorro. Qual palavra ele representa?",
        cipherAnswer: "SOS",
        secretClue: "💡 DICA DESCOBERTA: O sinal descodificado prova que a interrupção foi forçada por autoridades com jurisdição regulatória.",
        suspects: [
            { 
                id: "s1", name: "Marcelo (Técnico Rival)", role: "Operador Concorrente", 
                questions: [
                    { q: "Estava transmitindo na mesma hora?", a: "Sim, no canal 104 FM, longe do estúdio dele." },
                    { q: "O que achava da rádio dele?", a: "Era clandestina, mas eu não interferia." }
                ] 
            },
            { 
                id: "s2", name: "Juliana (Ex-parceira)", role: "Radialista", 
                questions: [
                    { q: "Por que foi ao estúdio?", a: "Fui apenas deixar uns discos antigos e saí antes do programa ir ao ar." },
                    { q: "Ouviu a transmissão?", a: "Ouvi o pedido de socorro pelo rádio do carro!" }
                ] 
            },
            { 
                id: "s3", name: "Otávio (Fiscal)", role: "Agente Regulador", 
                questions: [
                    { q: "Qual era seu objetivo às 22:00?", a: "Fui lacrar a rádio clandestina por irregularidades graves de outorga." },
                    { q: "Precisa cortar a transmissão à força?", a: "Segui rigorosamente o protocolo da agência!" }
                ] 
            }
        ],
        correctCulprit: "s3",
        solutionSummary: "Otávio usou sua autoridade de fiscal para invadir e interromper a transmissão ilegal, silenciando o operador."
    },
    {
        id: "caso_009",
        number: "CASO #009",
        title: "O Mistério do Cofre Central",
        description: "O maior assalto da história do Banco Metropolitano ocorreu sem disparar nenhum alarme silencioso.",
        crimeReport: "O cofre principal foi aberto por dentro. Os cofres particulares foram esvaziados. Na mesa do diretor, uma charada final aguardava o detetive.",
        headline: "GOLPE MILIONÁRIO NO BANCO METROPOLITANO: COFRE ABERTO POR DENTRO!",
        evidences: [
            { icon: "💰", title: "Sacos de Ouro Vazios", desc: "Alinhados em ordem decrescente no chão do cofre.", uvDetail: "🔍 UV: Fibra de jaleco exclusivo da tesouraria central." },
            { icon: "🧩", title: "Quebra-Cabeça Numérico", desc: "Sequência lógica: 2, 4, 8, 16, 32, ?", uvDetail: "🔍 UV: A constante da progressão equivale ao código do cofre noturno." },
            { icon: "📋", title: "Plano de Fuga", desc: "Desenho detalhado do duto de esgoto subterrâneo.", uvDetail: "🔍 UV: Carimbo de aprovação da chefia de operações." }
        ],
        cipherType: "text",
        cipherTitle: "SEQUÊNCIA LÓGICA DO COFRE",
        cipherDesc: "Qual é o próximo número na progressão geométrica: 2, 4, 8, 16, 32, ...?",
        cipherAnswer: "64",
        secretClue: "💡 DICA DESCOBERTA: O cálculo da progressão revela a chave matemática exata utilizada para programar o timer de abertura interna dos cofres.",
        suspects: [
            { 
                id: "s1", name: "Eduardo (Diretor Executivo)", role: "Diretor do Banco", 
                questions: [
                    { q: "Onde estava à meia-noite?", a: "Estava reunido com o conselho fiscal na sede corporativa." },
                    { q: "Tem a chave do cofre central?", a: "Apenas a tesouraria tem a combinação de auditoria noturna." }
                ] 
            },
            { 
                id: "s2", name: "Vanessa (Tesoureira)", role: "Chefe de Operações", 
                questions: [
                    { q: "Você tem a combinação mestre?", a: "Sim, para testes de auditoria quinzenais." },
                    { q: "Por que usou seu código às 23:45?", a: "Estava apenas conferindo o livro caixa..." }
                ] 
            },
            { 
                id: "s3", name: "Ricardo (Consultor de Segurança)", role: "Especialista Externo", 
                questions: [
                    { q: "Como o alarme não disparou?", a: "O alarme só pode ser desligado com credencial mestre interna." },
                    { q: "A que horas saiu do banco?", a: "Saí às 18:00 logo após os testes do sistema." }
                ] 
            }
        ],
        correctCulprit: "s2",
        solutionSummary: "Vanessa usou sua combinação mestre de auditoria e o conhecimento exato do sistema para burlar os cofres por dentro."
    },
    {
        id: "caso_010",
        number: "CASO #010",
        title: "O Veneno do Leilão",
        description: "Um bilionário desmaiou após beber um drinque comemorativo no Leilão de Antiguidades.",
        crimeReport: "Lord Harrington caiu após dar o primeiro gole no seu taça de uísque. No aparador havia um frasco de colírio vazio com resíduos de arsênico e uma lista de lances rasgada.",
        headline: "ESCÂNDALO NO LEILÃO: BILIONÁRIO É ENVENENADO EM EVENTO EXCLUSIVO!",
        evidences: [
            { icon: "🥃", title: "Copo de Uísque", desc: "Continha vestígios pesados de veneno amargo.", uvDetail: "🔍 UV: Impressões de luva de garçom VIP." },
            { icon: "👁️", title: "Frasco de Colírio", desc: "Usado para dosar o veneno gota a gota.", uvDetail: "🔍 UV: Rótulo de farmácia da zona norte." },
            { icon: "📑", title: "Lista de Lances", desc: "Valor final arrematado: 500 mil dólares.", uvDetail: "🔍 UV: Assinatura do avaliador oficial." }
        ],
        cipherType: "text",
        cipherTitle: "CÓDIGO ANAGRAMA DO DRINQUE",
        cipherDesc: "Reordene as letras da palavra 'ARSEN' para encontrar o nome do mineral nocivo de 5 letras.",
        cipherAnswer: "AR SEN",
        secretClue: "💡 DICA DESCOBERTA: A dosagem de veneno pelo frasco de colírio exige conhecimento de manipulação farmacêutica.",
        suspects: [
            { 
                id: "s1", name: "Felipe (Garçom VIP)", role: "Atendente do Salão", 
                questions: [
                    { q: "Quem preparou a bebida?", a: "O barman preparou, eu apenas levei até a mesa do Lord." },
                    { q: "Notou algo estranho no copo?", a: "Apenas que o frasco do garçom caiu perto do balcão." }
                ] 
            },
            { 
                id: "s2", name: "Dr. Maurício (Avaliador)", role: "Farmacêutico e Perito", 
                questions: [
                    { q: "Sabe algo sobre o frasco de colírio?", a: "Uso colírio manipulado para os olhos, mas perdi o meu no leilão." },
                    { q: "Por que perdeu o leilão do quadro?", a: "Lord Harrington cobriu meu lance no último segundo!" }
                ] 
            },
            { 
                id: "s3", name: "Tereza (Rival)", role: "Colecionadora", 
                questions: [
                    { q: "Onde estava durante o brindes?", a: "Estava conversando com a imprensa no saguão." },
                    { q: "Você conhecia a bebida dele?", a: "Todos sabem que ele só bebe uísque puro." }
                ] 
            }
        ],
        correctCulprit: "s2",
        solutionSummary: "Dr. Maurício manipulou o frasco de colírio com arsênico motivado pela vingança do lance perdido no leilão."
    },
    {
        id: "caso_011",
        number: "CASO #011",
        title: "O Mistério da Estufa",
        description: "O botânico chefe da mansão Real foi encontrado preso dentro da estufa tropical com a temperatura no máximo.",
        crimeReport: "Dr. Alencar ficou trancado por 2 horas sob vapor escaldante. A válvula de emergência foi travada por uma ferramenta de jardinagem e um par de galochas sujas de adubo foi esquecido na porta.",
        headline: "SABOTAGEM NO JARDIM BOTÂNICO: BOTÂNICO É TRANCADO EM ESTUFA!",
        evidences: [
            { icon: "🌡️", title: "Termômetro da Estufa", desc: "Marcando 60°C de calor sufocante.", uvDetail: "🔍 UV: Resíduo de óleo lubrificante na rosca de travamento." },
            { icon: "✂️", title: "Tesoura de Poda", desc: "Usada para travar a maçaneta externa.", uvDetail: "🔍 UV: Gravação com as iniciais do jardineiro assistente." },
            { icon: "👢", title: "Galocha com Adubo", desc: "Tamanho 42 abandonada no corredor de entrada.", uvDetail: "🔍 UV: Pegadas amarelas de nitrato de potássio." }
        ],
        cipherType: "text",
        cipherTitle: "SIGLA ELEMENTAR DA FÓRMULA",
        cipherDesc: "Qual é a sigla química internacional de 1 letra do elemento NITROGÊNIO do adubo?",
        cipherAnswer: "N",
        secretClue: "💡 DICA DESCOBERTA: As iniciais marcadas na tesoura de poda desmontam o álibi do assistente de jardinagem.",
        suspects: [
            { 
                id: "s1", name: "Tiago (Jardineiro)", role: "Assistente de Campo", 
                questions: [
                    { q: "Essa tesoura com iniciais é sua?", a: "Sim, mas emprestei para o zelador pela manhã!" },
                    { q: "Qual o seu tamanho de calçado?", a: "Calço 42, como a galocha encontrada na porta..." }
                ] 
            },
            { 
                id: "s2", name: "Márcio (Zelador)", role: "Manutenção Geral", 
                questions: [
                    { q: "Pegou a tesoura do Tiago?", a: "Peguei para cortar a rede do portão e devolvi às 15:00." },
                    { q: "Estava na estufa à tarde?", a: "Não chego perto das plantas tropicais." }
                ] 
            },
            { 
                id: "s3", name: "Lúcia (Agrônoma)", role: "Pesquisadora", 
                questions: [
                    { q: "O que fazia no horário do acidente?", a: "Estava no escritório escrevendo o relatório de colheita." },
                    { q: "Disputava verba com Alencar?", a: "Tínhamos divergências, mas nada que justificasse violência." }
                ] 
            }
        ],
        correctCulprit: "s1",
        solutionSummary: "Tiago usou sua própria ferramenta e galochas para travar a válvula de vapor após ser suspenso pelo botânico."
    },
    {
        id: "caso_012",
        number: "CASO #012",
        title: "O Último Ato no Camarim",
        description: "A atriz principal de um filme noir desapareceu antes da cena final de filmagem.",
        crimeReport: "A atriz Vivian Vance sumiu do estúdio de gravação. No espelho do camarim, uma frase foi escrita com batom vermelho: 'O ÚLTIMO ATO COMEÇOU', acompanhada de uma fita de filme de 35mm cortada.",
        headline: "MISTÉRIO NOS ESTÚDIOS: ESTRELA DE CINEMA DESAPARECE ANTES DA CENA FINAL!",
        evidences: [
            { icon: "💄", title: "Espelho do Camarim", desc: "Frase escrita em batom vermelho vivo.", uvDetail: "🔍 UV: Digital do maquiador chefe na tampa do batom." },
            { icon: "🎞️", title: "Rolo de Filme 35mm", desc: "Cortado exatamente na cena da revelação.", uvDetail: "🔍 UV: Marcas de estilete de edição de vídeo." },
            { icon: "🎬", title: "Claquete do Diretor", desc: "Última tomada registrada às 19:30.", uvDetail: "🔍 UV: Pano com clorofórmio guardado na caixa da câmera." }
        ],
        cipherType: "text",
        cipherTitle: "ANAGRAMA DO CINEMA",
        cipherDesc: "Qual palavra de 4 letras significa a unidade de cena gravada no cinema (S-E-N-A)?",
        cipherAnswer: "CENA",
        secretClue: "💡 DICA DESCOBERTA: A digital na tampa do batom e o pano com anestésico provam a ação de quem tinha acesso total ao camarim antes do take.",
        suspects: [
            { 
                id: "s1", name: "Gabriel (Diretor)", role: "Cineasta", 
                questions: [
                    { q: "Onde estava às 19:30?", a: "Na mesa de som orientando a equipe de iluminação." },
                    { q: "Por que a fita foi cortada?", a: "Alguém quis destruir a gravação da cena do crime!" }
                ] 
            },
            { 
                id: "s2", name: "Jorge (Maquiador Chefe)", role: "Caracterizador", 
                questions: [
                    { q: "Foi você quem retocou o batom dela?", a: "Sim, retoquei o batom no camarim antes de sair para o café..." },
                    { q: "Por que o seu batom foi usado no espelho?", a: "Deixei o batom em cima do camarim quando saí!" }
                ] 
            },
            { 
                id: "s3", name: "Camila (Dublê)", role: "Substituta de Cena", 
                questions: [
                    { q: "Queria assumir o papel principal?", a: "Eu era a dublê oficial, mas não machucaria a Vivian!" },
                    { q: "Onde estava no momento do desaparecimento?", a: "No figurino vestindo a roupa de cena igual à dela." }
                ] 
            }
        ],
        correctCulprit: "s2",
        solutionSummary: "Jorge usou o batom e o anestésico do camarim para raptar a atriz e impedir o lançamento do filme por vingança trabalhista."
    }
];

// --- CONTROLE DE TELAS & NAVEGAÇÃO ---
function showScreen(screenId) {
    document.querySelectorAll(".view-screen").forEach(s => s.classList.remove("active"));
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add("active");
    }

    const header = document.getElementById("game-header");
    const timerElem = document.getElementById("case-timer-display");

    if (screenId === "cover-screen") {
        header.style.display = "none";
        stopTimer();
    } else {
        header.style.display = "flex";
        if (screenId === "investigation-screen") {
            timerElem.style.display = "inline";
        } else {
            timerElem.style.display = "none";
            stopTimer();
        }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCaseSelection() {
    resetFormFields();
    updateHeaderStats();
    const grid = document.getElementById("cases-grid");
    grid.innerHTML = "";

    CASES_DATA.forEach(c => {
        const isUnlocked = gameState.unlockedCases.includes(c.id);
        const isSolved = gameState.solvedCases.includes(c.id);
        const stars = gameState.caseStars[c.id] || "";

        const card = document.createElement("div");
        card.className = `case-card ${!isUnlocked ? 'locked' : ''}`;
        
        card.innerHTML = `
            <div class="case-number">${c.number}</div>
            <h3>${c.title}</h3>
            <p>${c.description}</p>
            <div class="case-status">
                <span>${isSolved ? '✅ RESOLVIDO' : (isUnlocked ? '📂 DISPONÍVEL' : '🔒 TRANCADO')}</span>
                <span>${stars}</span>
            </div>
        `;

        if (isUnlocked) {
            card.addEventListener("click", () => {
                audio.playClick();
                openCase(c.id);
            });
        }

        grid.appendChild(card);
    });
}

function openCase(caseId) {
    resetFormFields();
    gameState.currentCaseId = caseId;
    const caseData = CASES_DATA.find(c => c.id === caseId);

    document.getElementById("case-badge-title").innerText = caseData.number;
    document.getElementById("case-title-display").innerText = caseData.title;
    document.getElementById("crime-report-text").innerText = caseData.crimeReport;

    const board = document.getElementById("evidence-board");
    board.innerHTML = "";
    caseData.evidences.forEach(ev => {
        board.innerHTML += `
            <div class="evidence-card">
                <div class="polaroid-img">${ev.icon}</div>
                <div class="evidence-title">${ev.title}</div>
                <div class="evidence-desc">${ev.desc}</div>
                <div class="uv-hidden-detail">${ev.uvDetail}</div>
            </div>
        `;
    });

    document.getElementById("cipher-title").innerText = caseData.cipherTitle;
    document.getElementById("cipher-desc").innerText = caseData.cipherDesc;
    const cipherContainer = document.getElementById("cipher-container");

    if (caseData.cipherType === "mimic") {
        cipherContainer.innerHTML = `
            <div class="mimic-display">
                <div class="mimic-animation">${caseData.mimicIcon}</div>
                <p><strong>Ação Gestual Gravada:</strong> Digite as 3 ações representadas pelos ícones separadas por espaço.</p>
                <div class="cipher-inputs">
                    <input type="text" id="cipher-input" placeholder="SUA RESPOSTA...">
                    <button id="btn-check-cipher" class="btn-primary">VERIFICAR MÍMICA</button>
                </div>
            </div>
        `;
    } else {
        cipherContainer.innerHTML = `
            <div class="cipher-inputs">
                <input type="text" id="cipher-input" placeholder="RESPOSTA DO ENIGMA...">
                <button id="btn-check-cipher" class="btn-primary">DECODIFICAR</button>
            </div>
        `;
    }

    document.getElementById("btn-check-cipher").addEventListener("click", checkCipherAnswer);

    const suspectsList = document.getElementById("suspects-list");
    const suspectSelect = document.getElementById("suspect-select");
    suspectsList.innerHTML = "";
    suspectSelect.innerHTML = '<option value="">-- Selecione o Culpado --</option>';

    caseData.suspects.forEach((s, sIndex) => {
        let questionsHTML = "";
        s.questions.forEach((qObj, qIndex) => {
            questionsHTML += `
                <button class="btn-question" data-suspect="${sIndex}" data-question="${qIndex}">
                    ❓ ${qObj.q}
                </button>
            `;
        });

        suspectsList.innerHTML += `
            <div class="suspect-card">
                <div>
                    <h4>${s.name}</h4>
                    <div class="suspect-role">${s.role}</div>
                    <div class="question-buttons">${questionsHTML}</div>
                </div>
                <div class="suspect-answer-box" id="answer-box-${sIndex}">
                    <em>Selecione uma pergunta acima para interrogar o suspeito...</em>
                </div>
            </div>
        `;

        suspectSelect.innerHTML += `<option value="${s.id}">${s.name} (${s.role})</option>`;
    });

    document.querySelectorAll(".btn-question").forEach(btn => {
        btn.addEventListener("click", (e) => {
            audio.playClick();
            const sIdx = e.target.dataset.suspect;
            const qIdx = e.target.dataset.question;
            const answer = caseData.suspects[sIdx].questions[qIdx].a;
            document.getElementById(`answer-box-${sIdx}`).innerHTML = `<strong>Resposta:</strong> "${answer}"`;
        });
    });

    switchTab("evidences");
    showScreen("investigation-screen");
    startTimer();
}

function switchTab(tabKey) {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.tab === tabKey);
    });
    document.querySelectorAll(".tab-content").forEach(content => {
        content.classList.toggle("active", content.id === `tab-${tabKey}`);
    });
}

function checkCipherAnswer() {
    const caseData = CASES_DATA.find(c => c.id === gameState.currentCaseId);
    const inputVal = document.getElementById("cipher-input").value.trim().toUpperCase();

    if (!inputVal) return;

    if (inputVal === caseData.cipherAnswer) {
        audio.playSuccess();
        showModal("Pista Confidencial Desbloqueada!", caseData.secretClue, "success");
    } else {
        audio.playError();
        showModal("Resposta Incorreta", "❌ O código inserido não confere com a evidência.\nExamine as pistas novamente e tente outra combinação.", "error");
    }
}

// --- SUBMISSÃO DO MANDADO E RESOLUÇÃO ---
document.getElementById("btn-submit-warrant").addEventListener("click", () => {
    const caseData = CASES_DATA.find(c => c.id === gameState.currentCaseId);
    const selectedSuspect = document.getElementById("suspect-select").value;
    const motiveText = document.getElementById("motive-input").value.trim();

    if (!selectedSuspect) {
        audio.playError();
        showModal("Aviso da Delegacia", "Por favor, selecione um acusado para emitir o mandado de prisão.", "warning");
        return;
    }

    if (motiveText.length < 5) {
        audio.playError();
        showModal("Aviso da Delegacia", "Escreva uma justificativa mais detalhada sobre o motivo da prisão.", "warning");
        return;
    }

    if (selectedSuspect === caseData.correctCulprit) {
        audio.playSuccess();
        stopTimer();

        let stars = "★ ★ ★";
        if (caseTimer.seconds > 180) stars = "★ ★ ☆";
        if (caseTimer.seconds > 300) stars = "★ ☆ ☆";

        gameState.caseStars[caseData.id] = stars;
        
        if (!gameState.solvedCases.includes(caseData.id)) {
            gameState.solvedCases.push(caseData.id);
            if (gameState.solvedCases.length % 2 === 0) {
                gameState.hintsAvailable++;
            }
        }

        const currentIndex = CASES_DATA.findIndex(c => c.id === caseData.id);
        
        if (currentIndex < CASES_DATA.length - 1) {
            const nextCaseId = CASES_DATA[currentIndex + 1].id;
            if (!gameState.unlockedCases.includes(nextCaseId)) {
                gameState.unlockedCases.push(nextCaseId);
            }
            saveProgress();

            const mins = Math.floor(caseTimer.seconds / 60).toString().padStart(2, '0');
            const secs = (caseTimer.seconds % 60).toString().padStart(2, '0');

            document.getElementById("news-headline").innerText = caseData.headline;
            document.getElementById("news-photo").innerText = caseData.evidences[0].icon;
            document.getElementById("victory-summary").innerText = caseData.solutionSummary;
            document.getElementById("stars-display").innerText = stars;
            document.getElementById("victory-time-stats").innerText = `⏱️ Tempo de Investigação: ${mins}:${secs}`;
            
            const nextBtn = document.getElementById("btn-next-case");
            nextBtn.style.display = "inline-block";
            nextBtn.onclick = () => {
                audio.playClick();
                openCase(CASES_DATA[currentIndex + 1].id);
            };

            showScreen("victory-screen");

        } else {
            saveProgress();
            showScreen("campaign-finish-screen");
        }

    } else {
        audio.playError();
        showModal("Acusação Falhou", "🚨 ACUSAÇÃO INCORRETA!\nVocê prendeu um inocente e o verdadeiro culpado escapou. Releia os depoimentos e as pistas!", "error");
    }
});

// --- INICIALIZAÇÃO DE EVENTOS ---
document.addEventListener("DOMContentLoaded", () => {
    loadProgress();

    // Eventos do Minigame de Perícia Digital
    const fpAngle = document.getElementById("fp-angle");
    const fpZoom = document.getElementById("fp-zoom");
    if (fpAngle && fpZoom) {
        fpAngle.addEventListener("input", updateFPTransform);
        fpZoom.addEventListener("input", updateFPTransform);
    }

    document.getElementById("btn-verify-fp").addEventListener("click", () => {
        const angle = parseInt(document.getElementById("fp-angle").value);
        const zoom = parseFloat((document.getElementById("fp-zoom").value / 10).toFixed(1));

        // Tolerância de alinhamento
        if (Math.abs(angle - 0) <= 10 && Math.abs(zoom - 1.0) <= 0.2) {
            audio.playSuccess();
            showModal("Perícia Papiloscópica Confirmada!", "🧬 IMPRESSÃO DIGITAL COMBINA 100% COM O BANCO DE DADOS DE SUSPEITOS!", "success");
        } else {
            audio.playError();
            showModal("Desalinhamento Papiloscópico", "❌ Ajuste a Rotação perto de 0° e a Frequência em 1.0x para alinhar as marcas de identificação.", "error");
        }
    });

    // Som de Chuva
    document.getElementById("btn-rain-toggle").addEventListener("click", () => {
        const isPlaying = audio.toggleRain();
        document.getElementById("btn-rain-toggle").innerText = isPlaying ? "🌧️ Chuva: ON" : "🌧️ Chuva: OFF";
    });

    // Botão Luz UV
    document.getElementById("btn-toggle-uv").addEventListener("click", () => {
        audio.playClick();
        const board = document.getElementById("evidence-board");
        const btn = document.getElementById("btn-toggle-uv");
        board.classList.toggle("uv-active");
        const isActive = board.classList.contains("uv-active");
        btn.classList.toggle("active", isActive);
        btn.innerText = isActive ? "🔦 Luz UV: LIGADA" : "💡 Ativar Luz UV";
    });

    // Botão Usar Lupa de Dica
    document.getElementById("btn-use-hint").addEventListener("click", () => {
        if (gameState.hintsAvailable <= 0) {
            audio.playError();
            showModal("Sem Lupas", "Você não possui mais lupas de dica disponíveis!", "warning");
            return;
        }

        const caseData = CASES_DATA.find(c => c.id === gameState.currentCaseId);
        const ans = caseData.cipherAnswer;
        const hintText = ans.length > 2 ? `A resposta começa com a letra "${ans.charAt(0)}" e possui ${ans.length} caracteres.` : `A resposta é "${ans}".`;

        gameState.hintsAvailable--;
        saveProgress();
        audio.playSuccess();
        showModal("Dica Revelada", hintText, "success");
    });

    document.getElementById("btn-start-game").addEventListener("click", () => {
        audio.playClick();
        renderCaseSelection();
        showScreen("case-selector-screen");
    });

    document.getElementById("btn-home-cover").addEventListener("click", () => {
        audio.playClick();
        showScreen("cover-screen");
    });

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            audio.playClick();
            switchTab(e.target.dataset.tab);
        });
    });

    document.getElementById("btn-back-menu").addEventListener("click", () => {
        audio.playClick();
        renderCaseSelection();
        showScreen("case-selector-screen");
    });

    document.getElementById("btn-victory-menu").addEventListener("click", () => {
        audio.playClick();
        renderCaseSelection();
        showScreen("case-selector-screen");
    });

    document.getElementById("btn-finish-menu").addEventListener("click", () => {
        audio.playClick();
        renderCaseSelection();
        showScreen("case-selector-screen");
    });

    const soundBtn = document.getElementById("btn-sound-toggle");
    soundBtn.addEventListener("click", () => {
        audio.enabled = !audio.enabled;
        soundBtn.innerText = audio.enabled ? "🔊 Som: ON" : "🔇 Som: OFF";
    });

    document.getElementById("btn-reset-game").addEventListener("click", () => {
        showModal(
            "Reiniciar Campanha", 
            "Tem certeza absoluta que deseja apagar todo o progresso dos 12 casos, estrelas e cargos?", 
            "warning", 
            () => {
                gameState = {
                    unlockedCases: ["caso_001"],
                    solvedCases: [],
                    caseStars: {},
                    hintsAvailable: 3,
                    currentCaseId: null
                };
                saveProgress();
                renderCaseSelection();
                showScreen("case-selector-screen");
            }
        );
    });
});
