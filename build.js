/* Build script for the MBTI Quick Insight quiz site.
   Pure static HTML + ES5 output. Run with: node build.js
   Files are organized into directories: questions/, legal/, assets/. */
var fs = require('fs');
var path = require('path');

var SITE_URL = 'https://mbti-quick.example.com';
var SITE_NAME = 'MindType';
var SITE_TAGLINE = 'Quick MBTI Insight Quiz';
var OUT = __dirname;

/* Root-absolute link helpers (work from any directory depth) */
var HOME = '/index.html';
var PRIV = '/legal/privacy-policy.html';
var TERM = '/legal/terms-of-service.html';
var DIS = '/legal/disclaimer.html';
var ABOUT = '/legal/about-us.html';
var RESULT_PATH = 'result/index.html';
var RESULT_HREF = '/result/';

function questionPath(q) { return 'questions/q' + q.num + '.html'; }
function optionPath(q, n) { return 'questions/q' + q.num + '-' + n + '.html'; }
function href(rel) { return '/' + rel; }

/* ---------- Data: 3 questions, each 10 original options ---------- */
var questions = [
  {
    num: 1,
    dim: 'EI',
    poleA: 'Introvert-leaning',
    poleB: 'Extravert-leaning',
    h1: 'Question 1 of 3 — Where Your Energy Comes From',
    question: 'After a busy, people-filled week, what helps you feel most like yourself again?',
    desc: 'This question explores how you naturally recharge. There are no right answers — pick the option that feels closest to you.',
    next: 'q2.html',
    nextLabel: 'Go to Question 2',
    options: [
      'A completely silent evening alone with a book or a movie.',
      'A calm night at home with just one close person.',
      'A small, low-key hangout with two or three friends.',
      'A cozy dinner where the conversation stays slow and easy.',
      'A casual game night with a handful of familiar people.',
      'A lively party where you mostly chat with people you know.',
      'A busy social event where you also meet some new faces.',
      'A full day of meetings, calls, and group activities.',
      'A big celebration surrounded by lots of energetic people.',
      'A packed festival or concert where the crowd fuels you.'
    ],
    aText: 'You recharge by stepping back. Quiet time, fewer inputs, and one-on-one depth help you reset and think clearly.',
    bText: 'You recharge by connecting outward. Conversation, shared activity, and group energy lift you up and keep you moving.'
  },
  {
    num: 2,
    file: 'q2.html',
    dim: 'SN',
    poleA: 'Sensing-leaning',
    poleB: 'Intuition-leaning',
    h1: 'Question 2 of 3 — How You Take In Information',
    question: 'When you first hear a new idea, what pulls your attention the most?',
    desc: 'This question looks at how you prefer to process information. Choose the option that matches your usual habit.',
    next: 'q3.html',
    nextLabel: 'Go to Question 3',
    options: [
      'The exact steps and facts I can verify right away.',
      'Clear details, examples, and how things actually work.',
      'Solid information I can apply to a real task today.',
      'Practical proofs and what has worked well before.',
      'A mix of useful facts and the pattern behind them.',
      'The underlying pattern more than the small details.',
      'The bigger idea and where it might eventually lead.',
      'New possibilities and what could be imagined next.',
      'Symbolic meaning and unexpected creative connections.',
      'A bold vision of what might exist someday.'
    ],
    aText: 'You trust what is concrete. Facts, details, and proven methods feel safe, useful, and easy to act on.',
    bText: 'You are drawn to meaning. Patterns, possibilities, and big ideas pull your attention beyond the surface.'
  },
  {
    num: 3,
    file: 'q3.html',
    dim: 'TF',
    poleA: 'Thinking-leaning',
    poleB: 'Feeling-leaning',
    h1: 'Question 3 of 3 — How You Make Decisions',
    question: 'When a friend asks for advice on a hard choice, you usually start with…',
    desc: 'This question shows how you weigh decisions. Pick the option that feels most like your natural first move.',
    next: 'result.html',
    nextLabel: 'See My Personality Snapshot',
    options: [
      'The logical pros and cons laid out as clearly as possible.',
      'What is fair and consistently reasonable for everyone.',
      'The most efficient, evidence-based solution.',
      'The option that holds up best under close scrutiny.',
      'A balance of the facts and people’s comfort.',
      'How the decision affects the people involved.',
      'Keeping harmony and making sure everyone feels heard.',
      'Protecting people’s feelings and the trust between them.',
      'What matters most to the people you care about.',
      'How supported and cared for everyone will end up feeling.'
    ],
    aText: 'You decide by logic. Fairness, consistency, and evidence guide the advice you give and the choices you make.',
    bText: 'You decide by impact. Harmony, care, and how people feel guide the advice you give and the choices you make.'
  }
];

