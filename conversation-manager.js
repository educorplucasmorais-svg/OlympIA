/**
 * 💬 CONVERSATION MANAGER
 * Gerencia diálogos interativos com usuários
 * Mantém contexto de conversa para cada usuário
 */

class ConversationManager {
  constructor() {
    this.conversations = new Map(); // userId -> { state, data, timestamp }
    this.dialogs = {
      relatorio: this.relatorioDialog,
      analisar: this.analisarDialog,
      gerar: this.gerarDialog,
      imagem: this.imagemDialog,
      traduzir: this.traduzirDialog,
      keywords: this.keywordsDialog,
      morse: this.morseDialog,
      noticias: this.noticiasDialog,
      email: this.emailDialog,
      chat: this.chatDialog,
      conhecimento: this.conhecimentoDialog
    };
  }

  /**
   * Inicia uma conversa com um usuário
   */
  startConversation(userId, type) {
    if (!this.dialogs[type]) {
      return null;
    }

    this.conversations.set(userId, {
      type,
      state: 'started',
      step: 1,
      data: {},
      timestamp: Date.now()
    });

    return this.dialogs[type].questions[0];
  }

  /**
   * Processa resposta do usuário na conversa
   */
  processResponse(userId, text) {
    const conversation = this.conversations.get(userId);
    
    if (!conversation) {
      return null;
    }

    const dialog = this.dialogs[conversation.type];
    const currentStep = conversation.step;

    // Renova o timeout a cada resposta do usuário
    conversation.timestamp = Date.now();

    // Armazena resposta
    const questionKey = dialog.questions[currentStep - 1]?.key;
    if (questionKey) {
      conversation.data[questionKey] = text;
    }

    // Próxima pergunta ou conclusão
    if (currentStep >= dialog.questions.length) {
      // Fim da conversa - retorna dados coletados
      const result = {
        complete: true,
        data: conversation.data,
        action: dialog.action
      };
      this.conversations.delete(userId); // Remove conversa
      return result;
    } else {
      // Próxima pergunta
      conversation.step++;
      const nextQuestion = dialog.questions[conversation.step - 1];
      return {
        complete: false,
        question: nextQuestion.text,
        tip: nextQuestion.tip
      };
    }
  }

  /**
   * Cancela conversa em progresso
   */
  cancelConversation(userId) {
    return this.conversations.delete(userId);
  }

  /**
   * Verifica se usuário está em conversa
   */
  isInConversation(userId) {
    const conv = this.conversations.get(userId);
    return conv && (Date.now() - conv.timestamp < 600000); // 10 min timeout
  }

  /**
   * Obtém conversa atual
   */
  getConversation(userId) {
    return this.conversations.get(userId);
  }

  // ═══════════════════════════════════════════════════════════════
  // DIÁLOGOS ESPECÍFICOS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Diálogo: Gerar Relatório
   */
  relatorioDialog = {
    questions: [
      {
        key: 'tipo',
        text: '📊 Que tipo de relatório você quer gerar?\n\n1. Diário (últimas 24h)\n2. Semanal (últimos 7 dias)\n3. Mensal (últimos 30 dias)\n4. Personalizado (escolher datas)',
        tip: 'Digite o número (1, 2, 3 ou 4)'
      },
      {
        key: 'formato',
        text: '📄 Em qual formato você prefere?\n\n1. PDF (para impressão)\n2. Excel (para análise)\n3. HTML (para web)',
        tip: 'Digite o número (1, 2 ou 3)'
      },
      {
        key: 'email',
        text: '📧 Enviar por email ao término?\n\n(Digite sim/não ou apelido do destinatário)',
        tip: 'Exemplo: "sim", "não", ou "joao@empresa.com"'
      }
    ],
    action: 'generateReport'
  };

  /**
   * Diálogo: Analisar Dados
   */
  analisarDialog = {
    questions: [
      {
        key: 'data',
        text: '🔍 O que você quer analisar?\n\nDescreva os dados, métricas ou padrões que você gostaria que eu analisasse.',
        tip: 'Seja específico: "vendas de janeiro" ou "performance do site"'
      },
      {
        key: 'profundidade',
        text: '🎯 Qual nível de profundidade?\n\n1. Análise rápida (resumido)\n2. Análise detalhada (completa)\n3. Análise com recomendações',
        tip: 'Digite o número (1, 2 ou 3)'
      },
      {
        key: 'acao',
        text: '💡 O que você quer fazer com os resultados?\n\n1. Ver insights\n2. Gerar relatório\n3. Tomar decisão\n4. Apresentar para alguém',
        tip: 'Digite o número (1, 2, 3 ou 4)'
      }
    ],
    action: 'analyzeData'
  };

  /**
   * Diálogo: Gerar Conteúdo
   */
  gerarDialog = {
    questions: [
      {
        key: 'tipo',
        text: '💡 O que você quer gerar?\n\n1. Post para redes sociais\n2. Email marketing\n3. Artigo/blog\n4. Descrição de produto\n5. Outro',
        tip: 'Digite o número (1, 2, 3, 4 ou 5)'
      },
      {
        key: 'tema',
        text: '📝 Qual é o tema/assunto?',
        tip: 'Descreva em poucas palavras o tema principal'
      },
      {
        key: 'tons',
        text: '🎭 Qual tom você quer?\n\n1. Profissional\n2. Descontraído\n3. Persuasivo\n4. Educativo\n5. Divertido',
        tip: 'Digite o número (1 a 5)'
      }
    ],
    action: 'generateContent'
  };

