/* Build script for the MBTI Quick Insight quiz site.
   Pure static HTML + ES5 output. Run with: node build.js
   - questions/ : one page per question + one page per answer option (pool of 12 questions)
   - legal/     : compliance pages
   - result/    : personality snapshot (aggregates all answered questions)
   - A random 5-question quiz runs client-side so returning users see variety. */
var fs = require('fs');
var path = require('path');

var SITE_URL = 'https://mbti-quick.example.com';
var SITE_NAME = 'MindType';
var SITE_TAGLINE = 'Quick MBTI Insight Quiz';
var OUT = __dirname;
var QUIZ_LEN = 5;

/* Root-absolute link helpers (work from any directory depth) */
var HOME = '/index.html';
var PRIV = '/legal/privacy-policy.html';
var TERM = '/legal/terms-of-service.html';
var DIS = '/legal/disclaimer.html';
var ABOUT = '/legal/about-us.html';
var RESULT_PATH = 'result/index.html';
var RESULT_HREF = '/result/';

function questionPath(q) { return 'questions/' + q.id + '.html'; }
function optionPath(q, n) { return 'questions/' + q.id + '-' + n + '.html'; }
function href(rel) { return '/' + rel; }

/* ---------- Dimension metadata ---------- */
var DIMS = {
  EI: {
    code: 'EI', name: 'Energy', a: 'Introvert-leaning', b: 'Extravert-leaning', aLetter: 'I', bLetter: 'E',
    aText: 'You recharge by stepping back. Quiet time, fewer inputs, and one-on-one depth help you reset and think clearly.',
    bText: 'You recharge by connecting outward. Conversation, shared activity, and group energy lift you up and keep you moving.'
  },
  SN: {
    code: 'SN', name: 'Information', a: 'Sensing-leaning', b: 'Intuition-leaning', aLetter: 'S', bLetter: 'N',
    aText: 'You trust what is concrete. Facts, details, and proven methods feel safe, useful, and easy to act on.',
    bText: 'You are drawn to meaning. Patterns, possibilities, and big ideas pull your attention beyond the surface.'
  },
  TF: {
    code: 'TF', name: 'Decisions', a: 'Thinking-leaning', b: 'Feeling-leaning', aLetter: 'T', bLetter: 'F',
    aText: 'You decide by logic. Fairness, consistency, and evidence guide the advice you give and the choices you make.',
    bText: 'You decide by impact. Harmony, care, and how people feel guide the advice you give and the choices you make.'
  },
  JP: {
    code: 'JP', name: 'Structure', a: 'Judging-leaning', b: 'Perceiving-leaning', aLetter: 'J', bLetter: 'P',
    aText: 'You like things settled. Plans, clear steps, and closure help you feel calm and in control.',
    bText: 'You like things open. Flexibility, spontaneity, and room to adapt keep you energized.'
  }
};
var DIM_ORDER = ['EI', 'SN', 'TF', 'JP'];

