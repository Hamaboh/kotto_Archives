/* ============================================================
   KOTTO ARCHIVES — 共通スクリプト
   ページ共通のヘッダー/フッター生成と各ページの描画処理。
   データは data/*.js（window.KOTTO_*）を参照します。
   ============================================================ */
(function () {
  'use strict';

  /* ---------- サイト設定（ここを編集するとサイト全体に反映されます） ---------- */
  var SITE = {
    title: 'KOTTO ARCHIVES',
    sub: '琴山しずく 活動記録',
    nav: [
      { id: 'home',        href: 'index.html',       label: 'トップ' },
      { id: 'history',     href: 'history.html',     label: '沿革' },
      { id: 'events',      href: 'events.html',      label: 'イベント' },
      { id: 'songs',       href: 'songs.html',       label: '楽曲' },
      { id: 'discography', href: 'discography.html', label: 'ディスコグラフィー' },
      { id: 'media',       href: 'media.html',       label: 'メディア' }
    ],
    footerNote: '本サイトはファンによる非公式の活動記録アーカイブです。掲載内容は公開情報をもとに整理しています。'
  };

  /* ---------- 汎用ヘルパー ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function jpDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? (m[1] + '年' + Number(m[2]) + '月' + Number(m[3]) + '日') : (iso || '');
  }
  function q(id) { return document.getElementById(id); }
  function setHtml(id, html) { var n = q(id); if (n) n.innerHTML = html; }

  /* ---------- ヘッダー / フッター ---------- */
  function chrome() {
    var page = document.body.getAttribute('data-page') || '';
    var nav = SITE.nav.map(function (n) {
      return '<li><a href="' + n.href + '"' + (n.id === page ? ' aria-current="page"' : '') + '>' + esc(n.label) + '</a></li>';
    }).join('');

    var header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML =
      '<div class="header-inner">' +
        '<div class="brand">' +
          '<a class="logo" href="index.html">' + esc(SITE.title) + '</a>' +
          '<span class="sub">' + esc(SITE.sub) + '</span>' +
        '</div>' +
        '<nav class="gnav" aria-label="メインメニュー"><ul>' + nav + '</ul></nav>' +
      '</div>';

    var footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML =
      '<div class="container">' +
        '<ul class="fnav">' + nav + '</ul>' +
        '<p>' + esc(SITE.footerNote) + '</p>' +
        '<p>&copy; ' + new Date().getFullYear() + ' ' + esc(SITE.title) + '</p>' +
        '<a class="to-top" href="#top">▲ ページ上部へ</a>' +
      '</div>';

    var mount = q('site-header-mount');
    if (mount) mount.parentNode.replaceChild(header, mount); else document.body.insertBefore(header, document.body.firstChild);
    var fmount = q('site-footer-mount');
    if (fmount) fmount.parentNode.replaceChild(footer, fmount); else document.body.appendChild(footer);
  }

  /* ---------- 部品 ---------- */
  function linksHtml(links) {
    if (!links || !links.length) return '';
    return '<ul class="entry-links">' + links.map(function (l) {
      return '<li><a href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">' + esc(l.label || 'リンク') + ' ↗</a></li>';
    }).join('') + '</ul>';
  }

  /* 写真は後日追加。images が空の間は何も表示しません。
     例) "images": [{"src":"images/2023-09-09_kottone.jpg","caption":"KOTTONE"}] */
  function photosHtml(images) {
    if (!images || !images.length) return '';
    return '<div class="photos">' + images.map(function (im) {
      var src = typeof im === 'string' ? im : im.src;
      var cap = typeof im === 'string' ? '' : (im.caption || '');
      return '<figure><img src="' + esc(src) + '" alt="' + esc(cap) + '" loading="lazy">' +
             (cap ? '<figcaption>' + esc(cap) + '</figcaption>' : '') + '</figure>';
    }).join('') + '</div>';
  }

  /* level 付きフラット配列 → 入れ子リストへ変換 */
  function nestDetails(details) {
    var root = { children: [] }, stack = [root];
    details.forEach(function (d) {
      var lv = Math.max(1, d.level || 1);
      while (stack.length > lv) stack.pop();
      while (stack.length < lv) {
        var filler = stack[stack.length - 1];
        if (!filler.children.length) filler.children.push({ text: '', links: [], children: [] });
        stack.push(filler.children[filler.children.length - 1]);
      }
      var node = { text: d.text, links: d.links || [], ordered: !!d.ordered, children: [] };
      stack[stack.length - 1].children.push(node);
      stack.push(node);
    });
    return root.children;
  }
  function renderNodes(nodes, top) {
    if (!nodes.length) return '';
    var ordered = nodes.length && nodes[0].ordered;
    var tag = ordered ? 'ol' : 'ul';
    var cls = top ? ' class="detail"' : (ordered ? ' class="setlist"' : '');
    return '<' + tag + cls + '>' + nodes.map(function (n) {
      var text = esc(n.text);
      (n.links || []).forEach(function (l) {
        var lab = esc(l.label);
        text = text.split(lab).join('<a href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">' + lab + '</a>');
      });
      return '<li>' + text + renderNodes(n.children, false) + '</li>';
    }).join('') + '</' + tag + '>';
  }
  function detailsBlock(details) {
    if (!details || !details.length) return '';
    return renderNodes(nestDetails(details), true);
  }

  /* イベント名に告知投稿へのリンクを張る。URL 未登録のイベントはテキストのまま。 */
  function titleHtml(e) {
    var links = e.links || [];
    var primary = null;
    for (var i = 0; i < links.length; i++) {
      if (links[i].label === 'Xのイベント告知投稿') { primary = links[i]; break; }
    }
    if (!primary) return esc(e.title);   /* 告知URLが未登録のイベントはテキスト表示 */
    return '<a class="title-link" href="' + esc(primary.url) + '" target="_blank" rel="noopener noreferrer">' +
           esc(e.title) + '<span class="ext">\u2197</span></a>';
  }
  function eventHtml(e, opts) {
    opts = opts || {};
    return '<article class="entry anchor-offset" id="' + esc(e.id) + '">' +
      '<div class="entry-head">' +
        '<span class="entry-date">' + esc(jpDate(e.date)) + '</span>' +
        '<h3 class="entry-title">' + titleHtml(e) + '</h3>' +
        (e.venue ? '<span class="entry-venue">' + esc(e.venue) + '</span>' : '') +
      '</div>' +
      (e.note ? '<p class="entry-note">' + esc(e.note) + '</p>' : '') +
      (opts.hideDetails ? '' : detailsBlock(e.details)) +
      photosHtml(e.images) +
      linksHtml(e.links) +
    '</article>';
  }

  /* 表ヘッダーの画面固定（横スクロール対応）
     .table-wrap.sticky-head の <thead> を複製した固定バーを作り、
     表が画面内にある間だけ上端に表示する。表の上端／下端を抜けると自動的に解除。 */
  var stickyUnits = [];
  function initStickyHeads() {
    Array.prototype.forEach.call(document.querySelectorAll('.sticky-clone'), function (n) { n.remove(); });
    stickyUnits = [];
    Array.prototype.forEach.call(document.querySelectorAll('.table-wrap.sticky-head'), function (wrap) {
      var table = wrap.querySelector('table');
      var thead = table && table.querySelector('thead');
      if (!thead) return;
      var clone = document.createElement('div');
      clone.className = 'sticky-clone';
      var ct = document.createElement('table');
      ct.className = table.className;
      ct.appendChild(thead.cloneNode(true));
      clone.appendChild(ct);
      document.body.appendChild(clone);
      stickyUnits.push({ wrap: wrap, table: table, thead: thead, clone: clone, ct: ct });
      wrap.addEventListener('scroll', schedule, { passive: true });
    });
    sync();
  }
  function sync() {
    stickyUnits.forEach(function (u) {
      var tr = u.table.getBoundingClientRect();
      var hh = u.thead.getBoundingClientRect().height;
      if (!(tr.top < 0 && tr.bottom > hh + 4)) { u.clone.style.display = 'none'; return; }
      var wr = u.wrap.getBoundingClientRect();
      u.clone.style.display = 'block';
      u.clone.style.left = wr.left + 'px';
      u.clone.style.width = wr.width + 'px';
      u.ct.style.width = u.table.offsetWidth + 'px';
      u.ct.style.tableLayout = getComputedStyle(u.table).tableLayout;
      var oth = u.thead.querySelectorAll('th'), cth = u.ct.querySelectorAll('th');
      for (var i = 0; i < oth.length && i < cth.length; i++) {
        cth[i].style.width = oth[i].getBoundingClientRect().width + 'px';
      }
      u.ct.style.transform = 'translateX(' + (-u.wrap.scrollLeft) + 'px)';
    });
  }
  var ticking = false;
  function schedule() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; sync(); });
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);

  /* ---------- 各ページの描画 ---------- */
  var pages = {};

  pages.home = function () {
    var ev = (window.KOTTO_EVENTS || {}).events || [];
    var sg = window.KOTTO_SONGS || {};
    var dc = (window.KOTTO_DISCOGRAPHY || {}).albums || [];
    var md = (window.KOTTO_MEDIA || {}).media || [];
    var pf = window.KOTTO_PROFILE || {};
    var mediaCount = md.reduce(function (a, m) { return a + (m.items ? m.items.length : 0); }, 0);

    setHtml('stats',
      stat(ev.length, '件', 'イベント / 配信 記録') +
      stat((sg.originals || []).length, '曲', 'オリジナル楽曲') +
      stat((sg.covers || []).length, '曲', 'カバー・披露楽曲') +
      stat(dc.length, '作品', '音源リリース') +
      stat(mediaCount, '本', 'メディア発信記録'));

    /* 活動期間はプロフィールの記載を優先し、無ければイベント記録の最初と最後から算出 */
    var period = (window.KOTTO_EVENTS || {}).period || {};
    var label = pf.active
              || ((period.from && period.to) ? jpDate(period.from) + '～' + jpDate(period.to) : '');
    setHtml('period-label', label);

    /* プロフィール */
    var rows = [];
    if (pf.name) rows.push(['名前', esc(pf.name) + (pf.reading ? ' <span class="reading">（' + esc(pf.reading) + '）</span>' : '')]);
    if (pf.birthday) rows.push(['生年月日', esc(pf.birthday)]);
    if (pf.active) rows.push(['活動期間', esc(pf.active)]);
    if (rows.length) {
      setHtml('profile', rows.map(function (r) {
        return '<div class="meta-row"><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>';
      }).join(''));
    } else { hide('profile-sec'); }

    /* RAY 体制の変遷 */
    var lu = pf.lineups || [];
    if (lu.length) {
      setHtml('lineup-count', '全 ' + lu.length + ' 期');
      setHtml('lineups', lu.map(function (l) {
        return '<li class="lineup">' +
          '<div class="lineup-head">' +
            '<span class="lineup-period">' + esc(l.period) + '</span>' +
            (l.duration ? '<span class="lineup-dur">' + esc(l.duration) + '</span>' : '') +
          '</div>' +
          (l.formation ? '<div class="lineup-form">' + esc(l.formation) + '</div>' : '') +
          (l.members && l.members.length ?
            '<div class="lineup-members">' + l.members.map(function (m) {
              return '<span class="member' + (m === pf.name ? ' is-self' : '') + '">' + esc(m) + '</span>';
            }).join('') + '</div>' : '') +
        '</li>';
      }).join(''));
    } else { hide('lineup-sec'); }

    /* アカウント（Notion側でリンクが未入力のものはテキスト表示） */
    var ac = pf.accounts || [];
    if (ac.length) {
      var groups = [], byGroup = {};
      ac.forEach(function (a) {
        var g = a.group || '';
        if (!byGroup[g]) { byGroup[g] = []; groups.push(g); }
        byGroup[g].push(a);
      });
      setHtml('accounts', groups.map(function (g) {
        return (g ? '<li class="account-group">' + esc(g) + '</li>' : '') +
          byGroup[g].map(function (a) {
            var body = a.url
              ? '<a href="' + esc(a.url) + '" target="_blank" rel="noopener noreferrer">' + esc(a.text || a.label) + ' \u2197</a>'
              : esc(a.text || '—');
            return '<li class="account"><span class="account-label">' + esc(a.label) + '</span>' +
                   '<span class="account-text">' + body + '</span></li>';
          }).join('');
      }).join(''));
    } else { hide('account-sec'); }
  };
  function hide(id) { var n = q(id); if (n) n.hidden = true; }

  function stat(num, unit, label) {
    return '<div class="stat"><div class="num">' + num + '<small>' + esc(unit) + '</small></div><div class="lbl">' + esc(label) + '</div></div>';
  }

  pages.events = function () {
    var all = ((window.KOTTO_EVENTS || {}).events || []).slice();
    var years = [];
    all.forEach(function (e) { if (years.indexOf(e.year) < 0) years.push(e.year); });
    years.sort();
    var state = { year: 'all', kw: '' };

    setHtml('year-chips',
      '<button class="chip" type="button" data-year="all" aria-pressed="true">すべて</button>' +
      years.map(function (y) { return '<button class="chip" type="button" data-year="' + y + '" aria-pressed="false">' + y + '年</button>'; }).join(''));

    function flat(e) {
      return [e.title, e.venue, e.date, jpDate(e.date)].concat((e.details || []).map(function (d) { return d.text; })).join(' ').toLowerCase();
    }
    function draw() {
      var list = all.filter(function (e) {
        if (state.year !== 'all' && String(e.year) !== String(state.year)) return false;
        if (state.kw && flat(e).indexOf(state.kw) < 0) return false;
        return true;
      });
      setHtml('count', list.length + ' 件を表示');
      if (!list.length) { setHtml('list', '<p class="empty">該当する記録はありません。</p>'); return; }
      var html = '', cy = null;
      list.forEach(function (e) {
        if (e.year !== cy) { cy = e.year; html += '<h2 class="year-head anchor-offset" id="y' + cy + '">' + cy + '年</h2>'; }
        html += eventHtml(e);
      });
      setHtml('list', html);
    }
    q('year-chips').addEventListener('click', function (ev) {
      var b = ev.target.closest('.chip'); if (!b) return;
      state.year = b.getAttribute('data-year');
      Array.prototype.forEach.call(this.querySelectorAll('.chip'), function (c) {
        c.setAttribute('aria-pressed', c === b ? 'true' : 'false');
      });
      draw();
    });
    q('kw').addEventListener('input', function () { state.kw = this.value.trim().toLowerCase(); draw(); });
    draw();
  };

  pages.history = function () {
    var ev = ((window.KOTTO_EVENTS || {}).events || []).slice();
    var dc = (window.KOTTO_DISCOGRAPHY || {}).albums || [];
    var md = (window.KOTTO_MEDIA || {}).media || [];

    var items = [];
    ev.forEach(function (e) {
      items.push({ date: e.date, kind: 'event', title: e.title, sub: e.venue,
                   tags: ['イベント'], href: 'events.html#' + e.id, note: e.note });
    });
    ev.forEach(function (e) {
      (e.details || []).forEach(function (d) {
        var m = /^(.+?)(?:（(.+?)）)?\s*初披露$/.exec(d.text || '');
        if (!m) return;
        if (/[：:]/.test(m[1])) return;   // 「RAY：新曲「◯◯」初披露」など、琴山しずく以外の初披露は除外
        items.push({ date: e.date, kind: 'song', title: '「' + m[1].trim() + '」初披露',
                     sub: (m[2] ? m[2] + '／' : '') + e.title, tags: ['楽曲'],
                     href: 'events.html#' + e.id });
      });
    });
    dc.forEach(function (a) {
      if (a.release) {
        var relEv = (a.relation_label === '発売開始イベント' && a.related && a.related.length) ? a.related[0].event : '';
        items.push({ date: a.release, kind: 'release', title: '『' + a.title + '』リリース',
                     sub: relEv,
                     tags: ['ディスコグラフィー'], href: 'discography.html' });
      }
    });
    md.forEach(function (m) {
      if (!m.items || !m.items.length) return;
      var dated = m.items.map(function (i) { return { iso: isoOf(i.date), title: i.title }; })
        .filter(function (i) { return /^\d{4}-\d{2}-\d{2}$/.test(i.iso); })
        .sort(function (a, b) { return a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : 0; });
      if (!dated.length) return;
      var first = dated[0], last = dated[dated.length - 1];
      items.push({ date: first.iso, kind: 'media', title: m.title + ' 開始',
                   sub: first.title, tags: ['メディア'], href: 'media.html' });
      if (last.iso !== first.iso) {
        items.push({ date: last.iso, kind: 'media', title: m.title + ' 最終',
                     sub: last.title, tags: ['メディア'], href: 'media.html' });
      }
    });
    items = items.filter(function (i) { return /^\d{4}-\d{2}-\d{2}$/.test(i.date); });
    items.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });

    var state = { kind: 'all' };
    function draw() {
      var list = items.filter(function (i) { return state.kind === 'all' || i.kind === state.kind; });
      setHtml('count', list.length + ' 件を表示');
      var html = '<ul class="timeline">', cy = null;
      list.forEach(function (i) {
        var y = i.date.slice(0, 4);
        if (y !== cy) { cy = y; html += '<li><h2 class="tl-year anchor-offset" id="y' + y + '">' + y + '年</h2></li>'; }
        html += '<li class="tl-item ' + (i.kind === 'event' ? 'is-event' : '') + '">' +
          '<div class="tl-body">' +
            '<div class="tl-meta">' +
              '<span class="tl-date">' + esc(jpDate(i.date)) + '</span>' +
              '<span class="tl-title"><a href="' + esc(i.href) + '">' + esc(i.title) + '</a></span>' +
            '</div>' +
            (i.sub ? '<div class="tl-sub">' + esc(i.sub) + '</div>' : '') +
            (i.note ? '<p class="entry-note">' + esc(i.note) + '</p>' : '') +
            '<div class="tl-tags">' + i.tags.map(function (t) { return '<span class="badge ' + (t === 'イベント' ? 'red' : 'gold') + '">' + esc(t) + '</span>'; }).join('') + '</div>' +
          '</div></li>';
      });
      html += '</ul>';
      setHtml('list', html);
    }
    q('kind-chips').addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      state.kind = b.getAttribute('data-kind');
      Array.prototype.forEach.call(this.querySelectorAll('.chip'), function (c) {
        c.setAttribute('aria-pressed', c === b ? 'true' : 'false');
      });
      draw();
    });
    draw();
  };
  function isoOf(jp) {
    var m = /(\d{4})年(\d{1,2})月(\d{1,2})日/.exec(jp || '');
    if (!m) return '';
    return m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
  }

  function fmtBadges(formats) {
    if (!formats || !formats.length) return '<span class="chk-off">—</span>';
    return formats.map(function (f) { return '<span class="badge red">' + esc(f.name) + '</span>'; }).join('');
  }
  function fmtCounts(formats) {
    if (!formats || !formats.length) return '<span class="chk-off">—</span>';
    return '<ul class="count-list">' + formats.map(function (f) {
      return '<li><span class="cf">' + esc(f.name) + '</span><span class="cn">' +
        (f.count > 0 ? f.count + '回' : '記録なし') + '</span></li>';
    }).join('') + '</ul>';
  }

  pages.songs = function () {
    var sg = window.KOTTO_SONGS || {};
    var orig = sg.originals || [], cov = sg.covers || [];

    setHtml('originals-count', '全 ' + orig.length + ' 曲');
    setHtml('originals',
      '<div class="table-wrap sticky-head"><table class="songs-table"><thead><tr>' +
      '<th>楽曲名</th><th>作詞</th><th>作曲</th><th>編曲</th><th>披露形態</th><th>披露回数</th>' +
      '</tr></thead><tbody>' +
      orig.map(function (s) {
        return '<tr>' +
          '<td class="song">' + esc(s.title) + '</td>' +
          '<td>' + esc(s.lyrics) + '</td><td>' + esc(s.music) + '</td><td>' + esc(s.arrange) + '</td>' +
          '<td>' + fmtBadges(s.formats) + '</td>' +
          '<td>' + fmtCounts(s.formats) + '</td>' +
        '</tr>';
      }).join('') + '</tbody></table></div>' +
      (sg.note && sg.note.length ? '<p class="desc">' + sg.note.map(esc).join('<br>') + '</p>' : ''));

    setHtml('covers-count', '全 ' + cov.length + ' 曲');
    setHtml('covers',
      '<div class="table-wrap sticky-head"><table class="covers-table"><thead><tr>' +
      '<th>楽曲名</th><th>披露形態</th><th>披露回数</th>' +
      '</tr></thead><tbody>' +
      cov.map(function (c) {
        return '<tr><td class="song">' + esc(c.title) + '</td>' +
          '<td>' + fmtBadges(c.formats) + '</td>' +
          '<td>' + fmtCounts(c.formats) + '</td></tr>';
      }).join('') + '</tbody></table></div>');

    initStickyHeads();
  };

  pages.discography = function () {
    var albums = (window.KOTTO_DISCOGRAPHY || {}).albums || [];
    setHtml('count', '全 ' + albums.length + ' 作品');
    setHtml('list', albums.map(function (a, i) {
      var rel = (a.related || []);
      return '<article class="entry anchor-offset" id="' + esc('d' + (i + 1)) + '">' +
        '<div class="entry-head">' +
          '<span class="entry-date">' + ('0' + (i + 1)).slice(-2) + '</span>' +
          '<h3 class="entry-title">' + esc(a.title) + '</h3>' +
          (a.release ? '<span class="entry-venue">リリース：' + esc(jpDate(a.release)) + '</span>' : '') +
        '</div>' +
        '<div class="table-wrap sticky-head"><table class="tracklist"><thead><tr>' +
          '<th>No.</th><th>収録楽曲</th></tr></thead><tbody>' +
          a.tracks.map(function (t, n) {
            return '<tr><td>' + (n + 1) + '</td><td class="song">' + esc(t) + '</td></tr>';
          }).join('') + '</tbody></table></div>' +
        (rel.length ? '<h4 class="sub-head">' + esc(a.relation_label || '関連する記録') + '</h4><ul class="detail">' +
          rel.map(function (r) {
            return '<li><a href="events.html#' + esc(r.event_id) + '">' + esc(jpDate(r.date)) + '｜' + esc(r.event) + '</a></li>';
          }).join('') + '</ul>' : '') +
        photosHtml(a.images) +
      '</article>';
    }).join(''));

    initStickyHeads();
  };

  pages.media = function () {
    var md = (window.KOTTO_MEDIA || {}).media || [];
    setHtml('count', '全 ' + md.length + ' 企画');
    setHtml('list', md.map(function (m, i) {
      var items = m.items || [];
      var meta = (m.meta || []).map(function (x) {
        var val = x.value || (x.children && x.children.length ? x.children.join('／') : '');
        return '<div class="meta-row"><dt>' + esc(x.label) + '</dt><dd>' + (val ? esc(val) : '<span class="chk-off">未整理</span>') + '</dd></div>';
      }).join('');
      var rel = (m.related || []);
      return '<section class="section anchor-offset" id="' + esc('m' + (i + 1)) + '">' +
        '<h2>' + esc(m.title) + (items.length ? '<span class="count">' + items.length + ' 本</span>' : '') + '</h2>' +
        (meta ? '<dl class="meta">' + meta + '</dl>' : '') +
        (rel.length ? '<p class="desc">関連する記録：' + rel.map(function (r) {
            return '<a href="events.html#' + esc(r.event_id) + '">' + esc(jpDate(r.date)) + '｜' + esc(r.event) + '</a>';
          }).join('　/　') + '</p>' : '') +
        (m.list_note ? '<p class="desc">発信一覧：' + esc(m.list_note) + '</p>' : '') +
        (items.length ?
          '<div class="table-wrap"><table><thead><tr><th>タイトル</th><th>日付</th><th>リンク</th></tr></thead><tbody>' +
          items.map(function (it) {
            return '<tr><td class="song">' + esc(it.title) + '</td><td>' + esc(it.date || '—') + '</td>' +
              '<td>' + ((it.urls || []).map(function (u) {
                var lbl = /note\.com/.test(u) ? 'note' : /tiktok\.com/.test(u) ? 'TikTok' :
                          /x\.com|twitter\.com/.test(u) ? 'X' : /youtube|youtu\.be/.test(u) ? 'YouTube' : 'リンク';
                return '<a class="badge red" href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + lbl + ' \u2197</a>';
              }).join(' ') || '<span class="chk-off">—</span>') + '</td></tr>';
          }).join('') + '</tbody></table></div>'
          : '<p class="empty">個別の記録は未整理です。</p>') +
      '</section>';
    }).join(''));
  };

  /* ---------- 起動 ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    chrome();
    var p = document.body.getAttribute('data-page');
    if (pages[p]) { try { pages[p](); } catch (err) { console.error(err); } }
  });

  window.KOTTO = { esc: esc, jpDate: jpDate, SITE: SITE };
})();
