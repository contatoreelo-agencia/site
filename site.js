/* Contatos reais: preencha aqui e o site liga tudo sozinho. Deixe vazio o que ainda não existe. */
const CONTATOS = {
  whatsapp: "",   // só números com DDI e DDD, ex.: 5511900000000
  email: "",      // ex.: contato@reeloagencia.com
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

  /* formulário: abre WhatsApp ou e-mail com a mensagem pronta */
  const form = document.getElementById('form'), msg = document.getElementById('formMsg');
  form.addEventListener('submit', e => {
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

  /* entrada suave das seções */
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .12 });
    document.querySelectorAll('.cab,.painel,.lista li,.pacote,.avulsos>div,.proj,.passos li,.faq__itens,.form').forEach(el => { el.classList.add('rv'); io.observe(el); });
  }
})();
