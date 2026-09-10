/**
 * Higienizador Cirúrgico de Markdown para Scrape e Crawl
 * Remove anúncios, banners, imagens publicitárias, pixels de rastreamento,
 * caixas de newsletter, avisos de cookies, botões de UI e rodapés de portais (ex: IEEE, ACM, Springer).
 */

// Domínios conhecidos de redes de anúncios, tracking e telemetria
const AD_DOMAINS = [
  'doubleclick.net',
  'googlesyndication.com',
  'adservice.google',
  'adnxs.com',
  'outbrain.com',
  'taboola.com',
  'amazon-adsystem.com',
  'criteo.com',
  'scorecardresearch.com',
  'pubmatic.com',
  'rubiconproject.com',
  'casalemedia.com',
  'serving-sys.com',
  'quantserve.com',
  'zemanta.com',
  'smartadserver.com',
  'popads.net',
  'propellerads.com',
  'mgid.com',
  'revcontent.com',
  'adroll.com',
  'facebook.com/tr',
  'google-analytics.com',
  'hotjar.com',
];

// Padrões de URL com caminhos de anúncios ou trackers
const AD_URL_PATTERNS = [
  /\/ads?\//i,
  /\/advert\b/i,
  /\/advertisement\b/i,
  /\/banners?\//i,
  /\/sponsors?\//i,
  /\/sponsorship\b/i,
  /\/affiliate\b/i,
  /\/tracking\b/i,
  /\/pixel\b/i,
  /\/promo\b/i,
  /beacon\./i,
  /1x1\.(?:gif|png|jpg|webp)/i,
  /pixel\.(?:gif|png)/i,
];

// Textos alternativos (alt text) característicos de banners e anúncios
const AD_ALT_PATTERNS = [
  /^ad$/i,
  /^ads$/i,
  /^an[uú]ncio$/i,
  /^an[uú]ncios$/i,
  /^publicidade$/i,
  /^patrocinado$/i,
  /^sponsored$/i,
  /^sponsored content$/i,
  /^banner$/i,
  /^banner ad$/i,
  /^advertisement$/i,
  /^propaganda$/i,
  /^compartilhe$/i,
  /^share on/i,
  /^close message button$/i,
];

function isAdUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (AD_DOMAINS.some((domain) => lower.includes(domain))) return true;
  if (AD_URL_PATTERNS.some((pattern) => pattern.test(url))) return true;
  if (lower.startsWith('data:image/gif;base64,r0lgodlhaqab') || lower.startsWith('data:image/png;base64,ivborw0kggoaaaansu')) return true;
  return false;
}

function isAdAltText(alt: string): boolean {
  if (!alt) return false;
  const trimmed = alt.trim();
  return AD_ALT_PATTERNS.some((pattern) => pattern.test(trimmed));
}

// Cabeçalhos que iniciam rodapé de conta ou navegação irrelevante em portais
const FOOTER_SECTION_START = [
  /^#*\s*ieee account\b/i,
  /^#*\s*my account\b/i,
  /^#*\s*minha conta\b/i,
  /^#*\s*purchase details\b/i,
  /^#*\s*profile information\b/i,
  /^#*\s*need help\??\b/i,
  /^#*\s*about ieee xplore\b/i,
  /^#*\s*about us\b/i,
  /^#*\s*terms of use\b/i,
  /^#*\s*privacy & opting out of cookies\b/i,
  /^#*\s*a not-for-profit organization, ieee\b/i,
];

/**
 * Remove anúncios, banners, pixels e textos espúrios do Markdown extraído.
 * Preserva blocos de código intactos através de tokens de substituição.
 */
