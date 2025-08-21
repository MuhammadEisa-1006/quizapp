/* =======================
   Data: 3 subjects × 10 MCQs
   Each question: { q, options:[a,b,c,d], answer: index }
======================= */
const QUESTIONS = {
  HTML: [
    { q: "What does HTML stand for?", options: ["Hyperlinks and Text Markup Language","Home Tool Markup Language","HyperText Markup Language","Hyperlinking Text Management Language"], answer: 2 },
    { q: "Choose the correct HTML element for the largest heading:", options: ["<heading>","<h6>","<h1>","<head>"], answer: 2 },
    { q: "Which tag creates a hyperlink?", options: ["<link>","<a>","<href>","<nav>"], answer: 1 },
    { q: "Which attribute specifies an image source?", options: ["link","href","src","alt"], answer: 2 },
    { q: "Which tag inserts a line break?", options: ["<lb>","<br>","<break>","<line>"], answer: 1 },
    { q: "Correct HTML for a checkbox:", options: ["<checkbox>","<input type='checkbox'>","<check>","<cb>"], answer: 1 },
    { q: "Which tag defines a table row?", options: ["<td>","<tr>","<th>","<row>"], answer: 1 },
    { q: "Which element contains meta information?", options: ["<meta>","<header>","<head>","<info>"], answer: 2 },
    { q: "Which is a semantic element?", options: ["<div>","<span>","<article>","<b>"], answer: 2 },
    { q: "Correct HTML5 doctype:", options: ["<!DOCTYPE HTML5>","<!DOCTYPE html>","<doctype html>","<!HTML5>"], answer: 1 },
  ],
  CSS: [
    { q: "What does CSS stand for?", options: ["Creative Style System","Cascading Style Sheets","Computer Styled Sections","Colorful Style Syntax"], answer: 1 },
    { q: "Where is an external stylesheet referenced?", options: ["<head>","<body>","At the end of HTML","It’s not allowed"], answer: 0 },
    { q: "Correct CSS comment syntax:", options: ["// comment","<!-- comment -->","/* comment */","# comment"], answer: 2 },
    { q: "Which property changes text color?", options: ["font-style","text-color","color","font-color"], answer: 2 },
    { q: "How to select element with id='main'?", options: [".main","#main","main","*main"], answer: 1 },
    { q: "Which property controls spacing inside border?", options: ["margin","padding","gap","indent"], answer: 1 },
    { q: "Make text bold:", options: ["font-weight: bold;","text-weight: bold;","bold: true;","font: bold;"], answer: 0 },
    { q: "Flexbox main axis alignment:", options: ["align-items","justify-content","place-items","text-align"], answer: 1 },
    { q: "Which unit is relative to viewport width?", options: ["em","rem","vh","vw"], answer: 3 },
    { q: "Round the corners of a box:", options: ["border-corner","corner-radius","border-radius","round"], answer: 2 },
  ],
  JavaScript: [
    { q: "Which is a correct way to declare a variable?", options: ["variable x = 5;","let x = 5;","dim x = 5;","set x = 5;"], answer: 1 },
    { q: "Data type of `true`:", options: ["string","number","boolean","undefined"], answer: 2 },
    { q: "`===` does what?", options: ["Assignment","Loose equality","Strict equality","Comparison with type coercion"], answer: 2 },
    { q: "How to write an array?", options: ["{1,2,3}","(1,2,3)","[1,2,3]","<1,2,3>"], answer: 2 },
    { q: "Which method adds an item to end of array?", options: ["push()","pop()","shift()","unshift()"], answer: 0 },
    { q: "How to write a function?", options: ["function myFunc() {}","def myFunc() {}","func myFunc() {}","function:myFunc() {}"], answer: 0 },
    { q: "Result of `typeof null`:", options: ["'null'","'object'","'undefined'","'number'"], answer: 1 },
    { q: "Which keyword stops a loop?", options: ["exit","stop","quit","break"], answer: 3 },
    { q: "Convert string to number:", options: ["toNumber(str)","parseInt(str)","Number.parse(str)","int(str)"], answer: 1 },
    { q: "How to log to console?", options: ["console.print()","log.console()","console.log()","print.console()"], answer: 2 },
  ]
};

/* =======================
   Helpers
======================= */
function $(sel){ return document.querySelector(sel); }
function qsParam(name){ return new URLSearchParams(location.search).get(name); }
function saveToBoard(entry){
  const key = 'qq_leaderboard';
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  arr.push(entry);
  localStorage.setItem(key, JSON.stringify(arr));
}