/* ---------- Helpers ---------- */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function canonical(rel) {
  return SITE_URL + '/' + rel;
}

function adInline() {
  return '' +
    '<div class="ad-inline" role="complementary" aria-label="Advertisement">' +
      '<div class="ad-label">Advertisement</div>' +
      '<div class="ad-box">Ad unit — content placement (replace with your AdSense code)</div>' +
    '</div>';
}

function adAnchor() {
  return '' +
    '<div class="ad-anchor" role="complementary" aria-label="Advertisement">' +
      '<div class="ad-label">Advertisement</div>' +
      '<div class="ad-box">Ad unit — anchored footer placement (replace with your AdSense code)</div>' +
    '</div>';
}

function cookieBanner() {
  return '' +
    '<div class="cookie-banner" id="cookieBanner" style="display:none">' +
      '<div class="wrap">' +
        '<span>We use cookies to improve your experience and to show relevant ads. By continuing you agree to our use of cookies.</span>' +
        '<button type="button" onclick="acceptCookies()">Got it</button>' +
      '</div>' +
    '</div>' +
    '<script>' +
    '(function(){' +
    '  function show(){var b=document.getElementById("cookieBanner");if(b){b.style.display="block";}}' +
    '  window.acceptCookies=function(){try{localStorage.setItem("cookie_ok","1");}catch(e){}var b=document.getElementById("cookieBanner");if(b){b.style.display="none";}};' +
    '  try{if(localStorage.getItem("cookie_ok")!=="1"){show();}}catch(e){show();}' +
    '})();' +
    '</script>';
}

function header(active) {
  function link(hrefPath, label, key) {
    var cls = (key === active) ? ' style="color:#4c6ef5;font-weight:700"' : '';
    return '<a href="' + hrefPath + '"' + cls + '>' + label + '</a>';
  }
  return '' +
    '<header class="site-header"><div class="wrap">' +
      '<a class="brand" href="' + HOME + '">' + esc(SITE_NAME) + '</a>' +
      '<nav class="nav">' +
        link(HOME, 'Home', 'home') +
        link(PRIV, 'Privacy', 'privacy') +
        link(TERM, 'Terms', 'terms') +
        link(DIS, 'Disclaimer', 'disclaimer') +
        link(ABOUT, 'About', 'about') +
      '</nav>' +
    '</div></header>';
}

function footer() {
  return '' +
    '<footer class="site-footer"><div class="wrap">' +
      '<div>&copy; ' + new Date().getFullYear() + ' ' + esc(SITE_NAME) + '. For entertainment and self-reflection only.</div>' +
      '<div>' +
        '<a href="' + PRIV + '">Privacy Policy</a>' +
        '<a href="' + TERM + '">Terms of Service</a>' +
        '<a href="' + DIS + '">Disclaimer</a>' +
        '<a href="' + ABOUT + '">About Us</a>' +
      '</div>' +
    '</div></footer>';
}

function pageHead(title, description, rel) {
  return '' +
    '<!DOCTYPE html>' +
    '<html lang="en">' +
    '<head>' +
      '<meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>' + esc(title) + '</title>' +
      '<meta name="description" content="' + esc(description) + '">' +
      '<link rel="canonical" href="' + canonical(rel) + '">' +
      '<meta property="og:type" content="website">' +
      '<meta property="og:title" content="' + esc(title) + '">' +
      '<meta property="og:description" content="' + esc(description) + '">' +
      '<meta property="og:url" content="' + canonical(rel) + '">' +
      '<meta name="twitter:card" content="summary">' +
      '<link rel="stylesheet" href="/assets/style.css">' +
    '</head><body>';
}

function pageClose() {
  return '</body></html>';
}

