// Mood & Tone Academy — interactive lessons
'use strict';
(function () {
  const $ = s => document.querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
  const store = {
    get(k, d) { try { const v = localStorage.getItem('mta-' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('mta-' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  };

  // =================================================================== 1. feelings wheel
  const WHEEL = [
    { core: 'Happy', color: '#f5c542', words: [
      ['Content', 'Satisfied with how things are right now; nothing needs to change.', 'Relaxed shoulders, slow easy breathing.', 'Nothing! Just notice and enjoy it.'],
      ['Proud', 'Pleased about something you (or someone close) achieved.', 'Standing taller, chest open, warm face.', 'To share it with someone who\'ll celebrate with you.'],
      ['Hopeful', 'Expecting that something good can happen.', 'Lightness in the chest, forward-leaning energy.', 'A next small step to move toward it.'],
      ['Grateful', 'Thankful for something or someone.', 'Warmth in the chest, soft smile.', 'To say thank you out loud.'],
      ['Playful', 'Light, silly, wanting fun.', 'Bouncy energy, laughing easily.', 'Someone to play along (and to check they\'re in the mood too).'],
      ['Excited', 'High-energy happiness about something coming up.', 'Fast heartbeat, can\'t sit still, talking fast.', 'An outlet: plan, share, move.'],
    ] },
    { core: 'Sad', color: '#5b8def', words: [
      ['Lonely', 'Wanting connection that isn\'t there, even in a crowd.', 'Heavy, empty feeling; low energy.', 'Reaching out, even with a small message.'],
      ['Disappointed', 'Something didn\'t turn out the way you hoped.', 'Sinking feeling, sighing.', 'To let yourself feel it, then adjust expectations or plan B.'],
      ['Hurt', 'Emotional pain caused by someone\'s words or actions.', 'Tight throat, tears, ache in the chest.', 'To be heard, and possibly to tell the person.'],
      ['Grief', 'Deep sadness about a loss: a person, pet, friendship or chapter of life.', 'Exhaustion, waves of crying, numbness.', 'Time, comfort, and people who let you talk about it.'],
      ['Guilty', 'Feeling you did something wrong (about an action).', 'Knot in the stomach, avoiding eye contact.', 'To make amends if you can, then forgive yourself.'],
      ['Ashamed', 'Feeling that <i>you</i> are bad (about yourself, not an action).', 'Wanting to hide or disappear, hot face.', 'Kindness. Shame shrinks when shared with someone safe.'],
    ] },
    { core: 'Angry', color: '#e5533d', words: [
      ['Irritated', 'Mild, prickly annoyance.', 'Tense jaw, short replies.', 'A break, or removing the small annoying thing.'],
      ['Frustrated', 'Blocked from something you want or are trying to do.', 'Clenched hands, wanting to quit or hit something.', 'A different approach, or help.'],
      ['Jealous', 'Afraid of losing someone or something to another person.', 'Hot stomach, watching closely.', 'Reassurance and honest talk, not control.'],
      ['Resentful', 'Old anger that keeps simmering because it was never resolved.', 'Bitterness, replaying the event.', 'To finally say it directly, or to let it go deliberately.'],
      ['Betrayed', 'Someone you trusted broke that trust.', 'Shock plus anger, feeling sick.', 'Time, and deciding what trust you can (or can\'t) rebuild.'],
      ['Furious', 'Very intense anger.', 'Racing heart, loud voice, shaking.', 'To cool down <i>before</i> acting: walk away, breathe, move.'],
    ] },
    { core: 'Scared', color: '#9a6bd8', words: [
      ['Anxious', 'Worried about what <i>might</i> happen.', 'Tight chest, butterflies, overthinking.', 'Slow breathing; separate what you can control from what you can\'t.'],
      ['Nervous', 'Jittery before something specific (a test, a performance).', 'Shaky hands, sweaty palms.', 'Preparation, and remembering nerves often mean you care.'],
      ['Insecure', 'Doubting you\'re good enough or liked.', 'Shrinking posture, comparing yourself.', 'Evidence of your worth, and kinder self-talk.'],
      ['Overwhelmed', 'Too much at once to handle.', 'Frozen, foggy, close to tears.', 'Break it into one small next step; ask for help.'],
      ['Embarrassed', 'Exposed in front of others after a mistake.', 'Blushing, wanting to hide.', 'Perspective: people forget faster than you think.'],
      ['Panicked', 'Sudden intense fear, sometimes for no clear reason.', 'Pounding heart, short breath, dizziness.', 'Grounding: name 5 things you see, 4 you hear… and slow breathing.'],
    ] },
    { core: 'Surprised', color: '#3fb6a8', words: [
      ['Amazed', 'Pleasantly blown away.', 'Wide eyes, open mouth, "wow".', 'To soak it in and share it.'],
      ['Confused', 'Things don\'t make sense yet.', 'Furrowed brow, head tilt.', 'Questions and more information.'],
      ['Startled', 'Quick jolt from something sudden.', 'Jumping, gasp.', 'A moment to settle.'],
      ['Shocked', 'Big unexpected news, good or bad.', 'Frozen, can\'t think straight.', 'Time to process before reacting.'],
    ] },
    { core: 'Disgusted', color: '#6aa84f', words: [
      ['Grossed out', 'Physical disgust (smells, bugs, mess).', 'Wrinkled nose, pulling back.', 'Distance from the gross thing.'],
      ['Disapproving', 'Judging something as wrong.', 'Raised upper lip, eye-roll.', 'To check: is it really wrong, or just different?'],
      ['Cringe', 'Second-hand embarrassment for someone else.', 'Wincing, wanting to look away.', 'Empathy: everyone has cringe moments.'],
      ['Contempt', 'Looking down on someone as beneath you.', 'One-sided smirk, eye-roll.', 'Care: contempt is one of the strongest predictors of a relationship breaking down.'],
    ] },
    { core: 'Low / Drained', color: '#8a8f98', words: [
      ['Bored', 'Not enough interest or challenge.', 'Restless or sluggish.', 'Something meaningful or new.'],
      ['Tired', 'Low physical or mental energy.', 'Heavy eyes and limbs.', 'Rest, food, water, sleep.'],
      ['Stressed', 'Pressure from too many demands.', 'Tense muscles, headaches, irritability.', 'Priorities, breaks and support.'],
      ['Burnt out', 'Exhausted after stress lasts too long; feeling like nothing you do matters.', 'Constant fatigue, getting sick often.', 'Real recovery time, and usually changing what caused it.'],
      ['Numb', 'Feeling almost nothing, often a protective shut-down.', 'Flat, disconnected, "on autopilot".', 'Gentle care. If it lasts weeks, talk to someone you trust or a doctor.'],
    ] },
  ];

  function renderWheel() {
    const wheel = $('#wheel'), sub = $('#wheelSub'), card = $('#feelCard');
    WHEEL.forEach((g, gi) => {
      const b = el('button', 'chip core', g.core);
      b.style.borderColor = g.color;
      b.addEventListener('click', () => {
        wheel.querySelectorAll('.chip').forEach(c => { c.classList.remove('on'); c.style.background = ''; });
        b.classList.add('on'); b.style.background = g.color;
        sub.innerHTML = '';
        g.words.forEach(([w, def, body, need]) => {
          const c = el('button', 'chip', w);
          c.addEventListener('click', () => {
            sub.querySelectorAll('.chip').forEach(x => { x.classList.remove('on'); x.style.background = ''; });
            c.classList.add('on'); c.style.background = g.color;
            card.hidden = false;
            card.style.borderColor = g.color;
            card.innerHTML = `<h4>${w} <span style="color:${g.color};font-size:14px">· ${g.core}</span></h4><p>${def}</p>
              <div class="feel-grid"><div><b>In the body</b>${body}</div><div><b>It usually needs</b>${need}</div><div><b>Say it</b>"I feel ${w.toLowerCase()} because…"</div></div>`;
          });
          sub.appendChild(c);
        });
        sub.firstChild.click();
      });
      wheel.appendChild(b);
      if (gi === 0) setTimeout(() => b.click());
    });
  }

  function renderCheckin() {
    const e = $('#energy'), p = $('#pleasant'), z = $('#zone');
    const zones = {
      'high-good': ['#ffe08a', '⚡ High energy, pleasant', 'Excited, joyful, motivated, playful', 'Great for creative work, sport and social time. Channel the energy into something you care about.'],
      'high-bad': ['#ffb3a7', '🔥 High energy, unpleasant', 'Angry, anxious, stressed, frustrated', 'Slow the body first: breathe in for 4, out for 6, five times. Move (walk, shake out your hands). Then name the exact feeling.'],
      'low-bad': ['#b7cdfa', '🌧️ Low energy, unpleasant', 'Sad, tired, lonely, bored, drained', 'Be gentle with yourself. Rest, water, food, fresh air, or a message to someone you like. Pick one tiny step.'],
      'low-good': ['#b9e8c6', '🍃 Low energy, pleasant', 'Calm, content, relaxed, grateful', 'Good for reading, reflecting, focused work or quality time. Notice what got you here so you can come back to it.'],
      mid: ['#e6e0f5', '⚖️ Somewhere in the middle', 'Okay, neutral, "meh"', 'Neutral is normal! Check again later, or ask what would nudge you toward the zone you want.'],
    };
    const upd = () => {
      const en = +e.value, pl = +p.value;
      let k = 'mid';
      if (Math.abs(en - 5) >= 2 || Math.abs(pl - 5) >= 2) k = (en >= 5 ? 'high' : 'low') + '-' + (pl >= 5 ? 'good' : 'bad');
      const [bg, title, words, tip] = zones[k];
      z.style.background = bg;
      z.innerHTML = `<h4>${title}</h4><p><b>Feelings here:</b> ${words}</p><p>${tip}</p>`;
    };
    e.addEventListener('input', upd); p.addEventListener('input', upd); upd();
  }

  // =================================================================== 2. voice tone
  const STRESS = [
    ['I', 'Somebody else said it, not me.'],
    ['didn\'t', 'I\'m denying it: I never said that.'],
    ['say', 'I might have hinted or thought it, but I didn\'t <i>say</i> it.'],
    ['she', 'I said <i>someone</i> took it, just not her.'],
    ['took', 'She did something with it (borrowed it?), but I didn\'t say she <i>took</i> it.'],
    ['my', 'She took somebody else\'s money, not mine.'],
    ['money', 'She took something of mine, but not money.'],
  ];
  function renderStress() {
    const box = $('#stress'), out = $('#stressOut');
    STRESS.forEach(([w, m]) => {
      const b = el('button', 'chip', w);
      b.addEventListener('click', () => {
        box.querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
        b.classList.add('on');
        const sentence = STRESS.map(([x]) => x === w ? `<b>${x.toUpperCase()}</b>` : x).join(' ');
        out.innerHTML = `"${sentence}."<br>→ ${m}`;
      });
      box.appendChild(b);
    });
  }

  // contour: pitch values 0..1 across the phrase
  const TONES = [
    { name: '😄 Genuinely happy', contour: [.45, .6, .55, .75, .9, .85, .6], pace: .65, vol: .7,
      desc: '<b>Rising, bouncy pitch</b>, a bit fast, bright and loud. Means: <i>"Yay, this is good news!"</i>', },
    { name: '🙄 Sarcastic', contour: [.75, .78, .4, .55, .62, .55, .3], pace: .25, vol: .55,
      desc: '<b>Exaggerated, drawn-out "greeeat"</b> that falls flat at the end, often with an eye-roll. Means the <b>opposite</b>: <i>"This is bad."</i>', },
    { name: '😑 Tired / flat', contour: [.32, .3, .28, .27, .26, .25, .22], pace: .3, vol: .25,
      desc: '<b>Monotone</b>: low, quiet, slow, hardly any pitch movement. Means: <i>"I have no energy for this."</i>', },
    { name: '😟 Worried', contour: [.5, .62, .48, .6, .5, .62, .7], pace: .75, vol: .3,
      desc: '<b>Wobbly pitch</b>, quick and quiet, rising at the end like a question. Means: <i>"Oh no… is this going to be a problem?"</i>', },
    { name: '😠 Angry', contour: [.35, .3, .7, .45, .35, .25, .15], pace: .8, vol: .95,
      desc: '<b>Sharp, clipped and loud</b>, with a hard stab on "great" and a falling end. Means: <i>"This is the last thing I needed."</i>', },
  ];
  function renderToneLab() {
    const pick = $('#tonePick'), svg = $('#toneSvg'), info = $('#toneInfo');
    const show = t => {
      const pts = t.contour.map((v, i) => [20 + i * (360 / (t.contour.length - 1)), 105 - v * 90]);
      let d = `M${pts[0][0]},${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], mx = (x0 + x1) / 2;
        d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
      }
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      const muted = getComputedStyle(document.documentElement).getPropertyValue('--muted').trim();
      svg.innerHTML = `
        <line x1="0" y1="105" x2="400" y2="105" stroke="${muted}" stroke-opacity=".3"/>
        <text x="8" y="14" font-size="10" fill="${muted}">high pitch</text>
        <text x="8" y="117" font-size="10" fill="${muted}">low</text>
        <path d="${d}" fill="none" stroke="${accent}" stroke-width="${2 + t.vol * 5}" stroke-linecap="round"/>
        <text x="40" y="${Math.min(100, pts[1][1] + 22)}" font-size="16" font-weight="700" fill="${accent}">Oh,</text>
        <text x="${t.pace < .4 ? 150 : 200}" y="${Math.min(100, pts[4][1] + 24)}" font-size="16" font-weight="700" fill="${accent}">${t.pace < .4 ? 'greeeeat.' : 'great.'}</text>`;
      info.innerHTML = `<p>${t.desc}</p>
        <div class="meter">Pace<span><i style="width:${t.pace * 100}%"></i></span></div>
        <div class="meter">Volume<span><i style="width:${t.vol * 100}%"></i></span></div>
        <div class="meter">Pitch range<span><i style="width:${(Math.max(...t.contour) - Math.min(...t.contour)) * 140}%"></i></span></div>`;
    };
    TONES.forEach((t, i) => {
      const b = el('button', 'chip', t.name);
      b.addEventListener('click', () => { pick.querySelectorAll('.chip').forEach(c => c.classList.remove('on')); b.classList.add('on'); show(t); });
      pick.appendChild(b);
      if (i === 0) { b.classList.add('on'); show(t); }
    });
  }

  const TONE_CARDS = [
    ['🤗 Warm', 'Soft volume, relaxed pace, gentle pitch movement, smiling while talking (you can <i>hear</i> a smile).', '"Hey, how are you doing?"'],
    ['🙄 Sarcastic', 'Exaggerated stretch on key words, flat or overly sweet pitch, meaning the opposite of the words.', '"Wow. Amazing idea."'],
    ['🧐 Condescending', 'Slow, over-clear, "explaining to a child" voice, often with a sing-song pitch.', '"Okaaay, so, let me explain this <i>one more time</i>."'],
    ['🛡️ Defensive', 'Faster, louder, rising pitch; answering a question that wasn\'t really asked.', '"I DID do it, why are you always on my case?"'],
    ['😐 Monotone', 'Little pitch change, steady pace. Can mean bored, tired, sad, or just that person\'s normal voice.', '"Yeah. Cool. Sure."'],
    ['😬 Nervous', 'Higher pitch than usual, fast, filler words ("um, like"), trailing off.', '"Um, so, I was, like, wondering if maybe…"'],
    ['🥶 Cold', 'Short, clipped, quiet, falling pitch; no warmth or extra words. Often hides anger.', '"Noted."'],
    ['🙏 Apologetic', 'Softer, slower, slightly lower; pauses; ends with "sorry".', '"I\'m really sorry. I messed that up."'],
    ['😜 Teasing', 'Playful, sing-song, laughing in the voice. Only friendly if <b>both</b> people find it fun.', '"Ohhh, someone\'s got a cruuush."'],
  ];

  // =================================================================== 3. text tone
  const REPLIES = [
    ['ok', 'Neutral and quick. Usually fine, just casual.'],
    ['ok.', 'The full stop can read as <b>cold, annoyed or final</b>, especially to younger people. From someone who always uses punctuation, it\'s neutral.'],
    ['Ok!', 'Friendly and positive. The exclamation mark adds warmth.'],
    ['k', 'Often reads as <b>dismissive</b> or annoyed: "I can\'t even be bothered to type two letters."'],
    ['okay...', 'Trailing dots suggest <b>hesitation, doubt or unspoken disagreement</b>: "okay… if you say so."'],
    ['okayyy', 'Stretched letters read as playful, friendly or teasing.'],
    ['OK 🙂', 'Usually friendly, but for some people the plain 🙂 reads as <b>passive-aggressive</b> ("I\'m smiling through gritted teeth").'],
    ['👍', 'Can mean "got it!" or a dismissive "sure, whatever". Generations read it differently.'],
    ['Fine.', 'Almost always means <b>not</b> fine. Classic passive-aggressive.'],
    ['lol', 'Often not real laughter: it softens a message so it doesn\'t sound harsh ("I can\'t come lol").'],
    ['Haha 😅', 'Nervous or awkward laughter: "I\'m uncomfortable but trying to keep it light."'],
    ['(read 3 hours ago, no reply)', 'Could be busy, forgetful, overwhelmed or upset. <b>Don\'t assume</b>. If it matters, ask kindly.'],
  ];
  function renderReplies() {
    const box = $('#replies'), out = $('#replyOut');
    REPLIES.forEach(([r, m]) => {
      const b = el('button', 'bubble', r);
      b.addEventListener('click', () => { box.querySelectorAll('.bubble').forEach(x => x.classList.remove('on')); b.classList.add('on'); out.innerHTML = `<b>"${r}"</b>: ${m}`; });
      box.appendChild(b);
    });
  }

  // =================================================================== 4. passive-aggressive decoder
  const KINDS = ['Sincere', 'Passive-aggressive', 'Sarcastic', 'Assertive'];
  const DECODE = [
    ['No worries if not! 🙂', 'Sent after asking the same favour for the third time.', 1,
      'The words say "no pressure", but asking three times plus a forced smiley shows frustration they won\'t say. (The first time, it may be totally sincere!)',
      '"I\'ve asked a few times now. Can you let me know by Friday if you can do it?"'],
    ['Per my last message, the meeting is at 3.', 'In a group chat, after someone asked the time again.', 1,
      '"Per my last message" really means "I already told you, pay attention."',
      '"Quick reminder: the meeting\'s at 3!"'],
    ['Wow, you actually finished on time for once!', 'Said to a classmate after a group project.', 1,
      'A backhanded compliment: praise wrapped around a dig ("for once").',
      '"Thanks for finishing on time! It really helped. Earlier deadlines have been stressful for me."'],
    ['Oh yeah, I LOVE doing the dishes every single night.', 'Said loudly while doing the dishes.', 2,
      'Openly saying the opposite of what you mean, so everyone can tell. Sarcasm is <i>more</i> obvious than passive-aggressiveness, but still indirect.',
      '"I\'ve done the dishes every night this week. Can we make a rota?"'],
    ['I felt left out when you all made plans without me. Can you include me next time?', 'A message to a friend group.', 3,
      'Says the feeling and makes a clear request, without blaming or attacking. Textbook assertive.', 'Already direct, nothing to fix!'],
    ['Thanks so much for helping me move, it meant a lot!', 'After a friend spent all Saturday helping.', 0,
      'The context matches the words. There\'s no hidden dig, just gratitude.', 'Already direct, nothing to fix!'],
    ['Fine. Do whatever you want.', 'At the end of an argument.', 1,
      'Agreeing in words, but the full stop and "whatever you want" show they\'re still upset and withdrawing.',
      '"I don\'t agree, and I\'m too upset to keep talking right now. Can we finish this later?"'],
    ['Great job, genius.', 'After someone trips and drops a tray.', 2,
      'Mocking praise: classic sarcasm. It\'s used to put someone down while "only joking".',
      '"You okay? Here, let me help."'],
    ['I can\'t make it Saturday, but I\'m free Sunday if that works.', 'Replying to an invite.', 3,
      'A clear "no" plus an alternative. No guilt, no excuses needed.', 'Already direct, nothing to fix!'],
    ['It must be nice to have so much free time.', 'To a sibling relaxing while you study.', 1,
      'Envy and annoyance disguised as an observation. The real message is "I resent that you\'re not helping / not busy".',
      '"I\'m really stressed with exams. Could you keep it down / help with chores this week?"'],
  ];
  function renderDecoder() {
    const box = $('#decoder');
    const score = store.get('decoder', {});
    const scoreLine = el('div', 'score-line');
    const updScore = () => {
      const done = Object.keys(score).length, right = Object.values(score).filter(Boolean).length;
      scoreLine.textContent = done ? `Score: ${right} / ${done} correct${done === DECODE.length ? ' 🎉 All done!' : ''}` : '';
    };
    DECODE.forEach(([msg, ctx, ans, why, direct], i) => {
      const m = el('div', 'msg', `<q>${msg}</q><div class="ctx">Context: ${ctx}</div>`);
      const opts = el('div', 'opts');
      const reveal = picked => {
        opts.querySelectorAll('.chip').forEach((c, k) => { c.disabled = true; if (k === ans) c.classList.add('right'); else if (k === picked) c.classList.add('wrong'); });
        m.appendChild(el('div', 'why', `<b>${picked === ans ? '✅ Correct!' : `❌ It's ${KINDS[ans].toLowerCase()}.`}</b> ${why}<br><b>More direct:</b> ${direct}`));
      };
      KINDS.forEach((k, ki) => {
        const b = el('button', 'chip', k);
        b.addEventListener('click', () => { score[i] = ki === ans; store.set('decoder', score); reveal(ki); updScore(); });
        opts.appendChild(b);
      });
      m.appendChild(opts);
      box.appendChild(m);
      if (i in score) reveal(score[i] ? ans : (ans + 1) % 4);
    });
    box.appendChild(scoreLine); updScore();
  }

  // =================================================================== 5. styles
  const STYLES = [
    { k: 'passive', t: '😶 Passive', say: '"Oh, it\'s fine, no problem!" (then says nothing and stews)',
      more: '<b>Belief:</b> your needs matter, mine don\'t.<br><b>Body:</b> small, quiet, avoids eye contact.<br><b>Result:</b> the problem continues and resentment builds… until it explodes.' },
    { k: 'aggressive', t: '😡 Aggressive', say: '"You\'re such a thief! Give my stuff back NOW!"',
      more: '<b>Belief:</b> my needs matter, yours don\'t.<br><b>Body:</b> loud, pointing, invading space.<br><b>Result:</b> the other person gets defensive and the friendship gets damaged.' },
    { k: 'pa', t: '🙃 Passive-aggressive', say: '"Must be nice having a free store." (and hides their stuff)',
      more: '<b>Belief:</b> my needs matter, but I can\'t say so.<br><b>Body:</b> sweet words, cold tone, eye-rolls.<br><b>Result:</b> confusion and tension, and nothing really changes.' },
    { k: 'assertive', t: '💪 Assertive', say: '"Hey, I\'ve noticed you borrow my things without asking. I don\'t mind lending, but please ask me first."',
      more: '<b>Belief:</b> both our needs matter.<br><b>Body:</b> calm voice, steady eye contact, relaxed posture.<br><b>Result:</b> the problem is clear and fixable, and respect is kept on both sides.' },
  ];
  const FLIPS = [
    ['Passive', 'Whatever, I don\'t care where we eat.', 'I\'d really like pizza tonight. Is that okay with you?'],
    ['Aggressive', 'You NEVER listen to me!', 'When I get interrupted, I feel unheard. Can you let me finish?'],
    ['Passive-aggressive', 'Guess I\'ll just do the whole project myself. Again.', 'I\'ve done most of the work so far. Can we split the rest? Could you take slides 5–8?'],
    ['Passive', 'Sure, I\'ll cover your shift… (for the 4th time)', 'I can\'t cover this time. I have plans.'],
    ['Passive-aggressive', 'Nice of you to finally reply.', 'I got worried when I didn\'t hear back. Could you give me a quick heads-up if you\'ll be a while?'],
    ['Aggressive', 'That\'s a stupid idea.', 'I\'m not sure that will work, because of the budget. What if we tried…?'],
  ];
  function renderStyles() {
    const box = $('#styleCards');
    STYLES.forEach(s => {
      const b = el('button', 'style ' + s.k, `<h4>${s.t}</h4><div class="say">${s.say}</div><div class="more">${s.more}</div>`);
      b.addEventListener('click', () => b.classList.toggle('open'));
      box.appendChild(b);
    });
    const flips = $('#flips');
    FLIPS.forEach(([kind, bad, good]) => {
      const b = el('button', 'flip', `<small>${kind}: tap to make it assertive</small>"${bad}"`);
      b.addEventListener('click', () => {
        const done = b.classList.toggle('done');
        b.innerHTML = done ? `<small>Assertive ✓</small>"${good}"` : `<small>${kind}: tap to make it assertive</small>"${bad}"`;
      });
      flips.appendChild(b);
    });
  }

  // =================================================================== 6. body language
  const BODY = [
    ['🙆 Open posture', 'Uncrossed arms, facing you, relaxed shoulders. Often comfortable and interested.'],
    ['🪞 Mirroring', 'Copying your posture or gestures without noticing. A common sign of rapport and liking.'],
    ['↗️ Leaning in', 'Moving closer means interest or engagement; leaning away can mean discomfort or wanting to leave.'],
    ['👣 Feet direction', 'Feet often point where people want to go. Feet aimed at the door can mean "I\'m ready to leave".'],
    ['😊 Real vs polite smile', 'A genuine (Duchenne) smile crinkles the eyes. A polite smile only moves the mouth.'],
    ['🤏 Self-soothing', 'Rubbing the neck, playing with hair, fidgeting. Often stress or nerves, not lying.'],
    ['👀 Eye contact', 'Some is friendly; staring can feel aggressive; avoiding it can be shyness, culture or neurodivergence.'],
    ['📏 Personal space', 'Close friends stand closer. Someone stepping back is asking for more room, so give it.'],
    ['⚡ Micro-expressions', 'Flashes of real emotion lasting under half a second, like a quick frown before a smile.'],
    ['🔀 Mismatch', 'When words and body disagree ("I\'m fine" + clenched fists), the body usually tells you more. Ask gently.'],
  ];

  // =================================================================== 7. dere types
  const DERES = [
    { e: '🥰', n: 'Deredere', jp: 'dere-dere: lovey-dovey', line: '"Good morning! I made you breakfast!"', risk: ['ok', 'Healthy'],
      fic: 'Sweet, cheerful and openly affectionate to everyone.', real: 'Warm and expressive. As long as they also respect your boundaries, this is just a kind person.', heal: 'Already healthy! Just make sure it\'s mutual.' },
    { e: '😤', n: 'Tsundere', jp: 'tsun-tsun (prickly) + dere', line: '"I-it\'s not like I made this for YOU or anything, b-baka!"', risk: ['mid', 'Mixed signals'],
      fic: 'Harsh, insulting or cold on the outside; secretly caring inside. The tension is the fun.', real: 'Hiding feelings behind insults causes confusion and hurt. <b>Insults are not flirting.</b> Often it comes from fear of rejection.', heal: 'Being brave enough to say "I like hanging out with you" directly.' },
    { e: '🔪', n: 'Yandere', jp: 'yan (sick) + dere', line: '"If I can\'t have you… no one can. ♡"', risk: ['bad', 'Real-life red flag'],
      fic: 'Starts sweet, then turns obsessive, possessive and even violent toward anyone near their crush. Used in horror and thrillers.',
      real: 'Extreme jealousy, tracking your phone, cutting you off from friends or making threats are <b>warning signs of abuse</b>, not devotion. It\'s not your job to "fix" them. Tell a trusted adult.',
      heal: 'Trust, space, respecting "no", and separate friends and lives.' },
    { e: '🧊', n: 'Kuudere', jp: 'kuu (cool) + dere', line: '"…I suppose I don\'t mind your company."', risk: ['ok', 'Usually fine'],
      fic: 'Calm, logical, rarely shows emotion; affection appears in small actions.', real: 'Some people really do show love quietly, through acts of service rather than words. Fine, as long as they can communicate when it matters.', heal: 'Saying feelings out loud occasionally, because others can\'t read minds.' },
    { e: '🙈', n: 'Dandere', jp: 'dan (silent) + dere', line: '"…h-hi. Um… thanks for sitting with me."', risk: ['ok', 'Healthy'],
      fic: 'Very shy and quiet, but opens up and becomes chatty around people they trust.', real: 'Introversion or social anxiety. Totally normal, and patience and safe spaces help.', heal: 'Gentle encouragement, not pressure.' },
    { e: '👑', n: 'Himedere', jp: 'hime (princess) + dere', line: '"You may have the honour of carrying my bag."', risk: ['mid', 'Watch for entitlement'],
      fic: 'Acts like royalty and expects to be treated like a princess or prince.', real: 'Fun as a joke; a problem if someone always expects to be served and never gives back.', heal: 'Both people get spoiled sometimes. Give and take.' },
    { e: '😇', n: 'Kamidere', jp: 'kami (god) + dere', line: '"Of course you like me. Everyone should."', risk: ['mid', 'Arrogance'],
      fic: 'A god complex: arrogant and sure they\'re superior, but secretly attached.', real: 'Constant superiority can slide into belittling you. Confidence is fine; contempt isn\'t.', heal: 'Confidence and humility together.' },
    { e: '🤪', n: 'Bakadere', jp: 'baka (silly) + dere', line: '"Wait, I put the milk in the… oven?"', risk: ['ok', 'Harmless'],
      fic: 'Clumsy, goofy airhead; very loving.', real: 'Just a fun, silly person. Being goofy isn\'t the same as being careless with people\'s feelings.', heal: 'Already healthy.' },
    { e: '🙇', n: 'Undere', jp: 'un (yes) + dere', line: '"Yes! Whatever you want! Sure!"', risk: ['mid', 'People-pleasing'],
      fic: 'Agrees with everything their crush says.', real: 'People-pleasing: losing yourself to keep others happy. It\'s passive communication, and it leads to resentment.', heal: 'Having opinions, and saying no sometimes.' },
    { e: '🗡️', n: 'Mayadere', jp: 'from a character name', line: '"I was sent to defeat you… but I\'ll fight beside you instead."', risk: ['mid', 'Fiction only'],
      fic: 'A dangerous enemy who switches sides out of love.', real: 'Exciting in stories; in real life, "they\'ll change for me" is a risky hope. Watch actions over time.', heal: 'Trust that\'s earned slowly through consistent behaviour.' },
  ];
  function renderDere() {
    const box = $('#dereCards');
    DERES.forEach(d => {
      const b = el('button', 'dcard', `<div class="dinner">
        <div class="dface dfront"><div class="emoji">${d.e}</div><h4>${d.n}</h4><div class="jp">${d.jp}</div><div class="line">${d.line}</div>
          <span class="risk ${d.risk[0]}">${d.risk[1]}</span><p class="jp" style="margin-top:10px">Tap to flip →</p></div>
        <div class="dface dback"><p><b>In fiction:</b> ${d.fic}</p><p><b>Real-life lens:</b> ${d.real}</p><p><b>Healthy version:</b> ${d.heal}</p></div>
      </div>`);
      b.setAttribute('aria-label', d.n + ': tap to flip');
      b.addEventListener('click', () => b.classList.toggle('flipped'));
      box.appendChild(b);
    });
  }

  // =================================================================== 8. flags sorter
  const FLAGS = [
    ['Checks your phone without asking "because they love you".', 0, 'Love includes trust. Monitoring is control.'],
    ['Is happy when you spend time with your friends.', 1, 'Healthy partners and friends want you to have a life outside them.'],
    ['Feels jealous sometimes, but talks about it calmly and owns the feeling.', 1, 'Jealousy as a feeling is human. What matters is handling it without controlling you.'],
    ['Tells you who you can and can\'t talk to.', 0, 'Isolating someone from friends is a classic abuse warning sign.'],
    ['Respects it when you say no.', 1, '"No" is a full sentence.'],
    ['Says "If you leave me, I\'ll hurt myself."', 0, 'This is emotional manipulation, and it is never your fault. If someone is in danger, contact emergency services or a crisis line (988 in the US).'],
    ['Texts you 40 times when you don\'t answer for an hour.', 0, 'Constant checking-up is anxious control, not care.'],
    ['Apologises and actually changes when they hurt you.', 1, 'Real apologies come with changed behaviour.'],
    ['Puts you down in front of others, then says "it\'s just a joke".', 0, 'Humiliation disguised as humour is still humiliation.'],
    ['Supports your goals, even if it means less time together.', 1, 'Healthy love wants you to grow.'],
    ['Showers you with huge gifts and "you\'re my soulmate" after one week.', 0, '"Love-bombing" moves very fast to create dependence. Healthy closeness builds over time.'],
    ['Gives you space when you ask for it.', 1, 'Space is normal and healthy.'],
  ];
  function renderSorter() {
    const box = $('#sorter'), sc = $('#sorterScore');
    let right = 0, done = 0;
    FLAGS.forEach(([t, healthy, why]) => {
      const row = el('div', 'srow', `<div>${t}</div>`);
      const opts = el('div', 'opts');
      [['🟢 Healthy', 1], ['🚩 Red flag', 0]].forEach(([label, v]) => {
        const b = el('button', 'chip', label);
        b.addEventListener('click', () => {
          opts.querySelectorAll('button').forEach(x => x.disabled = true);
          const ok = v === healthy; done++; if (ok) right++;
          row.classList.add(ok ? 'right' : 'wrong');
          row.appendChild(el('div', 'why', `${ok ? '✅' : '❌'} ${healthy ? 'Healthy.' : 'Red flag.'} ${why}`));
          sc.textContent = `${right} / ${done} correct${done === FLAGS.length ? ' — finished!' : ''}`;
        });
        opts.appendChild(b);
      });
      row.appendChild(opts); box.appendChild(row);
    });
  }

  // =================================================================== 9. final quiz
  const QUIZ = [
    ['What\'s the main difference between an emotion and a mood?', ['Emotions are fake, moods are real', 'Emotions are quick reactions; moods last longer in the background', 'Moods only happen to teenagers', 'There is no difference'], 1, 'Emotions last seconds to minutes and have a clear trigger; moods can last hours or days.'],
    ['Guilt vs shame: which is true?', ['Guilt = "I did something bad"; shame = "I am bad"', 'They mean exactly the same', 'Shame is always helpful', 'Guilt is only about money'], 0, 'Guilt is about an action and can motivate repair. Shame attacks your whole self.'],
    ['"I didn\'t say she took my MONEY." What does stressing "money" suggest?', ['Someone else said it', 'She took something else of mine', 'She borrowed it', 'I\'m denying I said it'], 1, 'Stress points to what\'s being contrasted: she took something, just not money.'],
    ['A drawn-out "greeeeat" with a flat, falling end most likely means…', ['Genuine excitement', 'Sarcasm', 'A question', 'Fear'], 1, 'Exaggerated stretching plus falling pitch is a classic sarcasm signal.'],
    ['Your friend usually texts "okayyy 😊" but today sends "ok." What\'s the best move?', ['Assume they hate you', 'Ignore it forever', 'Notice the change and maybe ask kindly if everything\'s okay', 'Reply "k"'], 2, 'Compare with their normal style, and ask instead of assuming.'],
    ['Which is passive-aggressive?', ['"I can\'t come, sorry!"', '"Wow, you remembered my birthday for once."', '"I feel hurt that you forgot."', '"Thanks for the gift!"'], 1, '"For once" turns a thank-you into a dig: a backhanded compliment.'],
    ['Which response is assertive?', ['"Fine, whatever."', '"You\'re so selfish!"', '"I\'d like to choose the movie this time. Is that okay?"', 'Saying nothing and sulking'], 2, 'It states a need clearly and respectfully.'],
    ['Someone has crossed arms. What does it mean?', ['They definitely hate you', 'They\'re definitely lying', 'Could be many things: cold, comfy, habit or defensive. Look for other clues', 'They want a hug'], 2, 'One signal alone means nothing. Look for clusters and context.'],
    ['A tsundere character mostly shows affection by…', ['Being openly sweet', 'Acting harsh or cold while secretly caring', 'Being shy and silent', 'Obsessive possessiveness'], 1, 'Tsun-tsun (prickly) outside, dere (lovey) inside.'],
    ['In real life, yandere-like behaviour (extreme jealousy, isolating you, threats) is…', ['Romantic proof of true love', 'A warning sign of an abusive relationship', 'Normal for all couples', 'Only a problem if they\'re famous'], 1, 'Control, isolation and threats are red flags. Reach out to someone you trust.'],
    ['What\'s "love-bombing"?', ['Throwing water balloons', 'Overwhelming someone with intense affection and gifts very early, to create dependence', 'Saying I love you after a year', 'A type of song'], 1, 'It moves very fast, often before trust exists, and can be followed by control.'],
    ['You feel high energy and unpleasant (heart racing, angry). A good first step is…', ['Send an angry text right away', 'Slow your breathing and move your body before reacting', 'Pretend you feel nothing', 'Eat a whole cake'], 1, 'Calm the body first, then name the feeling and decide what to do.'],
  ];
  function renderQuiz() {
    const box = $('#quizBox');
    let i = 0, score = 0, answered = false;
    const best = store.get('quizBest', null);
    const draw = () => {
      if (i >= QUIZ.length) {
        const prev = store.get('quizBest', 0);
        if (score > prev) store.set('quizBest', score);
        const msg = score === QUIZ.length ? 'Perfect! You\'re a mood & tone expert. 🏆' : score >= 9 ? 'Great job! 🎉' : score >= 6 ? 'Nice! Review the lessons you missed and try again.' : 'Keep learning. Scroll up, explore the lessons and retry!';
        box.innerHTML = `<div class="q">Your score</div><div class="big">${score} / ${QUIZ.length}</div><p>${msg}</p><button class="btn primary" id="retry">Try again</button>`;
        $('#retry').addEventListener('click', () => { i = 0; score = 0; draw(); });
        return;
      }
      const [q, opts, ans, why] = QUIZ[i];
      answered = false;
      box.innerHTML = `<div class="q">${i + 1}. ${q}</div><div class="answers"></div><div class="qnav"><span>Score: ${score}${best !== null ? ` · best ${Math.max(best, store.get('quizBest', 0))}` : ''}</span><button class="btn primary" id="next" hidden>${i === QUIZ.length - 1 ? 'See result' : 'Next →'}</button></div>`;
      const ab = box.querySelector('.answers');
      opts.forEach((o, k) => {
        const b = el('button', 'btn', o);
        b.addEventListener('click', () => {
          if (answered) return; answered = true;
          if (k === ans) score++;
          ab.querySelectorAll('button').forEach((x, j) => { if (j === ans) x.classList.add('right'); else if (j === k) x.classList.add('wrong'); });
          ab.after(el('div', 'explain', `${k === ans ? '✅' : '❌'} ${why}`));
          const n = $('#next'); n.hidden = false; n.focus();
        });
        ab.appendChild(b);
      });
      $('#next').addEventListener('click', () => { i++; draw(); });
    };
    draw();
  }

  // =================================================================== progress & nav
  function trackProgress() {
    const ids = [...document.querySelectorAll('.lesson')].map(s => s.id);
    const seen = new Set(store.get('seen', []));
    const links = document.querySelectorAll('.topics a');
    const upd = () => {
      $('#progressText').textContent = `${seen.size} / ${ids.length} explored`;
      $('#progressBar').style.width = (seen.size / ids.length * 100) + '%';
    };
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        seen.add(en.target.id); store.set('seen', [...seen]); upd();
        links.forEach(a => {
          const on = a.getAttribute('href') === '#' + en.target.id;
          a.classList.toggle('on', on);
          if (on) { const nav = a.parentElement; nav.scrollTo({ left: a.offsetLeft - nav.clientWidth / 2 + a.offsetWidth / 2, behavior: 'smooth' }); }
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('.lesson').forEach(s => io.observe(s));
    upd();
  }

  function renderSimpleCards(id, list) {
    const box = $(id);
    list.forEach(([t, d, ex]) => box.appendChild(el('div', 'card', `<h4>${t}</h4><p>${d}</p>${ex ? `<p class="ex">${ex}</p>` : ''}`)));
  }

  renderWheel(); renderCheckin(); renderStress(); renderToneLab();
  renderSimpleCards('#toneCards', TONE_CARDS);
  renderReplies(); renderDecoder(); renderStyles();
  renderSimpleCards('#bodyCards', BODY);
  renderDere(); renderSorter(); renderQuiz(); trackProgress();
  // content is built by script, so re-apply a #section link once it exists
  if (location.hash) { const t = document.querySelector(location.hash); if (t) setTimeout(() => t.scrollIntoView({ behavior: 'instant' }), 60); }
})();