  /**
   * Diálogo: Gerar Imagem
   */
  imagemDialog = {
    questions: [
      {
        key: 'descricao',
        text: '🎭 Descreva a imagem que você quer criar.\n\nSeja o mais detalhado possível!',
        tip: 'Exemplo: "Um gato laranja deitado em um sofá azul, luz dourada"'
      },
      {
        key: 'estilo',
        text: '🎨 Qual estilo de arte?\n\n1. Realista\n2. Desenho\n3. Pintura aquarela\n4. Cartoon\n5. Digital art\n6. 3D render',
        tip: 'Digite o número (1 a 6)'
      },
      {
        key: 'tamanho',
        text: '📐 Tamanho da imagem?\n\n1. Quadrado (1:1)\n2. Retrato (3:4)\n3. Paisagem (16:9)\n4. Banner (2:1)',
        tip: 'Digite o número (1 a 4)'
      }
    ],
    action: 'generateImage'
  };

  /**
   * Diálogo: Traduzir Texto
   */
  traduzirDialog = {
    questions: [
      {
        key: 'texto',
        text: '🌍 Qual é o texto que você quer traduzir?',
        tip: 'Cole ou digite o texto'
      },
      {
        key: 'idioma',
        text: '🗣️ Para qual idioma?\n\n1. Português (pt)\n2. Inglês (en)\n3. Espanhol (es)\n4. Francês (fr)\n5. Alemão (de)\n6. Italiano (it)\n7. Russo (ru)\n8. Japonês (ja)\n9. Chinês (zh)\n10. Outro',
        tip: 'Digite o número (1-10) ou código do idioma'
      }
    ],
    action: 'translateText'
  };

  /**
   * Diálogo: Extrair Keywords SEO
   */
  keywordsDialog = {
    questions: [
      {
        key: 'texto',
        text: '📝 Cole ou descreva o conteúdo para extrair keywords:',
        tip: 'Pode ser um texto completo, URL ou descrição do assunto'
      },
      {
        key: 'objetivo',
        text: '🎯 Qual é o objetivo?\n\n1. Blog/Artigo\n2. Produto/E-commerce\n3. Serviço\n4. Social media\n5. Geral',
        tip: 'Digite o número (1-5)'
      },
      {
        key: 'quantidade',
        text: '📊 Quantas keywords você quer?\n\n1. Poucas (5-7)\n2. Médias (10-15)\n3. Muitas (20+)',
        tip: 'Digite o número (1-3)'
      }
    ],
    action: 'extractKeywords'
  };

  /**
   * Diálogo: Código Morse
   */
  morseDialog = {
    questions: [
      {
        key: 'texto',
        text: '📡 Qual texto você quer converter para Morse?',
        tip: 'Digite o texto desejado'
      },
      {
        key: 'formato',
        text: '⚙️ Qual formato?\n\n1. Espaçado (cada letra separada)\n2. Compacto (tudo junto)\n3. Visual (com barra)',
        tip: 'Digite o número (1-3)'
      }
    ],
    action: 'generateMorse'
  };

  /**
   * Diálogo: Buscar Notícias
   */
  noticiasDialog = {
    questions: [
      {
        key: 'assunto',
        text: '📰 Qual é o assunto que você quer buscar?',
        tip: 'Ex: "inteligência artificial", "tecnologia", "economia"'
      },
      {
        key: 'quantidade',
        text: '📊 Quantas notícias você quer?\n\n1. Poucas (3-5)\n2. Médias (5-10)\n3. Muitas (15+)',
        tip: 'Digite o número (1-3)'
      },
      {
        key: 'filtro',
        text: '🔍 Filtrar por:\n\n1. Mais recentes\n2. Mais relevantes\n3. Ambos',
        tip: 'Digite o número (1-3)'
      }
    ],
    action: 'searchNews'
  };

  /**
   * Diálogo: Enviar Email
   */
  emailDialog = {
    questions: [
      {
        key: 'para',
        text: '📧 Para qual email?',
        tip: 'Digite o endereço de email'
      },
      {
        key: 'assunto',
        text: '📝 Qual o assunto do email?',
        tip: 'Título do email'
      },
      {
        key: 'tipo',
        text: '✉️ Qual tipo de email?\n\n1. Profissional\n2. Informal\n3. Marketing\n4. Suporte',
        tip: 'Digite o número (1-4)'
      },
      {
        key: 'conteudo',
        text: '💬 Descreva o conteúdo/mensagem:',
        tip: 'Diga o que você quer comunicar'
      },
      {
        key: 'confirmar',
        text: '✅ Posso enviar agora? (sim/não)',
        tip: 'Digite "sim" para enviar ou "não" para cancelar'
      }
    ],
    action: 'sendEmail'
  };

  /**
   * Diálogo: Chat com Contexto
   */
  chatDialog = {
    questions: [
      {
        key: 'contexto',
        text: '🧠 Qual é o contexto ou tema da conversa?',
        tip: 'Ex: "me ajuda com código Python", "fala sobre história", "dúvida em matemática"'
      },
      {
        key: 'profundidade',
        text: '📚 Qual nível de detalhe?\n\n1. Resumido\n2. Normal\n3. Bem detalhado\n4. Expert',
        tip: 'Digite o número (1-4)'
      }
    ],
    action: 'contextualChat'
  };

  /**
   * Diálogo: Base de Conhecimento (RAG)
   */
  conhecimentoDialog = {
    questions: [
      {
        key: 'pergunta',
        text: '🧠 O que você quer saber da base de conhecimento?',
        tip: 'Faça sua pergunta específica'
      },
      {
        key: 'contexto',
        text: '📚 De qual área você está procurando?\n\n1. Geral (todas)\n2. IA/Automação\n3. Marketing\n4. Trabalho/Carreira\n5. Tecnologia\n6. Outra',
        tip: 'Digite o número (1-6)'
      }
    ],
    action: 'searchKnowledge'
  };
}

export default ConversationManager;
