(function(){
  document.documentElement.classList.add('js');

  const $ = (q, el=document) => el.querySelector(q);
  const $$ = (q, el=document) => Array.from(el.querySelectorAll(q));

  const yearEl = $('#year');
  if(yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Reveal on scroll
  const revealEls = $$('.reveal');
  // Ensure above-the-fold content is visible immediately (prevents "missing" hero video)
  const hero = document.getElementById('hero');
  if(hero){
    $$('.reveal', hero).forEach(el=>el.classList.add('is-visible'));
  }
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach((e)=>{
        if(e.isIntersecting){
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, {threshold: 0.15});
    revealEls.forEach(el=>io.observe(el));
  } else {
    revealEls.forEach(el=>el.classList.add('is-visible'));
  }

  // Fallback: if something stays hidden (e.g. observer not firing), reveal everything after a moment
  window.setTimeout(()=>{
    revealEls.forEach(el=>el.classList.add('is-visible'));
  }, 800);

  // Authority marquee (autoplay continuous)
  const authorityMarquee = document.querySelector('[data-authority-marquee]');
  if(authorityMarquee){
    const track = authorityMarquee.querySelector('[data-authority-track]');
    if(track){
      const originalItems = Array.from(track.children);

      // Duplicate once for seamless loop
      if(!track.dataset.duplicated){
        originalItems.forEach((node)=>{
          track.appendChild(node.cloneNode(true));
        });
        track.dataset.duplicated = 'true';
      }

      const setHalf = ()=>{
        // After duplication the total scrollWidth is ~2x of the original
        const half = Math.floor(track.scrollWidth / 2);
        authorityMarquee.style.setProperty('--authority-half', `${half}px`);
      };

      // Wait a frame to ensure layout is computed
      requestAnimationFrame(()=>{
        setHalf();
      });

      window.addEventListener('resize', ()=>{
        setHalf();
      });

      // Touch-friendly pause
      authorityMarquee.addEventListener('pointerdown', ()=>authorityMarquee.classList.add('is-paused'));
      authorityMarquee.addEventListener('pointerup', ()=>authorityMarquee.classList.remove('is-paused'));
      authorityMarquee.addEventListener('pointercancel', ()=>authorityMarquee.classList.remove('is-paused'));
    }
  }

  // Accordion: allow only one open at a time
  const accordion = document.querySelector('[data-accordion]');
  if(accordion){
    accordion.addEventListener('toggle', (ev)=>{
      const t = ev.target;
      if(!(t instanceof HTMLDetailsElement)) return;
      if(!t.open) return;
      $$('details.accordion-item[open]', accordion).forEach((d)=>{
        if(d !== t) d.open = false;
      });
    }, true);
  }

  // Carousel
  const carousel = document.querySelector('[data-carousel]');
  if(carousel){
    const track = carousel.querySelector('[data-carousel-track]');
    const viewport = carousel.querySelector('[data-carousel-viewport]');
    const prevBtn = carousel.querySelector('[data-carousel-prev]');
    const nextBtn = carousel.querySelector('[data-carousel-next]');
    const items = $$('[data-carousel-item]', carousel);

    let index = 0;

    function getStep(){
      if(!items.length) return 0;
      const style = window.getComputedStyle(items[0]);
      const gap = parseFloat(style.marginRight || '0');
      return items[0].getBoundingClientRect().width + gap;
    }

    function clamp(i){
      return Math.max(0, Math.min(i, items.length - 1));
    }

    function update(){
      if(!track) return;
      const step = getStep();
      track.style.transform = `translateX(${-index * step}px)`;
      if(prevBtn) prevBtn.disabled = index === 0;
      if(nextBtn) nextBtn.disabled = index >= items.length - 1;
    }

    if(prevBtn) prevBtn.addEventListener('click', ()=>{ index = clamp(index - 1); update(); });
    if(nextBtn) nextBtn.addEventListener('click', ()=>{ index = clamp(index + 1); update(); });

    // Basic touch swipe
    let startX = null;
    if(viewport){
      viewport.addEventListener('pointerdown', (e)=>{ startX = e.clientX; viewport.setPointerCapture(e.pointerId); });
      viewport.addEventListener('pointerup', (e)=>{
        if(startX === null) return;
        const dx = e.clientX - startX;
        const threshold = 40;
        if(dx > threshold) index = clamp(index - 1);
        if(dx < -threshold) index = clamp(index + 1);
        startX = null;
        update();
      });
    }

    window.addEventListener('resize', ()=>update());
    update();
  }

  // WhatsApp verify
  const form = document.getElementById('verifyForm');
  const input = document.getElementById('whatsInput');
  const result = document.getElementById('verifyResult');

  function onlyDigits(v){ return (v || '').replace(/\D+/g,''); }

  function formatBRPhone(digits){
    const d = onlyDigits(digits).slice(0, 11);
    const ddd = d.slice(0,2);
    const ninth = d.slice(2,3);
    const part1 = d.slice(3,7);
    const part2 = d.slice(7,11);

    if(d.length <= 2) return d.length ? `(${ddd}` : '';
    if(d.length <= 3) return `(${ddd}) ${ninth}`;
    if(d.length <= 7) return `(${ddd}) ${ninth} ${part1}`;
    return `(${ddd}) ${ninth} ${part1}-${part2}`;
  }

  if(input){
    input.addEventListener('input', ()=>{
      const digits = onlyDigits(input.value);
      input.value = formatBRPhone(digits);
    });
  }

  function setResult(msg, ok){
    if(!result) return;
    result.textContent = msg;
    result.classList.remove('ok','bad');
    result.classList.add(ok ? 'ok' : 'bad');
  }

  if(form && input){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const digits = onlyDigits(input.value);

      if(digits.length !== 11){
        setResult('Digite um número válido com DDD (11 dígitos).', false);
        input.focus();
        return;
      }

      // Placeholder verification logic
      setResult('Número verificado! Você será direcionado ao WhatsApp.', true);

      const wa = document.querySelector('.whatsapp-float');
      const waHref = wa?.getAttribute('href') || 'https://wa.me/5500000000000';
      setTimeout(()=>{ window.open(waHref, '_blank', 'noopener'); }, 500);
    });
  }
})();