/* ---------- Page builders ---------- */
function buildIndex() {
  var title = SITE_NAME + ' — ' + SITE_TAGLINE;
  var desc = 'A quick, friendly 3-question MBTI-style insight quiz. Answer three simple questions to see a personalized personality snapshot based on how you recharge, learn, and decide.';
  var qList = '';
  for (var i = 0; i < questions.length; i++) {
    var q = questions[i];
    qList += '<li><a href="' + href(questionPath(q)) + '"><span class="num">' + q.num + '</span>' + esc(q.question) + '</a></li>';
  }
  var html = pageHead(title, desc, 'index.html') +
    header('home') +
    '<main>' +
      '<div class="card">' +
        '<h1>' + esc(SITE_NAME) + ': ' + esc(SITE_TAGLINE) + '</h1>' +
        '<p class="lead">Three short questions. Ten honest options each. At the end you get a simple personality snapshot built from how you recharge, take in information, and make decisions.</p>' +
        '<p>This is a light, entertainment-focused quiz inspired by MBTI ideas. It is for fun and gentle self-reflection, not a clinical or scientific assessment.</p>' +
        '<a class="btn" href="' + href(questionPath(questions[0])) + '">Start the Quiz</a>' +
      '</div>' +
      adInline() +
      '<div class="card">' +
        '<h2>The three questions</h2>' +
        '<p>Each question focuses on one part of personality style. Click any question to begin, or start from the first one.</p>' +
        '<ul class="option-list">' + qList + '</ul>' +
      '</div>' +
      '<div class="card">' +
        '<h2>How it works</h2>' +
        '<p>You answer one question per page. After each answer you land on its own page with a short interpretation, then move to the next question. Your choices are saved in your browser so the final snapshot can be built at the end.</p>' +
      '</div>' +
    '</main>' +
    footer() +
    adAnchor() +
    cookieBanner() +
    pageClose();
  writeFile('index.html', html);
}

function buildQuestion(q) {
  var title = 'MBTI Quiz ' + q.num + ' of 3 — ' + q.h1.replace(/^Question \d+ of \d+ — /, '');
  var desc = esc(q.question) + ' Choose the option that fits you best from ten original choices, then read your interpretation on the next page.';
  var opts = '';
  for (var i = 0; i < q.options.length; i++) {
    var n = i + 1;
    var optHref = href(optionPath(q, n));
    opts += '<li><a href="' + optHref + '"><span class="num">' + n + '</span>' + esc(q.options[i]) + '</a></li>';
  }
  var html = pageHead(title, desc, questionPath(q)) +
    header('home') +
    '<main>' +
      '<a class="back-link" href="' + HOME + '">&larr; Back to home</a>' +
      '<div class="card">' +
        '<span class="q-index">Question ' + q.num + ' of 3</span>' +
        '<h1>' + esc(q.question) + '</h1>' +
        '<p class="lead">' + esc(q.desc) + '</p>' +
        '<ul class="option-list">' + opts + '</ul>' +
      '</div>' +
      adInline() +
      '<div class="card">' +
        '<p>Pick the option that feels most natural. Every option opens its own page with a short, personalized interpretation before you continue.</p>' +
      '</div>' +
    '</main>' +
    footer() +
    adAnchor() +
    cookieBanner() +
    pageClose();
  writeFile(questionPath(q), html);
}

function strength(pos) {
  if (pos <= 2) return 'strongly';
  if (pos <= 4) return 'clearly';
  if (pos === 5) return 'slightly';
  if (pos <= 7) return 'slightly';
  if (pos <= 8) return 'clearly';
  return 'strongly';
}

function buildOption(q, pos) {
  var n = pos;
  var optText = q.options[pos - 1];
  var leansB = pos >= 6;
  var pole = leansB ? q.poleB : q.poleA;
  var sideText = leansB ? q.bText : q.aText;
  var str = strength(pos);
  var title = 'MBTI Quiz Q' + q.num + ' — Option ' + n + ': ' + pole;
  var desc = 'You chose: ' + optText + ' This page explains what that choice suggests about your ' + q.dim + ' style.';
  var interpret = 'Your answer leans <strong>' + str + ' ' + esc(pole) + '</strong>. ' + esc(sideText);
  var storeKey = 'mbti_q' + q.num;
  var nextHref = href(q.next === 'result.html' ? RESULT_HREF.substring(1) : questionPath({ num: q.num + 1 }));
  var html = pageHead(title, desc, optionPath(q, n)) +
    header('home') +
    '<main>' +
      '<a class="back-link" href="' + href(questionPath(q)) + '">&larr; Back to question</a>' +
      '<div class="card">' +
        '<span class="tag">Question ' + q.num + ' of 3 &middot; Option ' + n + ' of 10</span>' +
        '<h1>Your answer</h1>' +
        '<p class="lead">"' + esc(optText) + '"</p>' +
        '<p>' + interpret + '</p>' +
        '<p>Dimension explored: <strong>' + esc(q.dim) + '</strong> — ' + esc(q.poleA) + ' vs ' + esc(q.poleB) + '.</p>' +
        '<a class="btn" href="' + nextHref + '">' + esc(q.nextLabel) + '</a>' +
      '</div>' +
      adInline() +
      '<div class="card">' +
        '<h2>What this means</h2>' +
        '<p>One choice is only a small signal. The full snapshot comes together after all three questions, where we combine your ' + esc(q.dim) + ' tendency with the others.</p>' +
      '</div>' +
    '</main>' +
    footer() +
    adAnchor() +
    cookieBanner() +
    '<script>' +
    '(function(){try{localStorage.setItem("' + storeKey + '","' + n + '");}catch(e){}})();' +
    '</script>' +
    pageClose();
  writeFile(optionPath(q, n), html);
}