/* =======================
   Quiz Page Logic
======================= */
if (document.body && location.pathname.endsWith('quiz.html')) {
  const username = qsParam('username') || 'Guest';
  const subject  = qsParam('subject') || 'HTML';
  const set = QUESTIONS[subject] || QUESTIONS.HTML;

  // UI
  $('#userName').textContent = username;
  $('#subjectTitle').textContent = subject;

  // State
  const total = set.length;           // 10
  let index = 0;                      // current question
  const answers = Array(total).fill(null); // selected option indices
  const timeLeft = Array(total).fill(15);  // per-question remaining seconds
  let ticking = null;                 // interval handle

  // Elements
  const timeEl = $('#time');
  const barEl = $('#barFill');
  const qNumEl = $('#qNum');
  const qTextEl = $('#qText');
  const formEl = $('#options');
  const hintEl = $('#hint');
  const qCard = $('#qCard');
  const resultsCard = $('#resultsCard');
  const prevBtn = $('#prevBtn');
  const nextBtn = $('#nextBtn');
  const finishBtn = $('#finishBtn');

  // Setup first render
  renderQuestion();
  startTimer();

  /* ----- Rendering ----- */
  function renderQuestion() {
    qCard.classList.remove('hidden');
    resultsCard.classList.add('hidden');

    const q = set[index];
    qNumEl.textContent = String(index+1);
    qTextEl.textContent = q.q;
    formEl.innerHTML = '';

    q.options.forEach((opt, i) => {
      const id = `opt-${index}-${i}`;
      const label = document.createElement('label');
      label.setAttribute('for', id);
      label.innerHTML = `
        <input type="radio" name="opt" id="${id}" value="${i}" ${answers[index]===i?'checked':''}/>
        <span>${escapeHTML(opt)}</span>
      `;
      formEl.appendChild(label);
    });

    // restore hint
    hintEl.textContent = '';

    // UI buttons
    prevBtn.disabled = index === 0;
    nextBtn.classList.toggle('hidden', index === total-1);
    finishBtn.classList.toggle('hidden', index !== total-1);

    updateTimerUI();
  }

  function escapeHTML(str){
    return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  /* ----- Timer ----- */
  function startTimer() {
    clearInterval(ticking);
    ticking = setInterval(() => {
      timeLeft[index] = Math.max(0, timeLeft[index]-1);
      updateTimerUI();

      if (timeLeft[index] === 0) {
        // auto move to next or finish
        clearInterval(ticking);
        setTimeout(() => {
          if (index < total-1) {
            index++;
            renderQuestion();
            startTimer();
          } else {
            finishQuiz(true); // true = time-finished
          }
        }, 300);
      }
    }, 1000);
  }
  function updateTimerUI() {
    timeEl.textContent = String(timeLeft[index]);
    const pct = (timeLeft[index]/15)*100;
    barEl.style.width = pct + '%';
    if (timeLeft[index] <= 5) barEl.style.background = 'linear-gradient(90deg,var(--danger),var(--accent))';
    else barEl.style.background = 'linear-gradient(90deg,var(--success),var(--primary))';
  }

  /* ----- Events ----- */
  formEl.addEventListener('change', (e) => {
    if (e.target.name === 'opt') {
      answers[index] = Number(e.target.value);
      hintEl.textContent = '';
    }
  });

  prevBtn.addEventListener('click', () => {
    clearInterval(ticking);
    index = Math.max(0, index-1);
    renderQuestion();
    startTimer();
  });

  nextBtn.addEventListener('click', () => {
    // Rule: users shouldn't submit without selecting — for NEXT we require a selection
    if (answers[index] === null && timeLeft[index] > 0) {
      nudgeHint("Please select an answer before moving on.");
      return;
    }
    clearInterval(ticking);
    index = Math.min(total-1, index+1);
    renderQuestion();
    startTimer();
  });

  finishBtn.addEventListener('click', () => {
    // Allow finishing even if some timed-out; unanswered count as incorrect
    finishQuiz(false);
  });

  function nudgeHint(msg){
    hintEl.textContent = msg;
    nextBtn.classList.add('shake');
    setTimeout(()=>nextBtn.classList.remove('shake'),300);
  }

  /* ----- Finish & Score ----- */
  function finishQuiz(fromTimeout){
    clearInterval(ticking);
    // Score = number of correct matches (unanswered = null = incorrect)
    let score = 0;
    const reviewFrag = document.createDocumentFragment();

    set.forEach((q, i) => {
      const userPick = answers[i];
      const correct = q.answer;
      if (userPick === correct) score++;

      const div = document.createElement('div');
      div.className = 'review-block ' + (userPick === correct ? 'correct' : 'incorrect');
      div.innerHTML = `
        <p class="q"><strong>Q${i+1}.</strong> ${escapeHTML(q.q)}</p>
        ${q.options.map((opt, idx) => {
          const classes = [
            'choice',
            (idx === correct ? 'correct' : ''),
            (userPick === idx && userPick !== correct ? 'incorrect' : '')
          ].filter(Boolean).join(' ');
          const tags = [
            (idx === correct ? '<span class="tag">Correct</span>' : ''),
            (userPick === idx ? '<span class="tag">Your choice</span>' : '')
          ].join(' ');
          return `<div class="${classes}">${escapeHTML(opt)} ${tags}</div>`;
        }).join('')}
      `;
      reviewFrag.appendChild(div);
    });

    const pct = Math.round((score/total)*100);
    document.getElementById('finalScore').textContent = String(score);
    document.getElementById('percentage').textContent = pct + '%';

    const review = document.getElementById('review');
    review.innerHTML = '';
    review.appendChild(reviewFrag);

    // Save to leaderboard
    saveToBoard({ username, subject, score, time: Date.now() });

    // Toggle views
    document.getElementById('resultsCard').classList.remove('hidden');
    document.getElementById('qCard').classList.add('hidden');

    // Retake
    document.getElementById('retakeBtn').onclick = () => {
      // Reset state
      for (let i=0;i<total;i++){ answers[i]=null; timeLeft[i]=15; }
      index = 0;
      renderQuestion();
      startTimer();
      resultsCard.classList.add('hidden');
      qCard.classList.remove('hidden');
      window.scrollTo({ top:0, behavior:'smooth' });
    };
  }
}

/* Tiny flair for button shake */
const style = document.createElement('style');
style.textContent = `
  .shake { animation: sh .3s linear; }
  @keyframes sh { 10%, 90% { transform: translateX(-1px) } 20%, 80% { transform: translateX(2px) } 30%,50%,70% { transform: translateX(-4px) } 40%, 60% { transform: translateX(4px) } }
`;
document.head.appendChild(style);
