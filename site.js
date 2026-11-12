/* Contatos reais: preencha aqui e o site liga tudo sozinho. Deixe vazio o que ainda não existe. */
const CONTATOS = {
  whatsapp: "5511968186328",   // só números com DDI e DDD, ex.: 5511900000000
  email: "contato@reeloagencia.com",      // ex.: contato@reeloagencia.com
  instagram: "",  // ex.: https://instagram.com/usuario
  youtube: "",
  linkedin: ""
};

(function () {
  /* menu hambúrguer */
  const burger = document.getElementById('burger'), menu = document.getElementById('menu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.hidden = !open; document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', () => setMenu(menu.hidden));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
  matchMedia('(min-width:821px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  /* links de contato e redes */
  const hrefs = {
    whatsapp: CONTATOS.whatsapp && 'https://wa.me/' + CONTATOS.whatsapp,
    email: CONTATOS.email && 'mailto:' + CONTATOS.email,
    instagram: CONTATOS.instagram, youtube: CONTATOS.youtube, linkedin: CONTATOS.linkedin
  };
  document.querySelectorAll('[data-rede]').forEach(a => {
    const h = hrefs[a.dataset.rede];
    if (h) { a.href = h; a.target = '_blank'; a.rel = 'noopener'; } else { a.style.display = 'none'; }
  });

  /* botões que abrem o WhatsApp com mensagem pronta */
  document.querySelectorAll('[data-wa]').forEach(a => {
    if (CONTATOS.whatsapp) { a.href = 'https://wa.me/' + CONTATOS.whatsapp + '?text=' + encodeURIComponent(a.dataset.wa); a.target = '_blank'; a.rel = 'noopener'; }
  });

  /* formulário: abre WhatsApp ou e-mail com a mensagem pronta */
  const form = document.getElementById('form'), msg = document.getElementById('formMsg');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    let ok = true;
    ['nome', 'email'].forEach(n => { const i = form.elements[n]; const bad = !i.value.trim() || (n === 'email' && !/^\S+@\S+\.\S+$/.test(i.value)); i.setAttribute('aria-invalid', bad); if (bad) ok = false; });
    if (!ok) { msg.textContent = 'Preencha nome e um e-mail válido para continuar.'; return; }
    const texto = `Olá, Reelô! Sou ${d.nome}${d.empresa ? ' (' + d.empresa + ')' : ''}. Quero agendar o diagnóstico gratuito.` +
      (d.interesse ? ` Me interessa: ${d.interesse}.` : '') + ` E-mail: ${d.email}.` + (d.whatsapp ? ` WhatsApp: ${d.whatsapp}.` : '');
    if (CONTATOS.whatsapp) { window.open('https://wa.me/' + CONTATOS.whatsapp + '?text=' + encodeURIComponent(texto), '_blank', 'noopener'); msg.textContent = 'Abrimos o WhatsApp com a sua mensagem pronta. É só enviar.'; }
    else if (CONTATOS.email) { location.href = 'mailto:' + CONTATOS.email + '?subject=' + encodeURIComponent('Diagnóstico gratuito') + '&body=' + encodeURIComponent(texto); msg.textContent = 'Abrimos o seu e-mail com a mensagem pronta.'; }
    else { msg.textContent = 'Recebemos o seu interesse aqui, mas o envio ainda está sendo ativado. Em breve este botão abre a conversa com a Reelô.'; }
  });

  /* vídeos que abrem dentro da página (sem sair do site) */
  document.querySelectorAll('.vid').forEach(b => b.addEventListener('click', () => {
    const lb = document.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Vídeo');
    const v = document.createElement('video'); v.src = b.dataset.video; v.controls = true; v.autoplay = true; v.playsInline = true; v.setAttribute('controlsList', 'nodownload'); v.poster = b.dataset.poster || '';
    const x = document.createElement('button'); x.className = 'lb__x'; x.type = 'button'; x.setAttribute('aria-label', 'Fechar vídeo'); x.textContent = '×';
    lb.append(v, x); document.body.append(lb); document.body.style.overflow = 'hidden'; x.focus();
    const fechar = () => { v.pause(); lb.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', esc); b.focus(); };
    const esc = e => { if (e.key === 'Escape') fechar(); };
    x.addEventListener('click', fechar); lb.addEventListener('click', e => { if (e.target === lb) fechar(); }); document.addEventListener('keydown', esc);
  }));

  /* entrada suave das seções */
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .12 });
    document.querySelectorAll('.cab,.card,.tira figure,.texto,.painel,.lista li,.pacote,.avulsos>div,.proj,.passos li,.faq__itens,.form').forEach(el => { el.classList.add('rv'); io.observe(el); });
  }
})();