export function cleanScrapedMarkdown(rawMarkdown: string): string {
  if (!rawMarkdown || typeof rawMarkdown !== 'string') return '';

  // 1. Isolar blocos de código para não interferir em exemplos de código
  const codeBlocks: string[] = [];
  let text = rawMarkdown.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `___CODE_BLOCK_${codeBlocks.length - 1}___`;
  });

  // 2. Remover imagens de anúncio com links: [![alt](imgUrl)](linkUrl)
  text = text.replace(
    /\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/g,
    (match, alt, imgUrl, linkUrl) => {
      if (isAdUrl(imgUrl) || isAdUrl(linkUrl) || isAdAltText(alt)) {
        return '';
      }
      return match;
    },
  );

  // 3. Remover imagens isoladas de anúncio ou trackers: ![alt](imgUrl)
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, imgUrl) => {
    if (isAdUrl(imgUrl) || isAdAltText(alt)) {
      return '';
    }
    return match;
  });

  // 4. Remover links de rastreamento, botões de fechar e alertas: [texto](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, anchorText, url) => {
    const trimmedAnchor = anchorText.trim().toLowerCase();
    if (
      trimmedAnchor === 'close message button' ||
      trimmedAnchor === 'manage content alerts' ||
      trimmedAnchor === 'add to citation alerts' ||
      trimmedAnchor === 'save to alerts' ||
      trimmedAnchor === 'download references' ||
      trimmedAnchor === 'request permissions' ||
      trimmedAnchor === 'change username/password' ||
      trimmedAnchor === 'update address' ||
      trimmedAnchor === 'payment options' ||
      trimmedAnchor === 'order history' ||
      trimmedAnchor === 'view purchased documents' ||
      trimmedAnchor === 'communications preferences' ||
      trimmedAnchor === 'profession and education' ||
      trimmedAnchor === 'technical interests' ||
      trimmedAnchor === 'about ieee xplore' ||
      trimmedAnchor === 'terms of use' ||
      trimmedAnchor === 'nondiscrimination policy' ||
      trimmedAnchor === 'privacy & opting out of cookies'
    ) {
      return '';
    }
    if (isAdUrl(url)) {
      if (isAdAltText(anchorText)) return '';
      return anchorText;
    }
    return match;
  });

  // 5. Linhas e títulos isolados que representam marcadores de anúncios, cookies e botões de interface
  const lines = text.split('\n');
  const cleanedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const cleanLineContent = trimmed
      .replace(/^#{1,6}\s*/, '')
      .replace(/^\*+|\*+$/g, '')
      .replace(/^_+|_+$/g, '')
      .trim()
      .toLowerCase();

    // Se detectamos o início de uma seção de rodapé de conta ou suporte (ex: IEEE Account, Need Help?), descartamos o restante do rodapé
    if (FOOTER_SECTION_START.some((re) => re.test(trimmed))) {
      break;
    }

    // "Skip to main content"
    if (/^skip to (main )?content/i.test(trimmed)) {
      continue;
    }

    // Botões de interface repetitivos de portais
    const uiButtons = [
      'cite this',
      'download pdf',
      'download references',
      'request permissions',
      'save to alerts',
      'manage content alerts',
      'add to citation alerts',
      'show more',
      'show less',
      'sign in or purchase',
      'sign in to continue reading',
      'references is not available for this document.',
      'references is not available for this document',
      'all authors',
    ];

    if (uiButtons.includes(cleanLineContent)) {
      continue;
    }

    // Palavras-chave isoladas de anúncio
    const adKeywords = [
      'advertisement',
      'publicidade',
      'anúncio',
      'anúncios',
      'patrocinado',
      'sponsored',
      'sponsored content',
      'conteúdo patrocinado',
      'promoted stories',
      'anuncie aqui',
      'ads by google',
      'google ads',
    ];

    if (adKeywords.includes(cleanLineContent)) {
      continue;
    }

    // Padrões de aviso de cookies / consentimento / newsletter / copyright de rodapé
    if (
      cleanLineContent.includes('aceitar todos os cookies') ||
      cleanLineContent.includes('accept all cookies') ||
      cleanLineContent.includes('usamos cookies para') ||
      cleanLineContent.includes('we use cookies') ||
      cleanLineContent.includes('política de privacidade e cookies') ||
      cleanLineContent.includes('manage cookie preferences') ||
      cleanLineContent.includes('inscreva-se na nossa newsletter') ||
      cleanLineContent.includes('subscribe to our newsletter') ||
      cleanLineContent.includes('cadastre seu e-mail') ||
      cleanLineContent.includes('a not-for-profit organization') ||
      cleanLineContent.includes('all rights reserved') ||
      cleanLineContent.includes('todos os direitos reservados') ||
      cleanLineContent.startsWith('© copyright') ||
      cleanLineContent.startsWith('copyright ©')
    ) {
      continue;
    }

    // Padrões de links de compartilhamento social em massa
    if (
      trimmed.startsWith('Share on ') ||
      trimmed.startsWith('Compartilhe no ') ||
      trimmed.startsWith('Compartilhar:') ||
      trimmed.startsWith('Share this:')
    ) {
      continue;
    }

    // Linhas que continham apenas links/imagens removidos e agora são vazios
    if (trimmed === '[]()' || trimmed === '![]()') {
      continue;
    }

    cleanedLines.push(line);
  }

  text = cleanedLines.join('\n');

  // 6. Remover múltiplos saltos de linha vazios resultantes da remoção de elementos
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  // 7. Restaurar blocos de código preservados
  text = text.replace(/___CODE_BLOCK_(\d+)___/g, (_, index) => {
    return codeBlocks[parseInt(index, 10)] || '';
  });

  return text;
}