function buildResult() {
  var title = 'Your MBTI-Style Personality Snapshot — ' + SITE_NAME;
  var desc = 'See the personality snapshot built from your three answers: energy style, information style, and decision style, combined into a simple three-letter sketch.';
  var html = pageHead(title, desc, RESULT_PATH) +
    header('home') +
    '<main>' +
      '<a class="back-link" href="' + href(questionPath(questions[2])) + '">&larr; Back to last question</a>' +
      '<div class="card">' +
        '<h1>Your Personality Snapshot</h1>' +
        '<p class="lead">Based on the three questions you answered, here is a simple, entertainment-only sketch of your style.</p>' +
        '<div id="resultBox">Loading your result…</div>' +
      '</div>' +
      adInline() +
      '<div class="card">' +
        '<h2>About this snapshot</h2>' +
        '<p>This quiz covers three of the four MBTI dimensions (energy, information, and decisions). It is a friendly reflection tool, not a clinical test. Real personality is broader and changes with context.</p>' +
        '<a class="btn" href="' + HOME + '">Retake the Quiz</a>' +
      '</div>' +
    '</main>' +
    footer() +
    adAnchor() +
    cookieBanner() +
    '<script>' +
    '(function(){' +
    '  function get(n){try{return parseInt(localStorage.getItem(n)||"0",10);}catch(e){return 0;}}' +
    '  var q1=get("mbti_q1"),q2=get("mbti_q2"),q3=get("mbti_q3");' +
    '  var box=document.getElementById("resultBox");' +
    '  if(!q1||!q2||!q3){' +
    '    box.innerHTML="<p>We could not find your answers. Please <a href=\'' + href(questionPath(questions[0])) + '\'>start the quiz</a> again.</p>";' +
    '    return;' +
    '  }' +
    '  function letter(v,a,b){if(v===0)return "?";return v>=6?b:a;}' +
    '  function strengthLabel(v){if(v<=2)return "strongly";if(v<=4)return "clearly";if(v===5)return "slightly";if(v<=7)return "slightly";if(v<=8)return "clearly";return "strongly";}' +
    '  var EI=letter(q1,"I","E"),SN=letter(q2,"S","N"),TF=letter(q3,"T","F");' +
    '  var sketch=EI+SN+TF;' +
    '  var html="";' +
    '  html+="<p><strong>Your sketch: "+sketch+"</strong></p>";' +
    '  html+="<ul>";' +
    '  html+="<li><strong>Energy ("+strengthLabel(q1)+" "+EI+"):</strong> "+(q1>=6?"You recharge by connecting with people and activity.":"You recharge by stepping back and having quiet space.")+"</li>";' +
    '  html+="<li><strong>Information ("+strengthLabel(q2)+" "+SN+"):</strong> "+(q2>=6?"You are drawn to meaning, patterns, and possibilities.":"You trust concrete facts, details, and proven methods.")+"</li>";' +
    '  html+="<li><strong>Decisions ("+strengthLabel(q3)+" "+TF+"):</strong> "+(q3>=6?"You weigh choices by how people feel and the harmony involved.":"You weigh choices by logic, fairness, and evidence.")+"</li>";' +
    '  html+="</ul>";' +
    '  html+="<p>Thanks for taking the quiz. Share it or retake it any time.</p>";' +
    '  box.innerHTML=html;' +
    '})();' +
    '</script>' +
    pageClose();
  writeFile(RESULT_PATH, html);
}

/* ---------- Legal / SEO pages ---------- */
function legalPage(file, title, h1, paras, active) {
  var desc = 'Read the ' + title + ' for ' + SITE_NAME + ', covering how we handle data, ads, and content on this quiz site.';
  var body = '';
  for (var i = 0; i < paras.length; i++) {
    body += '<p>' + paras[i] + '</p>';
  }
  var html = pageHead(title, desc, file) +
    header(active) +
    '<main>' +
      '<div class="card">' +
        '<h1>' + esc(h1) + '</h1>' +
        body +
      '</div>' +
      adInline() +
    '</main>' +
    footer() +
    adAnchor() +
    cookieBanner() +
    pageClose();
  writeFile(file, html);
}