/* ---------- Question pool (12 original questions) ---------- */
var questions = [
  /* EI */
  {
    id: 'qE1', dim: 'EI',
    question: 'After a busy, people-filled week, what helps you feel most like yourself again?',
    desc: 'This question explores how you naturally recharge. Pick the option that feels closest to you.',
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
    ]
  },
  {
    id: 'qE2', dim: 'EI',
    question: 'At a lively gathering, you usually…',
    desc: 'Think about where you naturally end up when the room is full of people.',
    options: [
      'Stay near one trusted person for almost the whole time.',
      'Talk with a small familiar group in a quiet corner.',
      'Chat with a few friends, then slip away early.',
      'Join conversations but take regular breaks on your own.',
      'Mix socializing with a few quiet moments.',
      'Move between groups and enjoy the buzz.',
      'Introduce yourself to new people often.',
      'Stay in the middle of as many talks as possible.',
      'Keep the energy going well into the night.',
      'Thrive as the one hosting or performing.'
    ]
  },
  {
    id: 'qE3', dim: 'EI',
    question: 'For a big personal win, you would rather…',
    desc: 'How do you like to mark something that went really well for you?',
    options: [
      'Celebrate quietly by yourself.',
      'Tell one very close friend.',
      'Share it with a small inner circle.',
      'Post a low-key update to just a few people.',
      'Mention it to whoever happens to ask.',
      'Share it with a wider friend group.',
      'Post it publicly and enjoy the reactions.',
      'Throw a small gathering to mark it.',
      'Celebrate with a big crowd.',
      'Make it a public event everyone hears about.'
    ]
  },
  /* SN */
  {
    id: 'qS1', dim: 'SN',
    question: 'When you first hear a new idea, what pulls your attention the most?',
    desc: 'This question looks at how you prefer to take in information.',
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
    ]
  },
  {
    id: 'qS2', dim: 'SN',
    question: 'You tend to remember a place best by…',
    desc: 'Think about what sticks in your mind after you visit somewhere new.',
    options: [
      'The exact sights, sounds, and details you saw.',
      'Specific landmarks and what you did there.',
      'Clear facts like addresses, names, and times.',
      'Practical tips that helped you get around.',
      'A mix of details and the overall feel.',
      'The mood and the little story of the visit.',
      'The big impression it left on you.',
      'The ideas or symbols it triggered.',
      'How it might connect to other places.',
      'The dreamlike meaning it seemed to carry.'
    ]
  },
  {
    id: 'qS3', dim: 'SN',
    question: 'When learning a new skill, you prefer to…',
    desc: 'Choose the way you usually like to pick something up.',
    options: [
      'Follow step-by-step instructions exactly.',
      'Use clear examples and hands-on practice.',
      'Stick to proven methods that already work.',
      'Drill the practical parts until it feels real.',
      'Balance practice with the bigger picture.',
      'Understand the underlying principle first.',
      'Explore creative variations of it.',
      'Imagine new ways it could be used.',
      'Link it to broad concepts I already know.',
      'Reinvent it into something completely new.'
    ]
  },
  /* TF */
  {
    id: 'qT1', dim: 'TF',
    question: 'When a friend asks for advice on a hard choice, you usually start with…',
    desc: 'This question shows how you weigh decisions for other people.',
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
    ]
  },
  {
    id: 'qT2', dim: 'TF',
    question: 'When judging whether an idea is good, you focus on…',
    desc: 'What do you weigh first when something sounds promising?',
    options: [
      'Whether it is logically sound.',
      'If the reasoning holds up fairly.',
      'The evidence that supports it.',
      'How well it survives criticism.',
      'Both the logic and the people it affects.',
      'How it lands with the people involved.',
      'Whether it feels right to those who are hurt.',
      'The values and care it shows.',
      'How much it helps the people you love.',
      'The warmth and support it creates.'
    ]
  },
  {
    id: 'qT3', dim: 'TF',
    question: 'In a disagreement, you care most about…',
    desc: 'When people clash, what matters most to you?',
    options: [
      'Reaching the objectively correct point.',
      'Applying fair, consistent rules.',
      'Finding the clearest factual answer.',
      'Winning the argument on its merits.',
      'The truth and everyone’s feelings alike.',
      'Keeping the peace among the people.',
      'Making sure no one feels blamed.',
      'Protecting trust and the relationships.',
      'Supporting the person who is hurt.',
      'Everyone feeling safe and valued.'
    ]
  },
  /* JP */
  {
    id: 'qJ1', dim: 'JP',
    question: 'Your weekend plans are usually…',
    desc: 'This question looks at how much structure you like.',
    options: [
      'Fully scheduled down to the hour.',
      'Mostly planned, with a clear list.',
      'Planned, following a set routine.',
      'Loose plans with a few key things fixed.',
      'A rough plan that stays open to change.',
      'A few ideas, decided on the day.',
      'Mostly spontaneous.',
      'Whatever feels right in the moment.',
      'Open, with no plan at all.',
      'Pure improvisation, no agenda.'
    ]
  },
  {
    id: 'qJ2', dim: 'JP',
    question: 'When a deadline approaches, you tend to…',
    desc: 'How do you usually work toward a due date?',
    options: [
      'Finish everything days ahead of time.',
      'Work steadily to a set schedule.',
      'Tick tasks off in order, one by one.',
      'Wrap up with a little buffer to spare.',
      'Mix planning with a few last tweaks.',
      'Pick up the pace closer to the end.',
      'Do a solid push near the deadline.',
      'Work in bursts as it gets urgent.',
      'Leave most of it for the final hours.',
      'Thrive on the last-minute rush.'
    ]
  },
  {
    id: 'qJ3', dim: 'JP',
    question: 'You feel best when things are…',
    desc: 'What state of affairs helps you feel calm and good?',
    options: [
      'Decided, settled, and closed.',
      'Organized, with clear next steps.',
      'Scheduled and under control.',
      'Mostly sorted, with few loose ends.',
      'Flexible yet still moving forward.',
      'Open but with a general direction.',
      'Loose and adaptable.',
      'Unplanned and free.',
      'Wide open to possibility.',
      'Completely spontaneous.'
    ]
  }
];

