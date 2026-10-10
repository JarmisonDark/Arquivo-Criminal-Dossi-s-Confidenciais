// --- SISTEMA DE ÁUDIO WEB VIA SÍNTESE (SEM ARQUIVOS EXTERNOS) ---
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
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
}

const audio = new SoundEngine();

// --- SISTEMA DE MODAL CENTRALIZADO ---
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
    const modal = document.getElementById("custom-modal");
    modal.classList.remove("active");
}

// --- LIMPEZA DE CAMPOS DE TEXTO ENTRE FASES ---
function resetFormFields() {
    const motiveInput = document.getElementById("motive-input");
    if (motiveInput) motiveInput.value = "";

    const cipherInput = document.getElementById("cipher-input");
    if (cipherInput) cipherInput.value = "";

    const suspectSelect = document.getElementById("suspect-select");
    if (suspectSelect) suspectSelect.selectedIndex = 0;
}

// --- BANCO DE DADOS DOS 9 CASOS ---
const CASES_DATA = [
    {
        id: "caso_001",
        number: "CASO #001",
        title: "O Enigma da Partitura",
        description: "Um renomado maestro foi encontrado desacordado em seu camarim trancado no Teatro Municipal.",
        crimeReport: "O Maestro Victor foi atingido na cabeça durante o intervalo do espetáculo. A porta estava trancada por dentro e a única janela dava para o beco. No chão, havia uma partitura rasgada com notas musicais destacadas em vermelho e um relógio quebrado marcando 21:15.",
        evidences: [
            { icon: "🎼", title: "Partitura Rasgada", desc: "Notas circuladas em vermelho: MI - LÁ - RÉ - SI." },
            { icon: "⌚", title: "Relógio Parado", desc: "Vidro trincado, parado exatamente às 21:15." },
            { icon: "🍷", title: "Taça de Vinho", desc: "Duas taças na mesa. Uma limpa e outra com batom vermelho." }
        ],
        cipherType: "text",
        cipherTitle: "CÓDIGO DE NOTAS MUSICAIS",
        cipherDesc: "As notas na partitura (MI, LÁ, RÉ, SI) correspondem à cifra de letras (E-A-D-B). Qual palavra de 4 letras as notas formam ao reordenar?",
        cipherAnswer: "BEAD",
        suspects: [
            { id: "s1", name: "Helena (Soprano)", role: "Primeira Cantora", alibi: "Estava no palco até às 21:10. Uso batom vermelho. Fui ao camarim do maestro às 21:20 e a porta já estava trancada." },
            { id: "s2", name: "Roberto (Pianista)", role: "Músico Auxiliar", alibi: "Estava afinando o piano no fosso da orquestra das 21:00 às 21:30. Ninguém me viu lá." },
            { id: "s3", name: "Carlos (Zelador)", role: "Manutenção", alibi: "Estava limpando o corredor às 21:15 e vi Helena saindo apressada do camarim do maestro." }
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
        evidences: [
            { icon: "💎", title: "Pedestal Vazio", desc: "Vidro cortado com precisão a laser." },
            { icon: "📹", title: "Gravação Silenciosa", desc: "O suspeito faz gestos: primeiro imita 'VOLANTE', depois 'TESOURA' e por fim 'LIVRO'." },
            { icon: "🧤", title: "Luva de Pelica", desc: "Encontrada no duto de ventilação com resíduos de tinta amarela." }
        ],
        cipherType: "mimic",
        cipherTitle: "ANÁLISE MÍMICA DO LÁDRÃO",
        cipherDesc: "Identifique o significado dos 3 gestos em sequência gravados pela câmera de segurança.",
        mimicIcon: "🚗 ✂️ 📖",
        cipherAnswer: "DIRIGIR CORTAR LER",
        suspects: [
            { id: "s1", name: "Marcos (Pintor)", role: "Restaurador de Arte", alibi: "Minhas mãos estavam sujas de tinta amarela porque pintei o quadro da recepção às 21:30." },
            { id: "s2", name: "Lucas (Segurança)", role: "Vigilante Noturno", alibi: "Fui cortador de vidro na juventude, mas não entendo nada de mímica ou arte." },
            { id: "s3", name: "Sônia (Colecionadora)", role: "Visitante VIP", alibi: "Estava no saguão lendo o catálogo da exposição durante o blackout." }
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
        evidences: [
            { icon: "♟️", title: "Tabuleiro de Xadrez", desc: "O Rei branco estava sob xeque-mate iminente." },
            { icon: "🍵", title: "Xícara de Chá", desc: "Continha vestígios de amêndoas amargas (cianeto)." },
            { icon: "📜", title: "Bilhete em Código", desc: "Números anotados: 05 - 18 - 18 - 05." }
        ],
        cipherType: "text",
        cipherTitle: "DECODIFICAÇÃO NUMÉRICA (A=1, B=2...)",
        cipherDesc: "Converta os números 05 - 18 - 18 - 05 para letras do alfabeto e descubra a palavra.",
        cipherAnswer: "ERRO",
        suspects: [
            { id: "s1", name: "Dmitri (Oponente)", role: "Enxadrista Rival", alibi: "Eu estava jogando com ele. Ele mesmo serviu o próprio chá da garrafa térmica dele." },
            { id: "s2", name: "Olga (Garçom/Juíza)", role: "Árbitra da Partida", alibi: "Trouxe a garrafa de água quente para a mesa a pedido de Petrov às 20:00." },
            { id: "s3", name: "Viktor (Técnico)", role: "Treinador de Petrov", alibi: "Coloquei o adoçante no chá dele antes da partida começar como sempre faço." }
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
        evidences: [
            { icon: "📖", title: "Livro de Matemática", desc: "Página 42 destacando os números primos: 2, 3, 5, 7." },
            { icon: "💻", title: "Terminal do Cofre", desc: "Último acesso remoto via rede local às 02:00." },
            { icon: "☕", title: "Caneca Térmica", desc: "Ainda fumegante, com resíduos de café forte." }
        ],
        cipherType: "text",
        cipherTitle: "SENHA NUMÉRICA DO COFRE",
        cipherDesc: "A senha consiste na soma dos quatro primeiros números primos destacados no livro. Qual é o resultado numérico?",
        cipherAnswer: "17",
        suspects: [
            { id: "s1", name: "Bernardo (Sócio)", role: "Vice-Presidente", alibi: "Estava em casa dormindo quando o alarme silencioso foi acionado." },
            { id: "s2", name: "Clara (Filha)", role: "Herdeira", alibi: "Estava estudando matemática no meu quarto até tarde da noite." },
            { id: "s3", name: "Daniel (TI da Empresa)", role: "Engenheiro de Redes", alibi: "Acesseis os servidores da empresa às 02:00 para fazer uma manutenção de rotina na rede." }
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
        evidences: [
            { icon: "🧪", title: "Bureta Quebrada", desc: "Líquido azul espalhado na bancada." },
            { icon: "📹", title: "Câmera de Segurança", desc: "O intruso fez mímica de 'PESCAR', 'CORRER' e 'SILÊNCIO' antes de cortar os fios." },
            { icon: "🥾", title: "Pegada de Lama", desc: "Terra vermelha típica do canteiro de obras externo." }
        ],
        cipherType: "mimic",
        cipherTitle: "MÍMICA DO INTRUSO",
        cipherDesc: "Descreva os três verbos gesticulados pelo invasor separados por espaço (Ex: PESCAR CORRER SILENCIAR).",
        mimicIcon: "🎣 🏃 🤫",
        cipherAnswer: "PESCAR CORRER SILENCIAR",
        suspects: [
            { id: "s1", name: "Dr. Hélio", role: "Pesquisador Sênior", alibi: "Fiquei no laboratório até tarde testando compostos químicos." },
            { id: "s2", name: "Júlio (Segurança do Setor)", role: "Vigilante", alibi: "Fui pescar no lago da universidade no meu horário de folga às 23:00." },
            { id: "s3", name: "Beatriz (Estagiária)", role: "Assistente", alibi: "Estava no dormitório estudando para a prova de química." }
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
        evidences: [
            { icon: "🗿", title: "Pedestal Vazio", desc: "Área limpa de poeira." },
            { icon: "📜", title: "Bilhete Cifrado", desc: "Mensagem codificada com deslocamento César (+3): 'KHOO'." },
            { icon: "🎫", title: "Ingresso Rasgado", desc: "Pertencente ao último grupo de visitantes guiados." }
        ],
        cipherType: "text",
        cipherTitle: "CIFRA DE CÉSAR (DESLOCAMENTO +3)",
        cipherDesc: "Decodifique a palavra 'KHOO' voltando 3 letras no alfabeto (K->H, H->E, etc.). Qual é a palavra?",
        cipherAnswer: "HELLO",
        suspects: [
            { id: "s1", name: "Professor Bruno", role: "Historiador", alibi: "Estava guiando o grupo 3 de visitantes na ala romana." },
            { id: "s2", name: "Amanda", role: "Turista Estrangeira", alibi: "Sou professora de idiomas e estava apenas tirando fotos das esculturas." },
            { id: "s3", name: "Paulo", role: "Guarda da Galeria", alibi: "Fiquei postado na entrada principal o tempo todo." }
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
        evidences: [
            { icon: "🔑", title: "Chave Magnética", desc: "O registro do cartão mostra acesso às 21:05 usando a chave mestre da gerência." },
            { icon: "🔦", title: "Lanterna Tática", desc: "Encontrada com impressões digitais parciais no carpete." },
            { icon: "📝", title: "Anotação Rasgada", desc: "Contém números binários: 01000011." }
        ],
        cipherType: "text",
        cipherTitle: "CONVERSÃO BINÁRIA PARA CARACTERE",
        cipherDesc: "O código binário '01000011' representa qual letra maiúscula no formato ASCII?",
        cipherAnswer: "C",
        suspects: [
            { id: "s1", name: "Renato (Gerente)", role: "Administrador", alibi: "Eu guardo a chave mestre no cofre da recepção e ninguém mais tem acesso." },
            { id: "s2", name: "Camila (Hóspede)", role: "Empresária", alibi: "Estava no meu quarto escuro usando o celular durante o apagão." },
            { id: "s3", name: "Fábio (Eletricista)", role: "Manutenção", alibi: "Estava no subsolo consertando o disjuntor principal que desarmou sozinho." }
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
        evidences: [
            { icon: "📻", title: "Rádio Transmissor", desc: "Superaquecido por uso contínuo." },
            { icon: "📼", title: "Fita Cassete", desc: "Áudio final com código Morse: '... --- ...'." },
            { icon: "☕", title: "Xícara Quebrada", desc: "Estilhaços espalhados perto da mesa de som." }
        ],
        cipherType: "text",
        cipherTitle: "CÓDIGO MORSE UNIVERSAL",
        cipherDesc: "O código Morse '... --- ...' é o sinal internacional universal de socorro. Qual palavra ele representa?",
        cipherAnswer: "SOS",
        suspects: [
            { id: "s1", name: "Marcelo (Técnico Rival)", role: "Operador Concorrente", alibi: "Estava transmitindo meu próprio programa no canal vizinho à mesma hora." },
            { id: "s2", name: "Juliana (Ex-parceira)", role: "Radialista", alibi: "Fui ao estúdio deixar alguns discos antigos e saí antes da transmissão." },
            { id: "s3", name: "Otávio (Fiscal)", role: "Agente Regulador", alibi: "Fui lacrar o equipamento por irregularidades na outorga às 22:00." }
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
        evidences: [
            { icon: "💰", title: "Sacos de Ouro Vazios", desc: "Alinhados em ordem decrescente no chão do cofre." },
            { icon: "🧩", title: "Quebra-Cabeça Numérico", desc: "Sequência lógica: 2, 4, 8, 16, 32, ?" },
            { icon: "📋", title: "Plano de Fuga", desc: "Desenho detalhado do duto de esgoto subterrâneo." }
        ],
        cipherType: "text",
        cipherTitle: "SEQUÊNCIA LÓGICA DO COFRE",
        cipherDesc: "Qual é o próximo número na progressão geométrica: 2, 4, 8, 16, 32, ...?",
        cipherAnswer: "64",
        suspects: [
            { id: "s1", name: "Eduardo (Diretor Executivo)", role: "Diretor do Banco", alibi: "Estava reunido com o conselho fiscal até a meia-noite." },
            { id: "s2", name: "Vanessa (Tesoureira)", role: "Chefe de Operações", alibi: "Eu tinha a combinação mestre de abertura noturna para testes de auditoria." },
            { id: "s3", name: "Ricardo (Consultor de Segurança)", role: "Especialista Externo", alibi: "Projetei o sistema de alarme, mas saí do banco às 18:00." }
        ],
        correctCulprit: "s2",
        solutionSummary: "Vanessa usou sua combinação mestre de auditoria e o conhecimento exato do sistema para burlar os cofres por dentro."
    }
];

// --- ESTADO DO JOGO E PERSISTÊNCIA ---
let gameState = {
    unlockedCases: ["caso_001"],
    solvedCases: [],
    currentCaseId: null
};

function loadProgress() {
    const saved = localStorage.getItem("arquivo_criminal_progress");
    if (saved) {
        try {
            gameState = JSON.parse(saved);
        } catch (e) {
            console.error("Erro ao carregar progresso", e);
        }
    }
}

function saveProgress() {
    localStorage.setItem("arquivo_criminal_progress", JSON.stringify(gameState));
}

// --- CONTROLE DE TELAS & NAVEGAÇÃO ---
function showScreen(screenId) {
    document.querySelectorAll(".view-screen").forEach(s => s.classList.remove("active"));
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add("active");
    }

    const header = document.getElementById("game-header");
    if (screenId === "cover-screen") {
        header.style.display = "none";
    } else {
        header.style.display = "flex";
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCaseSelection() {
    resetFormFields();
    const grid = document.getElementById("cases-grid");
    grid.innerHTML = "";

    CASES_DATA.forEach(c => {
        const isUnlocked = gameState.unlockedCases.includes(c.id);
        const isSolved = gameState.solvedCases.includes(c.id);

        const card = document.createElement("div");
        card.className = `case-card ${!isUnlocked ? 'locked' : ''}`;
        
        card.innerHTML = `
            <div class="case-number">${c.number}</div>
            <h3>${c.title}</h3>
            <p>${c.description}</p>
            <div class="case-status">
                <span>${isSolved ? '✅ RESOLVIDO' : (isUnlocked ? '📂 DISPONÍVEL' : '🔒 TRANCADO')}</span>
                <span>${isSolved ? '★★★' : ''}</span>
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

    caseData.suspects.forEach(s => {
        suspectsList.innerHTML += `
            <div class="suspect-card">
                <h4>${s.name}</h4>
                <div class="suspect-role">${s.role}</div>
                <div class="suspect-alibi"><strong>Depoimento:</strong> "${s.alibi}"</div>
            </div>
        `;

        suspectSelect.innerHTML += `<option value="${s.id}">${s.name} (${s.role})</option>`;
    });

    switchTab("evidences");
    showScreen("investigation-screen");
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
        showModal("Pista Decodificada!", "🔍 Análise concluída com sucesso!\nAs contradições nos depoimentos dos suspeitos agora ficaram claras.", "success");
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
        
        if (!gameState.solvedCases.includes(caseData.id)) {
            gameState.solvedCases.push(caseData.id);
        }

        const currentIndex = CASES_DATA.findIndex(c => c.id === caseData.id);
        
        if (currentIndex < CASES_DATA.length - 1) {
            const nextCaseId = CASES_DATA[currentIndex + 1].id;
            if (!gameState.unlockedCases.includes(nextCaseId)) {
                gameState.unlockedCases.push(nextCaseId);
            }
            saveProgress();

            document.getElementById("victory-case-title").innerText = `${caseData.number}: RESOLVIDO`;
            document.getElementById("victory-summary").innerText = caseData.solutionSummary;
            
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
            "Tem certeza absoluta que deseja apagar todo o progresso dos 9 casos e rebloquear os dossiês?", 
            "warning", 
            () => {
                gameState = {
                    unlockedCases: ["caso_001"],
                    solvedCases: [],
                    currentCaseId: null
                };
                saveProgress();
                renderCaseSelection();
                showScreen("case-selector-screen");
            }
        );
    });
});