function buildLegal() {
  legalPage('legal/privacy-policy.html', 'Privacy Policy — ' + SITE_NAME, 'Privacy Policy', [
    'This Privacy Policy explains how ' + SITE_NAME + ' ("we", "us") handles information when you use this quiz website.',
    'We do not require you to create an account. The quiz stores your answer choices only in your own browser using local storage, so we never receive or store them on our servers.',
    'We use cookies and similar technologies, including third-party advertising cookies such as Google AdSense, to measure traffic and show relevant ads. You can accept or clear cookies through your browser settings.',
    'Third-party ad partners may use cookies to personalize advertising. Their use of data is governed by their own privacy policies.',
    'We do not knowingly collect personal information from children. This site is intended for general, entertainment use.',
    'If you have questions about this policy, you can contact us through the About page.'
  ], 'privacy');

  legalPage('legal/terms-of-service.html', 'Terms of Service — ' + SITE_NAME, 'Terms of Service', [
    'By using ' + SITE_NAME + ', you agree to these Terms of Service.',
    'This website provides a light, entertainment-focused personality quiz. Results are for fun and self-reflection and must not be used for medical, hiring, clinical, financial, or legal decisions.',
    'All content, including questions and interpretations, is provided "as is" without warranty of any kind.',
    'We may display third-party advertisements. We are not responsible for the content or practices of those advertisers.',
    'You may not misuse the site, attempt to disrupt it, or use it for unlawful purposes.',
    'We may update these terms at any time. Continued use after changes means you accept the updated terms.'
  ], 'terms');

  legalPage('legal/disclaimer.html', 'Disclaimer — ' + SITE_NAME, 'Disclaimer', [
    'The quiz on this site is inspired by MBTI concepts but is not affiliated with, endorsed by, or approved by the official MBTI instrument or its publishers.',
    'Results are generated for entertainment and gentle self-reflection. They are not psychological assessments, diagnoses, or scientific measurements.',
    'Do not use this quiz to make decisions about health, relationships, employment, finances, or safety.',
    'We are not liable for any actions taken based on the content of this site.',
    'Third-party advertisements and links are provided by external parties; their accuracy and practices are their own responsibility.'
  ], 'disclaimer');

  legalPage('legal/about-us.html', 'About Us — ' + SITE_NAME, 'About Us', [
    SITE_NAME + ' is a small project that builds friendly, quick personality quizzes for entertainment and light self-reflection.',
    'Our goal is to make short, approachable quizzes that help people think about how they recharge, learn, and decide — without overclaiming what a quiz can tell them.',
    'This site may show advertisements, including Google AdSense, to support its upkeep. Advertisers are independent and not affiliated with our content.',
    'If you would like to suggest a topic or report an issue, you can reach us through this site’s contact options.'
  ], 'about');
}

/* ---------- robots + sitemap ---------- */
function buildRobots() {
  var txt = 'User-agent: *\n' +
    'Allow: /\n' +
    '\n' +
    'Sitemap: ' + SITE_URL + '/sitemap.xml\n';
  writeFile('robots.txt', txt);
}

function buildSitemap() {
  var urls = ['index.html', 'result.html',
    'legal/privacy-policy.html', 'legal/terms-of-service.html', 'legal/disclaimer.html', 'legal/about-us.html'];
  for (var i = 0; i < questions.length; i++) {
    urls.push(questionPath(questions[i]));
    for (var j = 1; j <= 10; j++) {
      urls.push(optionPath(questions[i], j));
    }
  }
  var today = new Date().toISOString().slice(0, 10);
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (var k = 0; k < urls.length; k++) {
    xml += '  <url>\n';
    xml += '    <loc>' + SITE_URL + '/' + urls[k] + '</loc>\n';
    xml += '    <lastmod>' + today + '</lastmod>\n';
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>' + (urls[k] === 'index.html' ? '1.0' : '0.7') + '</priority>\n';
    xml += '  </url>\n';
  }
  xml += '</urlset>\n';
  writeFile('sitemap.xml', xml);
}

/* ---------- write + run ---------- */
function writeFile(rel, content) {
  var p = path.join(OUT, rel);
  var dir = path.dirname(p);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(p, content, 'utf8');
  console.log('wrote ' + rel);
}

buildIndex();
for (var i = 0; i < questions.length; i++) {
  buildQuestion(questions[i]);
  for (var j = 1; j <= 10; j++) {
    buildOption(questions[i], j);
  }
}
buildResult();
buildLegal();
buildRobots();
buildSitemap();
console.log('Done.');