function poolIds() {
  var a = [];
  for (var i = 0; i < questions.length; i++) { a.push(questions[i].id); }
  return a;
}

/* ---------- Helpers ---------- */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function canonical(rel) { return SITE_URL + '/' + rel; }

function adInline() {
  return '' +
    '<div class="ad-inline" id="ad-slot-inline" role="complementary" aria-label="Advertisement">' +
      '<div class="ad-label">Advertisement</div>' +
      '<div class="ad-box" id="ad-box-inline">Ad unit — content placement (replace with your ad code)</div>' +
    '</div>';
}

function adAnchor() {
  return '' +
    '<div class="ad-anchor" id="ad-slot-anchor" role="complementary" aria-label="Advertisement">' +
      '<div class="ad-label">Advertisement</div>' +
      '<div class="ad-box" id="ad-box-anchor">Ad unit — anchored footer placement (replace with your ad code)</div>' +
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

/* Shared quiz engine (ES5). Included on home, answer pages, and result. */
function globalJs() {
  var ids = JSON.stringify(poolIds());
  return '<script>' +
    'var MBTI_POOL=' + ids + ';' +
    'var MBTI_QUIZ_LEN=' + QUIZ_LEN + ';' +
    'function shuffle(arr){for(var i=arr.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=arr[i];arr[i]=arr[j];arr[j]=t;}return arr;}' +
    'function startRandomQuiz(){' +
    '  var picked=shuffle(MBTI_POOL.slice()).slice(0,MBTI_QUIZ_LEN);' +
    '  try{localStorage.setItem("mbti_session",JSON.stringify(picked));localStorage.removeItem("mbti_answers");}catch(e){}' +
    '  if(picked.length){window.location.href="/questions/"+picked[0]+".html";}' +
    '  else{window.location.href="/questions/"+MBTI_POOL[0]+".html";}' +
    '}' +
    'function continueQuiz(id){' +
    '  var sess=null;' +
    '  try{sess=JSON.parse(localStorage.getItem("mbti_session")||"null");}catch(e){sess=null;}' +
    '  if(sess&&sess.length){' +
    '    var idx=sess.indexOf(id);' +
    '    if(idx>=0 && idx<sess.length-1){window.location.href="/questions/"+sess[idx+1]+".html";return;}' +
    '    window.location.href="/result/";return;' +
    '  }' +
    '  window.location.href="/result/";' +
    '}' +
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
      '<script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>' +
    '</head><body>';
}

function libScripts() {
  return '' +
    '<script src="/libs/globalClickAndPv.js"></script>' +
    '<script src="/libs/recaptcha.js"></script>' +
    '<script src="/libs/adClickTracker.js"></script>' +
    '<script src="/libs/adxLimitControl.js"></script>' +
    '<script src="/libs/adxLimitControl-detail.js"></script>';
}

function pageClose() { return libScripts() + '</body></html>'; }

/* ---------- Homepage: full question bank + random quiz ---------- */
function buildIndex() {
  var title = SITE_NAME + ' — ' + SITE_TAGLINE;
  var desc = 'A friendly MBTI-style insight quiz with a bank of 12 questions across four personality dimensions. Start a random 5-question quiz, or browse and answer any question directly — each option opens its own page with a short interpretation.';
  var sections = '';
  for (var d = 0; d < DIM_ORDER.length; d++) {
    var dim = DIMS[DIM_ORDER[d]];
    var cards = '';
    for (var i = 0; i < questions.length; i++) {
      var q = questions[i];
      if (q.dim !== DIM_ORDER[d]) { continue; }
      var opts = '';
      for (var j = 0; j < q.options.length; j++) {
        var n = j + 1;
        opts += '<li><a href="' + href(optionPath(q, n)) + '"><span class="num">' + n + '</span>' + esc(q.options[j]) + '</a></li>';
      }
      cards += '<div class="card">' +
          '<span class="q-index">' + esc(dim.code) + ' · ' + esc(dim.name) + '</span>' +
          '<h3><a href="' + href(questionPath(q)) + '">' + esc(q.question) + '</a></h3>' +
          '<p class="lead">' + esc(q.desc) + '</p>' +
          '<ul class="option-list">' + opts + '</ul>' +
          '<p class="more-link"><a href="' + href(questionPath(q)) + '">Open this question on its own page &rarr;</a></p>' +
        '</div>';
    }
    sections += '<section class="dim-section">' +
        '<h2>' + esc(dim.name) + ' <span class="dim-code">' + esc(dim.code) + '</span></h2>' +
        '<p class="dim-intro">' + esc(dim.a) + ' vs ' + esc(dim.b) + '. Answer any of these to explore this side of your style.</p>' +
        cards +
      '</section>';
  }
  var html = pageHead(title, desc, 'index.html') +
    header('home') +
    '<main>' +
      '<div class="card hero">' +
        '<h1>' + esc(SITE_NAME) + ': ' + esc(SITE_TAGLINE) + '</h1>' +
        '<p class="lead">A bank of 12 questions across four personality dimensions. Every visit can be different — hit start for a random set, or scroll down and answer any question directly.</p>' +
        '<p>Pick the option that feels closest to you and read your interpretation on the next page. Your answers are saved in your browser so we can build a personality snapshot at the end.</p>' +
        '<a class="btn" href="' + href(questionPath(questions[0])) + '" onclick="startRandomQuiz();return false;">Start a Random ' + QUIZ_LEN + '-Question Quiz</a>' +
        ' <a class="btn btn-ghost" href="#bank">Browse All Questions</a>' +
      '</div>' +
      '<a id="bank"></a>' +
      sections +
      adInline() +
      '<div class="card">' +
        '<h2>How it works</h2>' +
        '<p>You can answer questions in any order. After each answer you land on its own page with a short interpretation, then continue to the next question in your quiz. When you have answered some, open your <a href="' + RESULT_HREF + '">personality snapshot</a>.</p>' +
        '<p>Because the quiz picks questions at random, coming back later gives you a fresh mix — a fun way to see which tendencies stay steady for you.</p>' +
      '</div>' +
    '</main>' +
    footer() +
    adAnchor() +
    cookieBanner() +
    globalJs() +
    pageClose();
  writeFile('index.html', html);
}

/* ---------- Question page ---------- */
function buildQuestion(q) {
  var dim = DIMS[q.dim];
  var title = 'MBTI Quiz — ' + dim.name + ' Question';
  var desc = esc(q.question) + ' Choose the option that fits you best from ten original choices, then read your interpretation on the next page.';
  var opts = '';
  for (var i = 0; i < q.options.length; i++) {
    var n = i + 1;
    opts += '<li><a href="' + href(optionPath(q, n)) + '"><span class="num">' + n + '</span>' + esc(q.options[i]) + '</a></li>';
  }
  var html = pageHead(title, desc, questionPath(q)) +
    header('home') +
    '<main>' +
      '<a class="back-link" href="' + HOME + '">&larr; Back to home</a>' +
      '<div class="card">' +
        '<span class="q-index">' + esc(dim.code) + ' · ' + esc(dim.name) + '</span>' +
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

/* ---------- Answer page (one HTML per option) ---------- */
function buildOption(q, pos) {
  var n = pos;
  var dim = DIMS[q.dim];
  var optText = q.options[pos - 1];
  var leansB = pos >= 6;
  var pole = leansB ? dim.b : dim.a;
  var sideText = leansB ? dim.bText : dim.aText;
  var str = strength(pos);
  var title = 'MBTI ' + dim.code + ' — Option ' + n + ': ' + pole;
  var desc = 'You chose: ' + optText + ' This page explains what that choice suggests about your ' + dim.code + ' style.';
  var interpret = 'Your answer leans <strong>' + str + ' ' + esc(pole) + '</strong>. ' + esc(sideText);
  var storeKey = 'mbti_' + q.id;
  var html = pageHead(title, desc, optionPath(q, n)) +
    header('home') +
    '<main>' +
      '<a class="back-link" href="' + href(questionPath(q)) + '">&larr; Back to question</a>' +
      '<div class="card">' +
        '<span class="tag">' + esc(dim.code) + ' · ' + esc(dim.name) + ' &middot; Option ' + n + ' of 10</span>' +
        '<h1>Your answer</h1>' +
        '<p class="lead">"' + esc(optText) + '"</p>' +
        '<p>' + interpret + '</p>' +
        '<p>Dimension explored: <strong>' + esc(dim.code) + '</strong> — ' + esc(dim.a) + ' vs ' + esc(dim.b) + '.</p>' +
        '<a class="btn" href="' + RESULT_HREF + '" onclick="continueQuiz(\'' + q.id + '\');return false;">Continue</a>' +
      '</div>' +
      adInline() +
      '<div class="card">' +
        '<h2>What this means</h2>' +
        '<p>One choice is only a small signal. The full snapshot combines this with your other answers across the four dimensions.</p>' +
      '</div>' +
    '</main>' +
    footer() +
    adAnchor() +
    cookieBanner() +
    '<script>' +
    '(function(){' +
    '  try{' +
    '    var a={};try{a=JSON.parse(localStorage.getItem("mbti_answers")||"{}");}catch(e){a={};}' +
    '    a["' + storeKey + '"]=' + n + ';' +
    '    localStorage.setItem("mbti_answers",JSON.stringify(a));' +
    '  }catch(e){}' +
    '})();' +
    '</script>' +
    pageClose();
  writeFile(optionPath(q, n), html);
}

/* ---------- Result page (aggregates all answers) ---------- */
function buildResult() {
  var title = 'Your MBTI-Style Personality Snapshot — ' + SITE_NAME;
  var desc = 'See the personality snapshot built from every question you answered: energy, information, decisions, and structure combined into a simple four-letter sketch.';
  var dimsJson = JSON.stringify(DIMS);
  var html = pageHead(title, desc, RESULT_PATH) +
    header('home') +
    '<main>' +
      '<a class="back-link" href="' + HOME + '">&larr; Back to home</a>' +
      '<div class="card">' +
        '<h1>Your Personality Snapshot</h1>' +
        '<p class="lead">Based on the questions you answered, here is a simple, entertainment-only sketch of your style.</p>' +
        '<div id="resultBox">Loading your result…</div>' +
      '</div>' +
      adInline() +
      '<div class="card">' +
        '<h2>About this snapshot</h2>' +
        '<p>This quiz covers all four MBTI dimensions (energy, information, decisions, structure). It is a friendly reflection tool, not a clinical test. Real personality is broader and changes with context.</p>' +
        '<p><a class="btn" href="' + HOME + '" onclick="startRandomQuiz();return false;">Start a New Random Quiz</a></p>' +
      '</div>' +
    '</main>' +
    footer() +
    adAnchor() +
    cookieBanner() +
    globalJs() +
    '<script>' +
    '(function(){' +
    '  var DIMS=' + dimsJson + ';' +
    '  var ORDER=["EI","SN","TF","JP"];' +
    '  function getAnswers(){try{return JSON.parse(localStorage.getItem("mbti_answers")||"{}");}catch(e){return {};}}' +
    '  var ans=getAnswers();' +
    '  var ids=Object.keys(ans);' +
    '  var box=document.getElementById("resultBox");' +
    '  if(!ids.length){' +
    '    box.innerHTML="<p>We could not find your answers yet. <a href=\'' + HOME + '\'>Start the quiz</a> or answer a question below.</p>";' +
    '    return;' +
    '  }' +
    '  var sums={},counts={};' +
    '  for(var k=0;k<ids.length;k++){' +
    '    var key=ids[k];' +                 /* mbti_qE1 -> dim code from position 5 */
    '    var dim=key.substring(5,7);' +
    '    if(!sums[dim]){sums[dim]=0;counts[dim]=0;}' +
    '    sums[dim]+=ans[key];counts[dim]+=1;' +
    '  }' +
    '  var sketch="";var lines="";var known=0;' +
    '  for(var d=0;d<ORDER.length;d++){' +
    '    var code=ORDER[d];var dm=DIMS[code];' +
    '    if(counts[code]){' +
    '      var avg=sums[code]/counts[code];' +
    '      var letter=avg>=6?dm.bLetter:dm.aLetter;' +
    '      sketch+=letter;known+=1;' +
    '      var txt=avg>=6?dm.bText:dm.aText;' +
    '      lines+="<li><strong>"+dm.name+" ("+letter+"):</strong> "+txt+"</li>";' +
    '    } else {' +
    '      sketch+="?";' +
    '      lines+="<li><strong>"+dm.name+" (?):</strong> Not answered yet — explore its questions to fill this in.</li>";' +
    '    }' +
    '  }' +
    '  var html="";' +
    '  html+="<p><strong>Your sketch: "+sketch+"</strong> ("+known+" of 4 dimensions answered)</p>";' +
    '  html+="<ul>"+lines+"</ul>";' +
    '  html+="<p>Thanks for taking the quiz. Come back any time — a new random mix awaits.</p>";' +
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
  for (var i = 0; i < paras.length; i++) { body += '<p>' + paras[i] + '</p>'; }
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
    'Our goal is to make short, approachable quizzes that help people think about how they recharge, learn, decide, and organize — without overclaiming what a quiz can tell them.',
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
  var urls = ['index.html', RESULT_PATH,
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
  if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }
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
console.log('Done. Total question pages: ' + questions.length + ', answer pages: ' + (questions.length * 10) + '.');
